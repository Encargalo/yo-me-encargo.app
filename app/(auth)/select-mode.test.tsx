import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";

import SelectMode from "./select-mode";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const testMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithSafeArea(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={testMetrics}>{ui}</SafeAreaProvider>);
}

beforeEach(() => {
  mockPush.mockClear();
});

describe("SelectMode", () => {
  it("navega al login existente al tocar la tarjeta Conductor", async () => {
    const { getByText } = await renderWithSafeArea(<SelectMode />);

    fireEvent.press(getByText("Conductor"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.AUTH.LOGIN);
  });

  it("navega al marcador de pasajero al tocar la tarjeta Pasajero", async () => {
    const { getByText } = await renderWithSafeArea(<SelectMode />);

    fireEvent.press(getByText("Pasajero"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.AUTH.PASSENGER_SOON);
  });
});
