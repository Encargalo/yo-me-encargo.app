import { Pressable, Text, View } from "react-native";

import { setAvailability } from "../services/ordersRiderWsService";
import { useOrdersStore } from "../store/useOrdersStore";

// Toggle de disponibilidad para recibir NUEVAS órdenes. No cierra el WebSocket:
// el rider "No disponible" sigue conectado para gestionar sus órdenes en curso.
export function AvailabilityToggle() {
  const isAvailable = useOrdersStore((s) => s.isAvailable);
  const setAvailable = useOrdersStore((s) => s.setAvailable);

  function handleToggle() {
    const next = !isAvailable;
    setAvailable(next); // UI optimista
    setAvailability(next); // comunica al backend (WS saliente)
  }

  return (
    <Pressable
      onPress={handleToggle}
      className="flex-row items-center gap-2.5"
      accessibilityRole="switch"
      accessibilityState={{ checked: isAvailable }}
      accessibilityLabel="Disponibilidad para recibir órdenes"
    >
      <View
        className={`h-6 w-[42px] justify-center rounded-[14px] px-0.5 ${
          isAvailable ? "bg-status-completed" : "bg-line"
        }`}
      >
        <View
          className={`h-5 w-5 rounded-full bg-white ${isAvailable ? "self-end" : "self-start"}`}
        />
      </View>

      <View>
        <Text className="text-sm font-semibold tracking-[-0.2px] text-ink">
          {isAvailable ? "Disponible" : "No disponible"}
        </Text>
        <Text className="mt-px font-mono text-[9px] tracking-[1px] text-label">
          {isAvailable ? "RECIBIENDO ÓRDENES" : "EN PAUSA"}
        </Text>
      </View>
    </Pressable>
  );
}
