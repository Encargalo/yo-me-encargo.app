import { fireEvent, render } from "@testing-library/react-native";

import { HistorialPagination } from "./HistorialPagination";

describe("HistorialPagination", () => {
  it("deshabilita 'Anterior' en la primera página", async () => {
    const onPageChange = jest.fn();
    const { getByText } = await render(
      <HistorialPagination page={1} totalPages={3} onPageChange={onPageChange} />,
    );

    fireEvent.press(getByText("Anterior"));
    expect(onPageChange).not.toHaveBeenCalled();
    expect(getByText("Página 1 de 3")).toBeTruthy();
  });

  it("deshabilita 'Siguiente' en la última página", async () => {
    const onPageChange = jest.fn();
    const { getByText } = await render(
      <HistorialPagination page={3} totalPages={3} onPageChange={onPageChange} />,
    );

    fireEvent.press(getByText("Siguiente"));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("dispara el cambio de página al tocar 'Siguiente'/'Anterior' en una página intermedia", async () => {
    const onPageChange = jest.fn();
    const { getByText } = await render(
      <HistorialPagination page={2} totalPages={3} onPageChange={onPageChange} />,
    );

    fireEvent.press(getByText("Siguiente"));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.press(getByText("Anterior"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
