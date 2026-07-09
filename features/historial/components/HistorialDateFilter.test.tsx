import { act, fireEvent, render } from "@testing-library/react-native";

import { HistorialDateFilter } from "./HistorialDateFilter";

// El picker nativo real (imperativo en Android, vista nativa en iOS) no es
// ejercitable en jsdom/test-renderer — se reemplaza por un host stub que
// expone `testID`/`onChange` tal cual los pasa nuestro componente, para
// testear nuestra lógica (no la del picker, ya probada upstream). `require`
// dentro del factory (en vez de un import de nivel superior) es necesario:
// `jest.mock` se hoistea sobre los imports, y `View` real no acepta `onChange`
// en su tipo — este stub no es la vista real, solo necesita exponer las
// mismas dos props que ya usa nuestro componente.
jest.mock("@react-native-community/datetimepicker", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- ver nota arriba
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({
      testID,
      onChange,
    }: {
      testID?: string;
      onChange: (...args: unknown[]) => void;
    }) => <View testID={testID} onChange={onChange} />,
  };
});

type Getters = Pick<
  Awaited<ReturnType<typeof render>>,
  "getByText" | "getByTestId"
>;

// Cada interacción se envuelve en su propio `act()` — encadenarlas en un solo
// bloque produce "overlapping act() calls" con el scheduler de React 19.
async function pickDate(
  { getByText, getByTestId }: Getters,
  label: "Desde" | "Hasta",
  date: Date,
) {
  await act(async () => {
    fireEvent.press(getByText(label));
  });
  await act(async () => {
    fireEvent(getByTestId("historial-date-picker"), "onChange", {}, date);
  });
}

describe("HistorialDateFilter", () => {
  it("aplica el filtro automáticamente al elegir la segunda fecha, sin tocar 'Aplicar'", async () => {
    const onApply = jest.fn();
    const screen = await render(
      <HistorialDateFilter dateRange={null} onApply={onApply} onClear={jest.fn()} />,
    );

    await pickDate(screen, "Desde", new Date("2026-06-10T00:00:00Z"));
    expect(onApply).not.toHaveBeenCalled();

    await pickDate(screen, "Hasta", new Date("2026-06-20T00:00:00Z"));

    expect(onApply).toHaveBeenCalledWith({
      from: new Date("2026-06-10T00:00:00Z"),
      to: new Date("2026-06-20T00:00:00Z"),
    });
  });

  it("el botón 'Aplicar' también dispara onApply una vez elegidas ambas fechas", async () => {
    const onApply = jest.fn();
    const screen = await render(
      <HistorialDateFilter dateRange={null} onApply={onApply} onClear={jest.fn()} />,
    );

    fireEvent.press(screen.getByText("Aplicar"));
    expect(onApply).not.toHaveBeenCalled();

    await pickDate(screen, "Desde", new Date("2026-06-10T00:00:00Z"));
    await pickDate(screen, "Hasta", new Date("2026-06-20T00:00:00Z"));
    onApply.mockClear();

    await act(async () => {
      fireEvent.press(screen.getByText("Aplicar"));
    });

    expect(onApply).toHaveBeenCalledWith({
      from: new Date("2026-06-10T00:00:00Z"),
      to: new Date("2026-06-20T00:00:00Z"),
    });
  });

  it("Aplicar no dispara onApply mientras falte una fecha", async () => {
    const onApply = jest.fn();
    const screen = await render(
      <HistorialDateFilter dateRange={null} onApply={onApply} onClear={jest.fn()} />,
    );

    fireEvent.press(screen.getByText("Aplicar"));
    expect(onApply).not.toHaveBeenCalled();

    await pickDate(screen, "Desde", new Date("2026-06-10T00:00:00Z"));

    fireEvent.press(screen.getByText("Aplicar"));
    expect(onApply).not.toHaveBeenCalled();
  });

  it("limpiar filtro llama a onClear cuando hay un filtro activo", async () => {
    const onClear = jest.fn();
    const { getByText } = await render(
      <HistorialDateFilter
        dateRange={{
          from: new Date("2026-06-01T00:00:00Z"),
          to: new Date("2026-06-30T00:00:00Z"),
        }}
        onApply={jest.fn()}
        onClear={onClear}
      />,
    );

    fireEvent.press(getByText("Limpiar filtro"));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("no muestra 'Limpiar filtro' cuando no hay filtro activo", async () => {
    const { queryByText } = await render(
      <HistorialDateFilter dateRange={null} onApply={jest.fn()} onClear={jest.fn()} />,
    );
    expect(queryByText("Limpiar filtro")).toBeNull();
  });
});
