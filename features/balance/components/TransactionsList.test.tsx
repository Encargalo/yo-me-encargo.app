import { render } from "@testing-library/react-native";

import type { Transaction } from "../types/balance.types";
import { TransactionsList } from "./TransactionsList";

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    amount: 8.5,
    createdAt: "2026-06-30T10:00:00Z",
    movementType: "Comisión entrega",
    ...overrides,
  };
}

describe("TransactionsList", () => {
  it("renderiza una fila por movimiento", async () => {
    const { getByText, toJSON } = await render(
      <TransactionsList
        transactions={[
          makeTransaction({ id: "tx-1" }),
          makeTransaction({ id: "tx-2", movementType: "Descuento plataforma", amount: -1.2 }),
        ]}
      />,
    );

    expect(getByText("Comisión entrega")).toBeTruthy();
    expect(getByText("Descuento plataforma")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("muestra el estado vacío cuando no hay movimientos", async () => {
    const { getByText } = await render(<TransactionsList transactions={[]} />);

    expect(getByText("Sin movimientos todavía")).toBeTruthy();
  });
});
