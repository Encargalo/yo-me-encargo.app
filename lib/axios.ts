import axios, { AxiosError } from "axios";

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let onUnauthorized: (() => void) | null = null;

// Registrado desde app/_layout.tsx — evita un require cycle entre
// lib/axios.ts y features/auth/store/useAuthStore.ts (que a su vez
// llama al servicio que usa este cliente).
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
