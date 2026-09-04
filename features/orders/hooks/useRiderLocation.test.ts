import { act, renderHook } from "@testing-library/react-native";

import { useRiderLocation } from "./useRiderLocation";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const mockedLocation = jest.requireMock("expo-location");

describe("useRiderLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("no solicita permiso ni posición cuando enabled=false", async () => {
    const { result } = await renderHook(() => useRiderLocation(false));

    expect(mockedLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(result.current.status).toBe("loading");
    expect(result.current.region).toBeNull();
  });

  it("solicita permiso y posición al pasar de enabled=false a true", async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: "granted",
    });
    mockedLocation.getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 10.48, longitude: -66.9 },
    });

    const { result, rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useRiderLocation(enabled),
      { initialProps: { enabled: false } },
    );
    expect(mockedLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();

    await act(async () => {
      rerender({ enabled: true });
    });

    expect(mockedLocation.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("granted");
    expect(result.current.region?.latitude).toBe(10.48);
  });
});
