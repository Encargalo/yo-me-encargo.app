import type { ActiveOrder } from "../types/order.types";

/**
 * Elige la orden que enfoca el mapa: la primera orden ACEPTADA (con `riderId`
 * propio) de la lista ya priorizada por `sortActiveOrders`. Las ofertas sin
 * decidir (sin `riderId`) no deben mostrar pines de tienda/cliente en el mapa.
 */
export function getFocusedOrder(
  orders: ActiveOrder[],
): ActiveOrder | undefined {
  return orders.find((order) => !!order.riderId);
}
