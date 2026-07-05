import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface HistorialSkeletonProps {
  rows?: number;
}

// Mismo patrón de pulso (Animated nativo, sin reanimated) que
// `features/balance/components/BalanceSkeleton.tsx`.
export function HistorialSkeleton({ rows = 5 }: HistorialSkeletonProps) {
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
    <Animated.View
      style={{ opacity }}
      testID="historial-skeleton"
      className="overflow-hidden rounded-[14px]"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          className={`h-[52px] bg-hair ${
            index === rows - 1 ? "" : "border-b border-canvas"
          }`}
        />
      ))}
    </Animated.View>
  );
}
