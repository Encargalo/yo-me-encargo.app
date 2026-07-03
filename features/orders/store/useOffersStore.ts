import { create } from "zustand";

import type { ActiveOrder } from "../types/order.types";

// ── Constantes del flujo de ofertas ───────────────────────────────────────────
// Segundos del temporizador regresivo de cada oferta (decisión del lado app).
export const OFFER_TIMEOUT_SECONDS = 15;
// Rechazos EXPLÍCITOS consecutivos que activan la suspensión de overlays.
export const REJECT_STREAK_LIMIT = 10;
// Duración de la suspensión por fatiga de rechazos.
export const SUSPENSION_MS = 5 * 60 * 1000;

// Motivo por el que el rider resuelve la oferta VISIBLE (queue[0]).
// - accept: pulsó Aceptar → reinicia la racha de rechazos.
// - reject: pulsó Rechazar → suma a la racha (puede activar la suspensión).
// - expire: el temporizador llegó a 0 → rechazo implícito, NO suma a la racha.
export type ResolveReason = "accept" | "reject" | "expire";

interface OffersState {
  // Cola FIFO de ofertas pendientes. La visible es siempre queue[0].
  queue: ActiveOrder[];
  // Ids ya decididos (aceptados, rechazados, expirados o tomados por otro) para
  // evitar re-abrir ofertas cuando el backend re-emite la ráfaga al reconectar.
  decidedIds: Record<string, true>;
  // Rechazos explícitos consecutivos.
  rejectStreak: number;
  // Epoch ms hasta el que los overlays están suspendidos; null = sin suspensión.
  suspendedUntil: number | null;
}

interface OffersActions {
  // Encola una oferta si no fue decidida, no está ya en cola y no hay suspensión.
  enqueue: (order: ActiveOrder) => void;
  // Resuelve la oferta visible (queue[0]) por acción del rider o expiración.
  resolveCurrent: (reason: ResolveReason) => void;
  // Retira una oferta (en cualquier posición) que otro rider tomó. No toca la
  // racha. Si era la visible, la cola avanza sola al nuevo queue[0].
  dropFromQueue: (id: string) => void;
  // Marca un id como decidido (y lo saca de la cola si estaba), para que nunca
  // se vuelva a ofrecer. Usado cuando la orden ya es mía (ya la acepté).
  markDecided: (id: string) => void;
  // Levanta la suspensión y reinicia la racha (vencimiento por tiempo o foreground).
  clearSuspension: () => void;
  reset: () => void;
}

export function isSuspended(state: OffersState, now = Date.now()): boolean {
  return state.suspendedUntil !== null && now < state.suspendedUntil;
}

const initialState: OffersState = {
  queue: [],
  decidedIds: {},
  rejectStreak: 0,
  suspendedUntil: null,
};

export const useOffersStore = create<OffersState & OffersActions>(
  (set, get) => ({
    ...initialState,

    enqueue: (order) => {
      if (!order.id) return;
      const state = get();
      if (isSuspended(state)) return; // en suspensión: se ignoran nuevas ofertas
      if (state.decidedIds[order.id]) return; // ya decidida (dedupe)
      if (state.queue.some((o) => o.id === order.id)) return; // ya en cola

      set({ queue: [...state.queue, order] });
    },

    resolveCurrent: (reason) =>
      set((state) => {
        const current = state.queue[0];
        if (!current) return state;

        const queue = state.queue.slice(1);
        const decidedIds = { ...state.decidedIds, [current.id]: true as const };

        if (reason === "accept") {
          return { queue, decidedIds, rejectStreak: 0, suspendedUntil: null };
        }
        if (reason === "reject") {
          const rejectStreak = state.rejectStreak + 1;
          const suspendedUntil =
            rejectStreak >= REJECT_STREAK_LIMIT
              ? Date.now() + SUSPENSION_MS
              : state.suspendedUntil;
          return { queue, decidedIds, rejectStreak, suspendedUntil };
        }
        // expire: rechazo implícito, no afecta la racha.
        return { queue, decidedIds };
      }),

    dropFromQueue: (id) =>
      set((state) => {
        if (!state.queue.some((o) => o.id === id)) return state;
        return {
          queue: state.queue.filter((o) => o.id !== id),
          decidedIds: { ...state.decidedIds, [id]: true as const },
        };
      }),

    markDecided: (id) =>
      set((state) => ({
        queue: state.queue.filter((o) => o.id !== id),
        decidedIds: { ...state.decidedIds, [id]: true as const },
      })),

    clearSuspension: () => set({ suspendedUntil: null, rejectStreak: 0 }),

    reset: () => set({ ...initialState }),
  }),
);
