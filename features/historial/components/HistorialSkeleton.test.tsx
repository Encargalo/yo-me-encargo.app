import { render } from "@testing-library/react-native";

import { HistorialSkeleton } from "./HistorialSkeleton";

describe("HistorialSkeleton", () => {
  it("renderiza 5 filas por defecto", async () => {
    const { toJSON } = await render(<HistorialSkeleton />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renderiza 1 sola fila cuando se pide", async () => {
    const { toJSON } = await render(<HistorialSkeleton rows={1} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("muestra el label cuando se pasa (carga del set completo para un filtro)", async () => {
    const { getByText } = await render(
      <HistorialSkeleton label="Cargando historial completo para aplicar el filtro..." />,
    );
    expect(getByText("Cargando historial completo para aplicar el filtro...")).toBeTruthy();
  });
});
