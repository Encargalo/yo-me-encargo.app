import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

// Mismo patrón de pulso que features/orders/components/MapSkeleton.tsx
// (Animated nativo, sin reanimated) sobre bloques que replican el layout real:
// card hero + 3 filas de movimiento.
export function BalanceSkeleton() {
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
    <Animated.View style={{ opacity }} testID="balance-skeleton">
      <View className="h-[170px] rounded-[18px] bg-hair" />
      <View className="mt-3.5 h-4 w-32 rounded-full bg-hair" />
      <View className="mt-2.5 overflow-hidden rounded-[14px]">
        <View className="h-[52px] border-b border-canvas bg-hair" />
        <View className="h-[52px] border-b border-canvas bg-hair" />
        <View className="h-[52px] bg-hair" />
      </View>
    </Animated.View>
  );
}
