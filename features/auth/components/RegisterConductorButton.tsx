import { ArrowRight } from "encargalo-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FontFamilies, Gradient, NeonAccent } from "@/constants/theme";

interface RegisterConductorButtonProps {
  onPress: () => void;
  rightIcon?: ReactNode;
}

const BORDER_WIDTH = 2;
const SPIN_SIZE = 520;
const SPIN_DURATION_MS = 2600;

export function RegisterConductorButton({ onPress, rightIcon }: RegisterConductorButtonProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: SPIN_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.border}>
      <Animated.View pointerEvents="none" style={[styles.spinWrap, { transform: [{ rotate }] }]}>
        <LinearGradient
          colors={[NeonAccent.coral, NeonAccent.violet, NeonAccent.coral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.spinGradient}
        />
      </Animated.View>

      <Pressable onPress={onPress} style={styles.inner}>
        <LinearGradient
          colors={Gradient.colors}
          locations={Gradient.locations}
          start={Gradient.start}
          end={Gradient.end}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.innerContent}>
          <View style={styles.illustrationBg}>
            <Image
              source={require("@/assets/images/auth/illustration-registro-conductor.png")}
              resizeMode="contain"
              style={styles.illustration}
            />
          </View>
          <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
            Registrarme como conductor
          </Text>
          {rightIcon ?? <ArrowRight size={20} color={Colors.superficie} />}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    width: "100%",
    height: 49,
    borderRadius: 25,
    padding: BORDER_WIDTH,
    overflow: "hidden",
    backgroundColor: Colors.marca,
  },
  spinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: SPIN_SIZE,
    height: SPIN_SIZE,
    marginTop: -SPIN_SIZE / 2,
    marginLeft: -SPIN_SIZE / 2,
  },
  spinGradient: {
    width: SPIN_SIZE,
    height: SPIN_SIZE,
  },
  inner: {
    flex: 1,
    borderRadius: 25 - BORDER_WIDTH,
    overflow: "hidden",
    backgroundColor: Colors.marca,
  },
  innerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  illustrationBg: {
    backgroundColor: Colors.marca,
    borderRadius: 17,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: 44,
    height: 30,
  },
  label: {
    flex: 1,
    marginHorizontal: 6,
    textAlign: "center",
    color: Colors.superficie,
    fontFamily: FontFamilies.headingSemiBold,
    fontSize: 13,
    textTransform: "uppercase",
  },
});
