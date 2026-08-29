import type { Transaction } from "../types/balance.types";
import { summarizeTransactions } from "./summarizeTransactions";

function tx(amountBs: number): Transaction {
  return {
    id: `tx-${amountBs}`,
    amountBs,
    amountUsd: amountBs / 40,
    createdAt: "2026-06-30T10:00:00Z",
    movementType: "Movimiento",
  };
}

describe("summarizeTransactions", () => {
  it("suma ganado y descontado con movimientos mixtos", () => {
    expect(summarizeTransactions([tx(340), tx(-48), tx(408)])).toEqual({
      earnedBs: 748,
      deductedBs: 48,
    });
  });

  it("solo movimientos positivos", () => {
    expect(summarizeTransactions([tx(200), tx(120)])).toEqual({
      earnedBs: 320,
      deductedBs: 0,
    });
  });

  it("solo movimientos negativos", () => {
    expect(summarizeTransactions([tx(-80), tx(-120)])).toEqual({
      earnedBs: 0,
      deductedBs: 200,
    });
  });

  it("lista vacía", () => {
    expect(summarizeTransactions([])).toEqual({ earnedBs: 0, deductedBs: 0 });
  });
});
