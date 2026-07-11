import { OrderStatusColors } from "@/constants/theme";

import type { ActiveOrder } from "../types/order.types";
import { DIMMED_PIN_OPACITY, getRouteStageInfo, rankOrdersByPriority } from "./routeStage";

function makeOrder(overrides: Partial<ActiveOrder> = {}): ActiveOrder {
  return {
    id: "order-1",
    status: "Ready",
    riderId: "rider-1",
    shop: { name: "Tienda" },
    customer: { name: "Cliente" },
    deliveryFee: 1,
    createdAt: "2026-07-03T00:00:00Z",
    ...overrides,
  };
}

describe("getRouteStageInfo", () => {
  it("traza hacia la tienda en recogida pendiente, con línea ámbar", () => {
    const info = getRouteStageInfo("Ready");
    expect(info).toEqual({
      destination: "shop",
      strokeColor: OrderStatusColors.pending,
      shopOpacity: 1,
      customerOpacity: DIMMED_PIN_OPACITY,
    });
  });

  it("traza hacia el cliente en camino, con línea azul", () => {
    const info = getRouteStageInfo("On The Way");
    expect(info).toEqual({
      destination: "customer",
      strokeColor: OrderStatusColors.enroute,
      shopOpacity: DIMMED_PIN_OPACITY,
      customerOpacity: 1,
    });
  });

  it("es null para un status fuera de pending/enroute (ej. completado)", () => {
    expect(getRouteStageInfo("Completed")).toBeNull();
  });
});

describe("rankOrdersByPriority", () => {
  const riderCoord = { latitude: 0, longitude: 0 };

  it("prioriza la orden en camino sobre la de recogida pendiente, sin importar distancia", () => {
    const enroute = makeOrder({
      id: "enroute",
      status: "On The Way",
      customer: { name: "Cliente", latitude: 10, longitude: 10 }, // lejos
    });
    const pending = makeOrder({
      id: "pending",
      status: "Ready",
      shop: { name: "Tienda", latitude: 0.001, longitude: 0.001 }, // cerca
    });

    expect(rankOrdersByPriority([pending, enroute], riderCoord).map((o) => o.id)).toEqual([
      "enroute",
      "pending",
    ]);
  });

  it("en la misma etapa, prioriza el destino más cercano al rider", () => {
    const far = makeOrder({
      id: "far",
      status: "On The Way",
      customer: { name: "Cliente", latitude: 1, longitude: 1 },
    });
    const near = makeOrder({
      id: "near",
      status: "On The Way",
      customer: { name: "Cliente", latitude: 0.001, longitude: 0.001 },
    });

    expect(rankOrdersByPriority([far, near], riderCoord).map((o) => o.id)).toEqual(["near", "far"]);
  });

  it("devuelve la única orden sin comparar cuando hay 1 sola", () => {
    const order = makeOrder({ id: "solo", status: "On The Way" });
    expect(rankOrdersByPriority([order], riderCoord).map((o) => o.id)).toEqual(["solo"]);
  });

  it("es vacío con la lista vacía", () => {
    expect(rankOrdersByPriority([], riderCoord)).toEqual([]);
  });
});
