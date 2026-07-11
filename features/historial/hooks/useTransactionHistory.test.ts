import { act, renderHook } from "@testing-library/react-native";

import { getAllTransactions, getTransactions } from "../services/historial.service";
import { useTransactionHistory } from "./useTransactionHistory";

jest.mock("../services/historial.service", () => ({
  getTransactions: jest.fn(),
  getAllTransactions: jest.fn(),
}));

const mockedGetTransactions = getTransactions as jest.Mock;
const mockedGetAllTransactions = getAllTransactions as jest.Mock;

function makeTransaction(id: string, createdAt = "2026-06-30T14:20:00Z") {
  return {
    id,
    amount: 8.5,
    createdAt,
    distanceKm: 3.1,
    movementType: "ride_bank",
    orderId: `order-${id}`,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useTransactionHistory", () => {
  it("carga inicial exitosa (modo server)", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 25,
      transactions: [makeTransaction("1")],
    });

    const { result } = await renderHook(() => useTransactionHistory());

    expect(result.current.status).toBe("success");
    expect(result.current.page).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.rows).toHaveLength(1);
    expect(mockedGetTransactions).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("goToPage navega a otra página en modo server", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 20,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetTransactions.mockResolvedValueOnce({
      page: 2,
      limit: 10,
      total: 20,
      transactions: [makeTransaction("2")],
    });
    await act(async () => {
      result.current.goToPage(2);
    });

    expect(mockedGetTransactions).toHaveBeenLastCalledWith({
      page: 2,
      limit: 10,
    });
    expect(result.current.page).toBe(2);
    expect(result.current.rows.map((t) => t.id)).toEqual(["2"]);
    expect(result.current.status).toBe("success");
  });

  it("goToPage no dispara fetch fuera del rango de páginas", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 5,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());
    expect(result.current.totalPages).toBe(1);

    await act(async () => {
      result.current.goToPage(0);
      result.current.goToPage(2);
    });

    expect(mockedGetTransactions).toHaveBeenCalledTimes(1);
  });

  it("aplica un filtro de fecha por primera vez: trae el set completo y pagina en cliente", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 2,
      transactions: [makeTransaction("1", "2026-06-15T00:00:00Z")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetAllTransactions.mockResolvedValueOnce([
      makeTransaction("a", "2026-06-01T00:00:00Z"),
      makeTransaction("b", "2026-06-15T00:00:00Z"),
      makeTransaction("c", "2026-07-01T00:00:00Z"),
    ]);

    await act(async () => {
      result.current.setDateRange({
        from: new Date("2026-06-10T00:00:00Z"),
        to: new Date("2026-06-20T00:00:00Z"),
      });
    });

    expect(mockedGetAllTransactions).toHaveBeenCalledTimes(1);
    expect(result.current.rows.map((t) => t.id)).toEqual(["b"]);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.status).toBe("success");
  });

  it("cambia el rango de fechas con el set completo ya cacheado, sin volver a pedirlo", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 1,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetAllTransactions.mockResolvedValueOnce([
      makeTransaction("a", "2026-06-01T00:00:00Z"),
      makeTransaction("b", "2026-06-15T00:00:00Z"),
    ]);
    await act(async () => {
      result.current.setDateRange({
        from: new Date("2026-06-01T00:00:00Z"),
        to: new Date("2026-06-30T00:00:00Z"),
      });
    });
    expect(result.current.rows).toHaveLength(2);

    await act(async () => {
      result.current.setDateRange({
        from: new Date("2026-06-10T00:00:00Z"),
        to: new Date("2026-06-30T00:00:00Z"),
      });
    });

    expect(mockedGetAllTransactions).toHaveBeenCalledTimes(1);
    expect(result.current.rows.map((t) => t.id)).toEqual(["b"]);
  });

  it("limpiar el filtro vuelve a modo server desde la página 1", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 1,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetAllTransactions.mockResolvedValueOnce([makeTransaction("a", "2026-06-15T00:00:00Z")]);
    await act(async () => {
      result.current.setDateRange({
        from: new Date("2026-06-01T00:00:00Z"),
        to: new Date("2026-06-30T00:00:00Z"),
      });
    });

    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 1,
      transactions: [makeTransaction("1")],
    });
    await act(async () => {
      result.current.setDateRange(null);
    });

    expect(mockedGetTransactions).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
    });
    expect(result.current.dateRange).toBeNull();
    expect(result.current.status).toBe("success");
  });

  it("error en la carga inicial deja status 'error' y rows vacío", async () => {
    mockedGetTransactions.mockRejectedValueOnce(new Error("network"));

    const { result } = await renderHook(() => useTransactionHistory());

    expect(result.current.status).toBe("error");
    expect(result.current.rows).toEqual([]);
  });

  it("error al navegar a otra página conserva la última página exitosa y permite reintentar", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 20,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetTransactions.mockRejectedValueOnce(new Error("network"));
    await act(async () => {
      result.current.goToPage(2);
    });

    expect(result.current.status).toBe("errorPage");
    expect(result.current.page).toBe(1);
    expect(result.current.rows.map((t) => t.id)).toEqual(["1"]);

    mockedGetTransactions.mockResolvedValueOnce({
      page: 2,
      limit: 10,
      total: 20,
      transactions: [makeTransaction("2")],
    });
    await act(async () => {
      result.current.retry();
    });

    expect(mockedGetTransactions).toHaveBeenLastCalledWith({
      page: 2,
      limit: 10,
    });
    expect(result.current.status).toBe("success");
    expect(result.current.page).toBe(2);
  });

  it("error al traer el set completo para un filtro conserva la vista previa y permite reintentar", async () => {
    mockedGetTransactions.mockResolvedValueOnce({
      page: 1,
      limit: 10,
      total: 1,
      transactions: [makeTransaction("1")],
    });
    const { result } = await renderHook(() => useTransactionHistory());

    mockedGetAllTransactions.mockRejectedValueOnce(new Error("network"));
    const range = {
      from: new Date("2026-06-01T00:00:00Z"),
      to: new Date("2026-06-30T00:00:00Z"),
    };
    await act(async () => {
      result.current.setDateRange(range);
    });

    expect(result.current.status).toBe("errorFullSet");
    expect(result.current.rows.map((t) => t.id)).toEqual(["1"]);

    mockedGetAllTransactions.mockResolvedValueOnce([makeTransaction("a", "2026-06-15T00:00:00Z")]);
    await act(async () => {
      result.current.retry();
    });

    expect(mockedGetAllTransactions).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("success");
    expect(result.current.rows.map((t) => t.id)).toEqual(["a"]);
  });
});
