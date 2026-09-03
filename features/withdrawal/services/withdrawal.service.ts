import apiClient from "@/lib/axios";

import type { RecentWithdrawal, WithdrawalResponse } from "../types/withdrawal.types";

interface RawWithdrawalResponse {
  amount_withdrawn: number;
}

// Errores tipados como AxiosError: no se capturan acá, el hook orquestador
// (`useWithdrawal`) lee `error.response?.status` para decidir el mensaje.
export async function requestWithdrawal(): Promise<WithdrawalResponse> {
  const { data } = await apiClient.post<RawWithdrawalResponse>("/riders/withdrawal");
  return { amountWithdrawnBs: data.amount_withdrawn };
}

// Placeholder hasta que exista un endpoint real de historial de retiros (ver
// design.md, Decisión 8) — sin llamada HTTP, datos fijos en Bs.
export function getMockRecentWithdrawals(): RecentWithdrawal[] {
  return [
    { amountBs: 1200, date: "2026-06-28T12:00:00Z", status: "processed" },
    { amountBs: 720, date: "2026-06-30T12:00:00Z", status: "pending" },
  ];
}
