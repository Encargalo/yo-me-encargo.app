import type { Transaction } from "../types/balance.types";

export interface TransactionsSummary {
  earnedBs: number; // suma de los montos positivos (Bs)
  deductedBs: number; // suma absoluta de los montos negativos (Bs)
}

// Desglose Ganado/Descontado calculado sobre los movimientos ya visibles en
// pantalla (el endpoint no expone un total histórico separado — ver design.md
// Riesgos: no es un total de todo el tiempo, solo de estos movimientos).
export function summarizeTransactions(transactions: Transaction[]): TransactionsSummary {
  return transactions.reduce<TransactionsSummary>(
    (summary, tx) => {
      if (tx.amountBs > 0) {
        return { ...summary, earnedBs: summary.earnedBs + tx.amountBs };
      }
      if (tx.amountBs < 0) {
        return { ...summary, deductedBs: summary.deductedBs - tx.amountBs };
      }
      return summary;
    },
    { earnedBs: 0, deductedBs: 0 },
  );
}
