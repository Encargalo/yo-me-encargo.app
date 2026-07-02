import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import Svg, { Path } from "react-native-svg";

import { Neutrals } from "@/constants/theme";

import type { LocationStatus } from "../hooks/useRiderLocation";
import type { ActiveOrder, OrderParty } from "../types/order.types";
import { getStatusColor } from "../utils/orderStatus";
import { MapSkeleton } from "./MapSkeleton";

interface OrdersMapProps {
  region: Region | null;
  riderStatus: LocationStatus;
  focusedOrder?: ActiveOrder;
}

// Estilo de relleno absoluto para componentes nativos (MapView/MapSkeleton),
// que no reciben className de NativeWind.
const FILL = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

// Región de respaldo (Caracas) cuando el permiso fue denegado y no hay posición
// del rider: el mapa igual se muestra y la pantalla sigue siendo usable.
const FALLBACK_REGION: Region = {
  latitude: 10.4806,
  longitude: -66.9036,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Pin de mapa (viewBox 24×32): cabeza circular arriba + punta abajo.
const PIN_W = 36;
const PIN_H = 48;
const PIN_PATH =
  "M12 0.5C6.201 0.5 1.5 5.201 1.5 11c0 7.5 10.5 20.5 10.5 20.5S22.5 18.5 22.5 11C22.5 5.201 17.799 0.5 12 0.5z";

type LatLng = { latitude: number; longitude: number };

function partyCoord(party?: OrderParty): LatLng | null {
  if (!party) return null;
  const { latitude, longitude } = party;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return { latitude, longitude };
}

// Pin con la letra (A/B), coloreado por el estado de la orden.
function MapPin({ label, color }: { label: string; color: string }) {
  return (
    <View className="items-center" style={{ width: PIN_W, height: PIN_H }}>
      <Svg width={PIN_W} height={PIN_H} viewBox="0 0 24 32">
        <Path d={PIN_PATH} fill={color} stroke="#ffffff" strokeWidth={1.5} />
      </Svg>
      <Text
        className="absolute top-2 text-center text-[15px] font-bold text-white"
        style={{ width: PIN_W }}
      >
        {label}
      </Text>
    </View>
  );
}

export function OrdersMap({
  region,
  riderStatus,
  focusedOrder,
}: OrdersMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  // tracksViewChanges debe estar en true al montar para que los marcadores
  // custom rendericen en Android; se apaga tras un instante para ahorrar batería.
  const [tracks, setTracks] = useState(true);

  const statusColor = focusedOrder
    ? getStatusColor(focusedOrder.status)
    : Neutrals.ink;
  const shopCoord = partyCoord(focusedOrder?.shop);
  const customerCoord = partyCoord(focusedOrder?.customer);

  const riderLat = region?.latitude;
  const riderLng = region?.longitude;

  // Re-renderizar los marcadores custom cuando cambia la orden enfocada.
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 1500);
    return () => clearTimeout(t);
  }, [focusedOrder?.id, riderLat, riderLng]);

  // Encuadrar la cámara para que se vean rider + marcadores de la orden.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;

    const points: LatLng[] = [];
    if (riderLat != null && riderLng != null) {
      points.push({ latitude: riderLat, longitude: riderLng });
    }
    if (shopCoord) points.push(shopCoord);
    if (customerCoord) points.push(customerCoord);

    if (points.length === 0) return;
    if (points.length === 1) {
      map.animateToRegion(
        { ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    } else {
      map.fitToCoordinates(points, {
        edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
        animated: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    riderLat,
    riderLng,
    focusedOrder?.id,
    shopCoord?.latitude,
    shopCoord?.longitude,
    customerCoord?.latitude,
    customerCoord?.longitude,
  ]);

  return (
    <View className="flex-1 p-3">
      <View className="flex-1 overflow-hidden rounded-2xl border border-hair bg-block">
        {riderStatus === "loading" ? (
          <MapSkeleton style={FILL} />
        ) : (
          <MapView
            ref={mapRef}
            style={FILL}
            initialRegion={region ?? FALLBACK_REGION}
            onMapReady={() => setReady(true)}
            showsMyLocationButton={false}
            showsCompass={false}
            showsPointsOfInterest={false}
            toolbarEnabled={false}
          >
            {/* Marcador del rider (●) — solo con permiso concedido */}
            {riderLat != null && riderLng != null && (
              <Marker
                coordinate={{ latitude: riderLat, longitude: riderLng }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={tracks}
              >
                <View className="h-6 w-6 items-center justify-center rounded-full bg-ink/20">
                  <View className="h-3.5 w-3.5 rounded-full border-2 border-white bg-ink" />
                </View>
              </Marker>
            )}

            {/* Restaurante (A) — coloreado según el estado de la orden */}
            {shopCoord && (
              <Marker
                coordinate={shopCoord}
                title={focusedOrder?.shop.name}
                description={focusedOrder?.shop.address}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={tracks}
              >
                <MapPin label="A" color={statusColor} />
              </Marker>
            )}

            {/* Cliente (B) — coloreado según el estado de la orden */}
            {customerCoord && (
              <Marker
                coordinate={customerCoord}
                title={focusedOrder?.customer.name || "Cliente"}
                description={focusedOrder?.customer.address}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={tracks}
              >
                <MapPin label="B" color={statusColor} />
              </Marker>
            )}
          </MapView>
        )}

        {/* Etiqueta mono del wireframe */}
        <View
          className="absolute left-2.5 top-2.5 rounded-md bg-white/85 px-2 py-1"
          pointerEvents="none"
        >
          <Text className="font-mono text-[9px] tracking-[1.2px] text-label">
            MAPA EN TIEMPO REAL
          </Text>
        </View>
      </View>
    </View>
  );
}
