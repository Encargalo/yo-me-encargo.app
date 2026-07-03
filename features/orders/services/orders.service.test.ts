import type { AxiosError } from "axios";

import apiClient from "@/lib/axios";

import { confirmDelivery } from "./orders.service";

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("confirmDelivery", () => {
  it("envía el código al endpoint de confirmación de entrega", async () => {
    mockedPost.mockResolvedValueOnce({ data: {} });

    await confirmDelivery("order-1", "482913");

    expect(mockedPost).toHaveBeenCalledWith(
      "/orders/order-1/confirm-delivery",
      { code: "482913" },
    );
  });

  it("propaga el error como AxiosError sin capturarlo", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 400, data: {} },
    } as AxiosError;
    mockedPost.mockRejectedValueOnce(axiosError);

    await expect(confirmDelivery("order-1", "000000")).rejects.toBe(
      axiosError,
    );
  });
});
