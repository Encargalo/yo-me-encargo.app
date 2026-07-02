import { useEffect, useMemo } from "react";

import { useAuthStore } from "@/features/auth/store/useAuthStore";

import { subscribeToRiderOrders } from "../services/ordersRiderWsService";
import { useOrdersStore } from "../store/useOrdersStore";
import type { ActiveOrder } from "../types/order.types";
import { sortActiveOrders } from "../utils/sortActiveOrders";

export interface UseRiderOrdersReturn {
  orders: ActiveOrder[];
  isConnecting: boolean;
  isConnected: boolean;
}

/**
 * Conecta al WebSocket de órdenes del rider mientras el componente está montado
 * y expone las órdenes activas ya ordenadas. La conexión es un singleton
 * compartido, así que varios consumidores no abren múltiples sockets.
 */
export function useRiderOrders(): UseRiderOrdersReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeOrders = useOrdersStore((s) => s.activeOrders);
  const statusChangedAt = useOrdersStore((s) => s.statusChangedAt);
  const isConnecting = useOrdersStore((s) => s.isConnecting);
  const isConnected = useOrdersStore((s) => s.isConnected);

  const orders = useMemo(
    () => sortActiveOrders(activeOrders, statusChangedAt),
    [activeOrders, statusChangedAt],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = subscribeToRiderOrders();
    return unsubscribe;
  }, [isAuthenticated]);

  return { orders, isConnecting, isConnected };
}
