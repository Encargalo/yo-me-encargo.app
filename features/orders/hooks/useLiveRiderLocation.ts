import * as Location from "expo-location";
import { useEffect, useState } from "react";

import type { LatLng } from "../utils/routeStage";

// timeInterval/distanceInterval moderados: suficiente fluidez para el modo
// "Hacer seguimiento" sin drenar batería como un tracking sin límites.
const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: 2000,
  distanceInterval: 10,
};

/**
 * Posición del rider en vivo (`watchPositionAsync`), activa únicamente
 * mientras `enabled` es `true` — usada por el botón "Hacer seguimiento" del
 * mapa. A diferencia de `useRiderLocation` (lectura única, sigue siendo la
 * fuente de posición para el encuadre de rutas), esta se actualiza de forma
 * continua; por eso queda gateada detrás de un botón explícito en vez de
 * correr siempre de fondo.
 */
export function useLiveRiderLocation(enabled: boolean): LatLng | null {
  const [coord, setCoord] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCoord(null);
      return;
    }

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    Location.watchPositionAsync(WATCH_OPTIONS, (location) => {
      if (cancelled) return;
      setCoord({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }).then((sub) => {
      if (cancelled) {
        sub.remove();
        return;
      }
      subscription = sub;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return coord;
}
