import { Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

import type { ActiveOrder } from "../types/order.types";
import { getStatusColor, getStatusLabel } from "../utils/orderStatus";

interface ActiveOrderCardProps {
  order: ActiveOrder;
  distanceKm?: number; // distancia rider → cliente calculada en la pantalla
  onPress: () => void;
}

function formatDistance(km?: number): string | null {
  if (typeof km !== "number") return null;
  return `${km.toFixed(1)} km`;
}

export function ActiveOrderCard({ order, distanceKm, onPress }: ActiveOrderCardProps) {
  const color = getStatusColor(order.status);
  const label = getStatusLabel(order.status, !!order.riderId);
  const distance = formatDistance(distanceKm ?? order.distanceKm);
  // El mensaje del WS no trae nombre de restaurante (solo shop_id) → fallback.
  const title = order.shop.name || (order.number != null ? `Pedido #${order.number}` : "Pedido");
  // La dirección/coords del mensaje son del cliente (entrega).
  const address = order.customer.address ?? order.shop.address;

  return (
    <Pressable
      onPress={onPress}
      className="gap-1.5 rounded-[14px] border border-borde-suave bg-superficie p-3.5"
      android_ripple={{ color: `${Colors.texto}0a` }}
    >
      <View className="flex-row items-center justify-between">
        <View className="rounded-[20px] px-2.5 py-[3px]" style={{ backgroundColor: color }}>
          <Text className="text-[11px] font-heading-semibold text-white">{label}</Text>
        </View>
        {distance ? <Text className="font-mono text-xs text-texto-suave">{distance}</Text> : null}
      </View>

      <Text
        className="text-[15px] font-heading-semibold tracking-[-0.2px] text-texto"
        numberOfLines={1}
      >
        {title}
      </Text>

      {address ? (
        <Text className="font-body text-[13px] text-texto-suave" numberOfLines={1}>
          Cliente · {address}
        </Text>
      ) : null}
    </Pressable>
  );
}
