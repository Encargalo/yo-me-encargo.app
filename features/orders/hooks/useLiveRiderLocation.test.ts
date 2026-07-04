import { act, renderHook } from "@testing-library/react-native";

import { useLiveRiderLocation } from "./useLiveRiderLocation";

jest.mock("expo-location", () => ({
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
}));

const mockedLocation = jest.requireMock("expo-location");

describe("useLiveRiderLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("no observa la posición cuando enabled=false", async () => {
    const { result } = await renderHook(() => useLiveRiderLocation(false));

    expect(mockedLocation.watchPositionAsync).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("al pasar a enabled=true, observa la posición y se actualiza con cada callback", async () => {
    let emit: (location: { coords: { latitude: number; longitude: number } }) => void =
      () => {};
    mockedLocation.watchPositionAsync.mockImplementation(
      (_options: unknown, callback: typeof emit) => {
        emit = callback;
        return Promise.resolve({ remove: jest.fn() });
      },
    );

    const { result, rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useLiveRiderLocation(enabled),
      { initialProps: { enabled: false } },
    );

    await act(async () => {
      rerender({ enabled: true });
    });

    expect(mockedLocation.watchPositionAsync).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();

    await act(async () => {
      emit({ coords: { latitude: 10.48, longitude: -66.9 } });
    });

    expect(result.current).toEqual({ latitude: 10.48, longitude: -66.9 });
  });

  it("cancela la suscripción al volver a enabled=false", async () => {
    const remove = jest.fn();
    mockedLocation.watchPositionAsync.mockResolvedValue({ remove });

    const { rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useLiveRiderLocation(enabled),
      { initialProps: { enabled: true } },
    );

    // Deja que la promesa de `watchPositionAsync` del montaje inicial
    // resuelva y `subscription` quede asignada antes de desactivar.
    await act(async () => {});

    await act(async () => {
      rerender({ enabled: false });
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
