import { Text, View } from "react-native";

import { formatAmount } from "@/features/balance/utils/formatAmount";

import { MIN_WITHDRAWAL_BALANCE } from "../types/withdrawal.types";

// El copy usa MIN_WITHDRAWAL_BALANCE + formatAmount en vez de un número
// hardcodeado, para que la constante sea la única fuente de verdad (ver
// design.md, Decisión 4).
export function MinimumBalanceNotice() {
  return (
    <View className="flex-row items-start gap-2 rounded-[12px] border border-hair bg-block px-3.5 py-3">
      <Text className="text-[14px]">ⓘ</Text>
      <Text className="flex-1 text-[12px] leading-[17px] text-body">
        Disponible para retiro a partir de{" "}
        <Text className="font-bold">
          {formatAmount(MIN_WITHDRAWAL_BALANCE)}
        </Text>
        . Por debajo de ese monto el botón permanece deshabilitado.
      </Text>
    </View>
  );
}
