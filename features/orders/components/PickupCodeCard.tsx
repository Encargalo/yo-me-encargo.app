import { Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";

interface PickupCodeCardProps {
  code: string;
}

const PENDING = OrderStatusColors.pending;

/**
 * Código de recogida (wireframe 04): el rider lo MUESTRA en el negocio, no lo
 * ingresa. Tinte derivado de `OrderStatusColors.pending` (recogida pendiente),
 * nunca un hex nuevo desconectado del sistema de color de estado.
 */
export function PickupCodeCard({ code }: PickupCodeCardProps) {
  return (
    <View
      className="items-center gap-1.5 rounded-[14px] border px-4 py-4"
      style={{ backgroundColor: `${PENDING}14`, borderColor: `${PENDING}40` }}
    >
      <Text
        className="font-mono text-[11px] font-semibold tracking-[1.4px]"
        style={{ color: PENDING }}
      >
        CÓDIGO DE RECOGIDA
      </Text>
      <Text
        className="font-mono text-[34px] font-bold"
        style={{ color: PENDING, letterSpacing: 6 }}
      >
        {code}
      </Text>
    </View>
  );
}
