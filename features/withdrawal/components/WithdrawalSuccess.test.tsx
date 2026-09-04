import { fireEvent, render } from "@testing-library/react-native";

import { WithdrawalSuccess } from "./WithdrawalSuccess";

describe("WithdrawalSuccess", () => {
  it("muestra el monto retirado y llama a onDismiss", async () => {
    const onDismiss = jest.fn();
    const { getByText, toJSON } = await render(
      <WithdrawalSuccess amountWithdrawn={3200} onDismiss={onDismiss} />,
    );

    expect(getByText("Retiro solicitado")).toBeTruthy();
    expect(getByText("3.200Bs")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();

    fireEvent.press(getByText("Entendido"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
