import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Neutrals } from "@/constants/theme";

// Stub de Solicitud de retiro (wireframe 07 / POST /riders/withdrawal): la
// pantalla real es un change de OpenSpec aparte — ver design.md del change
// `balance-screen`, Decisión 6. Existe para que el CTA de Balance tenga un
// destino real en vez de quedar deshabilitado.
export default function Withdrawal() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-canvas"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center gap-2 border-b border-hair px-2 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={20} color={Neutrals.ink} />
        </Pressable>
        <Text className="text-[15px] font-semibold text-ink">
          Solicitar retiro
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-[15px] font-semibold text-body">
          Solicitud de retiro · Próximamente
        </Text>
      </View>
    </View>
  );
}
