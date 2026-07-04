import { render } from "@testing-library/react-native";

import { AvailableBalanceCard } from "./AvailableBalanceCard";

describe("AvailableBalanceCard", () => {
  it("muestra el saldo disponible formateado", async () => {
    const { getByText, toJSON } = await render(
      <AvailableBalanceCard balance={24.5} />,
    );

    expect(getByText("24.5$")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
