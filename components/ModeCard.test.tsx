import { fireEvent, render } from "@testing-library/react-native";

import { ModeCard } from "./ModeCard";

const illustration = { uri: "illustration.png" };

describe("ModeCard", () => {
  it("muestra título y descripción, y dispara onPress al tocar la tarjeta", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <ModeCard
        illustration={illustration}
        title="Conductor"
        description="Aplica para hacer conductor aqui"
        onPress={onPress}
      />,
    );

    expect(getByText("Conductor")).toBeTruthy();
    expect(getByText("Aplica para hacer conductor aqui")).toBeTruthy();

    fireEvent.press(getByText("Conductor"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("no mezcla el onPress entre dos tarjetas renderizadas juntas", async () => {
    const onPressPasajero = jest.fn();
    const onPressConductor = jest.fn();
    const { getByText } = await render(
      <>
        <ModeCard
          illustration={illustration}
          title="Pasajero"
          description="Pide una moto o un carro"
          onPress={onPressPasajero}
        />
        <ModeCard
          illustration={illustration}
          title="Conductor"
          description="Aplica para hacer conductor aqui"
          onPress={onPressConductor}
        />
      </>,
    );

    fireEvent.press(getByText("Conductor"));

    expect(onPressConductor).toHaveBeenCalledTimes(1);
    expect(onPressPasajero).not.toHaveBeenCalled();
  });
});
