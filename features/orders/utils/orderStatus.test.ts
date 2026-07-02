import { OrderStatusColors } from "@/constants/theme";

import {
  getStatusColor,
  getStatusLabel,
  getStatusPriority,
  normalizeStatus,
} from "./orderStatus";

describe("normalizeStatus", () => {
  it("normaliza variantes sin espacio y con distinta capitalización", () => {
    expect(normalizeStatus("ontheway")).toBe("On The Way");
    expect(normalizeStatus("ON THE WAY")).toBe("On The Way");
    expect(normalizeStatus(" in preparation ")).toBe("In Preparation");
  });

  it("cae en 'Pending' cuando el valor es vacío o ausente", () => {
    expect(normalizeStatus(undefined)).toBe("Pending");
    expect(normalizeStatus("")).toBe("Pending");
  });

  it("deja pasar un status desconocido tal cual", () => {
    expect(normalizeStatus("Something New")).toBe("Something New");
  });
});

describe("getStatusColor / getStatusLabel", () => {
  it("mapea cada estado al color de estado correcto", () => {
    expect(getStatusColor("Ready")).toBe(OrderStatusColors.pending);
    expect(getStatusColor("On The Way")).toBe(OrderStatusColors.enroute);
    expect(getStatusColor("Completed")).toBe(OrderStatusColors.completed);
    expect(getStatusColor("Rejected")).toBe(OrderStatusColors.error);
  });

  it("da una etiqueta legible por color", () => {
    expect(getStatusLabel("Ready")).toBe("Recogida pendiente");
    expect(getStatusLabel("On The Way")).toBe("Entregando");
  });
});

describe("getStatusPriority", () => {
  it("prioriza 'On The Way' sobre los estados de recogida pendiente", () => {
    expect(getStatusPriority("On The Way")).toBeGreaterThan(
      getStatusPriority("Ready"),
    );
  });
});
