import { fireEvent, render } from "@testing-library/react-native";

import type { Transaction } from "../types/balance.types";
import { TransactionRow } from "./TransactionRow";

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    amountBs: 26,
    amountUsd: 0.64,
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
    expect(getByText("+26Bs")).toBeTruthy();
    expect(getByText("4 jul · 3.1 km")).toBeTruthy();
    // El método de pago nunca se muestra, aunque venga en la transacción.
    expect(queryByText(/PagoMovil/)).toBeNull();
    expect(toJSON()).toMatchSnapshot();
  });

  it("humaniza un movementType desconocido y no muestra distancia si no está presente", async () => {
    const { getByText, queryByText } = await render(
      <TransactionRow
        transaction={makeTransaction({
          amountBs: -48,
          movementType: "platform_fee",
        })}
      />,
    );

    expect(getByText("Platform fee")).toBeTruthy();
    expect(getByText("−48Bs")).toBeTruthy();
    expect(getByText("4 jul")).toBeTruthy();
    expect(queryByText(/km/)).toBeNull();
  });

  it("no responde a tap cuando no se pasa onPress (uso de Balance)", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<TransactionRow transaction={makeTransaction()} />);

    fireEvent.press(getByText("Carrera"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("dispara onPress al tocar la fila (uso de Historial)", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <TransactionRow transaction={makeTransaction()} onPress={onPress} />,
    );

    fireEvent.press(getByText("Carrera"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
