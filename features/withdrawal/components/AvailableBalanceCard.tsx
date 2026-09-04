import { Text, View } from "react-native";

import { formatBs, formatRef } from "@/features/balance/utils/formatAmount";

interface AvailableBalanceCardProps {
  balanceBs: number;
  balanceUsd: number;
}

// Reutiliza el formateo de dinero de features/balance (mismo dominio, ver
// design.md Decisión 3). A diferencia de NetBalanceCard (Balance), esta
// tarjeta no muestra zona ni desglose Ganado/Descontado — solo el disponible
// para retiro en Bs, con el USD referencial (wireframe 07).
export function AvailableBalanceCard({ balanceBs, balanceUsd }: AvailableBalanceCardProps) {
  return (
    <View className="items-center rounded-[16px] border border-borde-suave bg-superficie p-[18px]">
      <Text className="font-mono text-[10px] tracking-[1.2px] text-texto-suave">
        DISPONIBLE PARA RETIRO
      </Text>
      <Text className="mt-1.5 text-[34px] font-heading-bold tracking-[-0.4px] text-texto">
        {formatBs(balanceBs)}
      </Text>
      <Text className="mt-0.5 text-[12px] font-heading-semibold text-texto-suave">
        {formatRef(balanceUsd)}
      </Text>
    </View>
  );
}
