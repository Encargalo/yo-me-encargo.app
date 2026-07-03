import type {
  ActiveOrder,
  OrderItem,
  OrderItemOption,
  OrderParty,
} from "../types/order.types";
import { normalizeStatus } from "./orderStatus";

// El backend puede enviar el mensaje con nombres de campo alternativos dentro
// de cada parte. Se normaliza aquí, en un único punto, para que el store y la
// UI solo conozcan ActiveOrder. Todo el acoplamiento al shape crudo vive en
// este archivo.
//
// Shape real confirmado en `/orders/rider` (order_update / new_order):
// { type, order: { id, shop_id, customer_id, batch_id, rider_id?, number,
//                   method_payment, status, pickup_code?, delivery_fee,
//                   delivery_fee_bs, created_at },
//   shop: { id, name, phone, logo, address, latitude, longitude },
//   customer: { address, latitude, longitude } }
// `shop` y `customer` viajan como HERMANOS de `order` en la raíz del mensaje,
// no anidados dentro de él. `rider_id` vacío/ausente = oferta disponible; con
// valor = ya la tomó algún rider.
interface RawParty {
  name?: string;
  address?: string;
  phone?: string;
  phone_number?: string;
  logo?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  long?: number;
}

interface RawOrderItemOption {
  id?: string;
  name?: string;
  amount?: number;
}

interface RawOrderItem {
  id?: string;
  name?: string;
  image?: string;
  amount?: number;
  flavors?: RawOrderItemOption[];
  additions?: RawOrderItemOption[];
}

interface RawOrder {
  id?: string;
  number?: number;
  status?: string;
  pickup_code?: string;
  delivery_code?: string;
  code?: string;
  shop_id?: string;
  customer_id?: string;
  batch_id?: string;
  // Rider asignado: presente en órdenes ya tomadas, ausente/vacío en ofertas.
  rider_id?: string;
  method_payment?: string;
  delivery_fee?: number;
  delivery_fee_bs?: number;
  distance_km?: number;
  distance?: number;
  // Productos del pedido — solo viajan en el `order_update` posterior a
  // aceptar, no en la oferta `new_order`.
  items?: RawOrderItem[];
  created_at?: string;
  // Fallback defensivo: si algún mensaje aún manda cliente/tienda anidados o a
  // nivel raíz de `order` (shape anterior), se soportan sin romper.
  address?: string;
  latitude?: number;
  longitude?: number;
  shop?: RawParty;
  customer?: RawParty;
}

interface RawMessage {
  order?: RawOrder;
  shop?: RawParty;
  customer?: RawParty;
}

function toNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapParty(
  raw: RawParty | undefined,
  fallback: Partial<OrderParty>,
): OrderParty {
  return {
    name: raw?.name ?? fallback.name ?? "",
    address: raw?.address ?? fallback.address,
    phone: raw?.phone ?? raw?.phone_number ?? fallback.phone,
    logo: raw?.logo ?? fallback.logo,
    latitude: toNumber(raw?.latitude ?? raw?.lat) ?? fallback.latitude,
    longitude:
      toNumber(raw?.longitude ?? raw?.lng ?? raw?.long) ?? fallback.longitude,
  };
}

function mapItemOption(raw: RawOrderItemOption): OrderItemOption {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    amount: toNumber(raw.amount) ?? 0,
  };
}

function mapItems(raw: RawOrderItem[] | undefined): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    id: item.id ?? "",
    name: item.name ?? "",
    image: item.image,
    amount: toNumber(item.amount) ?? 0,
    flavors: Array.isArray(item.flavors)
      ? item.flavors.map(mapItemOption)
      : undefined,
    additions: Array.isArray(item.additions)
      ? item.additions.map(mapItemOption)
      : undefined,
  }));
}

export function mapRawOrder(input: unknown): ActiveOrder {
  const raw = (input ?? {}) as RawMessage & RawOrder;
  // Si el input no trae `order` anidado, se asume que el input ES la orden
  // (shape plano, ej. items de `orders_snapshot` sin confirmar todavía).
  const order: RawOrder = raw.order ?? raw;

  // `shop`/`customer` hermanos de `order`; si faltan, se cae al shape anterior
  // (anidados o dirección/coords a nivel raíz de `order` = cliente).
  const shop = mapParty(raw.shop ?? order.shop, {});
  const customer = mapParty(raw.customer ?? order.customer, {
    address: order.address,
    latitude: toNumber(order.latitude),
    longitude: toNumber(order.longitude),
  });

  return {
    id: order.id ?? "",
    number: toNumber(order.number),
    status: normalizeStatus(order.status),
    pickupCode: order.pickup_code ?? order.delivery_code ?? order.code,
    shop,
    customer,
    shopId: order.shop_id,
    customerId: order.customer_id,
    batchId: order.batch_id,
    methodPayment: order.method_payment,
    deliveryFee: toNumber(order.delivery_fee) ?? 0,
    deliveryFeeBs: toNumber(order.delivery_fee_bs),
    distanceKm: toNumber(order.distance_km ?? order.distance),
    items: mapItems(order.items),
    // Cadena vacía = sin asignar → se normaliza a undefined (oferta disponible).
    riderId: order.rider_id ? order.rider_id : undefined,
    createdAt: order.created_at ?? new Date().toISOString(),
  };
}
