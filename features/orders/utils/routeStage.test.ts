import { OrderStatusColors } from "@/constants/theme";

import { DIMMED_PIN_OPACITY, getRouteStageInfo } from "./routeStage";

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
