## 1. Dependencia y assets

- [x] 1.1 Instalar `react-native-maps-directions` (`npm install`); confirmar si requiere `expo prebuild`/rebuild nativo y dejar nota en el PR si aplica
- [x] 1.2 Confirmar en Google Cloud Console que la Directions API está habilitada para `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`; si no, habilitarla
- [x] 1.3 Confirmar la ruta de import correcta para `assets/shop-location.png` y `assets/user-location.png` desde `features/orders/components/` (relativa vs alias `@/assets`, según lo que resuelva Metro)

## 2. Fix de selección de la orden enfocada

- [x] 2.1 En `app/(app)/(tabs)/home.tsx`, cambiar `focusedOrder = orders[0]` por `orders.find((o) => o.riderId)`
- [x] 2.2 Test: con una lista que mezcla ofertas (sin `riderId`) y una aceptada, `focusedOrder` resuelve a la aceptada
- [x] 2.3 Test: con una lista de solo ofertas sin `riderId`, `focusedOrder` es `undefined`

## 3. Pines de imagen en el mapa

- [x] 3.1 En `features/orders/components/OrdersMap.tsx`, eliminar el componente `MapPin` (SVG + letra) y el color por estado de los marcadores de tienda/cliente
- [x] 3.2 Renderizar el marcador de tienda con `Image`/`expo-image` usando `shop-location.png`, y el de cliente con `user-location.png`, manteniendo `anchor={{ x: 0.5, y: 1 }}` y el patrón actual de `tracksViewChanges`
- [x] 3.3 Quitar el import de `react-native-svg` de `OrdersMap.tsx` si deja de usarse

## 4. Opacidad y ruta por etapa

- [x] 4.1 Derivar la etapa (`pending` | `enroute`) del `focusedOrder.status` con `getColorKey` ya existente
- [x] 4.2 Aplicar opacidad al pin de tienda/cliente según la etapa (destino actual = opacidad normal, el otro = `DIMMED_OPACITY`, ej. `0.35`)
- [x] 4.3 Integrar `<MapViewDirections>` con `origin` = posición del rider, `destination` = tienda o cliente según la etapa, `apikey` = `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`, `strokeColor` = `OrderStatusColors.pending`/`OrderStatusColors.enroute` según corresponda
- [x] 4.4 Montar `<MapViewDirections>` solo cuando hay `focusedOrder` con `riderId`, coordenadas de destino y posición del rider disponibles; manejar `onError` sin romper el resto del mapa (handler explícito agregado en verificación)
- [x] 4.5 Test (unit): función que deriva etapa/opacidad/color de ruta a partir del status, casos "pending" y "enroute"

## 5. Mapa deshabilitado por disponibilidad/ausencia de órdenes

- [x] 5.1 En `useRiderLocation.ts`, agregar parámetro `enabled: boolean = true`; cuando es `false`, el efecto no solicita permiso ni posición y `status`/`region` quedan sin resolver
- [x] 5.2 En `home.tsx`, calcular `mapEnabled = isAvailable && orders.length > 0` y pasar `enabled={mapEnabled}` a `useRiderLocation`
- [x] 5.3 En `OrdersMap.tsx`, cuando `mapEnabled` (o prop equivalente) es `false`, no montar `MapView`/`MapViewDirections`; renderizar un placeholder estático del mismo tamaño (`FILL`) con mensaje breve, estilo consistente con `OrdersEmptyState`/paleta `Neutrals`
- [x] 5.4 Test (integration): `useRiderLocation` con `enabled=false` no dispara la solicitud de ubicación; al pasar a `enabled=true` sí la dispara
- [x] 5.5 Test (integration): con `isAvailable=false` o `orders.length===0`, `home.tsx` no renderiza el mapa activo (placeholder en su lugar)

## 6. Verificación

- [x] 6.1 `npx tsc --noEmit` sin errores
- [x] 6.2 `npm run lint` sin errores
- [x] 6.3 Probar en dispositivo/emulador: aceptar una orden, ver pines correctos + ruta ámbar hacia tienda, pasar a "On The Way" y ver ruta azul hacia cliente, completar y ver mapa limpio
- [x] 6.4 Probar en dispositivo/emulador: pausar disponibilidad y sin órdenes, confirmar que el mapa se reemplaza por el placeholder y no se solicita ubicación
