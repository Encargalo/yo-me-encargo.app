import { fireEvent, render } from "@testing-library/react-native";

import { DeliveryCodeInput } from "./DeliveryCodeInput";

describe("DeliveryCodeInput", () => {
  it("deshabilita confirmar hasta completar los dígitos y muestra el error inline", async () => {
    const onSubmit = jest.fn();
    const { getByText, rerender, toJSON } = await render(
      <DeliveryCodeInput
        code="123"
        onChangeCode={() => {}}
        onSubmit={onSubmit}
        submitting={false}
        color="#3b82f6"
      />,
    );

    fireEvent.press(getByText("Confirmar entrega"));
    expect(onSubmit).not.toHaveBeenCalled();

    await rerender(
      <DeliveryCodeInput
        code="4829"
        onChangeCode={() => {}}
        onSubmit={onSubmit}
        submitting={false}
        color="#3b82f6"
        error="Código inválido"
      />,
    );

    expect(getByText("Código inválido")).toBeTruthy();
    fireEvent.press(getByText("Confirmar entrega"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(toJSON()).toMatchSnapshot();
  });
});
