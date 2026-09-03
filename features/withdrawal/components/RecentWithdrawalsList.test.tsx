import { render } from "@testing-library/react-native";

import { RecentWithdrawalsList } from "./RecentWithdrawalsList";

describe("RecentWithdrawalsList", () => {
  it("lista los retiros recientes", async () => {
    const { getByText, toJSON } = await render(
      <RecentWithdrawalsList
        withdrawals={[
          { amountBs: 1200, date: "2026-06-28T12:00:00Z", status: "processed" },
          { amountBs: 720, date: "2026-06-30T12:00:00Z", status: "pending" },
        ]}
      />,
    );

    expect(getByText("1.200Bs")).toBeTruthy();
    expect(getByText("720Bs")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("estado vacío cuando no hay retiros", async () => {
    const { getByText } = await render(<RecentWithdrawalsList withdrawals={[]} />);

    expect(getByText("Todavía no has solicitado ningún retiro.")).toBeTruthy();
  });
});
