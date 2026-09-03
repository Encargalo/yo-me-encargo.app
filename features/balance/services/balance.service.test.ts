import type { AxiosError } from "axios";

import apiClient from "@/lib/axios";

import { getBalance } from "./balance.service";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getBalance", () => {
  it("mapea la respuesta completa en Bs (con distance_km y payment_method)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance_bs: 980,
        balance_usd: 24.5,
        bcv_rate: 40,
        zone: "normal",
        withdrawal_min_bs: 600,
        transactions: [
          {
            id: "tx-1",
            amount_bs: 340,
            amount_usd: 8.5,
            bcv_rate: 40,
            created_at: "2026-06-30T10:00:00Z",
            distance_km: 3.1,
            movement_type: "Comisión entrega",
            order_id: "order-1",
            payment_method: "efectivo",
          },
        ],
      },
    });

    const result = await getBalance();

    expect(mockedGet).toHaveBeenCalledWith("/riders/balance");
    expect(result).toEqual({
      balanceBs: 980,
      balanceUsd: 24.5,
      bcvRate: 40,
      zone: "normal",
      withdrawalMinBs: 600,
      transactions: [
        {
          id: "tx-1",
          amountBs: 340,
          amountUsd: 8.5,
          bcvRate: 40,
          createdAt: "2026-06-30T10:00:00Z",
          distanceKm: 3.1,
          movementType: "Comisión entrega",
          orderId: "order-1",
          tripId: undefined,
          paymentMethod: "efectivo",
        },
      ],
    });
  });

  it("mapea el movimiento de un viaje (trip_id en vez de order_id)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance_bs: 340,
        balance_usd: 8.5,
        zone: "normal",
        withdrawal_min_bs: 600,
        transactions: [
          {
            id: "tx-3",
            amount_bs: 340,
            amount_usd: 8.5,
            created_at: "2026-06-30T11:00:00Z",
            movement_type: "ride_bank",
            trip_id: "trip-1",
          },
        ],
      },
    });

    const result = await getBalance();

    expect(result.transactions[0].tripId).toBe("trip-1");
    expect(result.transactions[0].orderId).toBeUndefined();
  });

  it("mapea un movimiento sin campos opcionales", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance_bs: -48,
        balance_usd: -1.2,
        zone: "normal",
        withdrawal_min_bs: 600,
        transactions: [
          {
            id: "tx-2",
            amount_bs: -48,
            amount_usd: -1.2,
            created_at: "2026-06-30T09:00:00Z",
            movement_type: "Descuento plataforma",
          },
        ],
      },
    });

    const result = await getBalance();

    expect(result.bcvRate).toBeUndefined();
    expect(result.transactions[0]).toEqual({
      id: "tx-2",
      amountBs: -48,
      amountUsd: -1.2,
      bcvRate: undefined,
      createdAt: "2026-06-30T09:00:00Z",
      distanceKm: undefined,
      movementType: "Descuento plataforma",
      orderId: undefined,
      tripId: undefined,
      paymentMethod: undefined,
    });
  });

  it("propaga el error como AxiosError sin capturarlo", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 500, data: {} },
    } as AxiosError;
    mockedGet.mockRejectedValueOnce(axiosError);

    await expect(getBalance()).rejects.toBe(axiosError);
  });
});
