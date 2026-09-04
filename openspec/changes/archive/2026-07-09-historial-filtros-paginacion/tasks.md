## 1. Dependencia

- [x] 1.1 Instalar `@react-native-community/datetimepicker` (`npm install`)

## 2. Servicio — `features/historial/services/historial.service.ts`

- [x] 2.1 Agregar función para traer todas las páginas del servidor (loop con `limit=50` hasta agotar `total`), reutilizando el mapeo `RawTransaction` → `Transaction` existente
- [x] 2.2 Tests: happy path (agota varias páginas y devuelve el set completo) + caso de error (una página intermedia falla, no se pierde lo ya traído / se propaga el error)

## 3. Hook — `features/historial/hooks/useTransactionHistory.ts`

- [x] 3.1 Reescribir el estado interno a `{ mode: "server" | "client-filtered", page, totalPages, rows, dateRange, isLoadingFullSet }`
- [x] 3.2 Modo `server`: pedir página N con `limit=10` (`HISTORIAL_PAGE_SIZE`), calcular `totalPages` desde `total`
- [x] 3.3 Modo `client-filtered`: al activar un rango de fechas, traer el set completo (usando 2.1), cachearlo en memoria, filtrar por `createdAt` dentro del rango, paginar en cliente con el mismo `HISTORIAL_PAGE_SIZE`
- [x] 3.4 Cambiar de rango de fechas con el set completo ya cacheado: re-filtrar y re-paginar sin refetch
- [x] 3.5 Limpiar el filtro de fecha: volver a modo `server`, página 1
- [x] 3.6 Manejo de errores: página fallida conserva la última página mostrada con éxito; falla al traer el set completo conserva la última vista válida (sin filtro o filtro previo)
- [x] 3.7 Tests: happy path de cada modo, cambio de rango con cache, limpieza de filtro, y los dos casos de error de 3.6

## 4. Componentes

- [x] 4.1 `features/balance/components/TransactionRow.tsx`: agregar prop opcional `onPress?: () => void`, sin alterar el render cuando no se pasa (Balance no cambia). (Se agregó también `orderId?: string` y se removió luego — ver tarea 7.3)
- [x] 4.2 Tests de `TransactionRow`: caso con `onPress` (Historial) + caso sin él (Balance, no debe romperse)
- [x] 4.3 Nuevo componente de paginación numerada (`features/historial/components/HistorialPagination.tsx`): controles anterior/siguiente + indicador "Página N de M", reemplaza a `HistorialListFooter`
- [x] 4.4 Tests de `HistorialPagination`: deshabilita "siguiente" en la última página, deshabilita "anterior" en la primera, dispara el cambio de página
- [x] 4.5 Eliminar `HistorialListFooter` y sus tests/snapshots (ya no aplica, era para scroll infinito)
- [x] 4.6 Nuevo componente de filtro de fecha (`features/historial/components/HistorialDateFilter.tsx`) con los dos inputs "Desde"/"Hasta" usando `@react-native-community/datetimepicker`, y acción para limpiar el filtro
- [x] 4.7 Tests de `HistorialDateFilter`: selección de rango dispara el filtro, limpiar filtro vuelve a modo sin filtro
- [x] 4.8 Nuevo componente de detalle simple (`features/historial/components/TransactionDetailModal.tsx`) con `Modal` nativo de RN, muestra los campos de la fila tocada (sin `payment_method`)
- [x] 4.9 Tests de `TransactionDetailModal`: muestra los campos esperados, cierra y vuelve a la tabla
- [x] 4.10 Nuevo estado de carga explícito para "cargando historial completo para aplicar el filtro" (puede reusar `HistorialSkeleton` con una variante o mensaje propio)

## 5. Pantalla — `app/(app)/(tabs)/historial.tsx`

- [x] 5.1 Reemplazar `FlatList` con `onEndReached` por una lista de tamaño fijo (una página) + `HistorialPagination` debajo
- [x] 5.2 Integrar `HistorialDateFilter` arriba de la tabla
- [x] 5.3 Integrar `TransactionDetailModal` al tocar una fila
- [x] 5.4 Verificar estados de carga/vacío/error para ambos modos (server / client-filtered) en la pantalla completa

## 6. Verificación

- [x] 6.1 `npx tsc --noEmit` sin errores
- [x] 6.2 `npm run lint` sin errores
- [x] 6.3 Probar manualmente en dispositivo: navegación de páginas sin filtro, aplicar rango de fechas, cambiar rango con cache, limpiar filtro, tap-to-detail, y los casos de error de red (retry)

## 7. Ajustes post-prueba en dispositivo

- [x] 7.1 Colores: reemplazar `bg-ink` por `bg-primary` en botones de paginación, "Aplicar" y "Cerrar" del detalle; chips de fecha elegida con `border-primary`/`bg-primary/10`; "Limpiar filtro" como chip con ícono `X` (antes texto plano, poco visible)
- [x] 7.2 Espaciado: separar la tarjeta de filtro del título "Historial" (`mt-3`) y del botón "Limpiar filtro" dentro de la tarjeta
- [x] 7.3 Quitar `orderId` de `TransactionRow`, de la fila de Historial y de `TransactionDetailModal` (agregado en 4.1/4.8, retirado a pedido del usuario) — tests ajustados
- [x] 7.4 Filtro de fecha: aplicar automáticamente al completar "desde" y "hasta" (en cualquier orden), sin requerir tocar "Aplicar"; tests ajustados
- [x] 7.5 Re-verificar `npx tsc --noEmit`, `npm run lint` y toda la suite de tests tras 7.1–7.4
