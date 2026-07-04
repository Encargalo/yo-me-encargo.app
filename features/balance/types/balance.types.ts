// ── Movimiento de balance (comisión, descuento, retiro, etc.) ────────────────
// Shape 1:1 con GET /riders/balance (docs/endpoints-yo-me-encargo.app.md).
export interface Transaction {
  id: string;
  amount: number; // con signo: positivo = ganado, negativo = descontado (USD)
  createdAt: string; // ISO
  distanceKm?: number;
  movementType: string;
  orderId?: string;
  paymentMethod?: string;
}

// ── Respuesta de GET /riders/balance ──────────────────────────────────────────
export interface RiderBalanceResponse {
  balance: number; // saldo neto (USD)
  zone: string;
  transactions: Transaction[]; // últimos 10 movimientos, sin paginación
}
