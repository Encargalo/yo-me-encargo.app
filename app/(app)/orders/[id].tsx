import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";
import { Neutrals, OrderStatusColors } from "@/constants/theme";
import { DeliveryCodeInput } from "@/features/orders/components/DeliveryCodeInput";
import { OrderCompletedSummary } from "@/features/orders/components/OrderCompletedSummary";
import { OrderItemsList } from "@/features/orders/components/OrderItemsList";
import { OrderPartyBlock } from "@/features/orders/components/OrderPartyBlock";
import { PickupCodeCard } from "@/features/orders/components/PickupCodeCard";
import { useIsKeyboardVisible } from "@/features/orders/hooks/useIsKeyboardVisible";
import { useOrderDetail } from "@/features/orders/hooks/useOrderDetail";
import {
  getStatusColor,
  getStatusLabel,
} from "@/features/orders/utils/orderStatus";

function formatUsd(fee: number): string {
  return `$${fee.toFixed(2)}`;
}

// Pantalla única de Orden Activa (wireframes 04/05/05b): el `stage` derivado
// por `useOrderDetail` decide qué bloque mostrar — ver design.md del change
// `order-detail`.
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    stage,
    order,
    accepting,
    accept,
    otpCode,
    setOtpCode,
    confirming,
    deliveryError,
    confirmDelivery,
    completedSummary,
  } = useOrderDetail(id);
  const insets = useSafeAreaInsets();
  const keyboardVisible = useIsKeyboardVisible();

  if (stage === "completed" && completedSummary) {
    return <OrderCompletedSummary summary={completedSummary} />;
  }

  if (stage === "not-found" || stage === "taken" || !order) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3 bg-canvas px-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-[15px] font-semibold text-body">
          {stage === "taken"
            ? "Esta orden ya fue tomada por otro rider"
            : "No encontramos esta orden"}
        </Text>
        <Pressable
          onPress={() => router.replace(ROUTES.APP.HOME)}
          className="h-11 items-center justify-center rounded-[12px] bg-ink px-5"
        >
          <Text className="text-[14px] font-semibold text-white">
            Volver a Inicio
          </Text>
        </Pressable>
      </View>
    );
  }

  const title =
    order.shop.name ||
    (order.number != null ? `Pedido #${order.number}` : "Pedido");
  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status, !!order.riderId);
  const items = order.items ?? [];

  return (
    // Estilo por `style`, no `className`: NativeWind sobre KeyboardAvoidingView
    // no calcula bien el padding cuando aparece el teclado (confirmado contra
    // el mismo patrón, con StyleSheet plano, funcionando en encargalo-mobile-v2
    // con el mismo edgeToEdgeEnabled).
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Neutrals.canvas, paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-row items-center gap-2 border-b border-hair bg-canvas px-2 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={20} color={Neutrals.ink} />
        </Pressable>
        <View
          className="rounded-[20px] px-2.5 py-[3px]"
          style={{ backgroundColor: statusColor }}
        >
          <Text className="text-[11px] font-semibold text-white">
            {statusLabel}
          </Text>
        </View>
        <Text
          className="ml-1 flex-1 text-[15px] font-semibold text-ink"
          numberOfLines={1}
        >
          {title}
        </Text>
        {order.number != null ? (
          <Text className="font-mono text-[11px] tracking-[0.5px] text-label">
            #{order.number}
          </Text>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-4 py-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <OrderPartyBlock
          eyebrow="RESTAURANTE"
          role="shop"
          pinColor={OrderStatusColors.pending}
          name={order.shop.name || "Restaurante"}
          address={order.shop.address}
          phone={order.shop.phone}
          latitude={order.shop.latitude}
          longitude={order.shop.longitude}
        />

        <OrderPartyBlock
          eyebrow="CLIENTE"
          role="customer"
          pinColor={OrderStatusColors.enroute}
          name={order.customer.name || "Cliente"}
          address={order.customer.address}
          phone={order.customer.phone}
          latitude={order.customer.latitude}
          longitude={order.customer.longitude}
        >
          <OrderItemsList items={items} />
        </OrderPartyBlock>

        {stage === "pending-pickup" && order.pickupCode ? (
          <PickupCodeCard code={order.pickupCode} />
        ) : null}

        <View className="flex-row items-center justify-between rounded-[14px] bg-block px-4 py-4">
          <Text className="text-[15px] font-semibold text-body">
            Comisión
          </Text>
          <Text className="text-[24px] font-bold tracking-[-0.4px] text-ink">
            {formatUsd(order.deliveryFee)}
          </Text>
        </View>
      </ScrollView>

      <View
        className="border-t border-hair bg-white px-4 pt-3"
        style={{
          paddingBottom: keyboardVisible
            ? 10
            : Math.max(insets.bottom, 16) + 12,
        }}
      >
        {stage === "offer" ? (
          <Pressable
            onPress={accept}
            disabled={accepting}
            className="h-[56px] items-center justify-center rounded-[14px]"
            style={{
              backgroundColor: statusColor,
              opacity: accepting ? 0.5 : 1,
            }}
          >
            <Text className="text-[16px] font-bold text-white">
              {accepting ? "Aceptando…" : "Aceptar orden"}
            </Text>
          </Pressable>
        ) : null}

        {stage === "pending-pickup" ? (
          <Text className="py-2 text-center text-[13px] text-muted">
            Muestra este código en el negocio para recoger el pedido
          </Text>
        ) : null}

        {stage === "on-the-way" ? (
          <DeliveryCodeInput
            code={otpCode}
            onChangeCode={setOtpCode}
            onSubmit={confirmDelivery}
            submitting={confirming}
            error={deliveryError}
            color={statusColor}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
