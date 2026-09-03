import { fireEvent, render } from "@testing-library/react-native";

import { WithdrawalSuccess } from "./WithdrawalSuccess";

describe("WithdrawalSuccess", () => {
  it("muestra el monto retirado y llama a onDismiss", async () => {
    const onDismiss = jest.fn();
    const { getByText, toJSON } = await render(
      <WithdrawalSuccess amountWithdrawnBs={980} onDismiss={onDismiss} />,
    );

    expect(getByText("Retiro solicitado")).toBeTruthy();
    expect(getByText("980Bs")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();

    fireEvent.press(getByText("Entendido"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
