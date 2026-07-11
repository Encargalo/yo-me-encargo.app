import { act, renderHook } from "@testing-library/react-native";

import { signInRider } from "../services/auth.service";
import { useAuthStore } from "../store/useAuthStore";
import { useLoginForm } from "./useLoginForm";

jest.mock("../services/auth.service");
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn(),
}));

const mockedSignInRider = signInRider as jest.MockedFunction<typeof signInRider>;

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

it("does not call the auth store when the fields are invalid", async () => {
  const { result } = await renderHook(() => useLoginForm());

  expect(result.current.isPhoneValid).toBe(false);

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(mockedSignInRider).not.toHaveBeenCalled();
  expect(result.current.errors.phone).toBe("Ingresa un número de teléfono válido");
  expect(result.current.errors.password).toBe("Ingresa tu contraseña");
});

it("marks the phone as valid reactively and clears a previous error as the user types", async () => {
  const { result } = await renderHook(() => useLoginForm());

  await act(async () => {
    await result.current.onSubmit();
  });
  expect(result.current.errors.phone).toBe("Ingresa un número de teléfono válido");

  await act(() => {
    result.current.setLocalPhone("3001112233");
  });

  expect(result.current.isPhoneValid).toBe(true);
  expect(result.current.errors.phone).toBeNull();
});

it("calls login with the composed E.164 phone number when fields are valid", async () => {
  mockedSignInRider.mockResolvedValueOnce(undefined);
  const { result } = await renderHook(() => useLoginForm());

  await act(() => {
    result.current.setLocalPhone("3001112233");
    result.current.setPassword("claveSegura123");
  });

  await act(async () => {
    await result.current.onSubmit();
  });

  expect(mockedSignInRider).toHaveBeenCalledWith({
    phone_number: "+573001112233",
    password: "claveSegura123",
  });
  expect(result.current.errors).toEqual({ phone: null, password: null });
});
