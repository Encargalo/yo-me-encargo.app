import { render } from "@testing-library/react-native";

import { MinimumBalanceNotice } from "./MinimumBalanceNotice";

describe("MinimumBalanceNotice", () => {
  it("muestra el umbral mínimo formateado", async () => {
    const { getByText, toJSON } = await render(<MinimumBalanceNotice />);

    expect(getByText("0.1$")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
