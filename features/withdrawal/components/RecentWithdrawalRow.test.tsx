import { render } from "@testing-library/react-native";

import { RecentWithdrawalRow } from "./RecentWithdrawalRow";

describe("RecentWithdrawalRow", () => {
  it("retiro pendiente", async () => {
    const { getByText, toJSON } = await render(
      <RecentWithdrawalRow
        withdrawal={{
          amount: 720,
          date: "2026-06-30T12:00:00Z",
          status: "pending",
        }}
      />,
    );

    expect(getByText("720Bs")).toBeTruthy();
    expect(getByText("30 jun")).toBeTruthy();
    expect(getByText("Pendiente")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it("retiro procesado", async () => {
    const { getByText } = await render(
      <RecentWithdrawalRow
        withdrawal={{
          amount: 1200,
          date: "2026-06-28T12:00:00Z",
          status: "processed",
        }}
      />,
    );

    expect(getByText("Retirado")).toBeTruthy();
  });
});
