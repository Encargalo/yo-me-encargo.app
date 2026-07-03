import * as Location from "expo-location";
import { useEffect, useState } from "react";
import type { Region } from "react-native-maps";

export type LocationStatus = "loading" | "granted" | "denied" | "error";

export interface RiderLocation {
  region: Region | null;
  status: LocationStatus;
}

// Región por defecto (Bogotá) para cuando aún no hay posición del rider.
const DEFAULT_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

/**
 * Pide el permiso de ubicación en primer plano y obtiene la posición inicial del
 * rider. Degrada con gracia: si el rider niega el permiso, `region` queda en null
 * y `status` en "denied" — la pantalla debe seguir siendo usable sin el marcador.
 *
 * `enabled` (default `true`) permite no solicitar permiso/GPS cuando el mapa que
 * consume esta posición está desactivado (rider no disponible o sin órdenes) —
 * ver `rider-orders-home`. Al volver a `true`, se vuelve a pedir la posición.
 */
export function useRiderLocation(enabled: boolean = true): RiderLocation {
  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<LocationStatus>("loading");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function resolve() {
      try {
        const { status: perm } =
          await Location.requestForegroundPermissionsAsync();
        if (perm !== "granted") {
          if (!cancelled) setStatus("denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          ...DEFAULT_DELTA,
        });
        setStatus("granted");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { region, status };
}
