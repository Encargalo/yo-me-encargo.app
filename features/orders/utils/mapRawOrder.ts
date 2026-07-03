import type { ActiveOrder, OrderParty } from "../types/order.types";
import { normalizeStatus } from "./orderStatus";

// El backend puede enviar el mensaje con nombres de campo alternativos. Se
// normaliza aquí, en un único punto, para que el store y la UI solo conozcan
// ActiveOrder. Todo el acoplamiento al shape crudo vive en este archivo.
//
// Shape real observado en `/orders/rider` (order_update / new_order):
// - La capa `order` (raíz) trae info del restaurante + de la orden.
// - `address` / `latitude` / `longitude` a nivel raíz = ubicación del CLIENTE
//   (entrega). Van a la capa `customer` del modelo.
// - `shop_id` presente pero SIN nombre ni coords del restaurante en el payload.
// - código = `pickup_code`. Comisión = `delivery_fee` (+ `delivery_fee_bs`).
interface RawParty {
  name?: string;
  address?: string;
  phone?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  long?: number;
}

interface RawOrder {
  id?: string;
  number?: number;
  status?: string;
  pickup_code?: string;
  delivery_code?: string;
  code?: string;
  // Restaurante: hoy solo llega el id; nombre/coords pueden venir anidados si el
  // backend los agrega más adelante (se soportan defensivamente).
  shop_id?: string;
  shop?: RawParty;
  restaurant?: RawParty;
  shop_name?: string;
  // Rider asignado: presente en órdenes ya tomadas, ausente/vacío en ofertas.
  rider_id?: string;
  // Nivel raíz = cliente / entrega.
  address?: string;
  latitude?: number;
  longitude?: number;
  customer?: RawParty;
  client?: RawParty;
  customer_name?: string;
  method_payment?: string;
  delivery_fee?: number;
  delivery_fee_bs?: number;
  distance_km?: number;
  distance?: number;
  created_at?: string;
  details?: { shop?: RawParty; shop_name?: string } | null;
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
    latitude: toNumber(raw?.latitude ?? raw?.lat) ?? fallback.latitude,
    longitude:
      toNumber(raw?.longitude ?? raw?.lng ?? raw?.long) ?? fallback.longitude,
  };
}

export function mapRawOrder(input: unknown): ActiveOrder {
  const raw = (input ?? {}) as RawOrder;

  // Restaurante: hoy solo llega `shop_id`, sin nombre ni coords (se soportan
  // defensivamente por si el backend los anida más adelante).
  const shop = mapParty(raw.shop ?? raw.restaurant ?? raw.details?.shop, {
    name: raw.shop_name ?? raw.details?.shop_name,
  });

  // Cliente / entrega: dirección y coordenadas vienen a nivel raíz del pedido.
  // Si el backend las anida en `customer`, esas tienen precedencia.
  const customer = mapParty(raw.customer ?? raw.client, {
    name: raw.customer_name,
    address: raw.address,
    latitude: toNumber(raw.latitude),
    longitude: toNumber(raw.longitude),
  });

  return {
    id: raw.id ?? "",
    number: toNumber(raw.number),
    status: normalizeStatus(raw.status),
    pickupCode: raw.pickup_code ?? raw.delivery_code ?? raw.code,
    shop,
    customer,
    methodPayment: raw.method_payment,
    deliveryFee: toNumber(raw.delivery_fee) ?? 0,
    deliveryFeeBs: toNumber(raw.delivery_fee_bs),
    distanceKm: toNumber(raw.distance_km ?? raw.distance),
    // Cadena vacía = sin asignar → se normaliza a undefined (oferta disponible).
    riderId: raw.rider_id ? raw.rider_id : undefined,
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}
