import { render } from "@testing-library/react-native";

import { MinimumBalanceNotice } from "./MinimumBalanceNotice";

describe("MinimumBalanceNotice", () => {
  it("muestra el mínimo vigente en Bs cuando el saldo lo alcanza", async () => {
    const { getByText, queryByText, toJSON } = await render(
      <MinimumBalanceNotice withdrawalMinBs={600} balanceBs={3200} />,
    );

    expect(getByText("600Bs")).toBeTruthy();
    expect(queryByText(/Te faltan/)).toBeNull();
    expect(toJSON()).toMatchSnapshot();
  });

  it("añade cuánto falta cuando el saldo está por debajo del mínimo", async () => {
    const { getByText } = await render(
      <MinimumBalanceNotice withdrawalMinBs={600} balanceBs={200} />,
    );

    expect(getByText("600Bs")).toBeTruthy();
    expect(getByText("400Bs")).toBeTruthy();
  });

  it("muestra el aviso genérico sin número cuando falta withdrawalMinBs", async () => {
    const { getByText, queryByText } = await render(
      <MinimumBalanceNotice withdrawalMinBs={undefined} balanceBs={200} />,
    );

    expect(getByText(/mínimo vigente/)).toBeTruthy();
    expect(queryByText(/Bs/)).toBeNull();
  });
});
