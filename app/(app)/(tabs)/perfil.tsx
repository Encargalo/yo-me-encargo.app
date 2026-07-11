import { router } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

// Placeholder — el contenido real de Perfil llega en su propio change de OpenSpec.
// El botón de cerrar sesión se adelanta para permitir probar el flujo de login.
export default function Perfil() {
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    router.replace(ROUTES.AUTH.LOGIN);
  }

  return (
    <View className="flex-1 items-center justify-center gap-8 bg-white px-6">
      <Text className="text-primary text-xl font-bold">Perfil · Próximamente</Text>
      <Button label="Cerrar sesión" onPress={handleLogout} />
    </View>
  );
}
