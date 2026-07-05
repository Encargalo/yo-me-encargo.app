## Context

`GET /riders/transactions` devuelve movimientos paginados (`page`, `limit` máx. 50, `total`, `transactions[]`) con el mismo shape por transacción que `GET /riders/balance` (`amount`, `created_at`, `distance_km`, `id`, `movement_type`, `order_id`, `payment_method`). No documenta parámetros de fecha ni de estado — el wireframe 08 muestra un selector de rango de fechas y chips de estado que este change **no** implementa (ver Non-Goals).

`features/balance` ya resolvió, para el mismo shape de transacción: el mapeo `snake_case → camelCase` (`balance.service.ts`), el tipo `Transaction` (`balance.types.ts`), la fila visual sin `payment_method` (`TransactionRow`, decisión de usuario documentada en el change `balance-screen`), el contenedor con estado vacío (`TransactionsList`), el formatter de moneda (`formatAmount.ts`) y el mapeo de `movement_type` a etiqueta legible (`movementTypeLabel.ts`). Ninguno de esos contratos cambia aquí — Historial es una vista adicional sobre los mismos datos, no un rediseño de la fila.

El tab Historial y su ruta (`ROUTES.APP.HISTORIAL`) ya existen desde el change `app-tab-bar`; este change solo reemplaza el contenido de `app/(app)/(tabs)/historial.tsx`.

## Goals / Non-Goals

**Goals:**
- Reemplazar el placeholder de Historial por la pantalla real: lista paginada de movimientos con scroll infinito, pull-to-refresh, skeleton inicial y estados de vacío/error.
- Reusar tal cual el formato de tarjeta de movimiento ya validado en Balance (`TransactionRow`/`TransactionsList`), sin duplicar su lógica de presentación.
- Manejar la paginación de forma robusta: no disparar cargas duplicadas, no perder los datos ya cargados si una página siguiente falla.

**Non-Goals:**
- No se implementan filtros de fecha ni de estado (decisión de exploración: el endpoint no los soporta; se documenta como brecha con el wireframe, mismo patrón que `payment_method` en Balance o el umbral de Retiro).
- No se implementa tap-to-detail de una transacción individual (decisión de exploración: se difiere a un change futuro).
- No se sincroniza con el WebSocket de órdenes ni con el store de Balance — es un fetch de solo lectura independiente, igual que `useBalance`.

## Decisions

### 1. Módulo nuevo `features/historial/`, con import cruzado a `features/balance`
Se crea `features/historial/{services,hooks,types}/` (sin `components/` propio) siguiendo la estructura estándar del proyecto. `TransactionRow` y `TransactionsList` se importan directo desde `features/balance/components/...`, y `formatSignedAmount`/`getMovementTypeLabel` desde `features/balance/utils/...`. El tipo `Transaction` también se reusa de `features/balance/types/balance.types.ts` en vez de redeclararlo.
- **Por qué**: checklist del proyecto ("¿esta función ya existe? úsala directamente") — la fila de movimiento, su formatter y su tipo ya están construidos y probados en Balance; Historial solo agrega paginación alrededor. Es el primer import cruzado entre dos `features/` del repo.
- **Alternativa descartada**: duplicar `TransactionRow`/`TransactionsList` dentro de `features/historial`. Se descarta por violar directamente la convención de reuso del proyecto y crear dos lugares que mantener en sync ante cualquier cambio de diseño de la fila.
- **Alternativa descartada**: promover `TransactionRow`/`TransactionsList`/`Transaction` a `components/`/`types/` globales. Se descarta por ahora — mover el tipo rompe el import existente en todo `features/balance` para una ganancia simbólica; si un tercer consumidor aparece más adelante, ahí sí se justifica la promoción.

### 2. `TransactionsList` no sirve para la lista paginada — se usa `FlatList` directo con `TransactionRow`
`TransactionsList` renderiza con `.map()` dentro de un `View` (pensado para los 10 ítems fijos de Balance) y ya incluye su propio estado vacío. Historial necesita virtualización (`FlatList`) para una lista potencialmente larga, así que la pantalla arma su propio `FlatList` usando `TransactionRow` directamente como `renderItem`, y reusa el estado vacío de `TransactionsList` solo para el caso "cero transacciones en total" (se renderiza en vez del `FlatList`, no dentro de él).
- **Por qué**: es el primer `FlatList` del repo — justificado porque Balance limita a 10 ítems fijos (sin paginación real) mientras que Historial puede acumular cientos de páginas de 50. Un `ScrollView` + `.map()` de todo lo cargado degradaría el rendimiento conforme crecen las páginas.
- **Alternativa descartada**: botón "Cargar más" en vez de scroll infinito. El wireframe menciona ambos ("scroll infinito o Cargar más"); se elige scroll infinito por ser el patrón estándar de RN para listas largas y no requerir un control adicional en el tercio inferior (zona ya ocupada por el tab bar).

