import { render } from "@testing-library/react-native";

import { NetBalanceCard } from "./NetBalanceCard";

describe("NetBalanceCard", () => {
  it("muestra el saldo positivo, zona y desglose", async () => {
    const { getByText, toJSON } = await render(
      <NetBalanceCard
        balance={24.5}
        zone="normal"
        summary={{ earned: 38, deducted: 13.5 }}
      />,
    );

    expect(getByText("24.5$")).toBeTruthy();
    expect(getByText("Zona: normal")).toBeTruthy();
    expect(getByText("+38$")).toBeTruthy();
    expect(getByText("−13.5$")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("muestra el saldo negativo", async () => {
    const { getByText } = await render(
      <NetBalanceCard
        balance={-5}
        zone="normal"
        summary={{ earned: 0, deducted: 5 }}
      />,
    );

    expect(getByText("-5$")).toBeTruthy();
  });
});
