import { useOrdersStore } from "../store/useOrdersStore";
import type { OrderWsMessage } from "../types/order.types";
import { mapRawOrder } from "../utils/mapRawOrder";

// ── URL del WebSocket ─────────────────────────────────────────────────────────
const WS_PATH = "/orders/rider";
const RECONNECT_DELAY_MS = 3000;

// Logging de debug del socket. Poner en `true` para reactivarlo (se deja para
// verificar cuándo el backend empiece a mandar las DOS coordenadas).
const DEBUG = false;
function log(...args: unknown[]) {
  if (DEBUG) console.log("[ws:rider]", ...args);
}

function resolveWsUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL ?? "";
  const wsBase = base.replace(/^http/, "ws"); // https → wss, http → ws
  return `${wsBase}${WS_PATH}`;
}

// ── Conexión singleton con contador de suscriptores ───────────────────────────
let socket: WebSocket | null = null;
let subscribers = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyClosed = false;

function handleMessage(event: MessageEvent) {
  // DEBUG: descomentar para ver el payload crudo del backend y verificar cuándo
  // empieza a mandar las DOS coordenadas (restaurante + cliente).
  // console.log(event.data);

  let msg: OrderWsMessage;
  try {
    msg = JSON.parse(event.data as string) as OrderWsMessage;
  } catch {
    return; // mensaje no-JSON (ping textual u otro) → ignorar
  }

  const store = useOrdersStore.getState();

  switch (msg.type) {
    case "connected":
      store.setConnected(true);
      store.setConnecting(false);
      break;
    case "order_update":
    case "new_order":
      store.upsertOrder(mapRawOrder(msg.order));
      break;
    case "orders_snapshot":
      // Lote inicial de órdenes activas al conectar.
      if (Array.isArray(msg.orders)) {
        msg.orders.forEach((raw) => store.upsertOrder(mapRawOrder(raw)));
      }
      break;
    case "error":
      // Error de protocolo del servidor — no rompe la conexión.
      break;
  }
}

function openSocket() {
  if (socket) return;

  manuallyClosed = false;
  const store = useOrdersStore.getState();
  store.setConnecting(true);

  const url = resolveWsUrl();
  log("⇨ conectando a", url);
  const ws = new WebSocket(url);
  socket = ws;

  ws.onmessage = handleMessage;

  ws.onopen = () => {
    // El backend confirma con un mensaje "connected"; esto es un respaldo por si
    // no lo envía, para no quedar atascados en "conectando".
    log("✓ OPEN");
    store.setConnected(true);
    store.setConnecting(false);
  };

  ws.onclose = (e) => {
    log("✕ CLOSE code:", e.code, "reason:", e.reason, "wasClean:", e.wasClean);
    socket = null;
    store.setConnected(false);
    store.setConnecting(false);
    if (!manuallyClosed && subscribers > 0) {
      scheduleReconnect();
    }
  };

  ws.onerror = (e) => {
    // onclose se dispara a continuación y maneja la reconexión.
    log("⚠ ERROR:", (e as unknown as { message?: string }).message ?? e);
    ws.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  useOrdersStore.getState().setConnecting(true);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (subscribers > 0) openSocket();
  }, RECONNECT_DELAY_MS);
}

function closeSocket() {
  manuallyClosed = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
  useOrdersStore.getState().reset();
}

/**
 * Suscribe a la conexión de órdenes del rider. Abre el socket en la primera
 * suscripción y lo reusa para las siguientes. Devuelve una función de limpieza
 * que cierra el socket cuando ya no quedan suscriptores.
 */
export function subscribeToRiderOrders(): () => void {
  subscribers += 1;
  if (subscribers === 1) {
    openSocket();
  }

  return () => {
    subscribers = Math.max(0, subscribers - 1);
    if (subscribers === 0) {
      closeSocket();
    }
  };
}

/**
 * Comunica al backend si el rider está disponible para recibir nuevas órdenes.
 * Hipótesis de transporte: mensaje saliente por el mismo WebSocket. Si resulta
 * ser un endpoint REST, se cambia SOLO aquí sin tocar store ni UI.
 */
export function setAvailability(available: boolean): void {
  const payload = JSON.stringify({ type: "set_availability", available });
  if (socket && socket.readyState === WebSocket.OPEN) {
    log("⇨ OUT:", payload);
    socket.send(payload);
  } else {
    log("⇨ OUT descartado (socket no abierto):", payload);
  }
}
