import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Neutrals } from "@/constants/theme";
import { TransactionRow } from "@/features/balance/components/TransactionRow";
import { TransactionsList } from "@/features/balance/components/TransactionsList";
import type { Transaction } from "@/features/balance/types/balance.types";
import { HistorialListFooter } from "@/features/historial/components/HistorialListFooter";
import { HistorialSkeleton } from "@/features/historial/components/HistorialSkeleton";
import { useTransactionHistory } from "@/features/historial/hooks/useTransactionHistory";

// Sin `useFocusEffect` a propósito: a diferencia de Balance, refrescar al
// recuperar foco descartaría el scroll ya avanzado del rider en la lista.
export default function Historial() {
  const insets = useSafeAreaInsets();
  const { transactions, status, loadMore, refresh, retryLoadMore } =
    useTransactionHistory();

  return (
    <View
      className="flex-1 bg-canvas"
      style={{ paddingTop: insets.top, paddingBottom: 16 }}
    >
      <Text className="px-4 pb-2 pt-3 text-[18px] font-bold text-ink">
        Historial
      </Text>

      {status === "loading" ? (
        <View className="px-4">
          <HistorialSkeleton />
        </View>
      ) : status === "error" ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-[15px] font-semibold text-body">
            No pudimos cargar tu historial
          </Text>
          <Pressable
            onPress={refresh}
            className="h-11 items-center justify-center rounded-[12px] bg-ink px-5"
          >
            <Text className="text-[14px] font-semibold text-white">
              Reintentar
            </Text>
          </Pressable>
        </View>
      ) : transactions.length === 0 ? (
        <View className="flex-1 px-4">
          <TransactionsList transactions={[]} />
        </View>
      ) : (
        // El borde/rounding va en este `View` fijo, no en el
        // `contentContainerStyle` del FlatList: si el rounding creciera con
        // los datos, el viewport del FlatList (sin overflow-hidden propio)
        // cortaría la esquina inferior a la mitad apenas el contenido se
        // acercara a la altura visible.
        <View className="mx-4 mt-1 flex-1 overflow-hidden rounded-[14px] border border-hair bg-white">
          <FlatList<Transaction>
            data={transactions}
            keyExtractor={(transaction) => transaction.id}
            renderItem={({ item, index }) => (
              <TransactionRow
                transaction={item}
                isLast={index === transactions.length - 1}
              />
            )}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              <HistorialListFooter status={status} onRetry={retryLoadMore} />
            }
            refreshControl={
              <RefreshControl
                refreshing={status === "refreshing"}
                onRefresh={refresh}
                tintColor={Neutrals.ink}
              />
            }
          />
        </View>
      )}
    </View>
  );
}
