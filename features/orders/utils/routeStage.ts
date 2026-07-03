import { OrderStatusColors } from "@/constants/theme";

import type { OrderStatus } from "../types/order.types";
import { getColorKey } from "./orderStatus";

// Opacidad del pin que no es el destino de la etapa actual.
export const DIMMED_PIN_OPACITY = 0.35;

export interface RouteStageInfo {
  destination: "shop" | "customer";
  strokeColor: string;
  shopOpacity: number;
  customerOpacity: number;
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
