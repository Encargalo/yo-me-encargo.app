import { act, fireEvent, render } from "@testing-library/react-native";
import * as Linking from "expo-linking";

import { OrderPartyBlock } from "./OrderPartyBlock";

jest.mock("expo-linking", () => ({ openURL: jest.fn() }));

describe("OrderPartyBlock", () => {
  it("muestra navegar y llamar cuando hay coordenadas y teléfono", async () => {
    const { getByText, getByLabelText, toJSON } = await render(
      <OrderPartyBlock
        eyebrow="RESTAURANTE"
        role="shop"
        pinColor="#f59e0b"
        name="Goofy Delicias"
        address="Carrera 27 #72v-2"
        phone="+573156147912"
        latitude={10.179249}
        longitude={-66.815325}
      />,
    );

    expect(getByText("Goofy Delicias")).toBeTruthy();
    expect(getByText("Carrera 27 #72v-2")).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByLabelText("Llamar a Goofy Delicias"));
    });
    expect(Linking.openURL).toHaveBeenCalledWith("tel:+573156147912");

    await act(async () => {
      fireEvent.press(getByLabelText("Navegar a Goofy Delicias"));
    });
    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining("10.179249,-66.815325"),
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it("oculta llamar cuando no hay teléfono", async () => {
    const { queryByLabelText } = await render(
      <OrderPartyBlock
        eyebrow="CLIENTE"
        role="customer"
        pinColor="#3b82f6"
        name="Ruben"
      />,
    );

    expect(queryByLabelText("Llamar a Ruben")).toBeNull();
    expect(queryByLabelText("Navegar a Ruben")).toBeNull();
  });
});
