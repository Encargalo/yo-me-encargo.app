import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

// Placeholder — el Detalle de Orden real llega en su propio change de OpenSpec.
// Ya recibe el id para que la navegación desde Inicio quede cableada.
export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-primary text-xl font-bold">Detalle de Orden</Text>
      <Text className="mt-1 text-gray-500">#{id} · Próximamente</Text>
    </View>
  );
}
