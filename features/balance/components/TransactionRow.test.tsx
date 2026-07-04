import { render } from "@testing-library/react-native";

import type { Transaction } from "../types/balance.types";
import { TransactionRow } from "./TransactionRow";

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    amount: 0.64,
    createdAt: "2026-07-04T10:00:00Z",
    movementType: "ride_bank",
    ...overrides,
  };
}

describe("TransactionRow", () => {
  it("mapea movementType a una etiqueta legible y muestra monto, fecha y distancia", async () => {
    const { getByText, queryByText, toJSON } = await render(
      <TransactionRow
        transaction={makeTransaction({ distanceKm: 3.1, paymentMethod: "PagoMovil" })}
      />,
    );

    expect(getByText("Carrera")).toBeTruthy();
    expect(getByText("+0.64$")).toBeTruthy();
    expect(getByText("4 jul · 3.1 km")).toBeTruthy();
    // El método de pago nunca se muestra, aunque venga en la transacción.
    expect(queryByText(/PagoMovil/)).toBeNull();
    expect(toJSON()).toMatchSnapshot();
  });

  it("humaniza un movementType desconocido y no muestra distancia si no está presente", async () => {
    const { getByText, queryByText } = await render(
      <TransactionRow
        transaction={makeTransaction({
          amount: -1.2,
          movementType: "platform_fee",
        })}
      />,
    );

    expect(getByText("Platform fee")).toBeTruthy();
    expect(getByText("−1.2$")).toBeTruthy();
    expect(getByText("4 jul")).toBeTruthy();
    expect(queryByText(/km/)).toBeNull();
  });
});
