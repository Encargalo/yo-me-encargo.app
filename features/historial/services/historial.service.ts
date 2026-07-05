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
