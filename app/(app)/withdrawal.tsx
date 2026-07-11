import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Neutrals, OrderStatusColors } from "@/constants/theme";
import { BalanceSkeleton } from "@/features/balance/components/BalanceSkeleton";
import { useBalance } from "@/features/balance/hooks/useBalance";
import { AvailableBalanceCard } from "@/features/withdrawal/components/AvailableBalanceCard";
import { MinimumBalanceNotice } from "@/features/withdrawal/components/MinimumBalanceNotice";
import { RecentWithdrawalsList } from "@/features/withdrawal/components/RecentWithdrawalsList";
import { WithdrawalSuccess } from "@/features/withdrawal/components/WithdrawalSuccess";
import { useWithdrawal } from "@/features/withdrawal/hooks/useWithdrawal";
import { MIN_WITHDRAWAL_BALANCE } from "@/features/withdrawal/types/withdrawal.types";

// Pantalla real de Solicitud de retiro (wireframe 07/07b), reemplaza el stub
// dejado por `balance-screen`. Ver design.md del change `withdrawal-screen`.
export default function Withdrawal() {
  const insets = useSafeAreaInsets();
  const { balance, status: balanceStatus, hasLoadedOnce, refetch: refetchBalance } = useBalance();
  const {
    status: withdrawalStatus,
    amountWithdrawn,
    errorMessage,
    recentWithdrawals,
    submit,
  } = useWithdrawal();

  if (withdrawalStatus === "success" && amountWithdrawn != null) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        <WithdrawalSuccess amountWithdrawn={amountWithdrawn} onDismiss={() => router.back()} />
      </View>
    );
  }

  const canWithdraw = balance >= MIN_WITHDRAWAL_BALANCE;
  const isSubmitting = withdrawalStatus === "submitting";

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2 border-b border-hair px-2 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full"
          accessibilityLabel="Volver"
        >
          <ChevronLeft size={20} color={Neutrals.ink} />
        </Pressable>
        <Text className="text-[15px] font-semibold text-ink">Solicitar retiro</Text>
      </View>

      {balanceStatus === "loading" ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <BalanceSkeleton />
        </ScrollView>
      ) : balanceStatus === "error" && !hasLoadedOnce ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-center text-[15px] font-semibold text-body">
            No pudimos cargar tu saldo
          </Text>
          <Pressable
            onPress={refetchBalance}
            className="h-11 items-center justify-center rounded-[12px] bg-ink px-5"
          >
            <Text className="text-[14px] font-semibold text-white">Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-3.5 px-4 pt-4 pb-4"
            showsVerticalScrollIndicator={false}
          >
            {balanceStatus === "error" && hasLoadedOnce ? (
              <Pressable
                onPress={refetchBalance}
                className="flex-row items-center justify-between rounded-[12px] px-3.5 py-3"
                style={{ backgroundColor: `${OrderStatusColors.error}14` }}
              >
                <Text
                  className="flex-1 text-[12.5px] font-semibold"
                  style={{ color: OrderStatusColors.error }}
                >
                  No pudimos actualizar tu saldo
                </Text>
                <Text
                  className="text-[12.5px] font-bold"
                  style={{ color: OrderStatusColors.error }}
                >
                  Reintentar
                </Text>
              </Pressable>
            ) : null}

            <AvailableBalanceCard balance={balance} />
            <MinimumBalanceNotice />

            <Text className="font-mono text-[10px] tracking-[1px] text-label">
              RETIROS RECIENTES
            </Text>
            <RecentWithdrawalsList withdrawals={recentWithdrawals} />
          </ScrollView>

          <View
            className="border-t border-hair bg-white px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          >
            {withdrawalStatus === "error" && errorMessage ? (
              <Text
                className="mb-2 text-center text-[12.5px] font-semibold"
                style={{ color: OrderStatusColors.error }}
              >
                {errorMessage}
              </Text>
            ) : null}
            <Pressable
              onPress={submit}
              disabled={!canWithdraw || isSubmitting}
              className={`h-[52px] items-center justify-center rounded-[13px] bg-ink ${
                !canWithdraw || isSubmitting ? "opacity-50" : ""
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Neutrals.white} />
              ) : (
                <Text className="text-[15px] font-bold text-white">Solicitar retiro</Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
