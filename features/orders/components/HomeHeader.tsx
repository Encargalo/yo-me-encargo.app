import { router } from "expo-router";
import { Wallet } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { ROUTES } from "@/constants/routes";
import { Colors } from "@/constants/theme";

import { AvailabilityToggle } from "./AvailabilityToggle";

export function HomeHeader() {
  return (
    <View className="flex-row items-center justify-between border-b border-borde-suave bg-fondo px-4 py-3">
      <AvailabilityToggle />

      <Pressable
        onPress={() => router.push(ROUTES.APP.BALANCE)}
        className="flex-row items-center gap-1.5 rounded-[20px] border border-borde bg-superficie px-3 py-2"
        android_ripple={{ color: `${Colors.texto}0a` }}
        accessibilityLabel="Ver balance"
      >
        <Wallet size={16} color={Colors.texto} />
        <Text className="text-[13px] font-heading-semibold text-texto">Balance</Text>
      </Pressable>
    </View>
  );
}
