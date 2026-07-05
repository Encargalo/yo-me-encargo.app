import type { AxiosError } from "axios";

import apiClient from "@/lib/axios";

import { getTransactions } from "./historial.service";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getTransactions", () => {
  it("mapea una página con más transacciones pendientes que el límite", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        page: 1,
        limit: 20,
        total: 45,
        transactions: [
          {
            id: "tx-1",
            amount: 8.5,
            created_at: "2026-06-30T14:20:00Z",
            distance_km: 3.1,
            movement_type: "ride_bank",
            order_id: "order-1",
            payment_method: "efectivo",
          },
        ],
      },
    });

    const result = await getTransactions({ page: 1, limit: 20 });

    expect(mockedGet).toHaveBeenCalledWith("/riders/transactions", {
      params: { page: 1, limit: 20 },
    });
    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 45,
      transactions: [
        {
          id: "tx-1",
          amount: 8.5,
          createdAt: "2026-06-30T14:20:00Z",
          distanceKm: 3.1,
          movementType: "ride_bank",
          orderId: "order-1",
          paymentMethod: "efectivo",
        },
      ],
    });
  });

  it("mapea una página sin transacciones (total 0)", async () => {
    mockedGet.mockResolvedValueOnce({
      data: { page: 1, limit: 20, total: 0, transactions: [] },
    });

    const result = await getTransactions({ page: 1, limit: 20 });

    expect(result).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      transactions: [],
    });
  });

  it("propaga el error como AxiosError sin capturarlo", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 500, data: {} },
    } as AxiosError;
    mockedGet.mockRejectedValueOnce(axiosError);

    await expect(getTransactions({ page: 1, limit: 20 })).rejects.toBe(
      axiosError,
    );
  });
});
