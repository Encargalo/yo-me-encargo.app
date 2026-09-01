import * as Linking from "expo-linking";
import { Navigation, Phone, ReceiptText, Store } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

interface OrderPartyBlockProps {
  eyebrow: string; // "RESTAURANTE" | "CLIENTE"
  role: "shop" | "customer";
  pinColor: string;
  name: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  children?: ReactNode; // contenido extra embebido en la misma card (ej. productos en Cliente)
}

function openNavigation(latitude: number, longitude: number, label: string) {
  Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}(${encodeURIComponent(label)})`,
  );
}

function callPhone(phone: string) {
  Linking.openURL(`tel:${phone}`);
}

/**
 * Bloque reutilizable para Restaurante/Cliente en el Detalle de Orden
 * (wireframe 04): icono (tienda / recibo) coloreado, nombre, dirección, y
 * acciones de navegar y llamar — ocultas (no deshabilitadas) si falta el
 * dato correspondiente.
 */
export function OrderPartyBlock({
  eyebrow,
  role,
  pinColor,
  name,
  address,
  phone,
  latitude,
  longitude,
  children,
}: OrderPartyBlockProps) {
  const hasCoords = latitude != null && longitude != null;
  const Icon = role === "shop" ? Store : ReceiptText;

  return (
    <View className="gap-2 rounded-[14px] border border-borde-suave bg-superficie p-3.5">
      <View className="flex-row items-center gap-2">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${pinColor}1a` }}
        >
          <Icon size={16} color={pinColor} />
        </View>
        <Text className="font-mono text-[11px] tracking-[1.2px] text-texto-suave">{eyebrow}</Text>
      </View>

      <Text
        className="text-[16px] font-heading-semibold tracking-[-0.2px] text-texto"
        numberOfLines={1}
      >
        {name}
      </Text>

      {address ? (
        <Text className="font-body text-[13px] text-texto-suave" numberOfLines={2}>
          {address}
        </Text>
      ) : null}

      {hasCoords || phone ? (
        <View className="mt-1 flex-row gap-2">
          {hasCoords ? (
            <Pressable
              onPress={() => openNavigation(latitude, longitude, name)}
              className="h-9 w-9 items-center justify-center rounded-full border border-borde bg-superficie"
              accessibilityLabel={`Navegar a ${name}`}
            >
              <Navigation size={16} color={Colors.texto} />
            </Pressable>
          ) : null}
          {phone ? (
            <Pressable
              onPress={() => callPhone(phone)}
              className="h-9 w-9 items-center justify-center rounded-full border border-borde bg-superficie"
              accessibilityLabel={`Llamar a ${name}`}
            >
              <Phone size={16} color={Colors.texto} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}
