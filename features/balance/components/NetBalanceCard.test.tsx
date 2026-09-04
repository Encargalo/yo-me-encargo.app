import { render } from "@testing-library/react-native";

import { NetBalanceCard } from "./NetBalanceCard";

describe("NetBalanceCard", () => {
  it("muestra el saldo positivo en Bs, el USD referencial, zona y desglose", async () => {
    const { getByText, toJSON } = await render(
      <NetBalanceCard
        balanceBs={3200}
        balanceUsd={80}
        zone="withdrawal_available"
        summary={{ earnedBs: 1520, deductedBs: 540 }}
      />,
    );

    expect(getByText("3.200Bs")).toBeTruthy();
    expect(getByText("Ref. 80$")).toBeTruthy();
    expect(getByText("Zona: withdrawal_available")).toBeTruthy();
    expect(getByText("+1.520Bs")).toBeTruthy();
    expect(getByText("−540Bs")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("muestra el saldo negativo en Bs", async () => {
    const { getByText } = await render(
      <NetBalanceCard
        balanceBs={-200}
        balanceUsd={-5}
        zone="normal"
        summary={{ earnedBs: 0, deductedBs: 200 }}
      />,
    );

    expect(getByText("-200Bs")).toBeTruthy();
    expect(getByText("Ref. -5$")).toBeTruthy();
  });
});
