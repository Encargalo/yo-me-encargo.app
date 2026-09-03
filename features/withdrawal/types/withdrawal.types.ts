// ── Respuesta de POST /riders/withdrawal ──────────────────────────────────────
// `amountWithdrawn` viene en Bs, igual que el resto de finanzas del rider.
export interface WithdrawalResponse {
  amountWithdrawnBs: number;
}

// ── Retiro reciente (datos mockeados hasta que exista un endpoint real) ──────
// Ver design.md, Decisión 8: forma pensada para calzar con una futura
// respuesta real sin cambiar el tipo ni los componentes que lo consumen.
export interface RecentWithdrawal {
  amountBs: number;
  date: string;
  status: "pending" | "processed";
}
