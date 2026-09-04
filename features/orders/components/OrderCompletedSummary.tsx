import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";

import type { CompletedSummary } from "../hooks/useOrderDetail";

interface OrderCompletedSummaryProps {
  summary: CompletedSummary;
}

function formatUsd(fee: number): string {
  return `$${fee.toFixed(2)}`;
}

/**
 * Pantalla de éxito tras confirmar la entrega (wireframe 05b). Recibe el
 * resumen ya calculado (no depende de que la orden siga en el store — ver
 * design.md, Decisión 2).
 */
export function OrderCompletedSummary({ summary }: OrderCompletedSummaryProps) {
  const insets = useSafeAreaInsets();
  const subtitle = [
    summary.orderNumber != null ? `#${summary.orderNumber}` : null,
    summary.shopName || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View className="flex-1 bg-fondo">
      <Animated.View
        entering={FadeInDown.duration(380)}
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
            Pedido completado
          </Text>
          {subtitle ? (
            <Text className="font-body text-center text-[12px] text-texto-suave">{subtitle}</Text>
          ) : null}
        </View>

        <View className="w-full gap-[18px] rounded-[14px] border border-borde-suave bg-superficie p-4">
          {summary.customerName ? (
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-[13px] text-texto-suave">Cliente</Text>
              <Text className="text-[14px] font-heading-semibold text-texto">
                {summary.customerName}
              </Text>
            </View>
          ) : null}
          {typeof summary.distanceKm === "number" ? (
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-[13px] text-texto-suave">Distancia</Text>
              <Text className="text-[14px] font-heading-semibold text-texto">
                {summary.distanceKm.toFixed(1)} km
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-[13px] text-texto-suave">Comisión</Text>
            <Text className="text-[14px] font-heading-semibold text-texto">
              {formatUsd(summary.deliveryFee)}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View
        className="border-t border-borde-suave bg-superficie px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}
      >
        <Pressable
          onPress={() => router.replace(ROUTES.APP.HOME)}
          className="h-[52px] w-full items-center justify-center rounded-[14px] bg-marca"
        >
          <Text className="text-[16px] font-heading-bold text-white">Volver a Inicio</Text>
        </Pressable>
      </View>
    </View>
  );
}
