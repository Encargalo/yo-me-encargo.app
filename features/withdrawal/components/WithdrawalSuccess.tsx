import LottieView from "lottie-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { formatBs } from "@/features/balance/utils/formatAmount";

interface WithdrawalSuccessProps {
  amountWithdrawn: number;
  onDismiss: () => void;
}

// Swap de estado dentro de la misma pantalla (no ruta/modal nueva), mismo
// patrón que OrderCompletedSummary (order-completed-polish) — ver design.md,
// Decisión 7. Reutiliza el mismo asset Lottie de éxito ya integrado ahí.
export function WithdrawalSuccess({ amountWithdrawn, onDismiss }: WithdrawalSuccessProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      className="flex-1 items-center justify-center gap-4 px-8"
    >
      <LottieView
        source={require("@/assets/animations/Success.json")}
        autoPlay
        loop={false}
        style={{ width: 120, height: 120 }}
      />

      <View className="items-center gap-1">
        <Text className="text-center text-[20px] font-heading-bold tracking-[-0.3px] text-texto">
          Retiro solicitado
        </Text>
        <Text className="font-body text-center text-[13px] text-texto-suave">
          Procesaremos tu solicitud en las próximas horas.
        </Text>
      </View>

      <View className="w-full items-center rounded-[14px] bg-fondo p-4">
        <Text className="font-mono text-[10px] text-texto-suave">MONTO RETIRADO</Text>
        <Text className="text-[28px] font-heading-bold text-texto">
          {formatBs(amountWithdrawn)}
        </Text>
      </View>

      <Pressable
        onPress={onDismiss}
        className="h-[50px] w-full items-center justify-center rounded-[13px] bg-marca"
      >
        <Text className="text-[15px] font-heading-bold text-white">Entendido</Text>
      </Pressable>
    </Animated.View>
  );
}
