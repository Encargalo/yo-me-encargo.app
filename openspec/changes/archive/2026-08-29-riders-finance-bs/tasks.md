## 1. Tipos y utils de formato

- [x] 1.1 Reescribir `features/balance/types/balance.types.ts`: `Transaction` con `amountBs`, `amountUsd`, `bcvRate?` (quitar `amount`); `RiderBalanceResponse` con `balanceBs`, `balanceUsd`, `bcvRate?`, `zone`, `withdrawalMinBs`, `transactions` (quitar `balance`). Actualizar comentarios de unidad (Bs, no USD).
- [x] 1.2 Reescribir `features/balance/utils/formatAmount.ts`: `formatBs(value)` (miles con `.`, decimales con `,` solo si no entero, sufijo `Bs`), `formatSignedBs(value)` (signo tipográfico `+`/`−`, cero sin signo), `formatRef(usd)` (`"Ref. N$"`). Quitar `formatAmount` y `formatSignedAmount`.
- [x] 1.3 Actualizar `features/balance/utils/formatAmount.test.ts`: casos de `formatBs` (entero, con decimales, negativo, miles), `formatSignedBs` (positivo, negativo, cero), `formatRef`. Happy path + caso borde por función.
- [x] 1.4 Actualizar `features/balance/utils/summarizeTransactions.ts`: sumar `amountBs`; tipo de retorno `{ earnedBs, deductedBs }`. Actualizar `summarizeTransactions.test.ts` (movimientos mixtos, solo positivos, vacío).

## 2. Servicios

- [x] 2.1 `features/balance/services/balance.service.ts`: `RawRiderBalanceResponse` / `RawTransaction` con campos `*_bs`, `*_usd`, `bcv_rate`, `withdrawal_min_bs`, `zone`. `mapTransaction` mapea a `amountBs`/`amountUsd`/`bcvRate`. Guard: `throw` si `typeof data.balance_bs !== "number"` o `!Array.isArray(data.transactions)`, con comentario de que se captura en `useBalance`. `getBalance` devuelve el nuevo `RiderBalanceResponse`.
- [x] 2.2 `features/balance/services/balance.service.test.ts`: actualizar mocks a la forma nueva; ajustar el test del guard "formato inesperado" a `balance_bs` ausente; agregar caso de `transactions` no-arreglo; verificar mapeo de `amount_bs`/`bcv_rate`.
- [x] 2.3 `features/historial/services/historial.service.ts`: `RawTransaction` y `mapTransaction` duplicados pasan a `*_bs`/`*_usd`/`bcv_rate` → `amountBs`/`amountUsd`/`bcvRate`. `historial.service.test.ts` actualizado (paginación + mapeo de montos en Bs).
- [x] 2.4 `features/withdrawal/services/withdrawal.service.ts`: `getMockRecentWithdrawals` con montos plausibles en Bs (mantener forma de `RecentWithdrawal`). `withdrawal.service.test.ts` sin cambios de contrato (revisar que `requestWithdrawal` sigue devolviendo `amountWithdrawn`).

## 3. Hooks

- [x] 3.1 `features/balance/hooks/useBalance.ts`: estado y retorno con `balanceBs`, `balanceUsd`, `withdrawalMinBs`, `zone` (quitar `balance`). `summary` usa el nuevo `summarizeTransactions`. Actualizar `UseBalanceReturn`.
- [x] 3.2 `features/balance/hooks/useBalance.test.ts`: mocks y asserts a los campos nuevos; conservar los tests de `hasLoadedOnce`, refetch en foco y transición a `error` (incluye caso respuesta malformada → `status: "error"`).
- [x] 3.3 `features/withdrawal/utils/withdrawalErrorMessage.ts`: agregar `if (status === 503)` con copy específico de tasa BCV no disponible. Actualizar `withdrawalErrorMessage.test.ts` (422, 503, 401, default).
- [x] 3.4 Revisar `features/withdrawal/hooks/useWithdrawal.ts` y `features/historial/hooks/useTransactionHistory.ts`: ajustar solo si el cambio de tipo de `Transaction` rompe el type-check; actualizar sus tests si aplica.

