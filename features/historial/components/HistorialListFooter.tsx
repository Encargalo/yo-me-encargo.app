import { Pressable, Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";

import type { HistorialStatus } from "../hooks/useTransactionHistory";
import { HistorialSkeleton } from "./HistorialSkeleton";

interface HistorialListFooterProps {
  status: HistorialStatus;
  onRetry: () => void;
}

// Fila-skeleton en vez de spinner genérico, por convención del proyecto.
export function HistorialListFooter({
  status,
  onRetry,
}: HistorialListFooterProps) {
  if (status === "loadingMore") {
    return (
      <View className="px-4 pb-2 pt-1">
        <HistorialSkeleton rows={1} />
      </View>
    );
  }

  if (status === "errorMore") {
    return (
      <Pressable
        onPress={onRetry}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Text
          className="flex-1 text-[12.5px] font-semibold"
          style={{ color: OrderStatusColors.error }}
        >
          No pudimos cargar más movimientos
        </Text>
        <Text
          className="text-[12.5px] font-bold"
          style={{ color: OrderStatusColors.error }}
        >
          Reintentar
        </Text>
      </Pressable>
    );
  }

  return null;
}
