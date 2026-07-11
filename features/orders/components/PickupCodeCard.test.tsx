import { render } from "@testing-library/react-native";

import { PickupCodeCard } from "./PickupCodeCard";

describe("PickupCodeCard", () => {
  it("muestra el código de recogida", async () => {
    const { getByText, toJSON } = await render(<PickupCodeCard code="4474" />);

    expect(getByText("4474")).toBeTruthy();
    expect(getByText("CÓDIGO DE RECOGIDA")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
