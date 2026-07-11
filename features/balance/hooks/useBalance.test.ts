import { act, renderHook } from "@testing-library/react-native";

import { getBalance } from "../services/balance.service";
import { useBalance } from "./useBalance";

jest.mock("../services/balance.service", () => ({
  getBalance: jest.fn(),
}));

// Mock mínimo de useFocusEffect: invoca el callback una sola vez al montar
// (simulando una pantalla que ya está en foco), y expone `triggerFocus()`
// para simular que el rider vuelve a la pantalla.
let mockStoredFocusCallback: (() => void) | null = null;
let mockHasMountedFocus = false;
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (cb: () => void) => {
    mockStoredFocusCallback = cb;
    if (!mockHasMountedFocus) {
      mockHasMountedFocus = true;
      cb();
    }
  },
}));

function triggerFocus() {
  mockStoredFocusCallback?.();
}

const mockedGetBalance = getBalance as jest.Mock;

const sampleResponse = { balance: 24.5, zone: "normal", transactions: [] };

beforeEach(() => {
  jest.clearAllMocks();
  mockHasMountedFocus = false;
  mockStoredFocusCallback = null;
});

describe("useBalance", () => {
  it("carga inicial exitosa", async () => {
    mockedGetBalance.mockResolvedValueOnce(sampleResponse);

    const { result } = await renderHook(() => useBalance());

    expect(result.current.status).toBe("success");
    expect(result.current.balance).toBe(24.5);
    expect(result.current.zone).toBe("normal");
  });

  it("error en carga inicial", async () => {
    mockedGetBalance.mockRejectedValueOnce(new Error("network"));

    const { result } = await renderHook(() => useBalance());

    expect(result.current.status).toBe("error");
  });

  it("refetch al recuperar foco", async () => {
    mockedGetBalance.mockResolvedValueOnce(sampleResponse);
    const { result } = await renderHook(() => useBalance());
    expect(result.current.status).toBe("success");

    mockedGetBalance.mockResolvedValueOnce({ ...sampleResponse, balance: 30 });
    await act(async () => {
      triggerFocus();
    });

    expect(mockedGetBalance).toHaveBeenCalledTimes(2);
    expect(result.current.balance).toBe(30);
  });

  it("refresh() marca 'refreshing' sin volver a 'loading' cuando ya había datos", async () => {
    mockedGetBalance.mockResolvedValueOnce(sampleResponse);
    const { result } = await renderHook(() => useBalance());
    expect(result.current.status).toBe("success");

    let resolveSecond: (value: typeof sampleResponse) => void = () => {};
    mockedGetBalance.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve;
      }),
    );

    await act(async () => {
      result.current.refresh();
    });
    expect(result.current.status).toBe("refreshing");

    await act(async () => {
      resolveSecond({ ...sampleResponse, balance: 50 });
    });

    expect(result.current.status).toBe("success");
    expect(result.current.balance).toBe(50);
  });
});
