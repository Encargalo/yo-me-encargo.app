## 1. Tipos y ruta nueva

- [x] 1.1 Crear `features/balance/types/balance.types.ts`: `Transaction { id, amount, createdAt, distanceKm?, movementType, orderId?, paymentMethod? }` (`orderId` opcional: no todo movimiento está ligado a una orden, ej. descuentos de plataforma) y `RiderBalanceResponse { balance, zone, transactions: Transaction[] }`
- [x] 1.2 Agregar `ROUTES.APP.WITHDRAWAL = "/withdrawal"` a `constants/routes.ts`

## 2. Servicio — `GET /riders/balance`

- [x] 2.1 Crear `features/balance/services/balance.service.ts` con `getBalance(): Promise<RiderBalanceResponse>` vía `apiClient.get` (instancia de `lib/axios.ts`), mapeo 1:1 de snake_case a camelCase
- [x] 2.2 Tests `balance.service.test.ts`: happy path (200, con y sin `distance_km`/`payment_method` en algún movimiento) y al menos un caso de error propagado como `AxiosError`

## 3. Utilidades — formato de moneda y desglose

- [x] 3.1 Crear `features/balance/utils/formatAmount.ts`: `formatAmount(value)` (símbolo `$` al final, sin decimales si `value` es entero) y `formatSignedAmount(value)` (antepone `+`/`−` tipográfico, usa `formatAmount` sobre el valor absoluto)
- [x] 3.2 Tests `formatAmount.test.ts`: enteros (`2$`), decimales (`0.54$`), cero, signo positivo/negativo
- [x] 3.3 Crear `features/balance/utils/summarizeTransactions.ts`: recibe `Transaction[]` y devuelve `{ earned, deducted }` (suma de positivos, suma absoluta de negativos)
- [x] 3.4 Tests `summarizeTransactions.test.ts`: movimientos mixtos, solo positivos, solo negativos, lista vacía

## 4. Hook orquestador `useBalance`

- [x] 4.1 Crear `features/balance/hooks/useBalance.ts`: fetch al montar y en `useFocusEffect` (`@react-navigation/native`), expone `{ balance, zone, transactions, summary, status: "loading" | "refreshing" | "error" | "success", hasLoadedOnce, refetch, refresh }` (`refresh` para pull-to-refresh, marca `status: "refreshing"` sin mostrar el skeleton de carga inicial; `hasLoadedOnce` distingue error de carga inicial vs. error de refresh con datos previos — ver design.md Decisión 5b)
- [x] 4.2 Manejo de error: al fallar la petición, `status` pasa a `"error"` conservando los últimos datos válidos si ya existían, o vacío en la carga inicial
- [x] 4.3 Tests `useBalance.test.ts`: carga inicial exitosa, error en carga inicial, refetch en foco, `refresh()` no reinicia a estado de skeleton si ya había datos

## 5. Componentes UI

- [x] 5.1 `features/balance/components/BalanceSkeleton.tsx`: mismo patrón de pulso de `MapSkeleton` (`Animated` nativo, sin reanimated) sobre bloques que replican card hero + 3 filas de movimiento
- [x] 5.2 `features/balance/components/NetBalanceCard.tsx`: card con saldo neto grande (verde `OrderStatusColors.completed` si `>= 0`, rojo `.error` si negativo), badge de zona, y desglose Ganado/Descontado (`summarizeTransactions`)
- [x] 5.3 `features/balance/components/TransactionRow.tsx`: fila de movimiento — tipo, monto con signo y color, fecha, distancia y método de pago solo si están presentes
- [x] 5.4 `features/balance/components/TransactionsList.tsx`: lista de `TransactionRow` con estado vacío ("Sin movimientos todavía") cuando `transactions` está vacío
- [x] 5.5 Snapshot tests de los 4 componentes presentacionales nuevos

## 6. Pantalla — integración

- [x] 6.1 Reemplazar el placeholder de `app/(app)/(tabs)/balance.tsx`: usa `useBalance()`, muestra `BalanceSkeleton` durante `status === "loading"`, mensaje de error con acción de reintentar durante `status === "error"` sin datos previos (`!hasLoadedOnce`), banner inline de error + reintentar cuando el error ocurre con datos ya cargados, y el contenido real (`NetBalanceCard` + `TransactionsList`) en `"success"`/`"refreshing"`
- [x] 6.2 `ScrollView` con `RefreshControl` conectado a `refresh()` de `useBalance`
- [x] 6.3 Botón primario fijo "Solicitar retiro" → `router.push(ROUTES.APP.WITHDRAWAL)`; link secundario "Ver historial completo" → `router.push(ROUTES.APP.HISTORIAL)`
- [x] 6.4 Crear `app/(app)/withdrawal.tsx`: pantalla stub empujada sobre el shell de tabs (mismo patrón que `orders/[id].tsx` antes de `order-detail`), mensaje "Próximamente"; registrada en `app/(app)/_layout.tsx`

## 7. Verificación

- [x] 7.1 `npx tsc --noEmit` y `npm run lint` en verde
- [x] 7.2 Prueba manual en dispositivo real (staging): confirmado que Balance carga datos reales (saldo, desglose, movimientos) correctamente. Detectado durante la prueba: `movement_type` real es un slug (`"ride_bank"`), no texto legible — corregido con 7.3. "Solicitar retiro"/"Ver historial completo" verificados por código (navegación simple `router.push`, cubierta por tsc/lint) tras un incidente al interactuar con el dispositivo del usuario en uso activo (ver conversación) — no se repitieron los taps en el dispositivo
- [x] 7.3 Ajuste post-verificación: `features/balance/utils/movementTypeLabel.ts` (mapeo `ride_bank` → "Carrera" + fallback humanizado) y `TransactionRow` deja de mostrar `payment_method` — decisión del usuario tras ver datos reales. Specs (`rider-balance`) y design.md actualizados. Tests nuevos/actualizados en verde
