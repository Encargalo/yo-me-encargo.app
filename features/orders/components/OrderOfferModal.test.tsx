import { render } from "@testing-library/react-native";

import type { ActiveOrder } from "../types/order.types";
import { OrderOfferModal } from "./OrderOfferModal";

const offer: ActiveOrder = {
  id: "a4548189",
  number: 5,
  status: "In Preparation",
  shop: { name: "Pizza Roma" },
  customer: { name: "Laura", address: "55MJ+F5 La Cabrera, Venezuela" },
  deliveryFee: 0.64,
  createdAt: "0001-01-01T00:00:00Z",
};

describe("OrderOfferModal", () => {
  it("renderiza la oferta con comisión, distancia y acciones", async () => {
    const { toJSON, getByText } = await render(
      <OrderOfferModal
        offer={offer}
        secondsLeft={14}
        distanceKm={3.1}
        onAccept={() => {}}
        onReject={() => {}}
      />,
    );

    expect(getByText("Pizza Roma")).toBeTruthy();
    expect(getByText("$0.64")).toBeTruthy();
    expect(getByText("Aceptar")).toBeTruthy();
    expect(getByText("Rechazar")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
