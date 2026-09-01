import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";
import { Colors, OrderStatusColors } from "@/constants/theme";
import { BalanceSkeleton } from "@/features/balance/components/BalanceSkeleton";
import { NetBalanceCard } from "@/features/balance/components/NetBalanceCard";
import { TransactionsList } from "@/features/balance/components/TransactionsList";
import { useBalance } from "@/features/balance/hooks/useBalance";

export default function Balance() {
  const insets = useSafeAreaInsets();
  const {
    balanceBs,
    balanceUsd,
    zone,
    transactions,
    summary,
    status,
    hasLoadedOnce,
    refetch,
    refresh,
  } = useBalance();

  return (
    <View className="flex-1 bg-fondo" style={{ paddingTop: insets.top }}>
      <Text className="px-4 pb-2 pt-3 text-[18px] font-heading-bold text-texto">Balance</Text>

      {status === "loading" ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4"
          showsVerticalScrollIndicator={false}
        >
          <BalanceSkeleton />
        </ScrollView>
      ) : status === "error" && !hasLoadedOnce ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-[15px] font-heading-semibold text-texto-suave">
            No pudimos cargar tu balance
          </Text>
          <Pressable
            onPress={refetch}
            className="h-11 items-center justify-center rounded-[12px] bg-marca px-5"
          >
            <Text className="text-[14px] font-heading-semibold text-white">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3.5 px-4 pb-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={status === "refreshing"}
              onRefresh={refresh}
              tintColor={Colors.texto}
            />
          }
        >
          {status === "error" && hasLoadedOnce ? (
            <Pressable
              onPress={refetch}
              className="flex-row items-center justify-between rounded-[12px] px-3.5 py-3"
              style={{ backgroundColor: `${OrderStatusColors.error}14` }}
            >
              <Text
                className="flex-1 text-[12.5px] font-heading-semibold"
                style={{ color: OrderStatusColors.error }}
              >
                No pudimos actualizar tu balance
              </Text>
              <Text
                className="text-[12.5px] font-heading-bold"
                style={{ color: OrderStatusColors.error }}
              >
                Reintentar
              </Text>
            </Pressable>
          ) : null}

          <NetBalanceCard
            balanceBs={balanceBs}
            balanceUsd={balanceUsd}
            zone={zone}
            summary={summary}
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-heading-semibold text-texto">
              Últimos movimientos
            </Text>
            <Text className="font-mono text-[10px] text-texto-suave">
              {transactions.length} recientes
            </Text>
          </View>

          <TransactionsList transactions={transactions} />

          <Pressable onPress={() => router.push(ROUTES.APP.HISTORIAL)}>
            <Text className="py-1 text-center text-[12.5px] font-heading-semibold text-texto">
              Ver historial completo →
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <View
        className="border-t border-borde-suave bg-superficie px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        <Pressable
          onPress={() => router.push(ROUTES.APP.WITHDRAWAL)}
          className="h-[52px] items-center justify-center rounded-[13px] bg-marca"
        >
          <Text className="text-[15px] font-heading-bold text-white">Solicitar retiro</Text>
        </Pressable>
      </View>
    </View>
  );
}
