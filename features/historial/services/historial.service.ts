import apiClient from "@/lib/axios";
import type { Transaction } from "@/features/balance/types/balance.types";

import type { TransactionHistoryResponse } from "../types/historial.types";

interface RawTransaction {
  id: string;
  amount: number;
  created_at: string;
  distance_km?: number;
  movement_type: string;
  order_id?: string;
  payment_method?: string;
}

interface RawTransactionHistoryResponse {
  page: number;
  limit: number;
  total: number;
  transactions: RawTransaction[];
}

// Duplica `mapTransaction` de `features/balance/services/balance.service.ts`
// a propósito: son servicios de features distintas, no se importa entre ellas.
function mapTransaction(raw: RawTransaction): Transaction {
  return {
    id: raw.id,
    amount: raw.amount,
    createdAt: raw.created_at,
    distanceKm: raw.distance_km,
    movementType: raw.movement_type,
    orderId: raw.order_id,
    paymentMethod: raw.payment_method,
  };
}

interface GetTransactionsParams {
  page: number;
  limit: number;
}

export async function getTransactions({
  page,
  limit,
}: GetTransactionsParams): Promise<TransactionHistoryResponse> {
  const { data } = await apiClient.get<RawTransactionHistoryResponse>(
    "/riders/transactions",
    { params: { page, limit } },
  );
  return {
    page: data.page,
    limit: data.limit,
    total: data.total,
    transactions: data.transactions.map(mapTransaction),
  };
}

// Máximo permitido por el backend — usado para minimizar la cantidad de
// requests al traer el historial completo (necesario para filtrar por fecha
// en el cliente, ver design.md del change historial-filtros-paginacion).
export const MAX_SERVER_LIMIT = 50;

export async function getAllTransactions(): Promise<Transaction[]> {
  const all: Transaction[] = [];
  let page = 1;
  // Se resuelve con el `total` de la primera respuesta; el chequeo de
  // `transactions.length === 0` evita un loop infinito si el backend alguna
  // vez devuelve menos ítems de los que promete `total`.
  let total = Infinity;
  while (all.length < total) {
    const response = await getTransactions({ page, limit: MAX_SERVER_LIMIT });
    total = response.total;
    if (response.transactions.length === 0) break;
    all.push(...response.transactions);
    page += 1;
  }
  return all;
}
