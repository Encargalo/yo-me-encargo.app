import { fireEvent, render } from "@testing-library/react-native";

import type { Transaction } from "@/features/balance/types/balance.types";

import { TransactionDetailModal } from "./TransactionDetailModal";

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    amount: 8.5,
    createdAt: "2026-06-30T14:20:00Z",
    distanceKm: 3.1,
    movementType: "ride_bank",
    paymentMethod: "efectivo",
    ...overrides,
  };
}

describe("TransactionDetailModal", () => {
  it("no renderiza nada si no hay transacción seleccionada", async () => {
    const { toJSON } = await render(
      <TransactionDetailModal transaction={null} onClose={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });

  it("muestra los campos de la transacción, sin payment_method", async () => {
    const { getByText, queryByText } = await render(
      <TransactionDetailModal
        transaction={makeTransaction()}
        onClose={jest.fn()}
      />,
    );

    expect(getByText("Carrera")).toBeTruthy();
    expect(getByText("+8.5$")).toBeTruthy();
    expect(getByText("30 jun")).toBeTruthy();
    expect(getByText("3.1 km")).toBeTruthy();
    expect(queryByText(/efectivo/)).toBeNull();
  });

  it("no muestra distancia cuando no está presente", async () => {
    const { queryByText } = await render(
      <TransactionDetailModal
        transaction={makeTransaction({ distanceKm: undefined })}
        onClose={jest.fn()}
      />,
    );

    expect(queryByText(/km/)).toBeNull();
  });

  it("cierra al tocar el botón 'Cerrar' o el fondo", async () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = await render(
      <TransactionDetailModal transaction={makeTransaction()} onClose={onClose} />,
    );

    fireEvent.press(getByText("Cerrar"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId("transaction-detail-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
