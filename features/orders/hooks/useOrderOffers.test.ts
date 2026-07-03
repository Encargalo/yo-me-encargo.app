import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import { acceptOrder, rejectOrder } from "../services/ordersRiderWsService";
import { SUSPENSION_MS, useOffersStore } from "../store/useOffersStore";
import type { ActiveOrder } from "../types/order.types";
import { useOrderOffers } from "./useOrderOffers";

jest.mock("../services/ordersRiderWsService", () => ({
  acceptOrder: jest.fn(),
  rejectOrder: jest.fn(),
}));

// Sin ubicación → la distancia no se calcula (irrelevante para estos tests).
jest.mock("./useRiderLocation", () => ({
  useRiderLocation: () => ({ region: null, status: "denied" }),
}));

const mockedAccept = acceptOrder as jest.MockedFunction<typeof acceptOrder>;
const mockedReject = rejectOrder as jest.MockedFunction<typeof rejectOrder>;

function makeOffer(id: string): ActiveOrder {
  return {
    id,
    status: "In Preparation",
    shop: { name: "Pizza Roma" },
    customer: { name: "Laura" },
    deliveryFee: 0.64,
    createdAt: "0001-01-01T00:00:00Z",
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useOffersStore.getState().reset();
});

describe("useOrderOffers", () => {
  it("expone la oferta visible y avanza al expirar el temporizador", async () => {
    jest.useFakeTimers();
    useOffersStore.getState().enqueue(makeOffer("a"));

    const { result } = await renderHook(() => useOrderOffers());
    expect(result.current.offer?.id).toBe("a");

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    // Expirada sin respuesta → sale de la cola, sin sumar a la racha.
    expect(useOffersStore.getState().queue).toHaveLength(0);
    expect(useOffersStore.getState().rejectStreak).toBe(0);
    jest.useRealTimers();
  });

  it("accept envía la aceptación y resuelve la oferta", async () => {
    useOffersStore.getState().enqueue(makeOffer("a"));
    const { result } = await renderHook(() => useOrderOffers());

    await act(async () => {
      result.current.accept();
    });

    expect(mockedAccept).toHaveBeenCalledWith("a");
    expect(useOffersStore.getState().queue).toHaveLength(0);
  });

  it("reject envía el rechazo, resuelve y suma a la racha", async () => {
    useOffersStore.getState().enqueue(makeOffer("a"));
    const { result } = await renderHook(() => useOrderOffers());

    await act(async () => {
      result.current.reject();
    });

    expect(mockedReject).toHaveBeenCalledWith("a");
    expect(useOffersStore.getState().rejectStreak).toBe(1);
  });

  it("no muestra oferta mientras hay suspensión vigente", async () => {
    useOffersStore.setState({
      queue: [makeOffer("a")],
      suspendedUntil: Date.now() + SUSPENSION_MS,
    });
    const { result } = await renderHook(() => useOrderOffers());
    expect(result.current.offer).toBeUndefined();
  });

  it("levanta la suspensión cuando la app vuelve a primer plano", async () => {
    let appStateCb: ((s: string) => void) | undefined;
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, cb) => {
        appStateCb = cb as (s: string) => void;
        return { remove: jest.fn() } as never;
      });

    useOffersStore.setState({
      suspendedUntil: Date.now() + SUSPENSION_MS,
      rejectStreak: 10,
    });
    await renderHook(() => useOrderOffers());

    await act(async () => {
      appStateCb?.("active");
    });

    const state = useOffersStore.getState();
    expect(state.suspendedUntil).toBeNull();
    expect(state.rejectStreak).toBe(0);
  });
});
