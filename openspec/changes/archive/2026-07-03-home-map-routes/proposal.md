## Why

El mapa de Inicio hoy enfoca `orders[0]` sin filtrar por aceptación: si hay una oferta sin decidir en la lista, sus coordenadas se muestran como si fueran una orden mía. Además los marcadores son un pin SVG genérico con letra (A/B) sin relación con el flujo real del rider (ir primero a la tienda, luego al cliente), y el mapa sigue activo (GPS + render) incluso cuando el rider está en pausa o no tiene ninguna orden, gastando batería y recursos sin necesidad.

## What Changes

- Fix: `focusedOrder` en Inicio pasa a ser la primera orden **aceptada** (`riderId` truthy) de la lista ya ordenada, no `orders[0]` a secas. Sin orden aceptada, el mapa no dibuja pines de restaurante/cliente (solo el punto del rider).
- Reemplazo de los pines A/B (SVG + letra, coloreados por estado) por los assets `assets/shop-location.png` y `assets/user-location.png`, usados tal cual sin overlay de texto. Dejan de representar estado (eso sigue siendo la píldora de `ActiveOrderCard`) y pasan a representar identidad (tienda / cliente).
- Nueva: ruta trazada en el propio mapa (polyline vía Google Directions API, paquete `react-native-maps-directions`) entre el rider y el destino que corresponde a la etapa de la orden aceptada enfocada:
  - Recogida Pendiente (`Pending`/`Accepted`/`In Preparation`/`Ready`): ruta rider → tienda, línea ámbar. Pin de tienda a opacidad normal, pin de cliente a opacidad reducida.
  - En camino (`On The Way`): ruta rider → cliente, línea azul. Se invierte: pin de cliente a opacidad normal, pin de tienda a opacidad reducida.
  - Completado: la orden ya sale de `activeOrders` (comportamiento existente) → sin pines ni ruta.
  - La ruta se calcula una vez por transición de etapa, no en vivo mientras el rider se mueve (sin `watchPositionAsync`).
- Nueva: el mapa se deshabilita (se desmonta el `MapView`, no se pide ubicación) cuando el rider está "No disponible" o no tiene ninguna orden (ofertas ni aceptadas). En su lugar se muestra un placeholder estático del mismo tamaño invitando a activarse.

## Capabilities

### New Capabilities
(ninguna — todo el comportamiento vive dentro de la pantalla de Inicio ya especificada)

### Modified Capabilities
- `rider-orders-home`: cambia el requirement de mapa (foco solo en órdenes aceptadas, pines de asset, ruta trazada por etapa, colores de ruta por estado) y agrega el requirement de mapa deshabilitado por disponibilidad/ausencia de órdenes.

## Impact

- `features/orders/components/OrdersMap.tsx`: swap de pines SVG→imagen, integración de `MapViewDirections`, opacidad condicional, prop de mapa deshabilitado/placeholder.
- `app/(app)/(tabs)/home.tsx`: fix de selección de `focusedOrder`, cálculo de `mapEnabled`.
- `features/orders/hooks/useRiderLocation.ts`: parámetro `enabled` para no pedir GPS cuando el mapa está deshabilitado.
- Nueva dependencia: `react-native-maps-directions` (usa la misma `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` ya configurada; requiere confirmar que la Directions API esté habilitada para esa key).
- Nuevos assets ya agregados: `assets/shop-location.png`, `assets/user-location.png`.
