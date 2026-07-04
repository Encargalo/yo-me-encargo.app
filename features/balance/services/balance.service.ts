import apiClient from "@/lib/axios";

import type { RiderBalanceResponse, Transaction } from "../types/balance.types";

interface RawTransaction {
  id: string;
  amount: number;
  created_at: string;
  distance_km?: number;
  movement_type: string;
  order_id?: string;
  payment_method?: string;
}

interface RawRiderBalanceResponse {
  balance: number;
  zone: string;
  transactions: RawTransaction[];
}

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

// Errores tipados como AxiosError: no se capturan acá, el hook orquestador
// (`useBalance`) lee `error.response?.status` para decidir el mensaje de error.
export async function getBalance(): Promise<RiderBalanceResponse> {
  const { data } = await apiClient.get<RawRiderBalanceResponse>(
    "/riders/balance",
  );
  return {
    balance: data.balance,
    zone: data.zone,
    transactions: data.transactions.map(mapTransaction),
  };
}
