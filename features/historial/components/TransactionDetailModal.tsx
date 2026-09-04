import { Modal, Pressable, Text, View } from "react-native";

import { OrderStatusColors } from "@/constants/theme";
import { formatSignedBs } from "@/features/balance/utils/formatAmount";
import { getMovementTypeLabel } from "@/features/balance/utils/movementTypeLabel";
import type { Transaction } from "@/features/balance/types/balance.types";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Duplica el formato de fecha de `TransactionRow` a propósito — mismo criterio
// que `historial.service.ts` (no compartir helpers triviales entre features).
function formatDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

interface DetailRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function DetailRow({ label, value, valueColor }: DetailRowProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-borde-suave py-2.5">
      <Text className="font-body text-[13px] text-texto-suave">{label}</Text>
      <Text
        className="text-[14px] font-heading-semibold text-texto"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

// Detalle de solo lectura (wireframe 08) — mismos campos ya visibles en la
// fila, sin fetch adicional. `payment_method` sigue oculto (Decisión 8 de
// balance-screen).
export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const amountColor =
    transaction.amountBs >= 0 ? OrderStatusColors.completed : OrderStatusColors.error;
  const date = formatDate(transaction.createdAt);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/55"
        onPress={onClose}
        testID="transaction-detail-backdrop"
      >
        <Pressable
          className="rounded-t-[28px] bg-superficie px-6 pb-9 pt-5"
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="font-mono text-[11px] tracking-[1.4px] text-texto-suave">
            MOVIMIENTO
          </Text>
          <Text className="mt-1 text-[20px] font-heading-bold text-texto">
            {getMovementTypeLabel(transaction.movementType)}
          </Text>

          <View className="mt-4">
            <DetailRow
              label="Monto"
              value={formatSignedBs(transaction.amountBs)}
              valueColor={amountColor}
            />
            {date ? <DetailRow label="Fecha" value={date} /> : null}
            {typeof transaction.distanceKm === "number" ? (
              <DetailRow label="Distancia" value={`${transaction.distanceKm.toFixed(1)} km`} />
            ) : null}
            {typeof transaction.bcvRate === "number" ? (
              <DetailRow label="Tasa BCV" value={`${transaction.bcvRate} Bs/$`} />
            ) : null}
          </View>

          <Pressable
            onPress={onClose}
            className="mt-6 h-12 items-center justify-center rounded-[14px] bg-primary"
          >
            <Text className="text-[14px] font-heading-semibold text-white">Cerrar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
