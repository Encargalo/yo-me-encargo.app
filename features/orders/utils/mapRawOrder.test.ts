import { mapRawOrder } from "./mapRawOrder";

describe("mapRawOrder", () => {
  it("mapea el shape real de /orders/rider (cliente a nivel raíz)", () => {
    const order = mapRawOrder({
      id: "41ecb744",
      number: 2,
      status: "On The Way",
      pickup_code: "453716",
      shop_id: "d33aaf08",
      address: "Av. Principal, Caracas",
      latitude: 10.178015,
      longitude: -66.815931,
      method_payment: "PagoMovil",
      delivery_fee: 0.48,
      delivery_fee_bs: 409.41,
      created_at: "2026-06-26T22:33:26Z",
    });

    expect(order.id).toBe("41ecb744");
    expect(order.number).toBe(2);
    expect(order.status).toBe("On The Way");
    expect(order.pickupCode).toBe("453716");
    // El restaurante hoy solo llega como shop_id → sin nombre ni coords.
    expect(order.shop.name).toBe("");
    expect(order.shop.latitude).toBeUndefined();
    // El cliente (entrega): dirección y coords vienen a nivel raíz.
    expect(order.customer.address).toBe("Av. Principal, Caracas");
    expect(order.customer.latitude).toBe(10.178015);
    expect(order.customer.longitude).toBe(-66.815931);
    expect(order.deliveryFee).toBe(0.48);
    expect(order.deliveryFeeBs).toBe(409.41);
    expect(order.methodPayment).toBe("PagoMovil");
  });

  it("soporta defensivamente restaurante/cliente anidados si el backend los agrega", () => {
    const order = mapRawOrder({
      id: "order-2",
      status: "Ready",
      code: "111111",
      shop: { name: "Sushi Bar", lat: 4.5, lng: -74.1 },
      customer: { name: "Ana", phone: "+573001112233" },
      distance: 1.1,
    });

    expect(order.pickupCode).toBe("111111");
    expect(order.shop.name).toBe("Sushi Bar");
    expect(order.shop.latitude).toBe(4.5);
    expect(order.customer.name).toBe("Ana");
    expect(order.customer.phone).toBe("+573001112233");
    expect(order.distanceKm).toBe(1.1);
  });

  it("aplica defaults seguros ante un payload vacío", () => {
    const order = mapRawOrder({});
    expect(order.id).toBe("");
    expect(order.status).toBe("Pending");
    expect(order.deliveryFee).toBe(0);
    expect(order.shop.name).toBe("");
    expect(order.customer.latitude).toBeUndefined();
    expect(typeof order.createdAt).toBe("string");
  });
});
