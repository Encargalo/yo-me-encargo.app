import { useOffersStore } from "../store/useOffersStore";
import { useOrdersStore } from "../store/useOrdersStore";
import type { OrderWsMessage } from "../types/order.types";
import { mapRawOrder } from "../utils/mapRawOrder";

// ── URL del WebSocket ─────────────────────────────────────────────────────────
const WS_PATH = "/orders/rider";
const RECONNECT_DELAY_MS = 3000;

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

// Enruta una orden entrante hacia la cola de ofertas del overlay.
// - Con `riderId` (asignada a mí o a otro) → sale de la cola si estaba.
// - Ya presente entre mis órdenes aceptadas (una versión previa llegó con
//   `riderId`) → ya la acepté, no volver a ofrecerla (aunque este `new_order`
//   venga sin `riderId`). `dropFromQueue` la marca como decidida para que quede
//   pegada aunque un `upsert` posterior sobrescriba la orden en Home.
// - Sin `riderId` y tipo `new_order` (oferta fresca) → se encola (con dedupe
//   y respeto a la suspensión dentro del propio store).
// IMPORTANTE: se invoca ANTES del `upsertOrder` para que el chequeo de "ya es
// mía" lea el estado previo de `activeOrders`.
export function routeToOffers(
  order: ReturnType<typeof mapRawOrder>,
  type: "order_update" | "new_order" | "order_accepted",
) {
  const offers = useOffersStore.getState();
  if (order.riderId) {
    offers.dropFromQueue(order.id);
    return;
  }
  const alreadyMine = useOrdersStore
    .getState()
    .activeOrders.some((o) => o.id === order.id && !!o.riderId);
  if (alreadyMine) {
    offers.markDecided(order.id);
    return;
  }
  if (type === "new_order") {
    offers.enqueue(order);
  }
}

function handleMessage(event: MessageEvent) {
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
    case "order_accepted": {
      // `order_accepted` es la respuesta directa a `accept_order`: mismo shape
      // que `order_update` (order/shop/customer hermanos), ya con `rider_id`,
      // `pickup_code` e `items`.
      // `shop`/`customer` viajan como hermanos de `order` en la raíz del
      // mensaje, no anidados dentro de él → se pasa `msg` completo al mapper.
      const order = mapRawOrder(msg);
      // Rutear ANTES del upsert: el chequeo de "ya es mía" necesita el estado
      // previo de activeOrders (el upsert de un new_order sin riderId lo borraría).
      routeToOffers(order, msg.type);
      store.upsertOrder(order);
      break;
    }
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
  const ws = new WebSocket(url);
  socket = ws;

  ws.onmessage = handleMessage;

  ws.onopen = () => {
    // El backend confirma con un mensaje "connected"; esto es un respaldo por si
    // no lo envía, para no quedar atascados en "conectando".
    store.setConnected(true);
    store.setConnecting(false);
  };

  ws.onclose = () => {
    socket = null;
    store.setConnected(false);
    store.setConnecting(false);
    if (!manuallyClosed && subscribers > 0) {
      scheduleReconnect();
    }
  };

  ws.onerror = () => {
    // onclose se dispara a continuación y maneja la reconexión.
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
    socket.send(payload);
  }
}

// ── Aceptar / rechazar una oferta ─────────────────────────────────────────────
// Hipótesis de transporte: mensajes salientes por el mismo WebSocket. Si el
// backend expone REST (`POST /orders/{id}/accept`), se cambia SOLO aquí sin
// tocar store, hook ni UI.
function sendOrderDecision(type: "accept_order" | "reject_order", id: string) {
  const payload = JSON.stringify({ type, order_id: id });
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
  }
}

export function acceptOrder(id: string): void {
  sendOrderDecision("accept_order", id);
}

export function rejectOrder(id: string): void {
  sendOrderDecision("reject_order", id);
}
