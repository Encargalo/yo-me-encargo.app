import { Text, View } from "react-native";

import { formatBs } from "@/features/balance/utils/formatAmount";

interface MinimumBalanceNoticeProps {
  // Mínimo vigente que manda el backend (`withdrawal_min_bs`). Es dinámico
  // porque se recalcula con la tasa BCV — nunca se hardcodea en el front.
  withdrawalMinBs: number;
  balanceBs: number;
}

export function MinimumBalanceNotice({ withdrawalMinBs, balanceBs }: MinimumBalanceNoticeProps) {
  const remainingBs = withdrawalMinBs - balanceBs;
  const isBelowMinimum = remainingBs > 0;

  return (
    <View className="flex-row items-start gap-2 rounded-[12px] border border-hair bg-block px-3.5 py-3">
      <Text className="text-[14px]">ⓘ</Text>
      <Text className="flex-1 text-[12px] leading-[17px] text-body">
        {isBelowMinimum ? (
          <>
            Te faltan <Text className="font-bold">{formatBs(remainingBs)}</Text> para poder retirar.
            El mínimo es {formatBs(withdrawalMinBs)}.
          </>
        ) : (
          <>
            Disponible para retiro a partir de{" "}
            <Text className="font-bold">{formatBs(withdrawalMinBs)}</Text>. Por debajo de ese monto
            el botón permanece deshabilitado.
          </>
        )}
      </Text>
    </View>
  );
}
