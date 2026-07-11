import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import MapView from "react-native-maps";

import { OrderStatusColors } from "@/constants/theme";

import type { ActiveOrder } from "../types/order.types";
import { lightenColor } from "../utils/color";
import { SECONDARY_ROUTE_LIGHTEN_RATIO } from "../utils/routeStage";
import { FOLLOW_ZOOM_DELTA, OrdersMap } from "./OrdersMap";

jest.mock("expo-location", () => ({
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  Accuracy: { High: 4, Balanced: 3 },
}));

const mockedLocation = jest.requireMock("expo-location");

const REGION = {
  latitude: 10.48,
  longitude: -66.9,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

function makeOrder(overrides: Partial<ActiveOrder> = {}): ActiveOrder {
  return {
    id: "order-1",
    status: "Ready",
    riderId: "rider-1",
    shop: { name: "Tienda", latitude: 10.5, longitude: -66.91 },
    customer: { name: "Cliente", latitude: 10.46, longitude: -66.88 },
    deliveryFee: 1,
    createdAt: "2026-07-03T00:00:00Z",
    ...overrides,
  };
}

// Respuesta mínima válida de la Directions API — solo lo que `MapViewDirections`
// necesita para pasar de `null` a renderizar su `Polyline` con las props que le
// pasamos (incluido `strokeColor`), sin importar la geometría real de la ruta.
const DIRECTIONS_RESPONSE = {
  status: "OK",
  routes: [
    {
      legs: [{ distance: { value: 1000 }, duration: { value: 120 } }],
      overview_polyline: { points: "" },
    },
  ],
};

describe("OrdersMap", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(DIRECTIONS_RESPONSE),
      }),
    ) as unknown as typeof fetch;
    mockedLocation.watchPositionAsync.mockReset();
    mockedLocation.watchPositionAsync.mockImplementation(() =>
      Promise.resolve({ remove: jest.fn() }),
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("muestra el placeholder estático y no la etiqueta del mapa cuando enabled=false", async () => {
    const { getByText, queryByText } = await render(
      <OrdersMap region={null} riderStatus="loading" enabled={false} />,
    );

    expect(getByText("Actívate para ver el mapa")).toBeTruthy();
    expect(queryByText("TOCA PARA VER EN PANTALLA COMPLETA")).toBeNull();
  });

  it("renderiza el mapa activo sin pines de tienda/cliente cuando no hay orden enfocada", async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} />,
    );

    expect(getByText("TOCA PARA VER EN PANTALLA COMPLETA")).toBeTruthy();
    expect(getByTestId("marker-rider")).toBeTruthy();
    expect(queryByTestId("pin-shop-order-1")).toBeNull();
    expect(queryByTestId("pin-customer-order-1")).toBeNull();
  });

  it("en recogida pendiente muestra la tienda a opacidad normal y el cliente atenuado", async () => {
    const order = makeOrder({ status: "Ready" });
    const { getByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} focusedOrders={[order]} />,
    );

    expect(getByTestId("pin-shop-order-1").props.style.opacity).toBe(1);
    expect(getByTestId("pin-customer-order-1").props.style.opacity).toBe(0.35);
  });

  it("en camino muestra el cliente a opacidad normal y la tienda atenuada", async () => {
    const order = makeOrder({ status: "On The Way" });
    const { getByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} focusedOrders={[order]} />,
    );

    expect(getByTestId("pin-shop-order-1").props.style.opacity).toBe(0.35);
    expect(getByTestId("pin-customer-order-1").props.style.opacity).toBe(1);
  });

  it("con 2 órdenes en etapas distintas, pinta ambas rutas y prioriza la que va en camino", async () => {
    const enroute = makeOrder({
      id: "order-enroute",
      status: "On The Way",
      customer: { name: "Cliente", latitude: 10.46, longitude: -66.88 },
    });
    const pending = makeOrder({
      id: "order-pending",
      status: "Ready",
      shop: { name: "Tienda", latitude: 10.5, longitude: -66.91 },
    });

    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        focusedOrders={[pending, enroute]}
      />,
    );

    // Pines de ambas órdenes presentes.
    expect(getByTestId("pin-shop-order-pending")).toBeTruthy();
    expect(getByTestId("pin-customer-order-enroute")).toBeTruthy();

    await waitFor(() => {
      expect(getByTestId("route-order-enroute")).toBeTruthy();
      expect(getByTestId("route-order-pending")).toBeTruthy();
    });

    // La ruta "En camino" es la prioritaria (color normal); la de recogida
    // pendiente, secundaria, usa una variante clarificada del mismo ámbar.
    expect(getByTestId("route-order-enroute").props.strokeColor).toBe(OrderStatusColors.enroute);
    expect(getByTestId("route-order-pending").props.strokeColor).toBe(
      lightenColor(OrderStatusColors.pending, SECONDARY_ROUTE_LIGHTEN_RATIO),
    );
  });

  it("con 2 órdenes en la misma etapa, prioriza la ruta más cercana al rider", async () => {
    const near = makeOrder({
      id: "order-near",
      status: "On The Way",
      customer: { name: "Cliente cerca", latitude: 10.481, longitude: -66.901 },
    });
    const far = makeOrder({
      id: "order-far",
      status: "On The Way",
      customer: { name: "Cliente lejos", latitude: 11, longitude: -67.5 },
    });

    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        focusedOrders={[far, near]}
      />,
    );

    await waitFor(() => {
      expect(getByTestId("route-order-near")).toBeTruthy();
      expect(getByTestId("route-order-far")).toBeTruthy();
    });

    expect(getByTestId("route-order-near").props.strokeColor).toBe(OrderStatusColors.enroute);
    expect(getByTestId("route-order-far").props.strokeColor).toBe(
      lightenColor(OrderStatusColors.enroute, SECONDARY_ROUTE_LIGHTEN_RATIO),
    );
  });

  it("sin ninguna orden enfocada, encuadra solo sobre el rider (animateToRegion, 1 punto)", async () => {
    const fitToCoordinates = jest
      .spyOn(MapView.prototype, "fitToCoordinates")
      .mockImplementation(() => {});
    const animateToRegion = jest
      .spyOn(MapView.prototype, "animateToRegion")
      .mockImplementation(() => {});

    const { getByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} />,
    );

    await act(async () => {
      getByTestId("map-view").props.onMapReady();
    });

    expect(animateToRegion).toHaveBeenCalledTimes(1);
    const [singleRegion] = animateToRegion.mock.calls[0];
    expect(singleRegion.latitude).toBe(REGION.latitude);
    expect(singleRegion.longitude).toBe(REGION.longitude);
    expect(fitToCoordinates).not.toHaveBeenCalled();
  });

  it("con 1 orden encuadra rider + su destino de etapa actual (2 puntos, no tienda+cliente)", async () => {
    const fitToCoordinates = jest
      .spyOn(MapView.prototype, "fitToCoordinates")
      .mockImplementation(() => {});

    const order = makeOrder({ status: "Ready" }); // recogida pendiente → destino = tienda
    const { getByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} focusedOrders={[order]} />,
    );

    await act(async () => {
      getByTestId("map-view").props.onMapReady();
    });

    expect(fitToCoordinates).toHaveBeenCalledTimes(1);
    const [points] = fitToCoordinates.mock.calls[0];
    expect(points).toHaveLength(2);
    expect(points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          latitude: REGION.latitude,
          longitude: REGION.longitude,
        }),
        expect.objectContaining({ latitude: 10.5, longitude: -66.91 }), // tienda
      ]),
    );
  });

  it("con 2 órdenes encuadra rider + los 2 destinos de etapa (no tienda+cliente de ambas)", async () => {
    const fitToCoordinates = jest
      .spyOn(MapView.prototype, "fitToCoordinates")
      .mockImplementation(() => {});

    const enroute = makeOrder({
      id: "order-enroute",
      status: "On The Way",
      customer: { name: "Cliente", latitude: 10.46, longitude: -66.88 },
    });
    const pending = makeOrder({
      id: "order-pending",
      status: "Ready",
      shop: { name: "Tienda", latitude: 10.5, longitude: -66.91 },
    });

    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        focusedOrders={[pending, enroute]}
      />,
    );

    await act(async () => {
      getByTestId("map-view").props.onMapReady();
    });

    expect(fitToCoordinates).toHaveBeenCalledTimes(1);
    const [points] = fitToCoordinates.mock.calls[0];
    // rider + destino de la orden en camino (cliente) + destino de la orden
    // en recogida pendiente (tienda) = 3 puntos, nunca tienda+cliente de ambas.
    expect(points).toHaveLength(3);
    expect(points).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          latitude: REGION.latitude,
          longitude: REGION.longitude,
        }),
        expect.objectContaining({ latitude: 10.46, longitude: -66.88 }), // cliente (en camino)
        expect.objectContaining({ latitude: 10.5, longitude: -66.91 }), // tienda (recogida pendiente)
      ]),
    );
  });

  it("un tap corto sobre el mapa reducido abre pantalla completa", async () => {
    const onRequestFullscreen = jest.fn();
    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        isFullscreen={false}
        onRequestFullscreen={onRequestFullscreen}
      />,
    );

    const touchZone = getByTestId("map-touch-zone");
    await act(async () => {
      fireEvent(touchZone, "touchStart", {
        nativeEvent: { pageX: 100, pageY: 100 },
      });
      fireEvent(touchZone, "touchEnd", {
        nativeEvent: { pageX: 101, pageY: 101 },
      });
    });

    expect(onRequestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("un arrastre largo sobre el mapa reducido NO abre pantalla completa", async () => {
    const onRequestFullscreen = jest.fn();
    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        isFullscreen={false}
        onRequestFullscreen={onRequestFullscreen}
      />,
    );

    const touchZone = getByTestId("map-touch-zone");
    await act(async () => {
      fireEvent(touchZone, "touchStart", {
        nativeEvent: { pageX: 0, pageY: 0 },
      });
      fireEvent(touchZone, "touchEnd", {
        nativeEvent: { pageX: 200, pageY: 200 },
      });
    });

    expect(onRequestFullscreen).not.toHaveBeenCalled();
  });

  it("en pantalla completa muestra el control de cerrar en vez de la etiqueta de tap, y lo invoca al tocarlo", async () => {
    const onRequestClose = jest.fn();
    const { getByTestId, queryByText } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        isFullscreen={true}
        onRequestClose={onRequestClose}
      />,
    );

    expect(queryByText("TOCA PARA VER EN PANTALLA COMPLETA")).toBeNull();
    // Sin detector de tap activo en pantalla completa (ya está abierta).
    expect(getByTestId("map-touch-zone").props.onTouchStart).toBeUndefined();

    fireEvent.press(getByTestId("close-fullscreen-button"));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("el botón de seguimiento activa la posición en vivo y centra la cámara con zoom cercano", async () => {
    let emitLocation: (location: {
      coords: { latitude: number; longitude: number };
    }) => void = () => {};
    mockedLocation.watchPositionAsync.mockImplementation(
      (_options: unknown, callback: typeof emitLocation) => {
        emitLocation = callback;
        return Promise.resolve({ remove: jest.fn() });
      },
    );
    const animateToRegion = jest
      .spyOn(MapView.prototype, "animateToRegion")
      .mockImplementation(() => {});

    const { getByTestId, getByText } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} />,
    );

    await act(async () => {
      fireEvent.press(getByTestId("follow-toggle-button"));
    });

    expect(mockedLocation.watchPositionAsync).toHaveBeenCalledTimes(1);
    expect(getByText("Siguiendo…")).toBeTruthy();

    animateToRegion.mockClear();
    await act(async () => {
      emitLocation({ coords: { latitude: 10.5, longitude: -66.95 } });
    });

    expect(animateToRegion).toHaveBeenCalledWith(
      {
        latitude: 10.5,
        longitude: -66.95,
        latitudeDelta: FOLLOW_ZOOM_DELTA,
        longitudeDelta: FOLLOW_ZOOM_DELTA,
      },
      500,
    );
  });

  it("mientras el seguimiento está activo, no se ejecuta el encuadre de rutas (no compite por la cámara)", async () => {
    const fitToCoordinates = jest
      .spyOn(MapView.prototype, "fitToCoordinates")
      .mockImplementation(() => {});
    jest.spyOn(MapView.prototype, "animateToRegion").mockImplementation(() => {});

    const order = makeOrder({ status: "Ready" });
    const { getByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} focusedOrders={[order]} />,
    );

    await act(async () => {
      fireEvent.press(getByTestId("follow-toggle-button"));
    });

    await act(async () => {
      getByTestId("map-view").props.onMapReady();
    });

    expect(fitToCoordinates).not.toHaveBeenCalled();
  });

  it("un pan manual (onPanDrag) desactiva el seguimiento", async () => {
    jest.spyOn(MapView.prototype, "animateToRegion").mockImplementation(() => {});

    const { getByTestId, getByText, queryByText } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} />,
    );

    await act(async () => {
      fireEvent.press(getByTestId("follow-toggle-button"));
    });
    expect(getByText("Siguiendo…")).toBeTruthy();

    await act(async () => {
      getByTestId("map-view").props.onPanDrag();
    });

    expect(queryByText("Siguiendo…")).toBeNull();
    expect(getByText("Hacer seguimiento")).toBeTruthy();
  });

  it("con followEnabled controlado por el padre, refleja ese valor y no lo cambia por su cuenta", async () => {
    const onFollowChange = jest.fn();
    const { getByTestId, getByText } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        followEnabled={true}
        onFollowChange={onFollowChange}
      />,
    );

    // Ya muestra "Siguiendo…" sin tocar el botón — viene controlado por el padre
    // (así persiste al pasar del mapa chico al de pantalla completa, que son
    // 2 instancias distintas de OrdersMap).
    expect(getByText("Siguiendo…")).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId("follow-toggle-button"));
    });

    // Notifica al padre el cambio; no lo aplica por su cuenta porque el prop
    // sigue en `true` (el padre es quien decide si vuelve a renderizar en `false`).
    expect(onFollowChange).toHaveBeenCalledWith(false);
    expect(getByText("Siguiendo…")).toBeTruthy();
  });
});
