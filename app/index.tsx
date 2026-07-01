import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    router.replace(isAuthenticated ? ROUTES.APP.HOME : ROUTES.AUTH.LOGIN);
  }, [isHydrated, isAuthenticated]);

  return <View className="flex-1 bg-white" />;
}
