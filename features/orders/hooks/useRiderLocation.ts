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
 */
export function useRiderLocation(): RiderLocation {
  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<LocationStatus>("loading");

  useEffect(() => {
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
  }, []);

  return { region, status };
}
