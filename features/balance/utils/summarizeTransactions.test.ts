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
    expect(summarizeTransactions([tx(8.5), tx(-1.2), tx(10.2)])).toEqual({
      earned: 18.7,
      deducted: 1.2,
    });
  });

  it("solo movimientos positivos", () => {
    expect(summarizeTransactions([tx(5), tx(3)])).toEqual({
      earned: 8,
      deducted: 0,
    });
  });

  it("solo movimientos negativos", () => {
    expect(summarizeTransactions([tx(-2), tx(-3)])).toEqual({
      earned: 0,
      deducted: 5,
    });
  });

  it("lista vacía", () => {
    expect(summarizeTransactions([])).toEqual({ earned: 0, deducted: 0 });
  });
});
