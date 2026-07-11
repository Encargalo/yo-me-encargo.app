## 1. Tipos

- [x] 1.1 Crear `features/historial/types/historial.types.ts`: `TransactionHistoryResponse { page, limit, total, transactions: Transaction[] }` (reusa el tipo `Transaction` de `features/balance/types/balance.types.ts`, sin redeclararlo)

## 2. Servicio — `GET /riders/transactions`

- [x] 2.1 Crear `features/historial/services/historial.service.ts` con `getTransactions({ page, limit }): Promise<TransactionHistoryResponse>` vía `apiClient.get("/riders/transactions", { params: { page, limit } })`, mapeo 1:1 snake_case → camelCase (mismo patrón que `mapTransaction` en `balance.service.ts`, duplicado localmente por ser servicios de features distintas)
- [x] 2.2 Tests `historial.service.test.ts`: happy path (página con `total` mayor al `limit`, página con transacciones vacías) y al menos un caso de error propagado como `AxiosError`

## 3. Hook orquestador `useTransactionHistory`

- [x] 3.1 Crear `features/historial/hooks/useTransactionHistory.ts`: fetch de página 1 al montar, expone `{ transactions, status: "loading" | "loadingMore" | "refreshing" | "error" | "errorMore" | "success", hasMore, loadMore, refresh, retryLoadMore }`
- [x] 3.2 `loadMore()`: no-op si `status` está en `loading`/`loadingMore`/`refreshing` o si `hasMore` es `false`; en éxito incrementa `page` y agrega transacciones al final; en error pasa a `"errorMore"` sin descartar `transactions` ya cargadas
- [x] 3.3 `refresh()`: pide página 1, reemplaza `transactions`/`page`/`total` desde cero (usado por pull-to-refresh)
- [x] 3.4 `hasMore` derivado de `transactions.length < total` (recalculado en cada respuesta exitosa)
- [x] 3.5 Tests `useTransactionHistory.test.ts`: carga inicial exitosa, error en carga inicial (lista vacía + `status: "error"`), `loadMore` agrega página siguiente, `loadMore` no dispara una segunda petición si ya hay una en curso, `loadMore` no dispara si `hasMore` es `false`, error en `loadMore` conserva transacciones ya cargadas (`status: "errorMore"`), `refresh` reemplaza la lista completa

## 4. Componentes UI

- [x] 4.1 Crear `features/historial/components/HistorialSkeleton.tsx`: mismo patrón de pulso (`Animated` nativo + `useNativeDriver`) que `BalanceSkeleton`, replicando varias filas del alto de `TransactionRow` (sin card hero, a diferencia de Balance)
- [x] 4.2 Crear `features/historial/components/HistorialListFooter.tsx`: fila-skeleton (reusa el patrón de 4.1) durante `loadingMore`; mensaje corto + acción "Reintentar" durante `errorMore`; `null` en cualquier otro estado
- [x] 4.3 Snapshot tests de los 2 componentes nuevos

## 5. Pantalla — integración

- [x] 5.1 Reemplazar el placeholder de `app/(app)/(tabs)/historial.tsx`: usa `useTransactionHistory()`, muestra `HistorialSkeleton` durante `status === "loading"`, mensaje de error de página completa con acción de reintentar durante `status === "error"`, y en cualquier otro estado un `FlatList` de `TransactionRow` (importado de `features/balance/components/TransactionRow`) con el estado vacío de `TransactionsList` cuando `transactions` está vacío tras una carga exitosa
- [x] 5.2 `FlatList`: `keyExtractor` por `id`, `onEndReached`/`onEndReachedThreshold` disparando `loadMore()`, `ListFooterComponent` con `HistorialListFooter`, `RefreshControl` conectado a `refresh()`
- [x] 5.3 Sin `useFocusEffect` — confirmar que la pantalla no reintenta fetch al recuperar foco (ver design.md, Decisión 4)

## 6. Verificación

- [x] 6.1 `npx tsc --noEmit` y `npm run lint` en verde
- [x] 6.2 Prueba manual en dispositivo real (staging): scroll infinito carga páginas siguientes, pull-to-refresh reinicia la lista, estado vacío si no hay movimientos, comportamiento ante error de red simulado (primera página y página siguiente)
