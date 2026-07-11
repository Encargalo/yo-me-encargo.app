import type { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { confirmDelivery as confirmDeliveryRequest } from "../services/orders.service";
import { acceptOrder } from "../services/ordersRiderWsService";
import { useOrdersStore } from "../store/useOrdersStore";
import type { ActiveOrder } from "../types/order.types";
import { haversineKm } from "../utils/haversine";
import { useRiderLocation } from "./useRiderLocation";

// Estado visual derivado directamente de la orden (más un puñado de banderas
// locales) — ver design.md del change `order-detail`, Decisión 1.
export type OrderDetailStage =
  | "not-found" // id no está en las órdenes recibidas por el WS
  | "taken" // riderId asignado a otro rider, nunca la acepté yo
  | "offer" // sin riderId, todavía puedo aceptarla
  | "pending-pickup" // mía, esperando que el negocio valide el código
  | "on-the-way" // mía, en camino — falta el OTP del cliente
  | "completed"; // confirmé la entrega (200), mostrando el resumen

const DELIVERY_ERROR_MESSAGES: Record<number, string> = {
  400: "Código inválido",
  404: "Pedido no encontrado",
  409: "Código ya utilizado",
  422: "Estado del pedido incorrecto",
};
const DEFAULT_DELIVERY_ERROR = "No se pudo confirmar la entrega";

export interface CompletedSummary {
  customerName?: string;
  distanceKm?: number;
  deliveryFee: number;
  orderNumber?: number;
  shopName?: string;
}

export interface UseOrderDetailReturn {
  stage: OrderDetailStage;
  order: ActiveOrder | undefined;
  accepting: boolean;
  accept: () => void;
  otpCode: string;
  setOtpCode: (code: string) => void;
  confirming: boolean;
  deliveryError: string | undefined;
  confirmDelivery: () => void;
  completedSummary: CompletedSummary | undefined;
}

/**
 * Orquesta la pantalla de Orden Activa: deriva qué bloque mostrar de la orden
 * ya presente en `useOrdersStore` (poblada por el WS), sin pedirla por HTTP
 * (no existe `GET /orders/{id}`). Ver design.md del change `order-detail`.
 */
export function useOrderDetail(id: string | undefined): UseOrderDetailReturn {
  const order = useOrdersStore((s) => s.activeOrders.find((o) => o.id === id));
  const { region } = useRiderLocation();

  // Capturado una sola vez al montar: si la orden YA tenía riderId cuando
  // entré a la pantalla, es mía (vengo de mi lista de Inicio), no una oferta
  // que alguien más tomó mientras yo miraba.
  const hadRiderIdOnMount = useRef(!!order?.riderId).current;
  const [acceptedLocally, setAcceptedLocally] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | undefined>();
  const [completedSummary, setCompletedSummary] = useState<CompletedSummary | undefined>();

  const isMine = !!order?.riderId && (hadRiderIdOnMount || acceptedLocally);
  const takenByOther = !!order?.riderId && !isMine;

  const stage: OrderDetailStage = useMemo(() => {
    if (completedSummary) return "completed";
    if (!order) return "not-found";
    if (takenByOther) return "taken";
    if (order.status === "On The Way") return "on-the-way";
    if (order.riderId) return "pending-pickup";
    return "offer";
  }, [order, takenByOther, completedSummary]);

  // Deja de "esperando confirmación" apenas la orden refleje un riderId.
  useEffect(() => {
    if (accepting && order?.riderId) {
      setAccepting(false);
    }
  }, [accepting, order?.riderId]);

  const accept = useCallback(() => {
    if (!id || accepting) return;
    setAcceptedLocally(true);
    setAccepting(true);
    acceptOrder(id);
  }, [id, accepting]);

  const confirmDelivery = useCallback(() => {
    if (!order || confirming) return;
    void (async () => {
      setConfirming(true);
      setDeliveryError(undefined);
      try {
        await confirmDeliveryRequest(order.id, otpCode);
        const { latitude, longitude } = order.customer;
        const distanceKm =
          region && latitude != null && longitude != null
            ? haversineKm(region, { latitude, longitude })
            : undefined;
        setCompletedSummary({
          customerName: order.customer.name,
          distanceKm,
          deliveryFee: order.deliveryFee,
          orderNumber: order.number,
          shopName: order.shop.name,
        });
      } catch (err) {
        const status = (err as AxiosError).response?.status;
        setDeliveryError(
          (status !== undefined && DELIVERY_ERROR_MESSAGES[status]) || DEFAULT_DELIVERY_ERROR,
        );
        if (status === 400) setOtpCode("");
      } finally {
        setConfirming(false);
      }
    })();
  }, [order, confirming, otpCode, region]);

  return {
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
  };
}
