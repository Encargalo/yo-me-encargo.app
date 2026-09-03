import type { AxiosError } from "axios";

import apiClient from "@/lib/axios";

import { getMockRecentWithdrawals, requestWithdrawal } from "./withdrawal.service";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requestWithdrawal", () => {
  it("mapea amount_withdrawn (Bs) a amountWithdrawnBs", async () => {
    mockedPost.mockResolvedValueOnce({ data: { amount_withdrawn: 980 } });

    const result = await requestWithdrawal();

    expect(mockedPost).toHaveBeenCalledWith("/riders/withdrawal");
    expect(result).toEqual({ amountWithdrawnBs: 980 });
  });

  it("propaga el error como AxiosError sin capturarlo", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 422, data: "string" },
    } as AxiosError;
    mockedPost.mockRejectedValueOnce(axiosError);

    await expect(requestWithdrawal()).rejects.toBe(axiosError);
  });
});

describe("getMockRecentWithdrawals", () => {
  it("devuelve el array mockeado con amountBs, date y status", () => {
    const result = getMockRecentWithdrawals();

    expect(result).toEqual([
      { amountBs: 1200, date: "2026-06-28T12:00:00Z", status: "processed" },
      { amountBs: 720, date: "2026-06-30T12:00:00Z", status: "pending" },
    ]);
  });
});
