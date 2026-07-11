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
  it("mapea la respuesta completa (con distance_km y payment_method)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance: 24.5,
        zone: "normal",
        transactions: [
          {
            id: "tx-1",
            amount: 8.5,
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
      balance: 24.5,
      zone: "normal",
      transactions: [
        {
          id: "tx-1",
          amount: 8.5,
          createdAt: "2026-06-30T10:00:00Z",
          distanceKm: 3.1,
          movementType: "Comisión entrega",
          orderId: "order-1",
          paymentMethod: "efectivo",
        },
      ],
    });
  });

  it("mapea un movimiento sin distance_km ni payment_method", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        balance: -1.2,
        zone: "normal",
        transactions: [
          {
            id: "tx-2",
            amount: -1.2,
            created_at: "2026-06-30T09:00:00Z",
            movement_type: "Descuento plataforma",
          },
        ],
      },
    });

    const result = await getBalance();

    expect(result.transactions[0]).toEqual({
      id: "tx-2",
      amount: -1.2,
      createdAt: "2026-06-30T09:00:00Z",
      distanceKm: undefined,
      movementType: "Descuento plataforma",
      orderId: undefined,
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
