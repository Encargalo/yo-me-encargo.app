import { Fragment, useEffect, useRef, useState } from "react";
import { type GestureResponderEvent, Image, Pressable, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import type { LocationStatus } from "../hooks/useRiderLocation";
import { useLiveRiderLocation } from "../hooks/useLiveRiderLocation";
import type { ActiveOrder } from "../types/order.types";
import { lightenColor } from "../utils/color";
import {
  getRouteStageInfo,
  partyCoord,
  rankOrdersByPriority,
  SECONDARY_ROUTE_LIGHTEN_RATIO,
  type LatLng,
} from "../utils/routeStage";
import { MapSkeleton } from "./MapSkeleton";

interface OrdersMapProps {
  region: Region | null;
  riderStatus: LocationStatus;
  // Órdenes ACEPTADAS a enfocar en el mapa, hasta 2 (ver `getFocusedOrders`).
  focusedOrders?: ActiveOrder[];
  // El mapa se desactiva (sin MapView montado, sin GPS) cuando el rider está
  // "No disponible" o no tiene ninguna orden — ver `rider-orders-home`.
  enabled: boolean;
  // Si este `OrdersMap` es el que se muestra dentro del modal de pantalla
  // completa (cambia el overlay: botón de cerrar en vez de etiqueta de tap).
  isFullscreen?: boolean;
  // Tap corto (sin arrastrar) sobre el mapa reducido.
  onRequestFullscreen?: () => void;
  // Toque sobre el control de cerrar en pantalla completa.
  onRequestClose?: () => void;
  // Estado del modo "Hacer seguimiento" controlado por el padre. El mapa
  // chico y el de pantalla completa son 2 instancias distintas de este mismo
  // componente (una se desmonta cuando aparece la otra) — sin este control
  // levantado a `home.tsx`, activar seguimiento en una y abrir pantalla
  // completa perdería el seguimiento al remontar. Si se omite, `OrdersMap`
  // mantiene su propio estado interno (uso standalone, ej. en tests).
  followEnabled?: boolean;
  onFollowChange?: (enabled: boolean) => void;
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

// Umbral para distinguir un tap (abre pantalla completa) de un pan/zoom sobre
// el mapa — ajustable si en dispositivo real no se siente natural.
const TAP_MAX_DURATION_MS = 250;
const TAP_MAX_MOVEMENT_PX = 10;

// Zoom cercano fijo del modo seguimiento, estilo navegación. En
// react-native-maps un delta MÁS CHICO = MÁS acercado (menos área visible);
// uno más grande = más alejado. Historial de ajustes en dispositivo:
// 0.005 → 0.0035 → 0.0042 → 0.00588 (esta rama subió el delta 3 veces
// seguidas, alejando la cámara en cada paso) → el usuario reportó que
// "todavía se ve lejos" en 0.00588, lo cual confirma que subir el delta fue
// en la dirección contraria a lo que se buscaba. Se corrige bajándolo un 70%
// desde 0.00588 para acercar la cámara de verdad.
export const FOLLOW_ZOOM_DELTA = 0.00176;

// Placeholder estático que reemplaza al mapa cuando está desactivado — mismo
// espacio que ocuparía el MapView, sin GPS ni render nativo detrás.
function MapDisabledPlaceholder() {
  return (
    <View className="flex-1 items-center justify-center bg-fondo px-8">
      <Text className="font-body text-center text-[13px] text-texto-suave">
        Actívate para ver el mapa
      </Text>
    </View>
  );
}

// Destino (tienda o cliente) de la etapa actual de una orden, o `null` si su
// status no cae en recogida pendiente / en camino (esa orden no traza ruta).
function destinationCoord(order: ActiveOrder): LatLng | null {
  const stageInfo = getRouteStageInfo(order.status);
  if (!stageInfo) return null;
  return stageInfo.destination === "shop" ? partyCoord(order.shop) : partyCoord(order.customer);
}

export function OrdersMap({
  region,
  riderStatus,
  focusedOrders = [],
  enabled,
  isFullscreen = false,
  onRequestFullscreen = () => {},
  onRequestClose = () => {},
  followEnabled: followEnabledProp,
  onFollowChange,
}: OrdersMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  // tracksViewChanges debe estar en true al montar para que los marcadores
  // custom rendericen en Android; se apaga tras un instante para ahorrar batería.
  const [tracks, setTracks] = useState(true);
  // Modo "Hacer seguimiento": apagado por defecto. Controlado (`followEnabledProp`)
  // si el padre lo levanta (ver `home.tsx`); si no, se maneja localmente.
  const [internalFollowEnabled, setInternalFollowEnabled] = useState(false);
  const followEnabled = followEnabledProp ?? internalFollowEnabled;
  function setFollowEnabled(next: boolean) {
    onFollowChange?.(next);
    if (followEnabledProp === undefined) setInternalFollowEnabled(next);
  }
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const riderLat = region?.latitude;
  const riderLng = region?.longitude;
  const riderCoord: LatLng | null =
    riderLat != null && riderLng != null ? { latitude: riderLat, longitude: riderLng } : null;

  // Posición en vivo del rider — solo se obtiene mientras el seguimiento está
  // activo (ver `useLiveRiderLocation`). El marcador del rider usa esta
  // posición cuando está disponible; la ruta trazada (`MapViewDirections`)
  // sigue usando `riderCoord` (lectura única): la ruta se recalcula solo por
  // transición de etapa, no de forma continua mientras el rider se mueve.
  const liveRiderCoord = useLiveRiderLocation(followEnabled);
  const effectiveRiderCoord = followEnabled && liveRiderCoord ? liveRiderCoord : riderCoord;

  // Orden de prioridad visual entre rutas simultáneas: el primer elemento es
  // el prioritario (color normal), el segundo (si existe) el secundario
  // (color atenuado, ver `SECONDARY_ROUTE_LIGHTEN_RATIO`). Con 0 o 1 orden no
  // cambia nada respecto al orden recibido.
  const rankedOrders = rankOrdersByPriority(focusedOrders, riderCoord);
  const primaryOrderId = rankedOrders[0]?.id;
  const hasSecondaryOrder = rankedOrders.length > 1;

  // Firma estable (string) de los destinos actuales de `focusedOrders`, usada
  // como dependencia de efectos en vez de la referencia del array (que cambia
  // de identidad en cada render del padre aunque el contenido sea el mismo).
  const destinationSignature = focusedOrders
    .map((order) => {
      const dest = destinationCoord(order);
      return `${order.id}:${dest?.latitude ?? ""},${dest?.longitude ?? ""}`;
    })
    .join("|");

  // Re-renderizar los marcadores custom cuando cambian las órdenes enfocadas, y
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
  }, [enabled, destinationSignature, riderLat, riderLng]);

  // `ready` se resetea al desactivar para que, al remontar `MapView`,
  // `onMapReady` vuelva a disparar el encuadre de cámara de abajo.
  useEffect(() => {
    if (!enabled) setReady(false);
  }, [enabled]);

  // Encuadrar la cámara sobre el rider y, por cada orden enfocada, únicamente
  // su destino de etapa actual (no tienda+cliente de cada una): con 1 orden
  // encuadra [rider, destino]; con 2, [rider, destinoA, destinoB]. Mientras el
  // seguimiento está activo, este efecto se desactiva por completo — el
  // efecto de seguimiento de más abajo es el único dueño de la cámara, para
  // que no se pisen entre sí.
  useEffect(() => {
    if (!ready || followEnabled) return;
    const map = mapRef.current;
    if (!map) return;

    const points: LatLng[] = [];
    if (riderCoord) points.push(riderCoord);
    for (const order of focusedOrders) {
      const dest = destinationCoord(order);
      if (dest) points.push(dest);
    }

    if (points.length === 0) return;
    if (points.length === 1) {
      map.animateToRegion({ ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
    } else {
      map.fitToCoordinates(points, {
        edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
        animated: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, followEnabled, riderLat, riderLng, destinationSignature]);

  // Modo seguimiento: mientras esté activo, la cámara queda bloqueada sobre
  // la posición en vivo del rider con un zoom cercano fijo.
  useEffect(() => {
    if (!followEnabled || !liveRiderCoord) return;
    const map = mapRef.current;
    if (!map) return;
    map.animateToRegion(
      {
        ...liveRiderCoord,
        latitudeDelta: FOLLOW_ZOOM_DELTA,
        longitudeDelta: FOLLOW_ZOOM_DELTA,
      },
      500,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followEnabled, liveRiderCoord?.latitude, liveRiderCoord?.longitude]);

  // Detección de tap (abre pantalla completa) vs. pan/zoom (gesto normal del
  // mapa): se mide en el `View` que envuelve el `MapView`, no en el `MapView`
  // ni con `Pressable`, para no interferir con su gesture handler nativo.
  function handleTouchStart(event: GestureResponderEvent) {
    const { pageX, pageY } = event.nativeEvent;
    touchStartRef.current = { x: pageX, y: pageY, time: Date.now() };
  }

  function handleTouchEnd(event: GestureResponderEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const { pageX, pageY } = event.nativeEvent;
    const elapsed = Date.now() - start.time;
    const distance = Math.hypot(pageX - start.x, pageY - start.y);
    if (elapsed <= TAP_MAX_DURATION_MS && distance <= TAP_MAX_MOVEMENT_PX) {
      onRequestFullscreen();
    }
  }

  return (
    <View className="flex-1 p-3">
      <View className="flex-1 overflow-hidden rounded-2xl border border-borde-suave bg-fondo">
        {!enabled ? (
          <MapDisabledPlaceholder />
        ) : riderStatus === "loading" ? (
          <MapSkeleton style={FILL} />
        ) : (
          <View
            style={FILL}
            testID="map-touch-zone"
            onTouchStart={!isFullscreen ? handleTouchStart : undefined}
            onTouchEnd={!isFullscreen ? handleTouchEnd : undefined}
          >
            <MapView
              ref={mapRef}
              testID="map-view"
              style={FILL}
              initialRegion={region ?? FALLBACK_REGION}
              onMapReady={() => setReady(true)}
              onPanDrag={() => {
                if (followEnabled) setFollowEnabled(false);
              }}
              showsMyLocationButton={false}
              showsCompass={false}
              showsPointsOfInterest={false}
              toolbarEnabled={false}
            >
              {/* Marcador del rider (●) — solo con permiso concedido. Usa la
                  posición en vivo mientras el seguimiento está activo. */}
              {effectiveRiderCoord && (
                <Marker
                  testID="marker-rider"
                  coordinate={effectiveRiderCoord}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={tracks}
                >
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-marca/20">
                    <View className="h-3.5 w-3.5 rounded-full border-2 border-white bg-marca" />
                  </View>
                </Marker>
              )}

              {focusedOrders.map((order) => {
                const shopCoord = partyCoord(order.shop);
                const customerCoord = partyCoord(order.customer);
                const stageInfo = getRouteStageInfo(order.status);
                const destCoord = destinationCoord(order);
                const isSecondary = hasSecondaryOrder && order.id !== primaryOrderId;
                const strokeColor = stageInfo
                  ? isSecondary
                    ? lightenColor(stageInfo.strokeColor, SECONDARY_ROUTE_LIGHTEN_RATIO)
                    : stageInfo.strokeColor
                  : undefined;

                return (
                  <Fragment key={order.id}>
                    {/* Restaurante — opacidad reducida cuando la etapa actual va hacia el cliente.
                        La opacidad se aplica al `View` hijo, NO al prop `opacity` del
                        `Marker`: combinar `opacity` nativo + ícono custom es un bug
                        conocido de react-native-maps en Android — el marcador deja de
                        dibujarse por completo en vez de solo atenuarse. */}
                    {shopCoord && (
                      <Marker
                        testID={`marker-shop-${order.id}`}
                        coordinate={shopCoord}
                        title={order.shop.name}
                        description={order.shop.address}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={tracks}
                      >
                        <View
                          testID={`pin-shop-${order.id}`}
                          style={{ opacity: stageInfo?.shopOpacity ?? 1 }}
                        >
                          <Image
                            source={require("@/assets/shop-location.png")}
                            style={{ width: PIN_SIZE, height: PIN_SIZE }}
                            resizeMode="contain"
                          />
                        </View>
                      </Marker>
                    )}

                    {/* Cliente — opacidad reducida cuando la etapa actual va hacia la tienda */}
                    {customerCoord && (
                      <Marker
                        testID={`marker-customer-${order.id}`}
                        coordinate={customerCoord}
                        title={order.customer.name || "Cliente"}
                        description={order.customer.address}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={tracks}
                      >
                        <View
                          testID={`pin-customer-${order.id}`}
                          style={{ opacity: stageInfo?.customerOpacity ?? 1 }}
                        >
                          <Image
                            source={require("@/assets/user-location.png")}
                            style={{ width: PIN_SIZE, height: PIN_SIZE }}
                            resizeMode="contain"
                          />
                        </View>
                      </Marker>
                    )}

                    {/* Ruta hacia el destino de la etapa actual (tienda o cliente).
                        Directions API no tiene modo moto fuera de India (`two_wheeler`
                        está restringido a ese país) — DRIVING es la aproximación más
                        segura: sigue calles reales y respeta sentidos únicos. Cuando hay
                        2 órdenes simultáneas, la no prioritaria traza con una variante
                        más clara del mismo color base (nunca cambia de bucket ámbar/azul). */}
                    {stageInfo && riderCoord && destCoord && strokeColor && (
                      <MapViewDirections
                        testID={`route-${order.id}`}
                        origin={riderCoord}
                        destination={destCoord}
                        apikey={GOOGLE_MAPS_API_KEY}
                        mode="DRIVING"
                        strokeWidth={4}
                        strokeColor={strokeColor}
                        // La librería ya loguea el error por su cuenta; este handler solo
                        // documenta que el fallo se contiene acá y no rompe el resto del
                        // mapa (pines y demás siguen intactos sin la línea de ruta).
                        onError={(errorMessage: string) =>
                          console.warn("[OrdersMap] No se pudo trazar la ruta:", errorMessage)
                        }
                      />
                    )}
                  </Fragment>
                );
              })}
            </MapView>
          </View>
        )}

        {/* Etiqueta de tap (mapa reducido) o control de cerrar (pantalla completa) */}
        {enabled &&
          (isFullscreen ? (
            <Pressable
              testID="close-fullscreen-button"
              onPress={onRequestClose}
              className="absolute left-2.5 top-2.5 rounded-md bg-superficie/85 px-3 py-1.5"
            >
              <Text className="font-mono text-[12px] tracking-[1px] text-texto-suave">
                ✕ Cerrar
              </Text>
            </Pressable>
          ) : (
            <View
              className="absolute left-2.5 top-2.5 rounded-md bg-superficie/85 px-2 py-1"
              pointerEvents="none"
            >
              <Text className="font-mono text-[9px] tracking-[1.2px] text-texto-suave">
                TOCA PARA VER EN PANTALLA COMPLETA
              </Text>
            </View>
          ))}

        {/* Botón de seguimiento — disponible en ambos tamaños, solo con GPS concedido.
            Abajo a la derecha (no arriba) para no chocar con la etiqueta de tap /
            el botón de cerrar, que viven arriba a la izquierda. */}
        {enabled && riderStatus === "granted" && (
          <Pressable
            testID="follow-toggle-button"
            onPress={() => setFollowEnabled(!followEnabled)}
            className={`absolute bottom-2.5 right-2.5 rounded-md ${
              isFullscreen ? "px-[13px] py-[7px]" : "px-3 py-1.5"
            } ${followEnabled ? "bg-marca" : "bg-superficie/85"}`}
          >
            <Text
              className={`font-mono font-heading-bold tracking-[1px] ${
                isFullscreen ? "text-[11px]" : "text-[10px]"
              } ${followEnabled ? "text-white" : "text-texto"}`}
            >
              {followEnabled ? "Siguiendo…" : "Hacer seguimiento"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
