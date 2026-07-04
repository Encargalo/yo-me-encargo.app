import { act, renderHook } from "@testing-library/react-native";
import type { AxiosError } from "axios";

import {
  getMockRecentWithdrawals,
  requestWithdrawal,
} from "../services/withdrawal.service";
import { useWithdrawal } from "./useWithdrawal";

jest.mock("../services/withdrawal.service", () => ({
  requestWithdrawal: jest.fn(),
  getMockRecentWithdrawals: jest.fn(),
}));

const mockedRequestWithdrawal = requestWithdrawal as jest.Mock;
const mockedGetMockRecentWithdrawals =
  getMockRecentWithdrawals as jest.Mock;

const sampleRecent = [
  { amount: 30, date: "2026-06-28T00:00:00Z", status: "processed" as const },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetMockRecentWithdrawals.mockReturnValue(sampleRecent);
});

describe("useWithdrawal", () => {
  it("estado inicial: idle, expone los retiros recientes mockeados", async () => {
    const { result } = await renderHook(() => useWithdrawal());

    expect(result.current.status).toBe("idle");
    expect(result.current.recentWithdrawals).toEqual(sampleRecent);
  });

  it("envío exitoso pasa por submitting y termina en success con el monto", async () => {
    let resolveRequest: (value: { amountWithdrawn: number }) => void = () => {};
    mockedRequestWithdrawal.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = await renderHook(() => useWithdrawal());

    await act(async () => {
      result.current.submit();
    });
    expect(result.current.status).toBe("submitting");

    await act(async () => {
      resolveRequest({ amountWithdrawn: 24.5 });
    });

    expect(result.current.status).toBe("success");
    expect(result.current.amountWithdrawn).toBe(24.5);
  });

  it("error 422 → mensaje de saldo insuficiente", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 422 },
    } as AxiosError;
    mockedRequestWithdrawal.mockRejectedValueOnce(axiosError);

    const { result } = await renderHook(() => useWithdrawal());

    await act(async () => {
      result.current.submit();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe(
      "Tu saldo es insuficiente para retirar.",
    );
  });

  it("error 401 → mensaje de sesión expirada", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 401 },
    } as AxiosError;
    mockedRequestWithdrawal.mockRejectedValueOnce(axiosError);

    const { result } = await renderHook(() => useWithdrawal());

    await act(async () => {
      result.current.submit();
    });

    expect(result.current.errorMessage).toBe(
      "Tu sesión expiró. Vuelve a iniciar sesión.",
    );
  });

  it("error genérico/red → mensaje genérico de reintento", async () => {
    const axiosError = { isAxiosError: true, response: undefined } as AxiosError;
    mockedRequestWithdrawal.mockRejectedValueOnce(axiosError);

    const { result } = await renderHook(() => useWithdrawal());

    await act(async () => {
      result.current.submit();
    });

    expect(result.current.errorMessage).toBe(
      "No pudimos procesar tu retiro. Intenta de nuevo.",
    );
  });
});
