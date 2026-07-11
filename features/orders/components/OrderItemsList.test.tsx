import { act, fireEvent, render } from "@testing-library/react-native";

import type { OrderItem } from "../types/order.types";
import { OrderItemsList } from "./OrderItemsList";

const items: OrderItem[] = [
  {
    id: "1",
    name: "Pizza 6 Porciones",
    amount: 7,
    flavors: [{ id: "f1", name: "Pollo y Jamón", amount: 1 }],
  },
  {
    id: "2",
    name: "Perro Ranchero",
    amount: 4,
    additions: [{ id: "a1", name: "Maduro", amount: 4 }],
  },
];

describe("OrderItemsList", () => {
  it("no renderiza nada sin productos", async () => {
    const { toJSON } = await render(<OrderItemsList items={[]} />);
    expect(toJSON()).toBeNull();
  });

  it("expande y muestra productos con sabores y adiciones", async () => {
    const { getByText, queryByText, toJSON } = await render(<OrderItemsList items={items} />);

    expect(getByText("Productos · 2")).toBeTruthy();
    expect(queryByText("7x Pizza 6 Porciones")).toBeNull();

    await act(async () => {
      fireEvent.press(getByText("Productos · 2"));
    });

    expect(getByText("7x Pizza 6 Porciones")).toBeTruthy();
    expect(getByText("Sabor: Pollo y Jamón")).toBeTruthy();
    expect(getByText("Adición: Maduro x4")).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
