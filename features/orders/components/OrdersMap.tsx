import { useEffect, useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import type { LocationStatus } from "../hooks/useRiderLocation";
import type { ActiveOrder, OrderParty } from "../types/order.types";
import { getRouteStageInfo } from "../utils/routeStage";
import { MapSkeleton } from "./MapSkeleton";

interface OrdersMapProps {
  region: Region | null;
  riderStatus: LocationStatus;
  focusedOrder?: ActiveOrder;
  // El mapa se desactiva (sin MapView montado, sin GPS) cuando el rider está
  // "No disponible" o no tiene ninguna orden — ver `rider-orders-home`.
  enabled: boolean;
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

const PIN_SIZE = 40;

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

type LatLng = { latitude: number; longitude: number };

function partyCoord(party?: OrderParty): LatLng | null {
  if (!party) return null;
  const { latitude, longitude } = party;
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return { latitude, longitude };
}

// Placeholder estático que reemplaza al mapa cuando está desactivado — mismo
// espacio que ocuparía el MapView, sin GPS ni render nativo detrás.
function MapDisabledPlaceholder() {
  return (
    <View className="flex-1 items-center justify-center bg-block px-8">
      <Text className="text-center text-[13px] text-muted">
        Actívate para ver el mapa
      </Text>
    </View>
  );
}

export function OrdersMap({
  region,
  riderStatus,
  focusedOrder,
  enabled,
}: OrdersMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  // tracksViewChanges debe estar en true al montar para que los marcadores
  // custom rendericen en Android; se apaga tras un instante para ahorrar batería.
  const [tracks, setTracks] = useState(true);

  const shopCoord = partyCoord(focusedOrder?.shop);
  const customerCoord = partyCoord(focusedOrder?.customer);
  const stageInfo = focusedOrder ? getRouteStageInfo(focusedOrder.status) : null;
  const destinationCoord =
    stageInfo?.destination === "shop" ? shopCoord : customerCoord;

  const riderLat = region?.latitude;
  const riderLng = region?.longitude;
  const riderCoord =
    riderLat != null && riderLng != null
      ? { latitude: riderLat, longitude: riderLng }
      : null;

  // Re-renderizar los marcadores custom cuando cambia la orden enfocada, y
  // también cuando el mapa vuelve a habilitarse: al desactivarse, `MapView`
  // se desmonta por completo, y Android solo dibuja la vista custom de un
  // marcador si `tracksViewChanges` está en `true` en el momento en que ese
  // marcador se MONTA — si `tracks` ya se había apagado antes de ocultar el
  // mapa, los marcadores del `MapView` remontado nunca llegan a pintarse.
  useEffect(() => {
    if (!enabled) return;
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 1500);
    return () => clearTimeout(t);
  }, [enabled, focusedOrder?.id, riderLat, riderLng]);

  // `ready` se resetea al desactivar para que, al remontar `MapView`,
  // `onMapReady` vuelva a disparar el encuadre de cámara de abajo.
  useEffect(() => {
    if (!enabled) setReady(false);
  }, [enabled]);

  // Encuadrar la cámara para que se vean rider + marcadores de la orden.
  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;

    const points: LatLng[] = [];
    if (riderCoord) points.push(riderCoord);
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
    riderCoord?.latitude,
    riderCoord?.longitude,
    focusedOrder?.id,
    shopCoord?.latitude,
    shopCoord?.longitude,
    customerCoord?.latitude,
    customerCoord?.longitude,
  ]);

  return (
    <View className="flex-1 p-3">
      <View className="flex-1 overflow-hidden rounded-2xl border border-hair bg-block">
        {!enabled ? (
          <MapDisabledPlaceholder />
        ) : riderStatus === "loading" ? (
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
            {riderCoord && (
              <Marker
                testID="marker-rider"
                coordinate={riderCoord}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={tracks}
              >
                <View className="h-6 w-6 items-center justify-center rounded-full bg-ink/20">
                  <View className="h-3.5 w-3.5 rounded-full border-2 border-white bg-ink" />
                </View>
              </Marker>
            )}

            {/* Restaurante — opacidad reducida cuando la etapa actual va hacia el cliente */}
            {shopCoord && (
              <Marker
                testID="marker-shop"
                coordinate={shopCoord}
                title={focusedOrder?.shop.name}
                description={focusedOrder?.shop.address}
                anchor={{ x: 0.5, y: 1 }}
                opacity={stageInfo?.shopOpacity ?? 1}
                tracksViewChanges={tracks}
              >
                <Image
                  source={require("@/assets/shop-location.png")}
                  style={{ width: PIN_SIZE, height: PIN_SIZE }}
                  resizeMode="contain"
                />
              </Marker>
            )}

            {/* Cliente — opacidad reducida cuando la etapa actual va hacia la tienda */}
            {customerCoord && (
              <Marker
                testID="marker-customer"
                coordinate={customerCoord}
                title={focusedOrder?.customer.name || "Cliente"}
                description={focusedOrder?.customer.address}
                anchor={{ x: 0.5, y: 1 }}
                opacity={stageInfo?.customerOpacity ?? 1}
                tracksViewChanges={tracks}
              >
                <Image
                  source={require("@/assets/user-location.png")}
                  style={{ width: PIN_SIZE, height: PIN_SIZE }}
                  resizeMode="contain"
                />
              </Marker>
            )}

            {/* Ruta hacia el destino de la etapa actual (tienda o cliente).
                Directions API no tiene modo moto fuera de India (`two_wheeler`
                está restringido a ese país) — DRIVING es la aproximación más
                segura: sigue calles reales y respeta sentidos únicos. */}
            {stageInfo && riderCoord && destinationCoord && (
              <MapViewDirections
                origin={riderCoord}
                destination={destinationCoord}
                apikey={GOOGLE_MAPS_API_KEY}
                mode="DRIVING"
                strokeWidth={4}
                strokeColor={stageInfo.strokeColor}
                // La librería ya loguea el error por su cuenta; este handler solo
                // documenta que el fallo se contiene acá y no rompe el resto del
                // mapa (pines y demás siguen intactos sin la línea de ruta).
                onError={(errorMessage: string) =>
                  console.warn("[OrdersMap] No se pudo trazar la ruta:", errorMessage)
                }
              />
            )}
          </MapView>
        )}

        {/* Etiqueta mono del wireframe */}
        {enabled && (
          <View
            className="absolute left-2.5 top-2.5 rounded-md bg-white/85 px-2 py-1"
            pointerEvents="none"
          >
            <Text className="font-mono text-[9px] tracking-[1.2px] text-label">
              MAPA EN TIEMPO REAL
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
