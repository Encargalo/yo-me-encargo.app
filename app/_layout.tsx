import "../global.css";

import { router, Stack } from "expo-router";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { setUnauthorizedHandler } from "@/lib/axios";

setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
  router.replace(ROUTES.AUTH.LOGIN);
});

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
