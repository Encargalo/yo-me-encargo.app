// ── Respuesta de POST /riders/withdrawal ──────────────────────────────────────
export interface WithdrawalResponse {
  amountWithdrawn: number; // monto retirado, en Bs
}

// ── Retiro reciente (datos mockeados hasta que exista un endpoint real) ──────
// Ver design.md, Decisión 8: forma pensada para calzar con una futura
// respuesta real sin cambiar el tipo ni los componentes que lo consumen.
// `amount` en Bs.
export interface RecentWithdrawal {
  amount: number;
  date: string;
  status: "pending" | "processed";
}