### 3. `useTransactionHistory`: estado paginado local, sin store de Zustand
Hook orquestador con `useState`/`useCallback`, mismo criterio que `useBalance` (single consumer, sin necesidad de estado compartido entre pantallas):
- `status: "loading" | "loadingMore" | "refreshing" | "error" | "errorMore" | "success"` — `error` bloquea la pantalla completa (nunca hubo carga exitosa); `errorMore` mantiene la lista ya cargada visible y solo afecta el footer (mismo patrón que `hasLoadedOnce` en `useBalance`, pero aplicado por página en vez de por pantalla completa).
- `transactions: Transaction[]` acumulado entre páginas (se reemplaza, no se acumula, en `refresh()`).
- `page` interno (arranca en 1), `total` de la última respuesta, `hasMore = transactions.length < total`.
- `loadMore()`: no-op si ya está cargando (`status` en `loading`/`loadingMore`/`refreshing`) o si `hasMore` es `false` — evita disparos duplicados desde `onEndReached`, que en RN puede dispararse más de una vez por el mismo umbral.
- `refresh()`: pull-to-refresh — pide página 1 y reemplaza `transactions`/`page`/`total` desde cero.
- Sin `useFocusEffect`: a diferencia de Balance, Historial no vuelve a pedir datos al recuperar foco. Ver Decisión 4.

### 4. Sin refetch automático al recuperar foco
`useBalance` sí refresca en `useFocusEffect` porque muestra un snapshot fijo de 10 ítems (resetear no cuesta nada de contexto). Historial es una lista que el rider puede haber scrolleado varias páginas adentro; resetear a página 1 cada vez que se recupera el foco del tab (por ejemplo, al volver de otro tab) descartaría silenciosamente ese progreso de scroll.
- **Por qué**: se prioriza no interrumpir la exploración del historial. El rider tiene pull-to-refresh disponible si quiere ver movimientos nuevos.
- **Trade-off aceptado**: si el rider completa una entrega y vuelve a Historial, la comisión nueva no aparece hasta un pull-to-refresh manual. Ver Risks.

### 5. Footer de "cargando página siguiente": fila-skeleton, no `ActivityIndicator`
El footer del `FlatList` durante `loadingMore` reusa el mismo patrón de pulso (`Animated` nativo + `useNativeDriver`) que `BalanceSkeleton`, mostrando 1 fila del alto de `TransactionRow` en vez de un spinner genérico.
- **Por qué**: convención del proyecto — preferir skeletons que repliquen el layout real sobre `ActivityIndicator` en cualquier pantalla con fetch, sin excepción para estados de carga parciales.

### 6. Servicio: mismo patrón 1:1 que `balance.service.ts`
`features/historial/services/historial.service.ts` expone `getTransactions({ page, limit }): Promise<TransactionHistoryResponse>` vía `apiClient.get<RawTransactionHistoryResponse>("/riders/transactions", { params: { page, limit } })`, con mapeo `snake_case → camelCase` igual al de `mapTransaction` en `balance.service.ts` (se duplica la función de mapeo, no se importa, porque son servicios de features distintas con su propio tipo de respuesta — el `Transaction` de salida sí se reusa).

## Risks / Trade-offs

- **Sin refetch en foco** → una comisión nueva no aparece hasta pull-to-refresh manual (ver Decisión 4). Se acepta porque el costo de resetear el scroll del rider es peor que un dato momentáneamente desactualizado, y el gesto de refresh es descubrible (mismo affordance que Balance).
- **`hasMore` depende de que `total` sea preciso** → si el backend devuelve un `total` inconsistente (ej. cambia entre requests porque llegan movimientos nuevos mientras el rider pagina), el cálculo `transactions.length < total` puede subestimar o sobrestimar páginas restantes. Se acepta por ser el único dato de conteo que expone el endpoint; no se agrega una heurística adicional (ej. "página corta implica que no hay más") porque el contrato no lo garantiza.
- **Primer `FlatList` del repo** → introduce un patrón nuevo (vs. `ScrollView`+`.map()` usado en todo el resto de la app). Mitigación: se seguirán las props estándar de RN (`keyExtractor` por `id`, sin configuración exótica de virtualización) para que sea un punto de partida simple si otras pantallas necesitan listas largas más adelante.
