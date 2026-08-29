import { render } from "@testing-library/react-native";

import { AvailableBalanceCard } from "./AvailableBalanceCard";

describe("AvailableBalanceCard", () => {
  it("muestra el saldo disponible en Bs con el USD referencial", async () => {
    const { getByText, toJSON } = await render(
      <AvailableBalanceCard balanceBs={3200} balanceUsd={80} />,
    );

    expect(getByText("3.200Bs")).toBeTruthy();
    expect(getByText("Ref. 80$")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
