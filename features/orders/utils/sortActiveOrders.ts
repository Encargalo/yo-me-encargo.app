import type { ActiveOrder } from "../types/order.types";
import { getStatusPriority } from "./orderStatus";

/**
 * Ordena las órdenes activas del rider:
 * 1. Por prioridad de estado descendente (Entregando > Recogida pendiente > ...).
 *    La primera es la más próxima a completarse.
 * 2. Desempate: la que transicionó más recientemente a su estado va primero
 *    (`statusChangedAt` desc).
 */
export function sortActiveOrders(
  orders: ActiveOrder[],
  statusChangedAt: Record<string, number>,
): ActiveOrder[] {
  return [...orders].sort((a, b) => {
    const pa = getStatusPriority(a.status);
    const pb = getStatusPriority(b.status);
    if (pa !== pb) return pb - pa;
    return (statusChangedAt[b.id] ?? 0) - (statusChangedAt[a.id] ?? 0);
  });
}
