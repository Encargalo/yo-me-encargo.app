import { OrderStatusColors } from "@/constants/theme";

import type { ActiveOrder, OrderParty, OrderStatus } from "../types/order.types";
import { haversineKm } from "./haversine";
import { getColorKey, getStatusPriority } from "./orderStatus";

// Opacidad del pin que no es el destino de la etapa actual.
export const DIMMED_PIN_OPACITY = 0.35;

// Mezcla hacia blanco del color base de la ruta secundaria cuando hay 2
// órdenes enfocadas simultáneas (ver `rankOrdersByPriority`).
export const SECONDARY_ROUTE_LIGHTEN_RATIO = 0.65;

export type LatLng = { latitude: number; longitude: number };

export interface RouteStageInfo {
  destination: "shop" | "customer";
  strokeColor: string;
  shopOpacity: number;
  customerOpacity: number;
}

export function partyCoord(party?: OrderParty): LatLng | null {
  if (!party) return null;
  const { latitude, longitude } = party;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return { latitude, longitude };
}

/**
 * Deriva, a partir del status de la orden aceptada enfocada, hacia dónde debe
 * trazarse la ruta (tienda o cliente), el color de la línea y la opacidad de
 * cada pin. `null` cuando el status no cae en "recogida pendiente" ni
 * "en camino" (ej. ya no aplica ruta): no se traza ruta y ambos pines quedan
 * a opacidad normal.
 */
export function getRouteStageInfo(status: OrderStatus): RouteStageInfo | null {
  const colorKey = getColorKey(status);

  if (colorKey === "pending") {
    return {
      destination: "shop",
      strokeColor: OrderStatusColors.pending,
      shopOpacity: 1,
      customerOpacity: DIMMED_PIN_OPACITY,
    };
  }

  if (colorKey === "enroute") {
    return {
      destination: "customer",
      strokeColor: OrderStatusColors.enroute,
      shopOpacity: DIMMED_PIN_OPACITY,
      customerOpacity: 1,
    };
  }

  return null;
}

function destinationCoordFor(order: ActiveOrder): LatLng | null {
  const stageInfo = getRouteStageInfo(order.status);
  if (!stageInfo) return null;
  return stageInfo.destination === "shop" ? partyCoord(order.shop) : partyCoord(order.customer);
}

/**
 * Ordena órdenes aceptadas por prioridad visual entre rutas simultáneas: la
 * primera de la lista resultante es la prioritaria (ruta a color normal), la
 * segunda (si existe) la secundaria (ruta atenuada, ver `SECONDARY_ROUTE_LIGHTEN_RATIO`).
 * Prioridad: 1) etapa más avanzada (`getStatusPriority`, "En camino" > "Recogida
 * pendiente"); 2) si empatan (misma etapa), la de destino más cercano al rider.
 */
export function rankOrdersByPriority(
  orders: ActiveOrder[],
  riderCoord: LatLng | null,
): ActiveOrder[] {
  return [...orders].sort((a, b) => {
    const priorityDiff = getStatusPriority(b.status) - getStatusPriority(a.status);
    if (priorityDiff !== 0) return priorityDiff;
    if (!riderCoord) return 0;

    const destA = destinationCoordFor(a);
    const destB = destinationCoordFor(b);
    if (!destA || !destB) return 0;

    return haversineKm(riderCoord, destA) - haversineKm(riderCoord, destB);
  });
}
