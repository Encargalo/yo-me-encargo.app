import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { OFFER_TIMEOUT_SECONDS } from "../store/useOffersStore";
import type { ActiveOrder } from "../types/order.types";
import { CountdownRing } from "./CountdownRing";

interface OrderOfferModalProps {
  offer: ActiveOrder;
  secondsLeft: number;
  distanceKm?: number;
  onAccept: () => void;
  onReject: () => void;
}

function formatUsd(fee: number): string {
  return `$${fee.toFixed(2)}`;
}

// ETA aproximada urbana (~18 km/h en moto) solo como referencia visual.
function formatDistanceEta(km?: number): string | null {
  if (typeof km !== "number") return null;
  const minutes = Math.max(1, Math.round((km / 18) * 60));
  return `≈ ${km.toFixed(1)} km · ${minutes} min`;
}

/**
 * Overlay de nueva orden disponible (wireframe 03). Modal de prioridad máxima,
 * anclado abajo, que solo cierra al Aceptar o Rechazar (o al expirar el
 * temporizador desde el hook). Sin cierre por gesto ni por back de Android.
 */
export function OrderOfferModal({
  offer,
  secondsLeft,
  distanceKm,
  onAccept,
  onReject,
}: OrderOfferModalProps) {
  // Deshabilita los botones tras pulsar, hasta que cambie la oferta visible.
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    setSubmitting(false);
  }, [offer.id]);

  const title =
    offer.shop.name ||
    (offer.number != null ? `Pedido #${offer.number}` : "Pedido");
  const address = offer.customer.address ?? offer.shop.address;
  const distanceEta = formatDistanceEta(distanceKm ?? offer.distanceKm);

  const handleAccept = () => {
    if (submitting) return;
    setSubmitting(true);
    onAccept();
  };
  const handleReject = () => {
    if (submitting) return;
    setSubmitting(true);
    onReject();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // Back de Android no cierra: solo Aceptar/Rechazar resuelven la oferta.
      }}
    >
      <View className="flex-1 justify-end bg-black/55">
        <View className="rounded-t-[28px] bg-card px-6 pb-9 pt-5">
          {/* Temporizador regresivo */}
          <View className="items-center">
            <CountdownRing
              secondsLeft={secondsLeft}
              totalSeconds={OFFER_TIMEOUT_SECONDS}
            />
          </View>

          {/* Restaurante */}
          <Text className="mt-4 font-mono text-[11px] tracking-[1.4px] text-label">
            RESTAURANTE
          </Text>
          <Text
            className="mt-1 text-[24px] font-bold tracking-[-0.5px] text-ink"
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Dirección de entrega + distancia */}
          {address ? (
            <View className="mt-3 flex-row items-start gap-2">
              <View
                className="mt-0.5 h-[22px] w-[22px] items-center justify-center border border-white"
                style={{
                  backgroundColor: "#3b82f6",
                  borderRadius: 11,
                  borderBottomRightRadius: 2,
                }}
              >
                <Text className="text-[11px] font-bold text-white">B</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] text-body" numberOfLines={2}>
                  {address}
                </Text>
                {distanceEta ? (
                  <Text className="mt-0.5 font-mono text-[12px] text-muted">
                    {distanceEta}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Comisión — el dato que decide */}
          <View className="mt-5 flex-row items-center justify-between rounded-[14px] bg-block px-4 py-4">
            <Text className="text-[15px] font-semibold text-body">Comisión</Text>
            <Text className="text-[30px] font-bold tracking-[-0.5px] text-ink">
              {formatUsd(offer.deliveryFee)}
            </Text>
          </View>

          {/* Acciones — zona del pulgar */}
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={handleReject}
              disabled={submitting}
              className="h-[56px] flex-1 items-center justify-center rounded-[14px] border-[1.5px] border-line bg-white"
              style={submitting ? { opacity: 0.5 } : undefined}
            >
              <Text className="text-[16px] font-semibold text-body">
                Rechazar
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              disabled={submitting}
              className="h-[56px] items-center justify-center rounded-[14px] bg-ink"
              style={[{ flexGrow: 1.3, flexBasis: 0 }, submitting && { opacity: 0.5 }]}
            >
              <Text className="text-[16px] font-bold text-white">Aceptar</Text>
            </Pressable>
          </View>

          <Text className="mt-3 text-center font-mono text-[10px] tracking-[1px] text-placeholder">
            ZONA DEL PULGAR · ACCIONES GRANDES LADO A LADO
          </Text>
        </View>
      </View>
    </Modal>
  );
}
