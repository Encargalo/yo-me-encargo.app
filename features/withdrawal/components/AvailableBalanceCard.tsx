import { Text, View } from "react-native";

import { formatBs, formatRef } from "@/features/balance/utils/formatAmount";

interface AvailableBalanceCardProps {
  balanceBs: number;
  balanceUsd: number;
}

// Reutiliza los formatters de features/balance (mismo dominio de dinero, ver
// design.md Decisión 3). A diferencia de NetBalanceCard (Balance), esta
// tarjeta no muestra zona ni desglose Ganado/Descontado — solo el disponible
// para retiro (wireframe 07), en Bs con el equivalente en USD debajo.
export function AvailableBalanceCard({ balanceBs, balanceUsd }: AvailableBalanceCardProps) {
  return (
    <View className="items-center rounded-[16px] border border-hair bg-white p-[18px]">
      <Text className="font-mono text-[10px] tracking-[1.2px] text-label">
        DISPONIBLE PARA RETIRO
      </Text>
      <Text className="mt-1.5 text-[34px] font-bold tracking-[-0.4px] text-ink">
        {formatBs(balanceBs)}
      </Text>
      <Text className="mt-0.5 text-[13px] text-label">{formatRef(balanceUsd)}</Text>
    </View>
  );
}
