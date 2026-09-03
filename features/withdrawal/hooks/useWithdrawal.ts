import { useCallback, useState } from "react";
import type { AxiosError } from "axios";

import { getMockRecentWithdrawals, requestWithdrawal } from "../services/withdrawal.service";
import type { RecentWithdrawal } from "../types/withdrawal.types";
import { getWithdrawalErrorMessage } from "../utils/withdrawalErrorMessage";

export type WithdrawalStatus = "idle" | "submitting" | "success" | "error";

export interface UseWithdrawalReturn {
  status: WithdrawalStatus;
  amountWithdrawnBs: number | null;
  errorMessage: string | null;
  recentWithdrawals: RecentWithdrawal[];
  submit: () => void;
}

/**
 * Orquesta la acción de Solicitud de retiro (`POST /riders/withdrawal`).
 * A diferencia de `useBalance`, no hace fetch continuo — es un hook de una
 * sola acción disparada por `submit()`. Ver design.md del change
 * `withdrawal-screen`, Decisión 5.
 */
export function useWithdrawal(): UseWithdrawalReturn {
  const [status, setStatus] = useState<WithdrawalStatus>("idle");
  const [amountWithdrawnBs, setAmountWithdrawnBs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentWithdrawals] = useState<RecentWithdrawal[]>(() => getMockRecentWithdrawals());

  const submit = useCallback(() => {
    setStatus("submitting");
    setErrorMessage(null);
    void requestWithdrawal()
      .then((response) => {
        setAmountWithdrawnBs(response.amountWithdrawnBs);
        setStatus("success");
      })
      .catch((error: AxiosError) => {
        setErrorMessage(getWithdrawalErrorMessage(error.response?.status));
        setStatus("error");
      });
  }, []);

  return {
    status,
    amountWithdrawnBs,
    errorMessage,
    recentWithdrawals,
    submit,
  };
}
