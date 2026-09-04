import type { Transaction } from "@/features/balance/types/balance.types";

export interface TransactionHistoryResponse {
  page: number;
  limit: number;
  total: number;
  transactions: Transaction[];
}
