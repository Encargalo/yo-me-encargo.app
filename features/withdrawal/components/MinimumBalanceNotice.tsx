import { Text, View } from "react-native";

import { formatBs } from "@/features/balance/utils/formatAmount";

interface MinimumBalanceNoticeProps {
  // Mínimo de retiro vigente en Bs (dinámico, del backend). Puede faltar si la
  // respuesta de balance no lo trae — en ese caso se muestra el aviso genérico.
  withdrawalMinBs?: number;
  balanceBs: number;
}

// El copy usa `withdrawal_min_bs` del backend, nunca un número hardcodeado
// (ver design.md, Decisión 5). Cuando el saldo está por debajo del mínimo,
// añade cuánto falta.
export function MinimumBalanceNotice({ withdrawalMinBs, balanceBs }: MinimumBalanceNoticeProps) {
  const missing =
    typeof withdrawalMinBs === "number" && balanceBs < withdrawalMinBs
      ? withdrawalMinBs - balanceBs
      : null;

  return (
    <View className="flex-row items-start gap-2 rounded-[12px] border border-borde-suave bg-fondo px-3.5 py-3">
      <Text className="font-body text-[14px]">ⓘ</Text>
      <Text className="font-body flex-1 text-[12px] leading-[17px] text-texto-suave">
        {typeof withdrawalMinBs === "number" ? (
          <>
            Disponible para retiro a partir de{" "}
            <Text className="font-heading-bold">{formatBs(withdrawalMinBs)}</Text>.
          </>
        ) : (
          <>El retiro se habilita al alcanzar el mínimo vigente.</>
        )}
        {missing != null ? (
          <>
            {" "}
            Te faltan <Text className="font-heading-bold">{formatBs(missing)}</Text>.
          </>
        ) : null}
      </Text>
    </View>
  );
}
