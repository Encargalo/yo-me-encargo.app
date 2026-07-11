import { Text, View } from "react-native";

import type { RecentWithdrawal } from "../types/withdrawal.types";
import { RecentWithdrawalRow } from "./RecentWithdrawalRow";

interface RecentWithdrawalsListProps {
  withdrawals: RecentWithdrawal[];
}

export function RecentWithdrawalsList({ withdrawals }: RecentWithdrawalsListProps) {
  if (withdrawals.length === 0) {
    return (
      <View className="items-center justify-center rounded-[14px] border border-hair bg-white px-6 py-6">
        <Text className="text-[13px] text-muted">Todavía no has solicitado ningún retiro.</Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-[14px] border border-hair bg-white">
      {withdrawals.map((withdrawal, index) => (
        <RecentWithdrawalRow
          key={`${withdrawal.date}-${withdrawal.amount}`}
          withdrawal={withdrawal}
          isLast={index === withdrawals.length - 1}
        />
      ))}
    </View>
  );
}
