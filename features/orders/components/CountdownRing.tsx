import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Colors, FontFamilies, OrderStatusColors } from "@/constants/theme";

interface CountdownRingProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: number;
}

// Aro circular regresivo: el arco ámbar restante se consume a gris a medida que
// baja el tiempo. Ámbar = estado "recogida pendiente" (OrderStatusColors.pending).
export function CountdownRing({ secondsLeft, totalSeconds, size = 54 }: CountdownRingProps) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  const offset = circumference * (1 - progress);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={Colors.borde}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={OrderStatusColors.pending}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{ fontFamily: FontFamilies.headingBold, fontSize: 18, color: Colors.texto }}>
        {secondsLeft}
      </Text>
    </View>
  );
}
