import { router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";
import { ActiveOrderCard } from "@/features/orders/components/ActiveOrderCard";
import { HomeHeader } from "@/features/orders/components/HomeHeader";
import { OrdersEmptyState } from "@/features/orders/components/OrdersEmptyState";
import { OrdersMap } from "@/features/orders/components/OrdersMap";
import { useRiderLocation } from "@/features/orders/hooks/useRiderLocation";
import { useRiderOrders } from "@/features/orders/hooks/useRiderOrders";
import type { ActiveOrder } from "@/features/orders/types/order.types";
import { haversineKm } from "@/features/orders/utils/haversine";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { orders } = useRiderOrders();
  const { region, status } = useRiderLocation();

  // La primera orden (más cerca de completarse) es la que enfoca el mapa.
  const focusedOrder = orders[0];

  function openOrder(id: string) {
    router.push({ pathname: ROUTES.APP.ORDER_DETAIL, params: { id } });
  }

  function distanceTo(order: ActiveOrder): number | undefined {
    const { latitude, longitude } = order.customer;
    if (!region || latitude == null || longitude == null) return undefined;
    return haversineKm(region, { latitude, longitude });
  }

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <HomeHeader />

      {/* Zona superior (~48%): mapa en tiempo real */}
      <View className="flex-[48]">
        <OrdersMap
          region={region}
          riderStatus={status}
          focusedOrder={focusedOrder}
        />
      </View>

      {/* Zona inferior (~52%): órdenes activas o estado vacío */}
      <View className="flex-[52]">
        {orders.length === 0 ? (
          <OrdersEmptyState />
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-2.5 px-4 pt-1 pb-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-0.5 flex-row items-center justify-between">
              <Text className="text-base font-bold tracking-[-0.3px] text-ink">
                Órdenes activas
              </Text>
              <Text className="font-mono text-[10px] tracking-[1px] text-label">
                {orders.length}
              </Text>
            </View>

            {orders.map((order) => (
              <ActiveOrderCard
                key={order.id}
                order={order}
                distanceKm={distanceTo(order)}
                onPress={() => openOrder(order.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
