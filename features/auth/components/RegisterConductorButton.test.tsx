import { fireEvent, render } from "@testing-library/react-native";

import { RegisterConductorButton } from "./RegisterConductorButton";

describe("RegisterConductorButton", () => {
  it("muestra el label y dispara onPress al tocar", async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<RegisterConductorButton onPress={onPress} />);

    expect(getByText("Registrarme como conductor")).toBeTruthy();

    fireEvent.press(getByText("Registrarme como conductor"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
