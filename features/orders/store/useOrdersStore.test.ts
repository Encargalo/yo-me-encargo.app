import type { ActiveOrder } from "../types/order.types";
import { useOrdersStore } from "./useOrdersStore";

function makeOrder(id: string, status: ActiveOrder["status"]): ActiveOrder {
  return {
    id,
    status,
    shop: { name: "Pizza Roma" },
    customer: { name: "Laura" },
    deliveryFee: 5000,
    createdAt: "2026-07-02T14:00:00Z",
  };
}

beforeEach(() => {
  useOrdersStore.setState({
    activeOrders: [],
    statusChangedAt: {},
    isConnected: false,
    isConnecting: false,
    isAvailable: true,
  });
});

describe("useOrdersStore.upsertOrder", () => {
  it("agrega una orden nueva y actualiza una existente sin duplicar", () => {
    const { upsertOrder } = useOrdersStore.getState();

    upsertOrder(makeOrder("a", "Ready"));
    expect(useOrdersStore.getState().activeOrders).toHaveLength(1);

    upsertOrder(makeOrder("a", "On The Way"));
    const orders = useOrdersStore.getState().activeOrders;
    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe("On The Way");
  });

  it("retira la orden cuando llega a un estado terminal", () => {
    const { upsertOrder } = useOrdersStore.getState();

    upsertOrder(makeOrder("a", "On The Way"));
    expect(useOrdersStore.getState().activeOrders).toHaveLength(1);

    upsertOrder(makeOrder("a", "Completed"));
    expect(useOrdersStore.getState().activeOrders).toHaveLength(0);
  });
});

describe("useOrdersStore.setAvailable", () => {
  it("cambia isAvailable sin alterar el estado de conexión", () => {
    useOrdersStore.setState({ isConnected: true, isConnecting: false });

    useOrdersStore.getState().setAvailable(false);

    const state = useOrdersStore.getState();
    expect(state.isAvailable).toBe(false);
    expect(state.isConnected).toBe(true);
    expect(state.isConnecting).toBe(false);
  });
});
