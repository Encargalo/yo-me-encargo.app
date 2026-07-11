import { Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";

import type { TransactionsSummary } from "../utils/summarizeTransactions";
import { formatAmount, formatSignedAmount } from "../utils/formatAmount";

interface NetBalanceCardProps {
  balance: number;
  zone: string;
  summary: TransactionsSummary;
}

// Card hero de saldo (wireframe 06). Reusa OrderStatusColors.completed/.error
// para el signo del monto en vez de introducir una paleta verde/rojo nueva —
// ver design.md, Decisión 4.
export function NetBalanceCard({ balance, zone, summary }: NetBalanceCardProps) {
  const balanceColor = balance >= 0 ? OrderStatusColors.completed : OrderStatusColors.error;

  return (
    <View className="rounded-[18px] border border-hair bg-white p-5">
      <View className="mb-2.5 flex-row items-start justify-between">
        <Text className="font-mono text-[10px] tracking-[1.2px] text-label">SALDO NETO</Text>
        <View className="rounded-full border border-hair px-2.5 py-[3px]">
          <Text className="text-[10px] font-semibold text-ink">Zona: {zone}</Text>
        </View>
      </View>

      <Text className="text-[38px] font-bold tracking-[-0.4px]" style={{ color: balanceColor }}>
        {formatAmount(balance)}
      </Text>

      <View className="mt-3 flex-row gap-[18px] border-t border-canvas pt-3">
        <View>
          <Text className="font-mono text-[9px] text-label">GANADO</Text>
          <Text
            className="text-[14px] font-semibold"
            style={{ color: OrderStatusColors.completed }}
          >
            {formatSignedAmount(summary.earned)}
          </Text>
        </View>
        <View>
          <Text className="font-mono text-[9px] text-label">DESCONTADO</Text>
          <Text className="text-[14px] font-semibold" style={{ color: OrderStatusColors.error }}>
            {formatSignedAmount(-summary.deducted)}
          </Text>
        </View>
      </View>
    </View>
  );
}
