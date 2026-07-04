import type { ActiveOrder } from "../types/order.types";

// Máximo de órdenes aceptadas simultáneas que el rider puede tener (impuesto
// por el backend); el cliente se limita a esta cantidad de forma defensiva.
const MAX_FOCUSED_ORDERS = 2;

/**
 * Elige las órdenes que enfocan el mapa: las órdenes ACEPTADAS (con `riderId`
 * propio) de la lista ya priorizada por `sortActiveOrders`, hasta un máximo de
 * `MAX_FOCUSED_ORDERS`. Las ofertas sin decidir (sin `riderId`) no deben
 * mostrar pines de tienda/cliente en el mapa.
 */
export function getFocusedOrders(orders: ActiveOrder[]): ActiveOrder[] {
  return orders.filter((order) => !!order.riderId).slice(0, MAX_FOCUSED_ORDERS);
}
