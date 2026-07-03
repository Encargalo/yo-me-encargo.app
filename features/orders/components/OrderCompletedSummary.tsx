import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { ROUTES } from "@/constants/routes";
import { OrderStatusColors } from "@/constants/theme";

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
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-canvas px-8">
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${OrderStatusColors.completed}1f` }}
      >
        <CheckCircle size={36} color={OrderStatusColors.completed} />
      </View>

      <Text className="text-center text-[20px] font-bold tracking-[-0.3px] text-ink">
        Pedido completado
      </Text>

      <View className="w-full gap-2 rounded-[14px] border border-hair bg-white p-4">
        {summary.customerName ? (
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Cliente</Text>
            <Text className="text-[14px] font-semibold text-ink">
              {summary.customerName}
            </Text>
          </View>
        ) : null}
        {typeof summary.distanceKm === "number" ? (
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Distancia</Text>
            <Text className="text-[14px] font-semibold text-ink">
              {summary.distanceKm.toFixed(1)} km
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] text-muted">Comisión</Text>
          <Text className="text-[14px] font-semibold text-ink">
            {formatUsd(summary.deliveryFee)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.replace(ROUTES.APP.HOME)}
        className="h-[52px] w-full items-center justify-center rounded-[14px] bg-ink"
      >
        <Text className="text-[16px] font-bold text-white">Volver a Inicio</Text>
      </Pressable>
    </View>
  );
}
