import { Text, View } from "react-native";

import { formatAmount } from "@/features/balance/utils/formatAmount";

interface AvailableBalanceCardProps {
  balance: number;
}

// Reutiliza formatAmount de features/balance (mismo dominio de dinero, ver
// design.md Decisión 3). A diferencia de NetBalanceCard (Balance), esta
// tarjeta no muestra zona ni desglose Ganado/Descontado — solo el disponible
// para retiro (wireframe 07).
export function AvailableBalanceCard({ balance }: AvailableBalanceCardProps) {
  return (
    <View className="items-center rounded-[16px] border border-hair bg-white p-[18px]">
      <Text className="font-mono text-[10px] tracking-[1.2px] text-label">
        DISPONIBLE PARA RETIRO
      </Text>
      <Text className="mt-1.5 text-[34px] font-bold tracking-[-0.4px] text-ink">
        {formatAmount(balance)}
      </Text>
    </View>
  );
}
