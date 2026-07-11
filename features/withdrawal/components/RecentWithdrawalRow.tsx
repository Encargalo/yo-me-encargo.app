import { Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";
import { formatAmount } from "@/features/balance/utils/formatAmount";

import type { RecentWithdrawal } from "../types/withdrawal.types";

interface RecentWithdrawalRowProps {
  withdrawal: RecentWithdrawal;
  isLast?: boolean;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Mismo criterio que TransactionRow (features/balance): formato manual de
// fecha, sin Intl.DateTimeFormat, para no depender de datos de locale
// completos en Hermes por solo día + mes abreviado.
function formatDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

const STATUS_LABEL: Record<RecentWithdrawal["status"], string> = {
  pending: "Pendiente",
  processed: "Retirado",
};

const STATUS_COLOR: Record<RecentWithdrawal["status"], string> = {
  pending: OrderStatusColors.pending,
  processed: OrderStatusColors.completed,
};

export function RecentWithdrawalRow({ withdrawal, isLast }: RecentWithdrawalRowProps) {
  const date = formatDate(withdrawal.date);

  return (
    <View
      className={`flex-row items-center justify-between px-3.5 py-3 ${
        isLast ? "" : "border-b border-canvas"
      }`}
    >
      <View>
        <Text className="text-[13px] font-semibold text-ink">
          {formatAmount(withdrawal.amount)}
        </Text>
        {date ? <Text className="text-[10.5px] text-label">{date}</Text> : null}
      </View>
      <View
        className="rounded-full border px-2.5 py-[3px]"
        style={{ borderColor: STATUS_COLOR[withdrawal.status] }}
      >
        <Text
          className="text-[10px] font-semibold"
          style={{ color: STATUS_COLOR[withdrawal.status] }}
        >
          {STATUS_LABEL[withdrawal.status]}
        </Text>
      </View>
    </View>
  );
}
