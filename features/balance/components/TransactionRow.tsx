import { Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";

import type { Transaction } from "../types/balance.types";
import { formatSignedAmount } from "../utils/formatAmount";
import { getMovementTypeLabel } from "../utils/movementTypeLabel";

interface TransactionRowProps {
  transaction: Transaction;
  isLast?: boolean;
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// Manual en vez de Intl.DateTimeFormat: evita depender de datos de locale
// completos en Hermes para un formato de solo día + mes abreviado.
function formatDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function TransactionRow({ transaction, isLast }: TransactionRowProps) {
  const amountColor =
    transaction.amount >= 0
      ? OrderStatusColors.completed
      : OrderStatusColors.error;

  // El método de pago no se muestra al rider — decisión del usuario tras ver
  // datos reales de staging (ver design.md, Decisión 8).
  const meta = [
    formatDate(transaction.createdAt),
    typeof transaction.distanceKm === "number"
      ? `${transaction.distanceKm.toFixed(1)} km`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      className={`flex-row items-center justify-between px-3.5 py-3 ${
        isLast ? "" : "border-b border-canvas"
      }`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-[13px] font-semibold text-ink" numberOfLines={1}>
          {getMovementTypeLabel(transaction.movementType)}
        </Text>
        {meta ? (
          <Text className="text-[10.5px] text-label" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <Text className="text-[14px] font-bold" style={{ color: amountColor }}>
        {formatSignedAmount(transaction.amount)}
      </Text>
    </View>
  );
}
