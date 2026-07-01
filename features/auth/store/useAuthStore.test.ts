import type { AxiosError } from "axios";

import { signInRider } from "../services/auth.service";
import { useAuthStore } from "./useAuthStore";

jest.mock("../services/auth.service");
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const SecureStore = jest.requireMock("expo-secure-store") as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

const mockedSignInRider = signInRider as jest.MockedFunction<
  typeof signInRider
>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    isAuthenticated: false,
    phoneNumber: null,
    isLoading: false,
    error: null,
    isHydrated: false,
  });
});

describe("useAuthStore.login", () => {
  it("marks the rider as authenticated and persists the session on success", async () => {
    mockedSignInRider.mockResolvedValueOnce(undefined);
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().login("+573001112233", "claveSegura123");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.phoneNumber).toBe("+573001112233");
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "rider_session",
      JSON.stringify({ hasSession: true, phoneNumber: "+573001112233" }),
    );
  });

  it("sets the credenciales-incorrectas error and stays unauthenticated on 422", async () => {
    const axiosError = {
      isAxiosError: true,
      response: { status: 422, data: {} },
    } as AxiosError;
    mockedSignInRider.mockRejectedValueOnce(axiosError);

    await useAuthStore.getState().login("+573001112233", "wrong-password");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toEqual({
      code: 422,
      message: "Credenciales incorrectas",
    });
    expect(state.isLoading).toBe(false);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
