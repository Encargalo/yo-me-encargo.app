import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OrderCompletedSummary } from "./OrderCompletedSummary";

const testMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithSafeArea(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={testMetrics}>{ui}</SafeAreaProvider>,
  );
}

describe("OrderCompletedSummary", () => {
  it("muestra el resumen de la entrega completada", async () => {
    const { getByText, toJSON } = await renderWithSafeArea(
      <OrderCompletedSummary
        summary={{
          customerName: "Ruben",
          distanceKm: 3.1,
          deliveryFee: 0.96,
          orderNumber: 128,
          shopName: "Restobar El Fogón",
        }}
      />,
    );

    expect(getByText("Pedido completado")).toBeTruthy();
    expect(getByText("#128 · Restobar El Fogón")).toBeTruthy();
    expect(getByText("Ruben")).toBeTruthy();
    expect(getByText("3.1 km")).toBeTruthy();
    expect(getByText("$0.96")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("omite el subtítulo cuando no hay número de orden ni restaurante", async () => {
    const { queryByText } = await renderWithSafeArea(
      <OrderCompletedSummary
        summary={{ customerName: "Ruben", distanceKm: 3.1, deliveryFee: 0.96 }}
      />,
    );

    expect(queryByText(/^#/)).toBeNull();
  });
});
