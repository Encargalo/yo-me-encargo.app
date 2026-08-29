import { Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";

import type { TransactionsSummary } from "../utils/summarizeTransactions";
import { formatBs, formatRef, formatSignedBs } from "../utils/formatAmount";

interface NetBalanceCardProps {
  balanceBs: number;
  balanceUsd: number;
  zone: string;
  summary: TransactionsSummary;
}

// Card hero de saldo (wireframe 06). Cifra principal en bolívares con el
// equivalente en USD como subtítulo referencial. Reusa OrderStatusColors
// .completed/.error para el signo del monto — ver design.md, Decisión 4.
export function NetBalanceCard({ balanceBs, balanceUsd, zone, summary }: NetBalanceCardProps) {
  const balanceColor = balanceBs >= 0 ? OrderStatusColors.completed : OrderStatusColors.error;

  return (
    <View className="rounded-[18px] border border-hair bg-white p-5">
      <View className="mb-2.5 flex-row items-start justify-between">
        <Text className="font-mono text-[10px] tracking-[1.2px] text-label">SALDO NETO</Text>
        <View className="rounded-full border border-hair px-2.5 py-[3px]">
          <Text className="text-[10px] font-semibold text-ink">Zona: {zone}</Text>
        </View>
      </View>

      <Text className="text-[38px] font-bold tracking-[-0.4px]" style={{ color: balanceColor }}>
        {formatBs(balanceBs)}
      </Text>
      <Text className="mt-0.5 text-[13px] font-semibold text-label">{formatRef(balanceUsd)}</Text>

      <View className="mt-3 flex-row gap-[18px] border-t border-canvas pt-3">
        <View>
          <Text className="font-mono text-[9px] text-label">GANADO</Text>
          <Text
            className="text-[14px] font-semibold"
            style={{ color: OrderStatusColors.completed }}
          >
            {formatSignedBs(summary.earnedBs)}
          </Text>
        </View>
        <View>
          <Text className="font-mono text-[9px] text-label">DESCONTADO</Text>
          <Text className="text-[14px] font-semibold" style={{ color: OrderStatusColors.error }}>
            {formatSignedBs(-summary.deductedBs)}
          </Text>
        </View>
      </View>
    </View>
  );
}
