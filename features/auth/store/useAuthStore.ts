import type { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { signInRider } from "../services/auth.service";
import type { AuthApiError } from "../types/auth.types";

const SESSION_STORAGE_KEY = "rider_session";

interface StoredSession {
  hasSession: boolean;
  phoneNumber: string;
}

interface AuthState {
  isAuthenticated: boolean;
  phoneNumber: string | null;
  isLoading: boolean;
  error: AuthApiError | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

function mapAuthError(error: AxiosError): AuthApiError {
  if (!error.response) {
    return {
      code: "network",
      message: "Sin conexión. Verifica tu internet.",
    };
  }

  switch (error.response.status) {
    case 422:
      return { code: 422, message: "Credenciales incorrectas" };
    case 400:
      return { code: 400, message: "Revisa los datos ingresados" };
    default:
      return { code: 500, message: "Ocurrió un error, intenta de nuevo" };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  phoneNumber: null,
  isLoading: false,
  error: null,
  isHydrated: false,

  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

    if (!raw) {
      set({ isHydrated: true });
      return;
    }

    const session = JSON.parse(raw) as StoredSession;
    set({
      isAuthenticated: session.hasSession,
      phoneNumber: session.phoneNumber,
      isHydrated: true,
    });
  },

  login: async (phoneNumber, password) => {
    set({ isLoading: true, error: null });

    try {
      await signInRider({ phone_number: phoneNumber, password });
      await SecureStore.setItemAsync(
        SESSION_STORAGE_KEY,
        JSON.stringify({ hasSession: true, phoneNumber } satisfies StoredSession),
      );
      set({
        isAuthenticated: true,
        phoneNumber,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({ isLoading: false, error: mapAuthError(err as AxiosError) });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    set({ isAuthenticated: false, phoneNumber: null, error: null });
  },
}));