## 4. Componentes de Balance e Historial

- [x] 4.1 `features/balance/components/NetBalanceCard.tsx`: props `balanceBs`, `balanceUsd`, `zone`, `summary`. Cifra hero con `formatBs(balanceBs)` + subtítulo `formatRef(balanceUsd)`. Color sobre `balanceBs`. Desglose Ganado/Descontado con `formatSignedBs` sobre `earnedBs`/`deductedBs`.
- [x] 4.2 `features/balance/components/TransactionRow.tsx`: usar `transaction.amountBs` para color y `formatSignedBs`.
- [x] 4.3 `features/historial/components/TransactionDetailModal.tsx`: monto con `formatSignedBs(transaction.amountBs)`; agregar fila "Tasa BCV" solo si `transaction.bcvRate != null`.
- [x] 4.4 Actualizar tests de `NetBalanceCard`, `TransactionRow`, `TransactionDetailModal` (props nuevas, fila BCV presente/ausente) y regenerar sus snapshots (`jest -u`), revisando el diff `$` → `Bs`.

## 5. Componentes de Retiro

- [x] 5.1 `features/withdrawal/types/withdrawal.types.ts`: eliminar `MIN_WITHDRAWAL_BALANCE`. Mantener `WithdrawalResponse` y `RecentWithdrawal`.
- [x] 5.2 `features/withdrawal/components/AvailableBalanceCard.tsx`: props `balanceBs`, `balanceUsd`; cifra con `formatBs` + subtítulo `formatRef`.
- [x] 5.3 `features/withdrawal/components/MinimumBalanceNotice.tsx`: props `withdrawalMinBs?`, `balanceBs`. Copy con `formatBs(withdrawalMinBs)`; cuando `balanceBs < withdrawalMinBs`, añadir el faltante `formatBs(withdrawalMinBs - balanceBs)`. Si `withdrawalMinBs` es `undefined`, copy genérico sin número (nunca "NaN Bs").
- [x] 5.4 `features/withdrawal/components/WithdrawalSuccess.tsx`: `formatBs(amountWithdrawn)`.
- [x] 5.5 `features/withdrawal/components/RecentWithdrawalRow.tsx`: monto con `formatBs`.
- [x] 5.6 Actualizar tests de `AvailableBalanceCard`, `MinimumBalanceNotice` (con/sin `withdrawalMinBs`, saldo bajo el mínimo), `WithdrawalSuccess`, `RecentWithdrawalRow` y regenerar snapshots.

## 6. Pantallas

- [x] 6.1 `app/(app)/(tabs)/balance.tsx`: pasar `balanceBs`, `balanceUsd`, `zone`, `summary` a `NetBalanceCard` desde `useBalance`.
- [x] 6.2 `app/(app)/withdrawal.tsx`: `canWithdraw = zone === "withdrawal_available"` (quitar `MIN_WITHDRAWAL_BALANCE`); pasar `balanceBs`/`balanceUsd` a `AvailableBalanceCard` y `withdrawalMinBs`/`balanceBs` a `MinimumBalanceNotice`.

## 7. Verificación

- [x] 7.1 `npx tsc --noEmit` sin errores.
- [x] 7.2 `npm run lint` sin errores.
- [x] 7.3 `npm test` en verde (incluye snapshots regenerados).
- [x] 7.4 Smoke manual (o revisión de wireframes 06/07/08): Balance carga sin crash, muestra Bs + Ref USD; Historial muestra Bs y el detalle la tasa BCV; Retiro se habilita solo en `withdrawal_available` y el aviso usa el mínimo dinámico.
- [x] 7.5 `openspec validate riders-finance-bs --strict` sin errores.
