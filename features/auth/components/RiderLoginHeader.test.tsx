import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RiderLoginHeader } from "./RiderLoginHeader";

const testMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithSafeArea(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={testMetrics}>{ui}</SafeAreaProvider>);
}

describe("RiderLoginHeader", () => {
  it("muestra el título, el subtítulo, el badge de modo y el contenido hijo", async () => {
    const { getByText } = await renderWithSafeArea(
      <RiderLoginHeader>
        <Text>contenido del hub</Text>
      </RiderLoginHeader>,
    );

    expect(getByText("Ingresa como conductor")).toBeTruthy();
    expect(getByText("O envía la solicitud para registrarte")).toBeTruthy();
    expect(getByText("MODO CONDUCTOR")).toBeTruthy();
    expect(getByText("contenido del hub")).toBeTruthy();
  });
});
