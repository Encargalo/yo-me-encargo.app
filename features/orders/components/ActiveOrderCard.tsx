import { Pressable, Text, View } from "react-native";

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

export function ActiveOrderCard({
  order,
  distanceKm,
  onPress,
}: ActiveOrderCardProps) {
  const color = getStatusColor(order.status);
  const label = getStatusLabel(order.status);
  const distance = formatDistance(distanceKm ?? order.distanceKm);
  // El mensaje del WS no trae nombre de restaurante (solo shop_id) → fallback.
  const title =
    order.shop.name ||
    (order.number != null ? `Pedido #${order.number}` : "Pedido");
  // La dirección/coords del mensaje son del cliente (entrega).
  const address = order.customer.address ?? order.shop.address;

  return (
    <Pressable
      onPress={onPress}
      className="gap-1.5 rounded-[14px] border border-hair bg-white p-3.5"
      android_ripple={{ color: "#0000000a" }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="rounded-[20px] px-2.5 py-[3px]"
          style={{ backgroundColor: color }}
        >
          <Text className="text-[11px] font-semibold text-white">{label}</Text>
        </View>
        {distance ? (
          <Text className="font-mono text-xs text-muted">{distance}</Text>
        ) : null}
      </View>

      <Text
        className="text-[15px] font-semibold tracking-[-0.2px] text-ink"
        numberOfLines={1}
      >
        {title}
      </Text>

      {address ? (
        <Text className="text-[13px] text-muted" numberOfLines={1}>
          Cliente · {address}
        </Text>
      ) : null}
    </Pressable>
  );
}
