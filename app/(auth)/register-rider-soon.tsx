import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Gradient } from "@/constants/theme";

export default function RegisterRiderSoon() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={Gradient.colors}
      locations={Gradient.locations}
      start={Gradient.start}
      end={Gradient.end}
      style={{ flex: 1 }}
    >
      <View
        style={{ paddingTop: insets.top + 23 }}
        className="flex-1 items-center justify-center gap-3 px-6"
      >
        <Text className="text-center font-heading-bold text-[20px] text-white">
          Registro de conductor próximamente
        </Text>
        <Text className="text-center font-subtitle text-[14px] text-white">
          Todavía estamos construyendo la postulación para nuevos conductores. Por ahora, solo
          puedes iniciar sesión si ya tienes una cuenta.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6">
          <Text className="font-heading-semibold text-[14px] text-white underline">Volver</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
