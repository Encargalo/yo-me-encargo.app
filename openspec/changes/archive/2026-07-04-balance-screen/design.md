## Context

`GET /riders/balance` devuelve, en una sola llamada, el saldo neto (`balance`), la zona del rider (`zone`) y los **últimos 10 movimientos** (`transactions[]`, cada uno con `amount`, `created_at`, `distance_km`, `movement_type`, `order_id`, `payment_method`). No existe paginación en este endpoint — el historial completo/paginado es `GET /riders/transactions`, consumido por Historial (08), fuera de este change.

El pill "Balance" del header de Inicio (`HomeHeader.tsx`) ya existe y solo navega al tab (`router.push(ROUTES.APP.BALANCE)`); no muestra un monto en vivo hoy, así que no hay estado compartido entre pantallas que resolver todavía.

El endpoint no trae un campo `currency` ni por transacción ni en el total — confirmado con el usuario que todos los montos son USD (mismo universo de referencia que `deliveryFee` en `features/orders`, aunque ese además tiene un equivalente en bolívares que este endpoint no expone).

## Goals / Non-Goals

**Goals:**
- Reemplazar el placeholder de Balance por la pantalla real: card hero de saldo neto + badge de zona, desglose Ganado/Descontado, lista de últimos movimientos, CTA "Solicitar retiro" y link a Historial.
- Manejar los tres estados de carga de una pantalla con fetch: skeleton (primera carga), pull-to-refresh (recarga manual), y error de red — todos con su propio tratamiento visual, nunca un spinner genérico.
- Refetch automático al recuperar foco (`useFocusEffect`) para que el saldo esté al día si el rider vuelve de completar una entrega.

**Non-Goals:**
- No se construye la pantalla de Solicitud de retiro (07) ni su lógica — solo un stub de navegación para que el CTA tenga destino.
- No se construye el contenido real de Historial (08) — el link navega al tab placeholder existente.
- No se sincroniza el balance en tiempo real vía WebSocket. El WS de órdenes (`ordersRiderWsService`) no emite eventos de balance; acoplar Balance a ese store para "refrescar en cuanto se complete una entrega" fue considerado y descartado (ver Decisión 5).
- No se resuelve de forma definitiva el desglose Ganado/Descontado como total histórico (ver Riesgos) — se deriva únicamente de los 10 movimientos que trae el endpoint.

## Decisions

### 1. Módulo nuevo `features/balance/`, sin store de Zustand
Se crea `features/balance/{services,hooks,types,utils,components}/` siguiendo la estructura estándar del proyecto, pero **sin** `store/`. El estado (`balance`, `zone`, `transactions`, `status`) vive en un hook orquestador `useBalance()` con `useState`/`useCallback`, igual de local que cualquier pantalla con un solo consumidor.
- **Por qué**: a diferencia de `useOrdersStore` (poblado por WS y leído desde Inicio, Detalle y el overlay simultáneamente), hoy solo la pantalla de Balance necesita este dato — el pill de Inicio no muestra un monto en vivo. Agregar un store ahora sería estado compartido sin un segundo consumidor real (checklist del proyecto: no construir abstracciones para necesidades hipotéticas).
- **Alternativa descartada**: `useBalanceStore` (Zustand) desde el inicio, para que el pill de Inicio pueda mostrar el saldo en vivo más adelante. Se descarta por ahora; si un change futuro pide eso, migrar el estado de `useBalance` a un store es un cambio mecánico y acotado.

### 2. Servicio único de solo lectura
`features/balance/services/balance.service.ts` expone `getBalance(): Promise<RiderBalanceResponse>` vía `apiClient.get<RiderBalanceResponse>("/riders/balance")`. Sin mapeo defensivo tipo `mapRawOrder.ts`: la respuesta ya es un objeto plano con nombres estables (`balance`, `zone`, `transactions[].amount/created_at/distance_km/id/movement_type/order_id/payment_method`), a diferencia del WS de órdenes que sí necesitaba normalización. Los tipos (`RiderBalanceResponse`, `Transaction`) viven en `features/balance/types/balance.types.ts` y usan camelCase mapeado 1:1 en el propio servicio (sin librería de transformación).

