import { useCallback, useEffect, useRef, useState } from "react";

import type { Transaction } from "@/features/balance/types/balance.types";

import { getTransactions } from "../services/historial.service";

// Default documentado por el backend (máx. permitido: 50).
const PAGE_LIMIT = 20;

export type HistorialStatus =
  | "loading"
  | "loadingMore"
  | "refreshing"
  | "error"
  | "errorMore"
  | "success";

export interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  status: HistorialStatus;
  hasMore: boolean;
  // No-op si ya hay un fetch en curso o si no quedan más páginas.
  loadMore: () => void;
  refresh: () => void;
  retryLoadMore: () => void;
}

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<HistorialStatus>("loading");
  // 0 = ninguna página cargada todavía.
  const pageRef = useRef(0);
  // Independiente de `status`: evita disparos duplicados de `loadMore()`
  // sin depender del timing de los re-renders.
  const isFetchingRef = useRef(false);

  const load = useCallback(
    async (
      targetPage: number,
      mode: "loading" | "loadingMore" | "refreshing",
    ) => {
      isFetchingRef.current = true;
      setStatus(mode);
      try {
        const response = await getTransactions({
          page: targetPage,
          limit: PAGE_LIMIT,
        });
        setTotal(response.total);
        pageRef.current = targetPage;
        setTransactions((prev) =>
          mode === "loadingMore"
            ? [...prev, ...response.transactions]
            : response.transactions,
        );
        setStatus("success");
      } catch {
        if (mode === "loadingMore") {
          setStatus("errorMore");
        } else if (mode === "refreshing") {
          // Si nunca hubo una página exitosa, este refresh es en realidad un
          // reintento del error inicial: sin esto, volvería a "success" con
          // la lista vacía en vez de mantener el estado de error.
          setStatus(pageRef.current > 0 ? "success" : "error");
        } else {
          setStatus("error");
        }
      } finally {
        isFetchingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    void load(1, "loading");
  }, [load]);

  const hasMore = transactions.length < total;

  const loadMore = useCallback(() => {
    if (isFetchingRef.current || !hasMore) return;
    void load(pageRef.current + 1, "loadingMore");
  }, [hasMore, load]);

  const retryLoadMore = useCallback(() => {
    if (isFetchingRef.current) return;
    void load(pageRef.current + 1, "loadingMore");
  }, [load]);

  const refresh = useCallback(() => {
    if (isFetchingRef.current) return;
    void load(1, "refreshing");
  }, [load]);

  return {
    transactions,
    status,
    hasMore,
    loadMore,
    refresh,
    retryLoadMore,
  };
}
