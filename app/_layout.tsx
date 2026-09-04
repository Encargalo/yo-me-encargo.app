import "../global.css";

import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { setUnauthorizedHandler } from "@/lib/axios";

setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
  router.replace(ROUTES.AUTH.LOGIN_PHONE);
});

// El splash se mantiene visible hasta que las fuentes del System Design están
// listas, para que el primer frame no se pinte con la tipografía del sistema y
// se reemplace después. Las claves son los nombres que consumen los tokens de
// `FontFamilies` y son idénticas en Android e iOS.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "PlusJakartaSans-Regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "PlusJakartaSans-SemiBold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "PlusJakartaSans-Bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Inter-Regular": require("@/assets/fonts/Inter-Regular.ttf"),
    "Manrope-Medium": require("@/assets/fonts/Manrope-Medium.ttf"),
  });

  // Si la carga falla, la app arranca igualmente con la tipografía del sistema
  // en vez de quedar bloqueada en el splash.
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
