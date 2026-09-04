import { Receipt } from "lucide-react-native";
import { Text, View } from "react-native";

import { Colors } from "@/constants/theme";

import type { Transaction } from "../types/balance.types";
import { TransactionRow } from "./TransactionRow";

interface TransactionsListProps {
  transactions: Transaction[];
}

export function TransactionsList({ transactions }: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <View className="items-center justify-center rounded-[14px] border border-borde-suave bg-superficie px-6 py-8">
        <View className="mb-3 h-[52px] w-[52px] items-center justify-center rounded-full bg-fondo">
          <Receipt size={24} color={Colors.textoTenue} />
        </View>
        <Text className="text-[15px] font-heading-semibold text-texto-suave">
          Sin movimientos todavía
        </Text>
        <Text className="font-body mt-1 text-center text-[13px] text-texto-suave">
          Tus comisiones y descuentos aparecerán aquí.
        </Text>
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-[14px] border border-borde-suave bg-superficie">
      {transactions.map((transaction, index) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          isLast={index === transactions.length - 1}
        />
      ))}
    </View>
  );
}
