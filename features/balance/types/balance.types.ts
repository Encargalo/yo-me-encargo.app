// ── Movimiento de balance (comisión, descuento, retiro, etc.) ────────────────
// Shape 1:1 con GET /riders/balance (TransactionDTO de documentacion-api-encargalo).
// Montos en bolívares (`amountBs`), con el equivalente en dólares (`amountUsd`)
// ya calculado por el backend — el front no reconstruye USD desde `bcvRate`.
export interface Transaction {
  id: string;
  amountBs: number; // con signo: positivo = ganado, negativo = descontado (Bs)
  amountUsd: number; // equivalente referencial en USD
  bcvRate?: number; // tasa BCV congelada de ese movimiento (informativa, solo detalle)
  createdAt: string; // ISO
  distanceKm?: number;
  movementType: string;
  orderId?: string;
  paymentMethod?: string; // nunca se muestra al rider
}

// ── Respuesta de GET /riders/balance ──────────────────────────────────────────
export interface RiderBalanceResponse {
  balanceBs: number; // saldo neto (Bs)
  balanceUsd: number; // equivalente referencial en USD
  bcvRate?: number; // tasa BCV vigente (informativa)
  zone: string; // "normal" | "withdrawal_available"
  withdrawalMinBs?: number; // mínimo de retiro vigente en Bs (dinámico, del backend)
  transactions: Transaction[]; // últimos 10 movimientos, sin paginación
}
