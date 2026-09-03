// ── Movimiento de balance (comisión, descuento, retiro, etc.) ────────────────
// Shape 1:1 con GET /riders/balance. Desde `fd0bb7d` el backend registra los
// montos en bolívares con la tasa BCV congelada por fila; `amount` plano en
// USD ya no existe.
export interface Transaction {
  id: string;
  amountBs: number; // con signo: positivo = ganado, negativo = descontado
  amountUsd: number; // equivalente en USD del mismo movimiento
  // Tasa BCV usada para esta conversión: congelada si el movimiento la trae,
  // spot si no. Informativa — no recalcular montos con ella.
  bcvRate?: number;
  createdAt: string; // ISO
  distanceKm?: number;
  movementType: string;
  orderId?: string;
  tripId?: string;
  paymentMethod?: string;
}

// Zona que habilita el CTA de retiro. El backend la calcula contra el mínimo
// vigente; el front nunca la deriva del saldo.
export const WITHDRAWAL_AVAILABLE_ZONE = "withdrawal_available";

// ── Respuesta de GET /riders/balance ──────────────────────────────────────────
export interface RiderBalanceResponse {
  balanceBs: number; // saldo neto, moneda principal
  balanceUsd: number; // mismo saldo como referencia
  bcvRate?: number;
  zone: string;
  // Mínimo de retiro vigente, ya convertido a Bs con la tasa BCV actual. Es
  // dinámico: nunca hardcodear un umbral en el front.
  withdrawalMinBs: number;
  transactions: Transaction[]; // últimos 10 movimientos, sin paginación
}
