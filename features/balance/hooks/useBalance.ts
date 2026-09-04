import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getBalance } from "../services/balance.service";
import type { Transaction } from "../types/balance.types";
import { summarizeTransactions } from "../utils/summarizeTransactions";
import type { TransactionsSummary } from "../utils/summarizeTransactions";

export type BalanceStatus = "loading" | "refreshing" | "error" | "success";

export interface UseBalanceReturn {
  balanceBs: number;
  balanceUsd: number;
  zone: string;
  withdrawalMinBs: number | undefined;
  transactions: Transaction[];
  summary: TransactionsSummary;
  status: BalanceStatus;
  // Distingue "nunca hubo una carga exitosa" (error debe bloquear la pantalla)
  // de "ya había datos válidos" (un error de refresh no debe borrarlos).
  hasLoadedOnce: boolean;
  // Recarga "inteligente": skeleton si nunca hubo datos, "refreshing" si ya los hay
  // (usado por el botón de reintentar tras un error y por el refetch en foco).
  refetch: () => void;
  // Siempre "refreshing" — para el gesto de pull-to-refresh, que asume contenido ya visible.
  refresh: () => void;
}

/**
 * Orquesta la pantalla de Balance: fetch de `GET /riders/balance` al montar y
 * al recuperar foco (`useFocusEffect`), más `refresh()` para pull-to-refresh.
 * Ver design.md del change `balance-screen`, Decisión 1 y 5.
 */
export function useBalance(): UseBalanceReturn {
  const [balanceBs, setBalanceBs] = useState(0);
  const [balanceUsd, setBalanceUsd] = useState(0);
  const [zone, setZone] = useState("");
  const [withdrawalMinBs, setWithdrawalMinBs] = useState<number | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<BalanceStatus>("loading");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // Ref espejo de `hasLoadedOnce`: `load`/`refetch` la leen sin depender de
  // ella, para que su identidad se mantenga estable y el listener de foco no
  // se re-registre en cada carga exitosa (ver useFocusEffect más abajo).
  const hasLoadedOnceRef = useRef(false);

  const load = useCallback(async (mode: "loading" | "refreshing") => {
    setStatus(mode);
    try {
      const response = await getBalance();
      setBalanceBs(response.balanceBs);
      setBalanceUsd(response.balanceUsd);
      setZone(response.zone);
      setWithdrawalMinBs(response.withdrawalMinBs);
      setTransactions(response.transactions);
      setStatus("success");
      hasLoadedOnceRef.current = true;
      setHasLoadedOnce(true);
    } catch {
      setStatus("error");
    }
  }, []);

  const refetch = useCallback(() => {
    void load(hasLoadedOnceRef.current ? "refreshing" : "loading");
  }, [load]);

  const refresh = useCallback(() => {
    void load("refreshing");
  }, [load]);

  useEffect(() => {
    void load("loading");
  }, [load]);

  // El primer disparo de useFocusEffect coincide con el montaje (ya cubierto
  // por el useEffect de arriba) — se ignora explícitamente para no duplicar
  // el fetch inicial.
  const isInitialFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialFocus.current) {
        isInitialFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  return {
    balanceBs,
    balanceUsd,
    zone,
    withdrawalMinBs,
    transactions,
    summary: summarizeTransactions(transactions),
    status,
    hasLoadedOnce,
    refetch,
    refresh,
  };
}
