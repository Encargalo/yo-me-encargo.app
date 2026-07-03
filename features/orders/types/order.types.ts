// ── Estados de una orden ──────────────────────────────────────────────────────
// Strings exactos que envía el backend (con espacios). Vocabulario compartido con
// la app de clientes; el rider solo actúa sobre un subconjunto (recogida → entrega).
export type OrderStatus =
  | "Pending"
  | "Waiting For Payment Proof"
  | "Accepted"
  | "In Preparation"
  | "Ready"
  | "On The Way"
  | "Completed"
  | "Rejected";

// Claves de color de estado (alineadas con OrderStatusColors en constants/theme.ts
// y status.* en tailwind.config.js).
export type OrderColorKey = "pending" | "enroute" | "completed" | "error";

// Estados terminales: la orden desaparece de la lista de órdenes activas del rider.
export const TERMINAL_STATUSES: OrderStatus[] = ["Completed"];

export function isVisibleStatus(status: OrderStatus): boolean {
  return !TERMINAL_STATUSES.includes(status);
}

// ── Parte de una orden (restaurante o cliente) ────────────────────────────────
export interface OrderParty {
  name: string;
  address?: string;
  phone?: string;
  logo?: string; // solo el restaurante lo trae hoy
  latitude?: number;
  longitude?: number;
}

// ── Producto de una orden ──────────────────────────────────────────────────────
// Llega solo en el `order_update` posterior a aceptar (la oferta `new_order` no
// trae items todavía) — `mapRawOrder` mapea con fallback a `[]`.
export interface OrderItemOption {
  id: string;
  name: string;
  amount: number;
}

export type OrderItemFlavor = OrderItemOption;
export type OrderItemAddition = OrderItemOption;

export interface OrderItem {
  id: string;
  name: string;
  image?: string;
  amount: number;
  flavors?: OrderItemFlavor[];
  additions?: OrderItemAddition[];
}

// ── Orden activa (modelo de dominio, normalizado desde el mensaje del WS) ──────
export interface ActiveOrder {
  id: string;
  number?: number; // número de pedido legible del batch
  status: OrderStatus;
  pickupCode?: string; // código que el rider muestra al recoger (`pickup_code`)
  shop: OrderParty; // restaurante (marcador A)
  customer: OrderParty; // cliente / entrega (marcador B)
  shopId?: string;
  customerId?: string;
  batchId?: string; // agrupa órdenes del mismo lote/viaje
  methodPayment?: string; // método de pago (ej. "PagoMovil")
  deliveryFee: number; // comisión del rider (ref, USD)
  deliveryFeeBs?: number; // comisión en bolívares
  distanceKm?: number;
  items?: OrderItem[]; // productos del pedido (solo tras aceptar)
  // Rider al que quedó asignada. Vacío/ausente = oferta disponible; con valor =
  // ya la tomó algún rider (señal para retirarla de la cola de ofertas).
  riderId?: string;
  createdAt: string; // ISO
}

// Longitud del código que el rider teclea para confirmar la entrega (OTP del
// cliente). El backend pasó de 6 a 4 dígitos (2026-07-03) — centralizado acá
// para que este tipo de cambio sea un edit de una sola línea.
export const DELIVERY_CODE_LENGTH = 4;

// ── Mensajes entrantes del WebSocket GET /orders/rider ────────────────────────
// Shape real confirmado: `order`, `shop` y `customer` viajan como hermanos en
// la raíz del mensaje (no anidados dentro de `order`).
export type OrderWsMessage =
  | { type: "connected" }
  | { type: "order_update"; order: unknown; shop?: unknown; customer?: unknown }
  | { type: "new_order"; order: unknown; shop?: unknown; customer?: unknown }
  // Respuesta directa a `accept_order`: confirma la aceptación con pickup_code,
  // riderId e items ya incluidos (mismo shape que `order_update`).
  | { type: "order_accepted"; order: unknown; shop?: unknown; customer?: unknown }
  | { type: "orders_snapshot"; orders: unknown[] }
  | { type: "error"; message?: string };
