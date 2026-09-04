import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

interface MapSkeletonProps {
  style?: StyleProp<ViewStyle>;
}

// Skeleton de carga del mapa: un bloque que late suavemente. Usa el Animated
// nativo de React Native (sin reanimated, que no está configurado en babel).
export function MapSkeleton({ style }: MapSkeletonProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View className="flex-1 bg-borde-suave" style={[{ opacity }, style]} />;
}
