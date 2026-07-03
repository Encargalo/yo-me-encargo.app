import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Neutrals } from "@/constants/theme";

import type { OrderItem, OrderItemOption } from "../types/order.types";

interface OrderItemsListProps {
  items: OrderItem[];
}

function formatOptions(label: string, options?: OrderItemOption[]): string | null {
  if (!options || options.length === 0) return null;
  const parts = options.map((o) =>
    o.amount > 1 ? `${o.name} x${o.amount}` : o.name,
  );
  return `${label}: ${parts.join(", ")}`;
}

/**
 * Lista colapsable de productos del pedido (wireframe 04). Solo llega con el
 * `order_update` de aceptación — antes de aceptar, `items` está vacío.
 * Se embebe dentro de la card de Cliente (sin chrome propio, solo un
 * divisor), no es una card independiente.
 */
export function OrderItemsList({ items }: OrderItemsListProps) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <View className="mt-2 border-t border-hair pt-2.5">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between"
        accessibilityRole="button"
        accessibilityLabel="Ver productos del pedido"
      >
        <Text className="text-[14px] font-semibold text-ink">
          Productos · {items.length}
        </Text>
        {expanded ? (
          <ChevronUp size={18} color={Neutrals.textMuted} />
        ) : (
          <ChevronDown size={18} color={Neutrals.textMuted} />
        )}
      </Pressable>

      {expanded ? (
        <View className="mt-3 gap-3">
          {items.map((item) => {
            const flavors = formatOptions("Sabor", item.flavors);
            const additions = formatOptions("Adición", item.additions);
            return (
              <View key={item.id} className="gap-0.5">
                <Text className="text-[14px] text-body">
                  {item.amount}x {item.name}
                </Text>
                {flavors ? (
                  <Text className="text-[12px] text-muted">{flavors}</Text>
                ) : null}
                {additions ? (
                  <Text className="text-[12px] text-muted">{additions}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
