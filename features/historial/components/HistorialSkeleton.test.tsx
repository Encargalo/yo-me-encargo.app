import { render } from "@testing-library/react-native";

import { HistorialSkeleton } from "./HistorialSkeleton";

describe("HistorialSkeleton", () => {
  it("renderiza 5 filas por defecto", async () => {
    const { toJSON } = await render(<HistorialSkeleton />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renderiza 1 sola fila cuando se pide (uso en el footer de carga)", async () => {
    const { toJSON } = await render(<HistorialSkeleton rows={1} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
