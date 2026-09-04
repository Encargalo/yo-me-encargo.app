## Why

Historial hoy solo reproduce un `FlatList` con scroll infinito y una tarjeta que oculta `order_id`, sin ningún filtro. El wireframe 08 (`docs/wireframes/EncargaloApp Riders Wireframes.md`) pide una tabla paginada de verdad, un filtro de rango de fechas y la tarjeta completa (incluyendo `order_id`) con tap a un detalle simple de la transacción. `GET /riders/transactions` no soporta ningún filtro server-side (solo `page`/`limit`, confirmado en `docs/endpoints-yo-me-encargo.app.md`), así que el filtro de fecha se resuelve enteramente en el cliente.

## What Changes

- Reemplazar el scroll infinito por una tabla con **paginación numerada real** (páginas, no "cargar más" acumulativo).
- Agregar **filtro de rango de fechas**, combinado con la paginación mediante estrategia híbrida:
  - Sin filtro activo: la tabla pagina directo contra `GET /riders/transactions` (`page`/`limit`/`total` tal cual los devuelve el servidor).
  - Con filtro de fecha activo: se traen todas las páginas del servidor (agotando `total`), se filtra en el cliente por rango de fechas, y la tabla pagina sobre ese resultado ya filtrado — para no perder ni duplicar ítems al cambiar de página.
  - El filtro se aplica automáticamente en cuanto ambas fechas ("desde" y "hasta") quedan elegidas, sin requerir tocar "Aplicar" — el botón queda como confirmación manual opcional (decisión post-implementación, tras probar en dispositivo).
- Agregar tap en una fila → detalle simple de esa transacción (mismos campos que la fila, sin fetch adicional).
- Colores e interacciones del filtro/paginación/detalle usan los tokens de marca existentes (`primary` #fc6b2b) en vez del gris `ink`, y "Limpiar filtro" se presenta como chip visible con ícono — ajuste de diseño tras probar en dispositivo (se veía "opaco" y el botón de limpiar filtro no se notaba).
- **BREAKING** (a nivel de spec, no de API pública): se reemplaza el modelo de paginación de "scroll infinito acumulativo" por "página numerada actual"; el estado interno de `useTransactionHistory` cambia de forma.

**Explícitamente fuera de alcance:**
- Filtro de "estado" (Pendiente/Retirado) del wireframe — ningún endpoint real expone hoy ese campo ni en `GET /riders/transactions` ni en `POST /riders/withdrawal`. Se difiere hasta que backend lo exponga (mismo patrón que `rider-withdrawal`).
- `order_id` en la fila y en el detalle — se implementó y luego se quitó a pedido explícito del usuario tras revisar en dispositivo ("no iba a servir, mejor quitarlo"); se reconsiderará en un change futuro con otro campo en su lugar.

## Capabilities

### New Capabilities
_(ninguna — todo el trabajo cae dentro de la capability existente)_

### Modified Capabilities
- `rider-transaction-history`: cambia el modelo de paginación (de scroll infinito a tabla con páginas numeradas), se agrega filtro de rango de fechas resuelto en cliente (con auto-aplicación), y se agrega tap-to-detail de una transacción.

## Impact

- `features/historial/hooks/useTransactionHistory.ts`: reescribe la lógica de paginación (server-side vs. fetch-all-y-filtra-en-cliente) y agrega estado de filtro de fecha.
- `features/historial/services/historial.service.ts`: sin cambios de contrato con el backend (sigue enviando solo `page`/`limit`); agrega `getAllTransactions()` para traer todas las páginas.
- `features/historial/components/`: nueva UI de filtro de fecha (con auto-aplicar y "Limpiar filtro" como chip), nuevo control de paginación numerada (reemplaza `HistorialListFooter` de scroll infinito), nuevo detalle de transacción (`Modal` nativo).
- `app/(app)/(tabs)/historial.tsx`: deja de usar `FlatList` con `onEndReached`; pasa a una lista paginada por página fija + controles de página.
- `features/balance/components/TransactionRow.tsx`: se extiende con prop opcional `onPress` (tap-to-detail); Balance no la usa y no cambia su render.
- `openspec/specs/rider-transaction-history/spec.md`: reescritura sustancial de requirements de paginación + nuevos requirements de filtro de fecha y detalle.
