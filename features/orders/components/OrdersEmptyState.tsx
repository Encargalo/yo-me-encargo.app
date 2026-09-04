import { Package } from "lucide-react-native";
import { Text, View } from "react-native";

import { Colors } from "@/constants/theme";

// Estado vacío tranquilo (wireframe 02b) — no alarmar al rider.
export function OrdersEmptyState() {
  return (
    <View className="items-center justify-center px-8 py-8">
      <View className="mb-3 h-[52px] w-[52px] items-center justify-center rounded-full bg-fondo">
        <Package size={24} color={Colors.textoTenue} />
      </View>
      <Text className="text-[15px] font-heading-semibold text-texto-suave">
        Sin órdenes activas
      </Text>
      <Text className="font-body mt-1 text-center text-[13px] text-texto-suave">
        Cuando recibas un pedido, aparecerá aquí.
      </Text>
    </View>
  );
}
