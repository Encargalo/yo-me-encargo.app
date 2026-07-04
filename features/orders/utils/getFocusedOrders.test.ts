import type { ActiveOrder } from "../types/order.types";
import { getFocusedOrders } from "./getFocusedOrders";

function makeOrder(id: string, riderId?: string): ActiveOrder {
  return {
    id,
    status: "Pending",
    shop: { name: "" },
    customer: { name: "" },
    deliveryFee: 0,
    createdAt: "2026-07-02T14:00:00Z",
    riderId,
  };
}

describe("getFocusedOrders", () => {
  it("resuelve solo las órdenes aceptadas cuando se mezclan ofertas y aceptadas", () => {
    const orders = [makeOrder("offer-1"), makeOrder("mine", "rider-1")];
    expect(getFocusedOrders(orders).map((o) => o.id)).toEqual(["mine"]);
  });

  it("devuelve las 2 órdenes aceptadas en el orden de la lista priorizada", () => {
    const orders = [
      makeOrder("mine-a", "rider-1"),
      makeOrder("mine-b", "rider-1"),
    ];
    expect(getFocusedOrders(orders).map((o) => o.id)).toEqual([
      "mine-a",
      "mine-b",
    ]);
  });

  it("recorta a 2 aunque lleguen más de 2 órdenes aceptadas (caso defensivo)", () => {
    const orders = [
      makeOrder("mine-a", "rider-1"),
      makeOrder("mine-b", "rider-1"),
      makeOrder("mine-c", "rider-1"),
    ];
    expect(getFocusedOrders(orders).map((o) => o.id)).toEqual([
      "mine-a",
      "mine-b",
    ]);
  });

  it("es vacío cuando solo hay ofertas sin decidir", () => {
    const orders = [makeOrder("offer-1"), makeOrder("offer-2")];
    expect(getFocusedOrders(orders)).toEqual([]);
  });

  it("es vacío con la lista vacía", () => {
    expect(getFocusedOrders([])).toEqual([]);
  });
});
