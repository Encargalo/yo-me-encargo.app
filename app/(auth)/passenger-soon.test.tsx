import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PassengerSoon from "./passenger-soon";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  router: { back: (...args: unknown[]) => mockBack(...args) },
}));

const testMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithSafeArea(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={testMetrics}>{ui}</SafeAreaProvider>);
}

beforeEach(() => {
  mockBack.mockClear();
});

describe("PassengerSoon", () => {
  it("informa que el modo pasajero no está disponible, sin disparar ninguna navegación ni llamada", async () => {
    const { getByText } = await renderWithSafeArea(<PassengerSoon />);

    expect(getByText("Modo pasajero próximamente")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });
});
