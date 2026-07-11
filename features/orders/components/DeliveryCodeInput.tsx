import { useRef } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Neutrals, OrderStatusColors } from "@/constants/theme";

import { DELIVERY_CODE_LENGTH } from "../types/order.types";

interface DeliveryCodeInputProps {
  code: string;
  onChangeCode: (code: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string;
  color: string; // color del botón "Confirmar entrega" — el de estado de la orden
}

/**
 * OTP del código de entrega que el cliente le da verbalmente al rider
 * (wireframe 05). Longitud tomada de `DELIVERY_CODE_LENGTH` (hoy 6 dígitos,
 * cambiará a 4 próximamente) — nunca un literal repetido acá.
 */
export function DeliveryCodeInput({
  code,
  onChangeCode,
  onSubmit,
  submitting,
  error,
  color,
}: DeliveryCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: DELIVERY_CODE_LENGTH }, (_, i) => code[i] ?? "");
  const complete = code.length === DELIVERY_CODE_LENGTH;

  function handleChange(text: string) {
    onChangeCode(text.replace(/[^0-9]/g, "").slice(0, DELIVERY_CODE_LENGTH));
  }

  return (
    <View className="gap-3">
      <Text className="font-mono text-[11px] tracking-[1.4px] text-label">CÓDIGO DEL CLIENTE</Text>

      {/* El TextInput real cubre exactamente las casillas (mismo tamaño,
          opacidad 0) — el toque cae directo sobre el input nativo, así el
          teclado se abre de forma confiable en cada toque (no solo la
          primera vez por `autoFocus`). Las casillas son un overlay puramente
          visual, `pointerEvents="none"` para no interceptar el toque. */}
      <View style={{ position: "relative" }}>
        <View className="flex-row gap-2" pointerEvents="none">
          {digits.map((digit, i) => (
            <View
              key={i}
              className="h-12 flex-1 items-center justify-center rounded-[10px] border-[1.5px] bg-white"
              style={{
                borderColor: error ? OrderStatusColors.error : Neutrals.borderInput,
              }}
            >
              <Text className="text-[20px] font-bold text-ink">{digit}</Text>
            </View>
          ))}
        </View>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={DELIVERY_CODE_LENGTH}
          autoFocus
          style={[StyleSheet.absoluteFill, { opacity: 0 }]}
          accessibilityLabel="Ingresar código de entrega"
        />
      </View>

      {error ? (
        <Text className="text-[13px] font-medium" style={{ color: OrderStatusColors.error }}>
          {error}
        </Text>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={!complete || submitting}
        className="h-[56px] items-center justify-center rounded-[14px]"
        style={{
          backgroundColor: color,
          opacity: !complete || submitting ? 0.5 : 1,
        }}
      >
        <Text className="text-[16px] font-bold text-white">Confirmar entrega</Text>
      </Pressable>
    </View>
  );
}
