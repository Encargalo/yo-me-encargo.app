import { router } from "expo-router";
import { useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";
import { ActiveOrderCard } from "@/features/orders/components/ActiveOrderCard";
import { HomeHeader } from "@/features/orders/components/HomeHeader";
import { OrdersEmptyState } from "@/features/orders/components/OrdersEmptyState";
import { OrdersMap } from "@/features/orders/components/OrdersMap";
import { useRiderLocation } from "@/features/orders/hooks/useRiderLocation";
import { useRiderOrders } from "@/features/orders/hooks/useRiderOrders";
import { useOrdersStore } from "@/features/orders/store/useOrdersStore";
import type { ActiveOrder } from "@/features/orders/types/order.types";
import { getFocusedOrders } from "@/features/orders/utils/getFocusedOrders";
import { haversineKm } from "@/features/orders/utils/haversine";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { orders } = useRiderOrders();
  const isAvailable = useOrdersStore((s) => s.isAvailable);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  // Levantado acá (no vive dentro de `OrdersMap`) para que sobreviva al
  // remontar el mapa al abrir/cerrar pantalla completa (mapa chico y pantalla
  // completa son 2 instancias distintas, nunca montadas a la vez).
  const [isFollowingRider, setIsFollowingRider] = useState(false);

  // Sin órdenes o en pausa: el mapa se desactiva por completo (sin GPS, sin
  // MapView montado) para no gastar recursos cuando no hay nada que mostrar.
  const mapEnabled = isAvailable && orders.length > 0;
  const { region, status } = useRiderLocation(mapEnabled);

  // Las órdenes ACEPTADAS (no ofertas sin decidir), hasta 2, son las que enfocan el mapa.
  const focusedOrders = getFocusedOrders(orders);

  function openOrder(id: string) {
    router.push({ pathname: ROUTES.APP.ORDER_DETAIL, params: { id } });
  }

  function distanceTo(order: ActiveOrder): number | undefined {
    const { latitude, longitude } = order.customer;
    if (!region || latitude == null || longitude == null) return undefined;
    return haversineKm(region, { latitude, longitude });
  }

  return (
    <View className="flex-1 bg-fondo" style={{ paddingTop: insets.top }}>
      <HomeHeader />

      {/* Zona superior (~48%): mapa en tiempo real. El mismo `OrdersMap` se
          muestra reducido acá o a pantalla completa en el `Modal` de abajo —
          nunca los dos a la vez, para no montar 2 `MapView` nativos juntos. */}
      <View className="flex-[48]">
        {!isMapFullscreen && (
          <OrdersMap
            region={region}
            riderStatus={status}
            focusedOrders={focusedOrders}
            enabled={mapEnabled}
            isFullscreen={false}
            onRequestFullscreen={() => setIsMapFullscreen(true)}
            onRequestClose={() => setIsMapFullscreen(false)}
            followEnabled={isFollowingRider}
            onFollowChange={setIsFollowingRider}
          />
        )}
      </View>

      <Modal
        visible={isMapFullscreen}
        animationType="slide"
        onRequestClose={() => setIsMapFullscreen(false)}
      >
        <View className="flex-1 bg-fondo" style={{ paddingTop: insets.top }}>
          <OrdersMap
            region={region}
            riderStatus={status}
            focusedOrders={focusedOrders}
            enabled={mapEnabled}
            isFullscreen={true}
            onRequestFullscreen={() => {}}
            onRequestClose={() => setIsMapFullscreen(false)}
            followEnabled={isFollowingRider}
            onFollowChange={setIsFollowingRider}
          />
        </View>
      </Modal>

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
              <Text className="text-base font-heading-bold tracking-[-0.3px] text-texto">
                Órdenes activas
              </Text>
              <Text className="font-mono text-[10px] tracking-[1px] text-texto-suave">
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
