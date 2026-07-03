import type { ActiveOrder } from "../types/order.types";
import { getFocusedOrder } from "./getFocusedOrder";

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

describe("getFocusedOrder", () => {
  it("resuelve a la primera orden aceptada cuando se mezclan ofertas y aceptadas", () => {
    const orders = [makeOrder("offer-1"), makeOrder("mine", "rider-1")];
    expect(getFocusedOrder(orders)?.id).toBe("mine");
  });

  it("es undefined cuando solo hay ofertas sin decidir", () => {
    const orders = [makeOrder("offer-1"), makeOrder("offer-2")];
    expect(getFocusedOrder(orders)).toBeUndefined();
  });

  it("es undefined con la lista vacía", () => {
    expect(getFocusedOrder([])).toBeUndefined();
  });
});
