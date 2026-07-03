import { render } from "@testing-library/react-native";

import { OrderCompletedSummary } from "./OrderCompletedSummary";

describe("OrderCompletedSummary", () => {
  it("muestra el resumen de la entrega completada", async () => {
    const { getByText, toJSON } = await render(
      <OrderCompletedSummary
        summary={{ customerName: "Ruben", distanceKm: 3.1, deliveryFee: 0.96 }}
      />,
    );

    expect(getByText("Pedido completado")).toBeTruthy();
    expect(getByText("Ruben")).toBeTruthy();
    expect(getByText("3.1 km")).toBeTruthy();
    expect(getByText("$0.96")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
