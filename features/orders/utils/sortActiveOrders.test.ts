import type { ActiveOrder } from "../types/order.types";
import { sortActiveOrders } from "./sortActiveOrders";

function makeOrder(id: string, status: ActiveOrder["status"]): ActiveOrder {
  return {
    id,
    status,
    shop: { name: "" },
    customer: { name: "" },
    deliveryFee: 0,
    createdAt: "2026-07-02T14:00:00Z",
  };
}

describe("sortActiveOrders", () => {
  it("ordena 'On The Way' antes que las de recogida pendiente", () => {
    const orders = [
      makeOrder("a", "Ready"),
      makeOrder("b", "On The Way"),
      makeOrder("c", "In Preparation"),
    ];

    const sorted = sortActiveOrders(orders, {});
    expect(sorted[0].id).toBe("b");
  });

  it("desempata por el estado cambiado más recientemente", () => {
    const orders = [makeOrder("a", "Ready"), makeOrder("b", "Ready")];
    const sorted = sortActiveOrders(orders, { a: 1, b: 2 });
    expect(sorted[0].id).toBe("b");
  });

  it("no muta el arreglo original", () => {
    const orders = [makeOrder("a", "Ready"), makeOrder("b", "On The Way")];
    const copy = [...orders];
    sortActiveOrders(orders, {});
    expect(orders).toEqual(copy);
  });
});
