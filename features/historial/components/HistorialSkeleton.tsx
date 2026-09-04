import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

interface HistorialSkeletonProps {
  rows?: number;
  // Texto explicativo arriba del skeleton — usado cuando la carga es distinta
  // a "página siguiente" (ej. traer el historial completo para un filtro).
  label?: string;
}

// Mismo patrón de pulso (Animated nativo, sin reanimated) que
// `features/balance/components/BalanceSkeleton.tsx`.
export function HistorialSkeleton({ rows = 5, label }: HistorialSkeletonProps) {
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

  return (
    <View>
      {label ? (
        <Text className="mb-2 text-[12.5px] font-heading-semibold text-texto-suave">{label}</Text>
      ) : null}
      <Animated.View
        style={{ opacity }}
        testID="historial-skeleton"
        className="overflow-hidden rounded-[14px]"
      >
        {Array.from({ length: rows }).map((_, index) => (
          <View
            key={index}
            className={`h-[52px] bg-borde-suave ${index === rows - 1 ? "" : "border-b border-borde-suave"}`}
          />
        ))}
      </Animated.View>
    </View>
  );
}