### 3. Formatter de moneda nuevo, no se reutiliza `formatUsd` de `orders`
Se agrega `features/balance/utils/formatAmount.ts` con dos funciones:
- `formatAmount(value: number): string` → sin signo, símbolo al final, decimales solo si `value` no es entero (`0.54$`, `2$`, `38$`).
- `formatSignedAmount(value: number): string` → antepone `+`/`−` (el `−` tipográfico del wireframe, no el guion ASCII) y aplica `formatAmount(Math.abs(value))` — usado en cada fila de movimiento y en Ganado/Descontado.
Esto es deliberadamente **distinto** de `formatUsd` (`features/orders`, símbolo adelante, siempre 2 decimales, usado para `deliveryFee` de una orden puntual) — confirmado con el usuario que ambos estilos son válidos y conviven; no se unifica en este change para no tocar pantallas ya cerradas (`order-detail`, `order-offer-overlay`).
- **Alternativa descartada**: extender `formatUsd` con un parámetro de estilo. Se descarta porque `formatUsd` está duplicado en dos componentes de `orders` (`OrderCompletedSummary`, `OrderOfferModal`) sin un lugar central hoy — tocarlo es un refactor de otro módulo, fuera del alcance de este change.

### 4. Colores de monto: se reutilizan `OrderStatusColors.completed`/`.error`, no se agregan hex nuevos
El saldo neto, el desglose Ganado/Descontado y el monto de cada movimiento usan `OrderStatusColors.completed` (`#22c55e`) para positivo y `OrderStatusColors.error` (`#ef4444`) para negativo — los mismos tokens que ya representan "bien"/"mal" en el resto de la app, en vez de introducir una paleta verde/rojo distinta como la que usa el wireframe (`#3c7a57`/`#4a9469` vs `#bd5b54`, tonos "apagados" propios del wireframe en escala de grises). El fondo de la card hero usa `bg-white`/`border-hair` (no el verde tenue `#f1f7f2` del mock) para no introducir un hex de fondo nuevo fuera de `Neutrals`.
- **Por qué**: CLAUDE.md reserva el color a los 4 tokens de estado de orden y pide no hardcodear hex adicionales; aquí el "signo del monto" es semánticamente igual de binario (positivo=bien/verde, negativo=mal/rojo) así que reusar esos tokens evita una paleta paralela solo para dinero.
- **Saldo en cero**: se trata como positivo (verde) — no hay un tercer estado "neutro" en los 4 colores oficiales, y un saldo en 0 no es un error.

### 5b. Error de refresh con datos previos: banner inline, no pantalla de error completa
`useBalance` expone `hasLoadedOnce: boolean` (además de `status`) para que la pantalla distinga "nunca hubo una carga exitosa" (bloquea con el mensaje de error de página completa + reintentar) de "ya había datos válidos y un refresh posterior falló" (mantiene `NetBalanceCard`/`TransactionsList` visibles con los últimos datos buenos, y agrega un banner inline rojo con "Reintentar" arriba del contenido). Sin este campo, un error durante `refresh()`/`useFocusEffect` habría vaciado la pantalla a pesar de tener datos válidos en memoria — detectado al implementar la integración de pantalla.

### 5. Refresh: fetch al montar + `useFocusEffect` + pull-to-refresh manual, sin acoplarse al store de órdenes
`useBalance()` hace fetch en el primer render y en cada `useFocusEffect` (expo-router), más un `refetch()` expuesto para `RefreshControl`. No se suscribe a `useOrdersStore` para disparar un refetch cuando una orden pasa a `Completed`.
- **Por qué**: acoplar Balance al store de órdenes para "refrescar cuando se complete una entrega" añade una dependencia cruzada entre dos features por una ganancia marginal — `useFocusEffect` ya cubre el caso real (el rider entrega y vuelve a Balance, lo cual dispara foco). Decisión del usuario en la fase de exploración.

