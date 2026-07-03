import { render } from "@testing-library/react-native";

import type { ActiveOrder } from "../types/order.types";
import { OrdersMap } from "./OrdersMap";

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

describe("OrdersMap", () => {
  it("muestra el placeholder estático y no la etiqueta del mapa cuando enabled=false", async () => {
    const { getByText, queryByText } = await render(
      <OrdersMap region={null} riderStatus="loading" enabled={false} />,
    );

    expect(getByText("Actívate para ver el mapa")).toBeTruthy();
    expect(queryByText("MAPA EN TIEMPO REAL")).toBeNull();
  });

  it("renderiza el mapa activo sin pines de tienda/cliente cuando no hay orden enfocada", async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <OrdersMap region={REGION} riderStatus="granted" enabled={true} />,
    );

    expect(getByText("MAPA EN TIEMPO REAL")).toBeTruthy();
    expect(getByTestId("marker-rider")).toBeTruthy();
    expect(queryByTestId("marker-shop")).toBeNull();
    expect(queryByTestId("marker-customer")).toBeNull();
  });

  it("en recogida pendiente muestra la tienda a opacidad normal y el cliente atenuado", async () => {
    const order = makeOrder({ status: "Ready" });
    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        focusedOrder={order}
      />,
    );

    expect(getByTestId("marker-shop").props.opacity).toBe(1);
    expect(getByTestId("marker-customer").props.opacity).toBe(0.35);
  });

  it("en camino muestra el cliente a opacidad normal y la tienda atenuada", async () => {
    const order = makeOrder({ status: "On The Way" });
    const { getByTestId } = await render(
      <OrdersMap
        region={REGION}
        riderStatus="granted"
        enabled={true}
        focusedOrder={order}
      />,
    );

    expect(getByTestId("marker-shop").props.opacity).toBe(0.35);
    expect(getByTestId("marker-customer").props.opacity).toBe(1);
  });
});
