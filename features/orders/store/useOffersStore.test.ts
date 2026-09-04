import type { ActiveOrder } from "../types/order.types";
import { isSuspended, REJECT_STREAK_LIMIT, SUSPENSION_MS, useOffersStore } from "./useOffersStore";

function makeOffer(id: string): ActiveOrder {
  return {
    id,
    status: "In Preparation",
    shop: { name: "Pizza Roma" },
    customer: { name: "Laura", address: "Av. Principal" },
    deliveryFee: 0.64,
    createdAt: "0001-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  useOffersStore.getState().reset();
});

describe("useOffersStore.enqueue", () => {
  it("encola ofertas nuevas y expone la visible como queue[0]", () => {
    const { enqueue } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    enqueue(makeOffer("b"));

    const { queue } = useOffersStore.getState();
    expect(queue.map((o) => o.id)).toEqual(["a", "b"]);
  });

  it("deduplica ofertas ya en cola y ya decididas (ráfaga de reconexión)", () => {
    const { enqueue, resolveCurrent } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    enqueue(makeOffer("a")); // duplicado en cola → ignorado
    expect(useOffersStore.getState().queue).toHaveLength(1);

    resolveCurrent("reject"); // "a" queda decidida
    enqueue(makeOffer("a")); // re-emitida al reconectar → ignorada
    expect(useOffersStore.getState().queue).toHaveLength(0);
  });

  it("ignora nuevas ofertas mientras hay suspensión vigente", () => {
    useOffersStore.setState({ suspendedUntil: Date.now() + SUSPENSION_MS });
    useOffersStore.getState().enqueue(makeOffer("a"));
    expect(useOffersStore.getState().queue).toHaveLength(0);
  });
});

describe("useOffersStore.resolveCurrent", () => {
  it("avanza al siguiente de la cola al resolver la visible", () => {
    const { enqueue, resolveCurrent } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    enqueue(makeOffer("b"));

    resolveCurrent("reject");
    expect(useOffersStore.getState().queue.map((o) => o.id)).toEqual(["b"]);
  });

  it("reject incrementa la racha; a los 10 activa la suspensión", () => {
    const { enqueue, resolveCurrent } = useOffersStore.getState();
    for (let i = 0; i < REJECT_STREAK_LIMIT; i++) {
      enqueue(makeOffer(`o${i}`));
      resolveCurrent("reject");
    }
    const state = useOffersStore.getState();
    expect(state.rejectStreak).toBe(REJECT_STREAK_LIMIT);
    expect(isSuspended(state)).toBe(true);
  });

  it("accept reinicia la racha de rechazos", () => {
    const { enqueue, resolveCurrent } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    resolveCurrent("reject");
    enqueue(makeOffer("b"));
    resolveCurrent("accept");
    expect(useOffersStore.getState().rejectStreak).toBe(0);
  });

  it("expire NO afecta la racha de rechazos", () => {
    const { enqueue, resolveCurrent } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    resolveCurrent("expire");
    expect(useOffersStore.getState().rejectStreak).toBe(0);
  });
});

describe("useOffersStore.dropFromQueue", () => {
  it("retira una oferta tomada por otro sin tocar la racha", () => {
    const { enqueue, resolveCurrent, dropFromQueue } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    resolveCurrent("reject"); // racha = 1
    enqueue(makeOffer("b"));
    enqueue(makeOffer("c"));

    dropFromQueue("c"); // encolada no visible
    const state = useOffersStore.getState();
    expect(state.queue.map((o) => o.id)).toEqual(["b"]);
    expect(state.rejectStreak).toBe(1); // sin cambios
    expect(state.decidedIds["c"]).toBe(true); // no se re-encola
  });

  it("al dropear la visible, la cola avanza a la siguiente", () => {
    const { enqueue, dropFromQueue } = useOffersStore.getState();
    enqueue(makeOffer("a"));
    enqueue(makeOffer("b"));

    dropFromQueue("a"); // la visible fue tomada por otro
    expect(useOffersStore.getState().queue.map((o) => o.id)).toEqual(["b"]);
  });
});

describe("useOffersStore.clearSuspension", () => {
  it("levanta la suspensión y reinicia la racha", () => {
    useOffersStore.setState({
      suspendedUntil: Date.now() + SUSPENSION_MS,
      rejectStreak: REJECT_STREAK_LIMIT,
    });
    useOffersStore.getState().clearSuspension();
    const state = useOffersStore.getState();
    expect(state.suspendedUntil).toBeNull();
    expect(state.rejectStreak).toBe(0);
    expect(isSuspended(state)).toBe(false);
  });
});
