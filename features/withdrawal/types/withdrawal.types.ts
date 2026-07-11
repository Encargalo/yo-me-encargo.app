// Umbral mínimo para poder solicitar un retiro (ver design.md, Decisión 4).
// Coordinado con backend: reemplaza el umbral de $15 que traían el doc de
// endpoints y el wireframe originales.
export const MIN_WITHDRAWAL_BALANCE = 0.1;

// ── Respuesta de POST /riders/withdrawal ──────────────────────────────────────
export interface WithdrawalResponse {
  amountWithdrawn: number;
}

// ── Retiro reciente (datos mockeados hasta que exista un endpoint real) ──────
// Ver design.md, Decisión 8: forma pensada para calzar con una futura
// respuesta real sin cambiar el tipo ni los componentes que lo consumen.
export interface RecentWithdrawal {
  amount: number;
  date: string;
  status: "pending" | "processed";
}
