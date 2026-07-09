import { useCallback, useEffect, useRef, useState } from "react";

import type { Transaction } from "@/features/balance/types/balance.types";

import { getAllTransactions, getTransactions } from "../services/historial.service";

// Tamaño de página de la UI — separado de `MAX_SERVER_LIMIT` (historial.service.ts).
// Sin filtro, es también el `limit` que se envía al servidor (1 página de tabla
// = 1 página de servidor). Con filtro, es el tamaño de página sobre el set
// completo ya cacheado en cliente.
export const HISTORIAL_PAGE_SIZE = 10;

export type HistorialStatus =
  | "loading"
  | "loadingPage"
  | "loadingFullSet"
  | "error"
  | "errorPage"
  | "errorFullSet"
  | "success";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface UseTransactionHistoryReturn {
  rows: Transaction[];
  status: HistorialStatus;
  page: number;
  totalPages: number;
  dateRange: DateRange | null;
  goToPage: (page: number) => void;
  setDateRange: (range: DateRange | null) => void;
  retry: () => void;
}

function isWithinRange(iso: string, range: DateRange): boolean {
  const time = new Date(iso).getTime();
  return time >= range.from.getTime() && time <= range.to.getTime();
}

function paginate(items: Transaction[], page: number): Transaction[] {
  const start = (page - 1) * HISTORIAL_PAGE_SIZE;
  return items.slice(start, start + HISTORIAL_PAGE_SIZE);
}

function totalPagesFor(count: number): number {
  return Math.max(1, Math.ceil(count / HISTORIAL_PAGE_SIZE));
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const [status, setStatus] = useState<HistorialStatus>("loading");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [dateRangeState, setDateRangeState] = useState<DateRange | null>(
    null,
  );

  const modeRef = useRef<"server" | "client-filtered">("server");
  // Evita fetches simultáneos (navegación de página + filtro a la vez, etc.).
  const isFetchingRef = useRef(false);
  // true después del primer éxito: distingue "loading"/"error" (sin datos
  // previos, pantalla completa) de "loadingPage"/"errorPage" (ya hay una
  // página mostrada con éxito que debe conservarse).
  const everLoadedRef = useRef(false);
  // Página que se intentó cargar en el fetch en curso — la que reintenta `retry()`.
  const attemptedPageRef = useRef(1);
  // Cache del historial completo, poblado la primera vez que se activa un
  // filtro de fecha en esta sesión de pantalla. Null = todavía no se trajo.
  const fullSetRef = useRef<Transaction[] | null>(null);

  const applyClientFilter = useCallback(
    (range: DateRange, targetPage: number) => {
      const fullSet = fullSetRef.current;
      if (!fullSet) return;
      const filtered = fullSet.filter((t) => isWithinRange(t.createdAt, range));
      const newTotalPages = totalPagesFor(filtered.length);
      const clampedPage = Math.min(targetPage, newTotalPages);
      modeRef.current = "client-filtered";
      everLoadedRef.current = true;
      setPage(clampedPage);
      setTotalPages(newTotalPages);
      setRows(paginate(filtered, clampedPage));
      setStatus("success");
    },
    [],
  );

  const applyServerPage = useCallback(async (targetPage: number) => {
    isFetchingRef.current = true;
    attemptedPageRef.current = targetPage;
    setStatus(everLoadedRef.current ? "loadingPage" : "loading");
    try {
      const response = await getTransactions({
        page: targetPage,
        limit: HISTORIAL_PAGE_SIZE,
      });
      modeRef.current = "server";
      everLoadedRef.current = true;
      setPage(targetPage);
      setTotalPages(totalPagesFor(response.total));
      setRows(response.transactions);
      setStatus("success");
    } catch {
      setStatus(everLoadedRef.current ? "errorPage" : "error");
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const fetchFullSetAndFilter = useCallback(
    async (range: DateRange) => {
      isFetchingRef.current = true;
      setStatus("loadingFullSet");
      try {
        const all = await getAllTransactions();
        fullSetRef.current = all;
        applyClientFilter(range, 1);
      } catch {
        setStatus("errorFullSet");
      } finally {
        isFetchingRef.current = false;
      }
    },
    [applyClientFilter],
  );

  useEffect(() => {
    void applyServerPage(1);
    // Solo en el montaje: `applyServerPage` es estable (sin dependencias).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = useCallback(
    (targetPage: number) => {
      if (isFetchingRef.current) return;
      if (targetPage < 1 || targetPage > totalPages) return;
      if (modeRef.current === "client-filtered" && dateRangeState) {
        applyClientFilter(dateRangeState, targetPage);
      } else {
        void applyServerPage(targetPage);
      }
    },
    [totalPages, dateRangeState, applyClientFilter, applyServerPage],
  );

  const setDateRange = useCallback(
    (range: DateRange | null) => {
      if (isFetchingRef.current) return;
      setDateRangeState(range);
      if (range === null) {
        void applyServerPage(1);
        return;
      }
      if (fullSetRef.current) {
        applyClientFilter(range, 1);
      } else {
        void fetchFullSetAndFilter(range);
      }
    },
    [applyServerPage, applyClientFilter, fetchFullSetAndFilter],
  );

  const retry = useCallback(() => {
    if (isFetchingRef.current) return;
    if (status === "errorFullSet") {
      if (dateRangeState) void fetchFullSetAndFilter(dateRangeState);
      return;
    }
    if (status === "errorPage" || status === "error") {
      void applyServerPage(attemptedPageRef.current);
    }
  }, [status, dateRangeState, fetchFullSetAndFilter, applyServerPage]);

  return {
    rows,
    status,
    page,
    totalPages,
    dateRange: dateRangeState,
    goToPage,
    setDateRange,
    retry,
  };
}
