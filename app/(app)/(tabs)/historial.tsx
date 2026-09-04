import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TransactionRow } from "@/features/balance/components/TransactionRow";
import { TransactionsList } from "@/features/balance/components/TransactionsList";
import type { Transaction } from "@/features/balance/types/balance.types";
import { HistorialDateFilter } from "@/features/historial/components/HistorialDateFilter";
import { HistorialPagination } from "@/features/historial/components/HistorialPagination";
import { HistorialSkeleton } from "@/features/historial/components/HistorialSkeleton";
import { TransactionDetailModal } from "@/features/historial/components/TransactionDetailModal";
import { useTransactionHistory } from "@/features/historial/hooks/useTransactionHistory";

export default function Historial() {
  const insets = useSafeAreaInsets();
  const { rows, status, page, totalPages, dateRange, goToPage, setDateRange, retry } =
    useTransactionHistory();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const isInitialLoading = status === "loading";
  const isInitialError = status === "error";
  const hasRetriableError = status === "errorPage" || status === "errorFullSet";

  return (
    <View className="flex-1 bg-fondo" style={{ paddingTop: insets.top, paddingBottom: 16 }}>
      <Text className="px-4 pb-2 pt-3 text-[18px] font-heading-bold text-texto">Historial</Text>

      {isInitialLoading || isInitialError ? null : (
        <HistorialDateFilter
          dateRange={dateRange}
          onApply={setDateRange}
          onClear={() => setDateRange(null)}
        />
      )}

      {isInitialLoading ? (
        <View className="px-4">
          <HistorialSkeleton />
        </View>
      ) : isInitialError ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-[15px] font-heading-semibold text-texto-suave">
            No pudimos cargar tu historial
          </Text>
          <Pressable
            onPress={retry}
            className="h-11 items-center justify-center rounded-[12px] bg-marca px-5"
          >
            <Text className="text-[14px] font-heading-semibold text-white">Reintentar</Text>
          </Pressable>
        </View>
      ) : status === "loadingFullSet" ? (
        <View className="px-4">
          <HistorialSkeleton label="Cargando historial completo para aplicar el filtro..." />
        </View>
      ) : status === "loadingPage" ? (
        <View className="px-4">
          <HistorialSkeleton />
        </View>
      ) : rows.length === 0 ? (
        <View className="flex-1 px-4">
          <TransactionsList transactions={[]} />
        </View>
      ) : (
        <>
          {hasRetriableError ? (
            <Pressable
              onPress={retry}
              className="mx-4 mb-2 flex-row items-center justify-between rounded-[10px] bg-status-error/10 px-3 py-2.5"
            >
              <Text className="flex-1 text-[12.5px] font-heading-semibold text-status-error">
                No pudimos completar la acción
              </Text>
              <Text className="text-[12.5px] font-heading-bold text-status-error">Reintentar</Text>
            </Pressable>
          ) : null}

          <View className="mx-4 mt-1 overflow-hidden rounded-[14px] border border-borde-suave bg-superficie">
            {rows.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                isLast={index === rows.length - 1}
                onPress={() => setSelected(transaction)}
              />
            ))}
          </View>

          <HistorialPagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      )}

      <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
    </View>
  );
}
