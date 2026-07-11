import type { Transaction } from "../types/balance.types";

export interface TransactionsSummary {
  earned: number; // suma de montos positivos
  deducted: number; // suma absoluta de montos negativos
}

// Desglose Ganado/Descontado calculado sobre los movimientos ya visibles en
// pantalla (el endpoint no expone un total histórico separado — ver design.md
// Riesgos: no es un total de todo el tiempo, solo de estos movimientos).
export function summarizeTransactions(transactions: Transaction[]): TransactionsSummary {
  return transactions.reduce<TransactionsSummary>(
    (summary, tx) => {
      if (tx.amount > 0) {
        return { ...summary, earned: summary.earned + tx.amount };
      }
      if (tx.amount < 0) {
        return { ...summary, deducted: summary.deducted - tx.amount };
      }
      return summary;
    },
    { earned: 0, deducted: 0 },
  );
}
