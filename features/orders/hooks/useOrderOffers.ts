import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import {
  acceptOrder,
  rejectOrder,
} from "../services/ordersRiderWsService";
import {
  isSuspended,
  OFFER_TIMEOUT_SECONDS,
  useOffersStore,
} from "../store/useOffersStore";
import type { ActiveOrder } from "../types/order.types";
import { haversineKm } from "../utils/haversine";
import { useRiderLocation } from "./useRiderLocation";

export interface UseOrderOffersReturn {
  offer: ActiveOrder | undefined; // oferta visible (undefined = nada que mostrar)
  secondsLeft: number;
  distanceKm: number | undefined; // rider → cliente
  accept: () => void;
  reject: () => void;
}

/**
 * Orquesta el overlay de ofertas: expone la oferta visible (queue[0]) con su
 * temporizador regresivo, resuelve por expiración, envía aceptar/rechazar por el
 * WS y levanta la suspensión por fatiga cuando vence o la app vuelve a primer
 * plano. Se usa una sola vez, en el modal global.
 */
export function useOrderOffers(): UseOrderOffersReturn {
  const queue = useOffersStore((s) => s.queue);
  const suspendedUntil = useOffersStore((s) => s.suspendedUntil);
  const resolveCurrent = useOffersStore((s) => s.resolveCurrent);
  const clearSuspension = useOffersStore((s) => s.clearSuspension);

  // En suspensión no se muestra ninguna oferta, aunque la cola tenga elementos.
  const suspended = isSuspended({
    queue,
    suspendedUntil,
    decidedIds: {},
    rejectStreak: 0,
  });
  const offer = suspended ? undefined : queue[0];
  const offerId = offer?.id;

  const { region } = useRiderLocation();
  const [secondsLeft, setSecondsLeft] = useState(OFFER_TIMEOUT_SECONDS);

  // Temporizador regresivo, reiniciado por cada oferta visible.
  useEffect(() => {
    if (!offerId) return;
    setSecondsLeft(OFFER_TIMEOUT_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [offerId]);

  // Al llegar a 0 → rechazo implícito (no suma a la racha). Separado del updater
  // del contador para no disparar un set del store durante el render.
  useEffect(() => {
    if (offerId && secondsLeft === 0) {
      resolveCurrent("expire");
    }
  }, [offerId, secondsLeft, resolveCurrent]);

  // Levantar la suspensión al vencer su plazo (5 min).
  useEffect(() => {
    if (suspendedUntil === null) return;
    const ms = suspendedUntil - Date.now();
    if (ms <= 0) {
      clearSuspension();
      return;
    }
    const timer = setTimeout(clearSuspension, ms);
    return () => clearTimeout(timer);
  }, [suspendedUntil, clearSuspension]);

  // Levantar la suspensión cuando el rider vuelve a poner la app en primer plano.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && useOffersStore.getState().suspendedUntil !== null) {
        clearSuspension();
      }
    });
    return () => sub.remove();
  }, [clearSuspension]);

  const distanceKm = useMemo(() => {
    const lat = offer?.customer.latitude;
    const lng = offer?.customer.longitude;
    if (!region || lat == null || lng == null) return undefined;
    return haversineKm(region, { latitude: lat, longitude: lng });
  }, [region, offer]);

  const accept = useCallback(() => {
    if (!offerId) return;
    acceptOrder(offerId);
    resolveCurrent("accept");
  }, [offerId, resolveCurrent]);

  const reject = useCallback(() => {
    if (!offerId) return;
    rejectOrder(offerId);
    resolveCurrent("reject");
  }, [offerId, resolveCurrent]);

  return { offer, secondsLeft, distanceKm, accept, reject };
}
