import { render, waitFor } from "@testing-library/react-native";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

import Index from "./index";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  mockReplace.mockClear();
  useAuthStore.setState({
    isAuthenticated: false,
    phoneNumber: null,
    isLoading: false,
    error: null,
    isHydrated: false,
  });
});

describe("Index", () => {
  it("sin sesión, redirige a la pantalla de elegir modo (no directo al login)", async () => {
    render(<Index />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(ROUTES.AUTH.SELECT_MODE));
  });

  it("con sesión, sigue redirigiendo a Inicio", async () => {
    useAuthStore.setState({ isAuthenticated: true, phoneNumber: "+5731234567" });

    render(<Index />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(ROUTES.APP.HOME));
  });
});
