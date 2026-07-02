import { OrderStatusColors } from "@/constants/theme";

import type { OrderColorKey, OrderStatus } from "../types/order.types";

// Normaliza el status entrante a la forma canónica del backend (con espacios),
// tolerando variantes sin espacio y diferencias de mayúsculas.
const STATUS_ALIASES: Record<string, OrderStatus> = {
  pending: "Pending",
  "waiting for payment proof": "Waiting For Payment Proof",
  waitingforpaymentproof: "Waiting For Payment Proof",
  accepted: "Accepted",
  "in preparation": "In Preparation",
  inpreparation: "In Preparation",
  ready: "Ready",
  "on the way": "On The Way",
  ontheway: "On The Way",
  completed: "Completed",
  rejected: "Rejected",
};

export function normalizeStatus(raw?: string): OrderStatus {
  if (!raw) return "Pending";
  return STATUS_ALIASES[raw.trim().toLowerCase()] ?? (raw as OrderStatus);
}

// Desde la óptica del rider, cada estado del backend cae en uno de los 4 colores:
// - pending (ámbar): la orden aún no se recoge del restaurante.
// - enroute (azul): el rider va en camino / entregando.
// - completed (verde): entregada.
// - error (rojo): rechazada / cancelada.
const STATUS_COLOR_BUCKET: Record<OrderStatus, OrderColorKey> = {
  Pending: "pending",
  "Waiting For Payment Proof": "pending",
  Accepted: "pending",
  "In Preparation": "pending",
  Ready: "pending",
  "On The Way": "enroute",
  Completed: "completed",
  Rejected: "error",
};

const COLOR_LABEL: Record<OrderColorKey, string> = {
  pending: "Recogida pendiente",
  enroute: "Entregando",
  completed: "Completado",
  error: "Cancelado",
};

// Prioridad para ordenar la lista: más cerca de entregarse = mayor.
const COLOR_PRIORITY: Record<OrderColorKey, number> = {
  enroute: 3,
  pending: 2,
  error: 1,
  completed: 0,
};

export function getColorKey(status: OrderStatus): OrderColorKey {
  return STATUS_COLOR_BUCKET[status] ?? "pending";
}

export function getStatusColor(status: OrderStatus): string {
  return OrderStatusColors[getColorKey(status)];
}

export function getStatusLabel(status: OrderStatus): string {
  return COLOR_LABEL[getColorKey(status)];
}

export function getStatusPriority(status: OrderStatus): number {
  return COLOR_PRIORITY[getColorKey(status)];
}
