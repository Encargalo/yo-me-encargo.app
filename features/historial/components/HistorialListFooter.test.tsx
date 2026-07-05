import { render } from "@testing-library/react-native";

import { HistorialListFooter } from "./HistorialListFooter";

describe("HistorialListFooter", () => {
  it("renderiza la fila-skeleton durante loadingMore", async () => {
    const { toJSON } = await render(
      <HistorialListFooter status="loadingMore" onRetry={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("renderiza el mensaje de reintentar durante errorMore", async () => {
    const { toJSON } = await render(
      <HistorialListFooter status="errorMore" onRetry={jest.fn()} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("no renderiza nada en otros estados", async () => {
    const { toJSON } = await render(
      <HistorialListFooter status="success" onRetry={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });
});
