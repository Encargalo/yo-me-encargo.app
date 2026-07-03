import { mapRawOrder } from "./mapRawOrder";

describe("mapRawOrder", () => {
  it("mapea el shape real de /orders/rider (order + shop + customer hermanos)", () => {
    const order = mapRawOrder({
      type: "new_order",
      order: {
        id: "f7a9ec8d-6192-404c-a057-3d2bdaac32f7",
        shop_id: "d33aaf08-2c43-41c4-b2e7-882b019edb1e",
        customer_id: "a9cca4e8-4956-4c02-8974-c0f698914703",
        batch_id: "21b5cab9-ce8e-40f8-82ad-4bb8689424c0",
        number: 1,
        method_payment: "PagoMovil",
        status: "In Preparation",
        delivery_fee: 0.96,
        delivery_fee_bs: 626.86,
        created_at: "0001-01-01T00:00:00Z",
      },
      shop: {
        id: "d33aaf08-2c43-41c4-b2e7-882b019edb1e",
        name: "Goofy Delicias",
        phone: "+573156147912",
        logo: "https://res.cloudinary.com/dxmvyitlc/image/upload/v1758042448/logo_c6lfsj.jpg",
        address: "a 72v-40 Carrera 27 #72v-2, Cali, Valle del Cauca",
        latitude: 10.179249,
        longitude: -66.815325,
      },
      customer: {
        address: "55MJ+G54 La Cabrera, Miranda, Venezuela",
        latitude: 10.1837597,
        longitude: -66.8195358,
      },
    });

    expect(order.id).toBe("f7a9ec8d-6192-404c-a057-3d2bdaac32f7");
    expect(order.number).toBe(1);
    expect(order.status).toBe("In Preparation");
    expect(order.methodPayment).toBe("PagoMovil");
    expect(order.shopId).toBe("d33aaf08-2c43-41c4-b2e7-882b019edb1e");
    expect(order.customerId).toBe("a9cca4e8-4956-4c02-8974-c0f698914703");
    expect(order.batchId).toBe("21b5cab9-ce8e-40f8-82ad-4bb8689424c0");
    // Restaurante: ahora sí llega con nombre, teléfono, logo y coords.
    expect(order.shop.name).toBe("Goofy Delicias");
    expect(order.shop.phone).toBe("+573156147912");
    expect(order.shop.logo).toBe(
      "https://res.cloudinary.com/dxmvyitlc/image/upload/v1758042448/logo_c6lfsj.jpg",
    );
    expect(order.shop.latitude).toBe(10.179249);
    expect(order.shop.longitude).toBe(-66.815325);
    // Cliente: dirección y coords vienen en su propio objeto hermano.
    expect(order.customer.address).toBe("55MJ+G54 La Cabrera, Miranda, Venezuela");
    expect(order.customer.latitude).toBe(10.1837597);
    expect(order.customer.longitude).toBe(-66.8195358);
    expect(order.deliveryFee).toBe(0.96);
    expect(order.deliveryFeeBs).toBe(626.86);
  });

  it("soporta defensivamente el shape plano anterior (sin `order` anidado)", () => {
    const order = mapRawOrder({
      id: "41ecb744",
      number: 2,
      status: "On The Way",
      pickup_code: "453716",
      address: "Av. Principal, Caracas",
      latitude: 10.178015,
      longitude: -66.815931,
      delivery_fee: 0.48,
      delivery_fee_bs: 409.41,
      created_at: "2026-06-26T22:33:26Z",
    });

    expect(order.id).toBe("41ecb744");
    expect(order.pickupCode).toBe("453716");
    // Sin `shop` hermano → sin nombre ni coords de tienda.
    expect(order.shop.name).toBe("");
    // Fallback: dirección/coords a nivel raíz de `order` = cliente.
    expect(order.customer.address).toBe("Av. Principal, Caracas");
    expect(order.customer.latitude).toBe(10.178015);
    expect(order.deliveryFee).toBe(0.48);
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
