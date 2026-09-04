import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Gradient, Radius } from "@/constants/theme";
import { withAlpha } from "@/utils/color";

interface RiderLoginHeaderProps {
  children: ReactNode;
}

const BADGE_OVERHANG = 36;

export function RiderLoginHeader({ children }: RiderLoginHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={Gradient.colors}
      locations={Gradient.locations}
      start={Gradient.start}
      end={Gradient.end}
      style={{ flex: 1 }}
    >
      <View style={{ paddingTop: insets.top + 23 }} className="gap-[10px] px-[17px] pb-[24px]">
        <Image
          source={require("@/assets/images/mode-select/logo-reverse.png")}
          resizeMode="contain"
          style={{ width: 134, height: 39 }}
        />
        <View className="gap-[6px]">
          <Text className="font-heading-bold text-[20px] text-white">Ingresa como conductor</Text>
          <Text className="font-subtitle text-[14px] text-white">
            O envía la solicitud para registrarte
          </Text>
        </View>
      </View>

      <View className="flex-1">
        <LinearGradient
          colors={[withAlpha(Colors.superficie, 0.4), withAlpha(Colors.superficie, 0.12)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.badge, { borderColor: withAlpha(Colors.superficie, 0.55) }]}
        >
          <Text className="font-heading-semibold text-[12px] tracking-wide text-white">
            MODO CONDUCTOR
          </Text>
        </LinearGradient>

        <View
          className="flex-1 bg-superficie px-[17px] pt-[32px]"
          style={{
            marginTop: BADGE_OVERHANG,
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
            paddingBottom: insets.bottom + 17,
          }}
        >
          {children}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 44,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderBottomWidth: 0,
  },
});
