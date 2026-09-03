import apiClient from "@/lib/axios";

import type { RiderBalanceResponse, Transaction } from "../types/balance.types";

interface RawTransaction {
  id: string;
  amount_bs: number;
  amount_usd: number;
  bcv_rate?: number;
  created_at: string;
  distance_km?: number;
  movement_type: string;
  order_id?: string;
  trip_id?: string;
  payment_method?: string;
}

interface RawRiderBalanceResponse {
  balance_bs: number;
  balance_usd: number;
  bcv_rate?: number;
  zone: string;
  withdrawal_min_bs: number;
  transactions: RawTransaction[];
}

function mapTransaction(raw: RawTransaction): Transaction {
  return {
    id: raw.id,
    amountBs: raw.amount_bs,
    amountUsd: raw.amount_usd,
    bcvRate: raw.bcv_rate,
    createdAt: raw.created_at,
    distanceKm: raw.distance_km,
    movementType: raw.movement_type,
    orderId: raw.order_id,
    tripId: raw.trip_id,
    paymentMethod: raw.payment_method,
  };
}

// Errores tipados como AxiosError: no se capturan acá, el hook orquestador
// (`useBalance`) lee `error.response?.status` para decidir el mensaje de error.
export async function getBalance(): Promise<RiderBalanceResponse> {
  const { data } = await apiClient.get<RawRiderBalanceResponse>("/riders/balance");
  return {
    balanceBs: data.balance_bs,
    balanceUsd: data.balance_usd,
    bcvRate: data.bcv_rate,
    zone: data.zone,
    withdrawalMinBs: data.withdrawal_min_bs,
    transactions: data.transactions.map(mapTransaction),
  };
}
