import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModeCard } from "@/components/ModeCard";
import { Gradient, Radius } from "@/constants/theme";
import { ROUTES } from "@/constants/routes";

export default function SelectMode() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={Gradient.colors}
      locations={Gradient.locations}
      start={Gradient.start}
      end={Gradient.end}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: insets.top + 23 }} className="px-[17px]">
        <Image
          source={require("@/assets/images/mode-select/logo-reverse.png")}
          resizeMode="contain"
          style={{ width: 134, height: 39 }}
        />
        <View className="mt-[10px] gap-[10px]">
          <Text className="font-heading-bold text-[20px] text-white">¿Qué modo deseas usar?</Text>
          <Text className="font-subtitle text-[14px] text-white">
            Puedes cambiar de un modo a otro siempre que quieras
          </Text>
        </View>
      </View>

      <View
        className="mt-[26px] flex-1 gap-[26px] bg-superficie px-[17px] pt-[23px]"
        style={{ borderTopLeftRadius: Radius.lg - 1, borderTopRightRadius: Radius.lg - 1 }}
      >
        <ModeCard
          illustration={require("@/assets/images/mode-select/illustration-pasajero.png")}
          title="Pasajero"
          description="Pide una moto o un carro"
          onPress={() => router.push(ROUTES.AUTH.PASSENGER_SOON)}
        />
        <ModeCard
          illustration={require("@/assets/images/mode-select/illustration-conductor.png")}
          title="Conductor"
          description="Aplica para hacer conductor aqui"
          onPress={() => router.push(ROUTES.AUTH.LOGIN)}
        />
      </View>
    </LinearGradient>
  );
}
