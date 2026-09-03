import { render } from "@testing-library/react-native";

import { NetBalanceCard } from "./NetBalanceCard";

describe("NetBalanceCard", () => {
  it("muestra el saldo en Bs, la referencia en USD, zona y desglose", async () => {
    const { getByText, toJSON } = await render(
      <NetBalanceCard
        balanceBs={43505.03}
        balanceUsd={54.5}
        zone="normal"
        summary={{ earned: 10334.89, deducted: 17489.82 }}
      />,
    );

    expect(getByText("43.505,03Bs")).toBeTruthy();
    expect(getByText("Ref. 54.5$")).toBeTruthy();
    expect(getByText("Zona: normal")).toBeTruthy();
    expect(getByText("+10.334,89Bs")).toBeTruthy();
    expect(getByText("−17.489,82Bs")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("muestra el saldo negativo", async () => {
    const { getByText } = await render(
      <NetBalanceCard
        balanceBs={-200}
        balanceUsd={-5}
        zone="normal"
        summary={{ earned: 0, deducted: 200 }}
      />,
    );

    expect(getByText("-200Bs")).toBeTruthy();
  });
});
