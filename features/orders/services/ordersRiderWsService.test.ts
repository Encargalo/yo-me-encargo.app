import { useOffersStore } from "../store/useOffersStore";
import { useOrdersStore } from "../store/useOrdersStore";
import type { ActiveOrder } from "../types/order.types";
import { routeToOffers } from "./ordersRiderWsService";

function makeOrder(
  id: string,
  overrides: Partial<ActiveOrder> = {},
): ActiveOrder {
  return {
    id,
    status: "In Preparation",
    shop: { name: "Pizza Roma" },
    customer: { name: "Laura" },
    deliveryFee: 0.64,
    createdAt: "0001-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  useOffersStore.getState().reset();
  useOrdersStore.setState({ activeOrders: [], statusChangedAt: {} });
});

describe("routeToOffers", () => {
  it("encola una oferta fresca (new_order sin riderId, desconocida)", () => {
    routeToOffers(makeOrder("a"), "new_order");
    expect(useOffersStore.getState().queue.map((o) => o.id)).toEqual(["a"]);
  });

  it("no ofrece una orden que ya es mía, aunque el new_order venga sin riderId", () => {
    // Antes llegó como order_update con mi riderId → quedó en mis activas.
    useOrdersStore.setState({
      activeOrders: [makeOrder("a", { riderId: "me", status: "On The Way" })],
    });

    // Re-broadcast como oferta sin riderId: NO debe encolarse.
    routeToOffers(makeOrder("a"), "new_order");

    const offers = useOffersStore.getState();
    expect(offers.queue).toHaveLength(0);
    expect(offers.decidedIds["a"]).toBe(true); // queda pegada como decidida
  });

  it("retira de la cola una orden asignada a otro rider (riderId presente)", () => {
    useOffersStore.getState().enqueue(makeOrder("a"));
    routeToOffers(makeOrder("a", { riderId: "otro" }), "order_update");
    expect(useOffersStore.getState().queue).toHaveLength(0);
  });

  it("un order_update sin riderId de una orden no-mía no la encola", () => {
    routeToOffers(makeOrder("a"), "order_update");
    expect(useOffersStore.getState().queue).toHaveLength(0);
  });
});
