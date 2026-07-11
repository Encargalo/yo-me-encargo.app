import { act, renderHook } from "@testing-library/react-native";
import type { AxiosError } from "axios";

import { useOrdersStore } from "../store/useOrdersStore";
import type { ActiveOrder } from "../types/order.types";
import { useOrderDetail } from "./useOrderDetail";

jest.mock("../services/ordersRiderWsService", () => ({
  acceptOrder: jest.fn(),
}));
jest.mock("../services/orders.service", () => ({
  confirmDelivery: jest.fn(),
}));
jest.mock("./useRiderLocation", () => ({
  useRiderLocation: () => ({ region: null, status: "denied" }),
}));

const { acceptOrder } = jest.requireMock("../services/ordersRiderWsService");
const { confirmDelivery } = jest.requireMock("../services/orders.service");

function makeOrder(overrides: Partial<ActiveOrder> = {}): ActiveOrder {
  return {
    id: "order-1",
    status: "In Preparation",
    shop: { name: "Goofy Delicias" },
    customer: { name: "Ruben" },
    deliveryFee: 0.96,
    createdAt: "0001-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useOrdersStore.getState().reset();
});

describe("useOrderDetail", () => {
  it("stage 'not-found' cuando el id no está en el store", async () => {
    const { result } = await renderHook(() => useOrderDetail("missing"));
    expect(result.current.stage).toBe("not-found");
  });

  it("stage 'offer' para una orden sin riderId", async () => {
    useOrdersStore.getState().upsertOrder(makeOrder());
    const { result } = await renderHook(() => useOrderDetail("order-1"));
    expect(result.current.stage).toBe("offer");
  });

  it("stage 'pending-pickup' para una orden que ya era mía al entrar", async () => {
    useOrdersStore.getState().upsertOrder(makeOrder({ riderId: "me", pickupCode: "4474" }));
    const { result } = await renderHook(() => useOrderDetail("order-1"));
    expect(result.current.stage).toBe("pending-pickup");
  });

  it("stage 'on-the-way' cuando la orden mía pasa a En camino", async () => {
    useOrdersStore.getState().upsertOrder(makeOrder({ riderId: "me", status: "On The Way" }));
    const { result } = await renderHook(() => useOrderDetail("order-1"));
    expect(result.current.stage).toBe("on-the-way");
  });

  it("stage 'taken' cuando otro rider toma la orden mientras se ve el Detalle (sin haberla aceptado)", async () => {
    useOrdersStore.getState().upsertOrder(makeOrder());
    const { result, rerender } = await renderHook(() => useOrderDetail("order-1"));
    expect(result.current.stage).toBe("offer");

    await act(async () => {
      useOrdersStore.getState().upsertOrder(makeOrder({ riderId: "other" }));
    });
    await rerender({});

    expect(result.current.stage).toBe("taken");
  });

  it("accept() llama acceptOrder y deja de esperar cuando llega el riderId", async () => {
    useOrdersStore.getState().upsertOrder(makeOrder());
    const { result, rerender } = await renderHook(() => useOrderDetail("order-1"));

    await act(async () => {
      result.current.accept();
    });
    expect(acceptOrder).toHaveBeenCalledWith("order-1");
    expect(result.current.accepting).toBe(true);

    await act(async () => {
      useOrdersStore.getState().upsertOrder(makeOrder({ riderId: "me", pickupCode: "4474" }));
    });
    await rerender({});

    expect(result.current.accepting).toBe(false);
    expect(result.current.stage).toBe("pending-pickup");
  });

  it("confirmDelivery mapea cada código de error a su mensaje y vacía el código en 400", async () => {
    useOrdersStore.getState().upsertOrder(makeOrder({ riderId: "me", status: "On The Way" }));
    const { result, rerender } = await renderHook(() => useOrderDetail("order-1"));

    const cases: [number, string][] = [
      [400, "Código inválido"],
      [404, "Pedido no encontrado"],
      [409, "Código ya utilizado"],
      [422, "Estado del pedido incorrecto"],
    ];

    for (const [status, message] of cases) {
      const axiosError = {
        isAxiosError: true,
        response: { status },
      } as AxiosError;
      confirmDelivery.mockRejectedValueOnce(axiosError);

      await act(async () => {
        result.current.setOtpCode("123456");
      });
      await act(async () => {
        result.current.confirmDelivery();
      });
      await rerender({});

      expect(result.current.deliveryError).toBe(message);
      if (status === 400) {
        expect(result.current.otpCode).toBe("");
      }
    }
  });

  it("confirmDelivery exitoso guarda el resumen y sobrevive a que la orden salga del store", async () => {
    useOrdersStore
      .getState()
      .upsertOrder(makeOrder({ riderId: "me", status: "On The Way", number: 128 }));
    const { result, rerender } = await renderHook(() => useOrderDetail("order-1"));

    confirmDelivery.mockResolvedValueOnce(undefined);
    await act(async () => {
      result.current.setOtpCode("482913");
    });
    await act(async () => {
      result.current.confirmDelivery();
    });
    await rerender({});

    expect(result.current.stage).toBe("completed");
    expect(result.current.completedSummary).toEqual({
      customerName: "Ruben",
      distanceKm: undefined,
      deliveryFee: 0.96,
      orderNumber: 128,
      shopName: "Goofy Delicias",
    });

    // La orden llega a estado terminal y useOrdersStore la retira — el
    // resumen debe seguir visible (no depende de que siga en el store).
    await act(async () => {
      useOrdersStore.getState().upsertOrder(makeOrder({ riderId: "me", status: "Completed" }));
    });
    await rerender({});

    expect(result.current.stage).toBe("completed");
  });
});
