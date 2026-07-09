import { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { Primary } from "@/constants/theme";

import type { DateRange } from "../hooks/useTransactionHistory";

interface HistorialDateFilterProps {
  dateRange: DateRange | null;
  onApply: (range: DateRange) => void;
  onClear: () => void;
}

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

type OpenPicker = "from" | "to" | null;

export function HistorialDateFilter({
  dateRange,
  onApply,
  onClear,
}: HistorialDateFilterProps) {
  const [pendingFrom, setPendingFrom] = useState<Date | null>(
    dateRange?.from ?? null,
  );
  const [pendingTo, setPendingTo] = useState<Date | null>(
    dateRange?.to ?? null,
  );
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);

  const canApply = pendingFrom !== null && pendingTo !== null;

  function handleClear() {
    setPendingFrom(null);
    setPendingTo(null);
    onClear();
  }

  return (
    <View className="mx-4 mt-3 mb-2 rounded-[14px] border border-hair bg-card p-3">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => setOpenPicker("from")}
          className={`h-10 flex-1 items-center justify-center rounded-[10px] border ${
            pendingFrom ? "border-primary bg-primary/10" : "border-line bg-white"
          }`}
        >
          <Text
            className={`text-[12.5px] font-semibold ${
              pendingFrom ? "text-primary" : "text-ink"
            }`}
          >
            {pendingFrom ? formatDate(pendingFrom) : "Desde"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setOpenPicker("to")}
          className={`h-10 flex-1 items-center justify-center rounded-[10px] border ${
            pendingTo ? "border-primary bg-primary/10" : "border-line bg-white"
          }`}
        >
          <Text
            className={`text-[12.5px] font-semibold ${
              pendingTo ? "text-primary" : "text-ink"
            }`}
          >
            {pendingTo ? formatDate(pendingTo) : "Hasta"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => canApply && onApply({ from: pendingFrom!, to: pendingTo! })}
          disabled={!canApply}
          className={`h-10 items-center justify-center rounded-[10px] bg-primary px-3.5 ${
            canApply ? "" : "opacity-40"
          }`}
        >
          <Text className="text-[12.5px] font-semibold text-white">
            Aplicar
          </Text>
        </Pressable>
      </View>

      {dateRange ? (
        <Pressable
          onPress={handleClear}
          className="mt-3 flex-row items-center gap-1 self-start rounded-full border border-primary px-3 py-1.5"
        >
          <X size={13} color={Primary} />
          <Text className="text-[12px] font-bold text-primary">
            Limpiar filtro
          </Text>
        </Pressable>
      ) : null}

      {openPicker ? (
        <DateTimePicker
          testID="historial-date-picker"
          value={
            (openPicker === "from" ? pendingFrom : pendingTo) ?? new Date()
          }
          mode="date"
          onChange={(_event, selectedDate) => {
            setOpenPicker(null);
            if (!selectedDate) return;
            if (openPicker === "from") {
              setPendingFrom(selectedDate);
              if (pendingTo) onApply({ from: selectedDate, to: pendingTo });
            } else {
              setPendingTo(selectedDate);
              if (pendingFrom) onApply({ from: pendingFrom, to: selectedDate });
            }
          }}
        />
      ) : null}
    </View>
  );
}
