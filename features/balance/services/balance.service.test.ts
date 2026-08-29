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
  it("mapea la respuesta completa (con distance_km, payment_method y bcv_rate)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance_bs: 3200,
        balance_usd: 80,
        bcv_rate: 40,
        zone: "withdrawal_available",
        withdrawal_min_bs: 600,
        transactions: [
          {
            id: "tx-1",
            amount_bs: 1280,
            amount_usd: 32,
            bcv_rate: 40,
            created_at: "2026-06-30T10:00:00Z",
            distance_km: 3.1,
            movement_type: "ride_bank",
            order_id: "order-1",
            payment_method: "cash",
          },
        ],
      },
    });

    const result = await getBalance();

    expect(mockedGet).toHaveBeenCalledWith("/riders/balance");
    expect(result).toEqual({
      balanceBs: 3200,
      balanceUsd: 80,
      bcvRate: 40,
      zone: "withdrawal_available",
      withdrawalMinBs: 600,
      transactions: [
        {
          id: "tx-1",
          amountBs: 1280,
          amountUsd: 32,
          bcvRate: 40,
          createdAt: "2026-06-30T10:00:00Z",
          distanceKm: 3.1,
          movementType: "ride_bank",
          orderId: "order-1",
          paymentMethod: "cash",
        },
      ],
    });
  });

  it("mapea un movimiento sin distance_km, payment_method ni bcv_rate", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance_bs: -48,
        balance_usd: -1.2,
        zone: "normal",
        transactions: [
          {
            id: "tx-2",
            amount_bs: -48,
            amount_usd: -1.2,
            created_at: "2026-06-30T09:00:00Z",
            movement_type: "platform_fee",
          },
        ],
      },
    });

    const result = await getBalance();

    expect(result.transactions[0]).toEqual({
      id: "tx-2",
      amountBs: -48,
      amountUsd: -1.2,
      bcvRate: undefined,
      createdAt: "2026-06-30T09:00:00Z",
      distanceKm: undefined,
      movementType: "platform_fee",
      orderId: undefined,
      paymentMethod: undefined,
    });
    expect(result.withdrawalMinBs).toBeUndefined();
  });

  it("propaga el error como AxiosError sin capturarlo", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 500, data: {} },
    } as AxiosError;
    mockedGet.mockRejectedValueOnce(axiosError);

    await expect(getBalance()).rejects.toBe(axiosError);
  });

  it("lanza un error si el backend responde sin `balance_bs` (200 con forma inesperada)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { zone: "normal", transactions: [] },
    });

    await expect(getBalance()).rejects.toThrow(/formato inesperado/);
  });

  it("lanza un error si `transactions` no es un arreglo", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { balance_bs: 3200, balance_usd: 80, zone: "normal", transactions: null },
    });

    await expect(getBalance()).rejects.toThrow(/formato inesperado/);
  });
});
