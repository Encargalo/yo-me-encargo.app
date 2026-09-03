import { render } from "@testing-library/react-native";

import { MinimumBalanceNotice } from "./MinimumBalanceNotice";

describe("MinimumBalanceNotice", () => {
  it("por debajo del mínimo muestra cuánto falta", async () => {
    const { getByText, toJSON } = await render(
      <MinimumBalanceNotice withdrawalMinBs={600} balanceBs={250} />,
    );

    expect(getByText("350Bs")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("alcanzado el mínimo muestra el umbral vigente", async () => {
    const { getByText, queryByText } = await render(
      <MinimumBalanceNotice withdrawalMinBs={600} balanceBs={980} />,
    );

    expect(getByText("600Bs")).toBeTruthy();
    expect(queryByText(/Te faltan/)).toBeNull();
  });

  it("usa el mínimo del backend, no un umbral fijo", async () => {
    const { getByText } = await render(
      <MinimumBalanceNotice withdrawalMinBs={1250.5} balanceBs={0} />,
    );

    expect(getByText("1.250,5Bs")).toBeTruthy();
  });
});
