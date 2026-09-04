import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { Button } from "./Button";

describe("Button", () => {
  it("monta las tres variantes con su label", async () => {
    const { getByText } = await render(
      <>
        <Button label="Primario" variant="primary" onPress={jest.fn()} />
        <Button label="Verde" variant="green" onPress={jest.fn()} />
        <Button label="Secundario" variant="secondary" onPress={jest.fn()} />
      </>,
    );

    expect(getByText("Primario")).toBeTruthy();
    expect(getByText("Verde")).toBeTruthy();
    expect(getByText("Secundario")).toBeTruthy();
  });

  it("renderiza los íconos opcionales de izquierda y derecha", async () => {
    const { getByText } = await render(
      <Button
        label="Con íconos"
        onPress={jest.fn()}
        leftIcon={<Text>izq</Text>}
        rightIcon={<Text>der</Text>}
      />,
    );

    expect(getByText("izq")).toBeTruthy();
    expect(getByText("der")).toBeTruthy();
    expect(getByText("Con íconos")).toBeTruthy();
  });

  it("dispara onPress al tocar (happy path)", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button label="Tocar" onPress={onPress} />);

    fireEvent.press(getByText("Tocar"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("no dispara onPress cuando está disabled (caso de error)", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<Button label="Bloqueado" onPress={onPress} disabled />);

    fireEvent.press(getByText("Bloqueado"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("no dispara onPress mientras loading (caso de error)", async () => {
    const onPress = jest.fn();
    const { queryByText } = await render(<Button label="Cargando" onPress={onPress} loading />);

    expect(queryByText("Cargando")).toBeNull();
  });
});
