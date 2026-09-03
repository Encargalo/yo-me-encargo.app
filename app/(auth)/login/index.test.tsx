import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ROUTES } from "@/constants/routes";

import LoginRidersHub from "./index";

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

const testMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderHub() {
  return render(
    <SafeAreaProvider initialMetrics={testMetrics}>
      <LoginRidersHub />
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
});

describe("LoginRidersHub", () => {
  it("muestra las tres acciones sin pedir credenciales", async () => {
    const { getByText, queryByPlaceholderText } = await renderHub();

    expect(getByText("Continuar con tu teléfono")).toBeTruthy();
    expect(getByText("Registrarme como conductor")).toBeTruthy();
    expect(getByText("Cambiar a modo pasajero")).toBeTruthy();
    expect(queryByPlaceholderText("Número de teléfono")).toBeNull();
    expect(queryByPlaceholderText("Contraseña")).toBeNull();
  });

  it("'Continuar con tu teléfono' navega al formulario en /login/phone", async () => {
    const { getByText } = await renderHub();

    fireEvent.press(getByText("Continuar con tu teléfono"));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.AUTH.LOGIN_PHONE);
  });

  it("'Cambiar a modo pasajero' reemplaza por la pantalla de elegir modo", async () => {
    const { getByText } = await renderHub();

    fireEvent.press(getByText("Cambiar a modo pasajero"));

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.AUTH.SELECT_MODE);
  });

  it("'Registrarme como conductor' navega al marcador y no dispara ninguna otra navegación", async () => {
    const { getByText } = await renderHub();

    fireEvent.press(getByText("Registrarme como conductor"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.AUTH.REGISTER_RIDER_SOON);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
