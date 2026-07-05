import { act, renderHook } from "@testing-library/react-native";

import { getTransactions } from "../services/historial.service";
import { useTransactionHistory } from "./useTransactionHistory";

jest.mock("../services/historial.service", () => ({
  getTransactions: jest.fn(),
}));

const mockedGetTransactions = getTransactions as jest.Mock;

function makeTransaction(id: string) {
  return {
    id,
    amount: 8.5,
    createdAt: "2026-06-30T14:20:00Z",
    distanceKm: 3.1,
    movementType: "ride_bank",
    orderId: `order-${id}`,
    paymentMethod: "efectivo",
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useTransactionHistory", () => {
  it("carga inicial exitosa", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 1,
      transactions: [makeTransaction("1")],
    });

    const { result } = await renderHook(() => useTransactionHistory());

    expect(result.current.status).toBe("success");
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.hasMore).toBe(false);
  });

  it("error en carga inicial deja la lista vacía", async () => {
    mockedGetTransactions.mockRejectedValueOnce(new Error("network"));

    const { result } = await renderHook(() => useTransactionHistory());

    expect(result.current.status).toBe("error");
    expect(result.current.transactions).toEqual([]);
  });

  it("reintentar tras un error de carga inicial que vuelve a fallar se queda en 'error'", async () => {
    mockedGetTransactions.mockRejectedValueOnce(new Error("network"));
    const { result } = await renderHook(() => useTransactionHistory());
    expect(result.current.status).toBe("error");

    mockedGetTransactions.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.transactions).toEqual([]);
  });

  it("loadMore agrega la página siguiente al final de la lista", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 2,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());
    expect(result.current.hasMore).toBe(true);

    mockedGetTransactions.mockResolvedValueOnce({
      page: 2,
      limit: 20,
      total: 2,
      transactions: [makeTransaction("2")],
    });
    await act(async () => {
      result.current.loadMore();
    });

    expect(mockedGetTransactions).toHaveBeenCalledWith({ page: 2, limit: 20 });
    expect(result.current.transactions.map((t) => t.id)).toEqual(["1", "2"]);
    expect(result.current.status).toBe("success");
    expect(result.current.hasMore).toBe(false);
  });

  it("loadMore no dispara una segunda petición si ya hay una en curso", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 3,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetTransactions.mockResolvedValueOnce({
      page: 2,
      limit: 20,
      total: 3,
      transactions: [makeTransaction("2")],
    });

    // Ambas llamadas ocurren en el mismo tick síncrono (sin await entre
    // medio) para que el guard de `isFetchingRef` bloquee la segunda.
    await act(async () => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(mockedGetTransactions).toHaveBeenCalledTimes(2);
  });

  it("loadMore no dispara si hasMore es false", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 1,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());
    expect(result.current.hasMore).toBe(false);

    await act(async () => {
      result.current.loadMore();
    });

    expect(mockedGetTransactions).toHaveBeenCalledTimes(1);
  });

  it("error en loadMore conserva las transacciones ya cargadas", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 2,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetTransactions.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      result.current.loadMore();
    });

    expect(result.current.status).toBe("errorMore");
    expect(result.current.transactions).toHaveLength(1);
  });

  it("refresh reemplaza la lista completa desde la página 1", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 2,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());
    mockedGetTransactions.mockResolvedValueOnce({
      page: 2,
      limit: 20,
      total: 2,
      transactions: [makeTransaction("2")],
    });
    await act(async () => {
      result.current.loadMore();
    });
    expect(result.current.transactions).toHaveLength(2);

    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 20,
      total: 1,
      transactions: [makeTransaction("3")],
    });
    await act(async () => {
      result.current.refresh();
    });

    expect(mockedGetTransactions).toHaveBeenLastCalledWith({
      page: 1,
      limit: 20,
    });
    expect(result.current.transactions.map((t) => t.id)).toEqual(["3"]);
    expect(result.current.status).toBe("success");
  });
});
