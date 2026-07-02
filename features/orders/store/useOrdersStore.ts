import { create } from "zustand";

import type { ActiveOrder } from "../types/order.types";
import { isVisibleStatus } from "../types/order.types";

// Contador monotónico para registrar cuándo cambió de estado cada orden
// (usado por el ordenamiento por recencia en sortActiveOrders).
let statusSeq = 0;

interface OrdersState {
  activeOrders: ActiveOrder[];
  statusChangedAt: Record<string, number>;
  isConnected: boolean;
  isConnecting: boolean;
  // Disponibilidad del rider para recibir NUEVAS órdenes. Es ortogonal a la
  // conexión: el WS sigue abierto aunque el rider esté "No disponible".
  isAvailable: boolean;
}

interface OrdersActions {
  // Inserta o actualiza una orden por id. Si su estado es terminal, la elimina.
  upsertOrder: (order: ActiveOrder) => void;
  removeOrder: (id: string) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setAvailable: (available: boolean) => void;
  reset: () => void;
}

function withoutKey(
  map: Record<string, number>,
  key: string,
): Record<string, number> {
  const { [key]: _removed, ...rest } = map;
  return rest;
}

export const useOrdersStore = create<OrdersState & OrdersActions>((set) => ({
  activeOrders: [],
  statusChangedAt: {},
  isConnected: false,
  isConnecting: false,
  isAvailable: true,

  upsertOrder: (order) =>
    set((state) => {
      // Estado terminal → la orden sale de la lista
      if (!isVisibleStatus(order.status)) {
        return {
          activeOrders: state.activeOrders.filter((o) => o.id !== order.id),
          statusChangedAt: withoutKey(state.statusChangedAt, order.id),
        };
      }

      const idx = state.activeOrders.findIndex((o) => o.id === order.id);
      const prev = idx === -1 ? undefined : state.activeOrders[idx];
      const statusChanged = !prev || prev.status !== order.status;

      const statusChangedAt = statusChanged
        ? { ...state.statusChangedAt, [order.id]: ++statusSeq }
        : state.statusChangedAt;

      let activeOrders: ActiveOrder[];
      if (idx === -1) {
        activeOrders = [...state.activeOrders, order];
      } else {
        activeOrders = [...state.activeOrders];
        activeOrders[idx] = order;
      }

      return { activeOrders, statusChangedAt };
    }),

  removeOrder: (id) =>
    set((state) => ({
      activeOrders: state.activeOrders.filter((o) => o.id !== id),
      statusChangedAt: withoutKey(state.statusChangedAt, id),
    })),

  setConnected: (connected) => set({ isConnected: connected }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setAvailable: (available) => set({ isAvailable: available }),

  // No resetea isAvailable: es preferencia del rider, no estado de conexión.
  reset: () =>
    set({
      activeOrders: [],
      statusChangedAt: {},
      isConnected: false,
      isConnecting: false,
    }),
}));