### 6. Pantalla de Solicitud de retiro: stub real de una sola ruta, no oculto/deshabilitado
El CTA "Solicitar retiro" navega con `router.push(ROUTES.APP.WITHDRAWAL)` a una pantalla nueva y mínima (`app/(app)/withdrawal.tsx`, pantalla empujada sobre el shell de tabs, igual que Detalle de Orden) con un mensaje "Próximamente" — mismo patrón que tenía `balance.tsx` antes de este change. `ROUTES.APP.WITHDRAWAL = "/withdrawal"` se agrega a `constants/routes.ts`.
- **Por qué navegar en vez de deshabilitar**: decisión del usuario en la exploración — el botón debe sentirse funcional ahora; deshabilitarlo permanentemente hasta que exista el change de Retiro daría la falsa impresión de que el saldo no alcanza el umbral, cuando en realidad la pantalla simplemente no existe todavía.

### 7. Skeleton con el `Animated` nativo de RN, siguiendo `MapSkeleton`
`BalanceSkeleton.tsx` reutiliza el mismo patrón de pulso de opacidad de `features/orders/components/MapSkeleton.tsx` (`Animated.loop` + `useNativeDriver`, sin reanimated) sobre bloques que replican el layout real: card hero (rectángulo alto), dos bloques Ganado/Descontado, y 3 filas de movimiento.

### 8. `movement_type` se mapea a una etiqueta legible; `payment_method` no se muestra
Al probar la pantalla contra datos reales de staging (verificación manual de este change), el `movement_type` real resultó ser un slug interno (`"ride_bank"` para la comisión de una carrera entregada), no un texto ya legible como sugería el wireframe (`"Comisión entrega"`). Mostrarlo crudo confundiría al rider. Se agrega `features/balance/utils/movementTypeLabel.ts` con un mapeo de slugs conocidos (`ride_bank` → `"Carrera"`) y un fallback "humanizado" (guiones bajos → espacios, solo la primera letra en mayúscula) para tipos aún no vistos, en vez de bloquear la pantalla hasta conocer el enum completo del backend.
Además, decisión del usuario tras ver la pantalla real: el método de pago (`payment_method`, ej. `"PagoMovil"`) no aporta valor al rider y se retira de `TransactionRow` — el campo se sigue mapeando en el servicio (refleja el contrato real de la API) pero deja de renderizarse.
- **Por qué un mapeo + fallback y no esperar el enum completo**: igual criterio que `DELIVERY_CODE_LENGTH` en `order-detail` — centralizar la decisión en un único archivo hace que agregar el próximo slug conocido sea un edit de una línea, sin bloquear el resto de la pantalla mientras tanto.

## Risks / Trade-offs

- **Ganado/Descontado no es un total histórico real** → el endpoint no expone una suma de todo el tiempo, solo los últimos 10 movimientos. El desglose se calcula sumando los `amount` positivos y negativos de esos mismos 10 registros que ya se muestran en pantalla. Se acepta porque es el único dato disponible; el título "Últimos movimientos" dejará claro que el desglose corresponde a esa misma ventana, no a un histórico completo.
- **Sin campo `currency` en el contrato** → si el backend algún día mezcla monedas por transacción (ej. `payment_method` en bolívares mostrando un monto en Bs), este change asume USD uniforme para todo. Mitigación: el formatter vive aislado en `formatAmount.ts`, así que si aparece un campo de moneda real más adelante, el cambio queda contenido a ese archivo + el mapeo del servicio.
- **`useFocusEffect` sin acople al store de órdenes** → si el rider completa una entrega y la comisión tarda en reflejarse del lado del backend, el refetch al volver a foco puede mostrar el saldo aún no actualizado. Se acepta (mismo tipo de latencia que ya existe entre cualquier acción y su reflejo en `GET`); no se agrega polling.
