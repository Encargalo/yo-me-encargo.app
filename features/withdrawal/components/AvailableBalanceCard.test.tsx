import { render } from "@testing-library/react-native";

import { AvailableBalanceCard } from "./AvailableBalanceCard";

describe("AvailableBalanceCard", () => {
  it("muestra el saldo disponible en Bs con la referencia en USD", async () => {
    const { getByText, toJSON } = await render(
      <AvailableBalanceCard balanceBs={43505.03} balanceUsd={54.5} />,
    );

    expect(getByText("43.505,03Bs")).toBeTruthy();
    expect(getByText("Ref. 54.5$")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
