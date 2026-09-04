## Context

`app/(app)/withdrawal.tsx` es hoy un stub ("Próximamente") dejado a propósito por el change `balance-screen` (ver `openspec/changes/archive/2026-07-04-balance-screen/design.md`, Decisión 6): el CTA "Solicitar retiro" de Balance ya navega con `router.push(ROUTES.APP.WITHDRAWAL)`, empujado sobre el shell de tabs (mismo patrón que Detalle de Orden). Este change reemplaza ese stub por la pantalla real.

`POST /riders/withdrawal` no recibe body — el rider retira **todo** el balance acumulado de una vez, no un monto parcial. La respuesta de éxito es `{ amount_withdrawn: number }`. El umbral mínimo de retiro es **$0.1** (corregido durante la exploración de este change — el doc original y el wireframe decían $15, desactualizados; ya se coordinó con backend y se actualizó `docs/endpoints-yo-me-encargo.app.md`). No hay tope máximo.

A diferencia de `confirm-delivery`, los códigos de error de este endpoint (401/422/500) devuelven un cuerpo `"string"` sin estructura — no hay un `message` utilizable del backend. El 422 ("Balance insuficiente para retiro") debería ser raro dado que el botón ya se deshabilita client-side por debajo del umbral; solo ocurriría por una carrera (el balance bajó entre el fetch y el tap).

No existe ningún endpoint de lectura para el historial/estado de retiros (`Pendiente`/`Procesado` del wireframe 07). Se coordinó con el usuario dejar esa sección con datos mockeados en el frontend, como placeholder, hasta que el backend exponga un endpoint real.

`features/balance/` (change anterior) ya resuelve: fetch de saldo con skeleton/error/refresh (`useBalance`), formato de moneda (`formatAmount`/`formatSignedAmount`), y el criterio de color verde/rojo por signo (`OrderStatusColors.completed`/`.error`). `order-completed-polish` (change anterior) ya trajo `react-native-reanimated` a la app para animar una transición de éxito sin navegar a una ruta nueva.

## Goals / Non-Goals

**Goals:**
- Reemplazar el stub por la pantalla real de Solicitud de retiro: saldo disponible para retiro, aviso del umbral mínimo, botón "Solicitar retiro" (deshabilitado bajo el umbral), sección de retiros recientes (mockeada) y confirmación de éxito con el monto retirado.
- Manejar los estados de un flujo de acción (no de un simple fetch): idle, enviando (spinner en el botón), éxito (swap de contenido), error (banner inline con mensaje propio por código).
- El saldo se calcula con el mismo dato que Balance (`GET /riders/balance`), reutilizando el hook existente en vez de duplicar el fetch.

**Non-Goals:**
- No se construye el endpoint/lectura real de historial de retiros — se mockea explícitamente.
- No se permite retiro parcial (el endpoint no lo soporta) — no hay campo de monto editable.
- No se agrega un store de Zustand — mismo criterio que `balance-screen` Decisión 1 (un solo consumidor hoy).
- No se toca el flujo de Balance más allá de que ya navega a esta ruta (su spec no cambia).

## Decisions

### 1. Nuevo módulo `features/withdrawal/`, separado de `features/balance/`
Balance es una vista de lectura ("cuánto gané"); Retiro es una acción con su propio ciclo de vida (idle/enviando/éxito/error) sobre un endpoint distinto (`POST /riders/withdrawal`). Se crea `features/withdrawal/{services,hooks,types,utils,components}/`, sin `store/` (incluida la misma razón que Balance: un solo consumidor, la pantalla de Solicitud de retiro).
- **Alternativa descartada**: meter el servicio/hook de retiro dentro de `features/balance/`. Se descarta porque mezclaría dos dominios con ciclos de vida distintos (lectura continua vs. una acción puntual) bajo el mismo módulo, dificultando encontrar cada uno.

### 2. La pantalla reutiliza `useBalance()` de `features/balance` para el saldo, no duplica el fetch
`app/(app)/withdrawal.tsx` importa `useBalance` (`@/features/balance/hooks/useBalance`) para obtener `balance` y sus estados de carga/error — exactamente el mismo dato y skeleton que ya usa Balance. Un hook nuevo en `features/withdrawal` que vuelva a pedir `GET /riders/balance` sería una duplicación total del mismo fetch, mismo mapeo y mismo skeleton.
- **Por qué es válido cruzar features**: es reutilizar un hook ya construido (checklist del proyecto, punto 1: "¿esta función ya existe? usarla directamente"), no acoplar estado compartido — `useBalance()` no expone un store, cada llamada es su propia instancia con su propio fetch.
- **Alternativa descartada**: pasar el saldo como route param desde Balance (`router.push({ pathname, params: { balance } })`). Se descarta porque el rider puede llegar a esta ruta con datos desactualizados si pasó tiempo entre pantallas, y porque expo-router serializa params solo como strings — reobtener el dato con el mismo hook ya da skeleton/error gratis.

### 3. Se reutilizan `formatAmount`/`formatSignedAmount` de `features/balance/utils`, no se duplican
El dinero de Retiro es el mismo dominio (mismo saldo USD) que Balance — a diferencia de `formatUsd` de `features/orders` (que sí es un estilo deliberadamente distinto, ver `balance-screen` Decisión 3), acá no hay una segunda convención de formato: es el mismo número, la misma pantalla de origen. Importar el mismo formatter evita una copia idéntica del mismo código.
- **Alternativa descartada**: duplicar `formatAmount` dentro de `features/withdrawal/utils`. Se descarta por ser una copia literal sin ninguna diferencia de comportamiento — no aporta aislamiento real, solo dos lugares que mantener sincronizados.

### 4. Umbral mínimo como constante nombrada, mismo patrón que `DELIVERY_CODE_LENGTH`
`features/withdrawal/types/withdrawal.types.ts` exporta `MIN_WITHDRAWAL_BALANCE = 0.1`. El botón "Solicitar retiro" se deshabilita si `balance < MIN_WITHDRAWAL_BALANCE`. El aviso inline usa `formatAmount(MIN_WITHDRAWAL_BALANCE)` para que el copy nunca quede hardcodeado en dos lugares (constante + texto).

### 5. `useWithdrawal()`: hook de una acción, no de un fetch continuo
Nuevo hook con estado `"idle" | "submitting" | "success" | "error"`:
- `idle`: estado inicial, muestra el formulario (tarjeta de saldo + aviso + retiros recientes + botón).
- `submitting`: el botón muestra `ActivityIndicator` en vez de su label (mismo patrón que `components/Button.tsx` usa en Login vía prop `loading`), sin bloquear el resto de la pantalla con un spinner de página completa.
- `success`: expone `amountWithdrawn` (del `200`) — la pantalla swapea a la vista de confirmación.
- `error`: expone un mensaje ya traducido (ver Decisión 6) — la pantalla muestra un banner inline arriba del botón, sin perder el resto del contenido (mismo criterio que el banner de refresh-error de Balance).
- **Nota**: no usa `components/Button.tsx` (el botón naranja/píldora de Login) — las pantallas de este flujo (Balance, Detalle de Orden) usan botones rectangulares `bg-ink` hand-rolled con NativeWind, siguiendo el wireframe. Se mantiene esa consistencia visual en vez de introducir el botón de Auth aquí.

### 6. Mensajes de error se escriben en el frontend por código de status
`features/withdrawal/utils/withdrawalErrorMessage.ts` expone `getWithdrawalErrorMessage(status?: number): string` con un mapeo fijo:
- `422` → "Tu saldo es insuficiente para retirar." (mismo texto que el aviso del umbral, coherente con por qué se bloqueó)
- `401` → mensaje genérico de sesión ("Tu sesión expiró. Vuelve a iniciar sesión.")
- resto (`500`, network error, etc.) → mensaje genérico de reintento ("No pudimos procesar tu retiro. Intenta de nuevo.")
El servicio (`withdrawal.service.ts`) no intenta leer un `message` del cuerpo de la respuesta (no existe, ver Contexto) — el hook captura el `AxiosError`, lee `error.response?.status` y llama a este mapeo, mismo patrón que ya usa `useBalance`/`useLoginForm` para tipar errores de Axios.
- **Explícitamente temporal**: si el backend en el futuro empieza a mandar un cuerpo estructurado (como `confirm-delivery`), este mapeo se reemplaza por lectura directa del mensaje — confirmado con el usuario que por ahora se maneja así y se revisita después.

### 7. Confirmación de éxito: swap de estado in-place, con Reanimated, no ruta/modal nueva
Mismo patrón que `OrderCompletedSummary` (`order-completed-polish`, Decisión 1): cuando `useWithdrawal().status === "success"`, `withdrawal.tsx` renderiza `WithdrawalSuccess` (ícono de check, "Retiro solicitado", monto retirado, botón "Entendido") como un swap del árbol dentro de la misma pantalla, envuelto en `Animated.View` con `entering={FadeIn.duration(350)}` (ya instalado, sin nueva dependencia). "Entendido" hace `router.back()` — vuelve a Balance, cuyo `useFocusEffect` refresca el saldo solo.
- **Ícono de éxito**: reutiliza el mismo asset Lottie (`assets/animations/Success.json`, `autoPlay`, `loop={false}`, 120×120) ya integrado por `OrderCompletedSummary` — mismo criterio del checklist del proyecto ("¿ya existe? usarla directamente"), y mantiene consistencia visual entre las dos pantallas de éxito de la app en vez de introducir un ícono estático (ej. `CheckCircle` de lucide) distinto.
- **Por qué no el modal atenuado del wireframe**: replicar el fondo oscurecido + sheet centrado requeriría un `Modal`/overlay nuevo para un caso ya resuelto sin navegación adicional en el change anterior; el swap in-place es más simple y consistente con el precedente ya establecido en esta misma app.
- **Alternativa descartada**: navegar a `withdrawal/success` como ruta hija. Mismo motivo que `order-completed-polish` descartó su alternativa equivalente — complejidad de serializar `amountWithdrawn` como route param sin ganancia real.

### 8. "Retiros recientes": datos mockeados, tipados como si vinieran de un endpoint real
`features/withdrawal/services/withdrawal.service.ts` exporta `getMockRecentWithdrawals(): RecentWithdrawal[]` (síncrono, sin llamada HTTP) devolviendo 2-3 registros fijos (`amount`, `date`, `status: "pending" | "processed"`), con un comentario explícito marcando que es un placeholder hasta que exista `GET /riders/withdrawals` (o el campo equivalente en `GET /riders/transactions`). El tipo `RecentWithdrawal` se define ya con la forma que probablemente tendría la respuesta real, para que conectar el endpoint real más adelante sea solo cambiar la función, no el tipo ni el componente que la consume.
- **Por qué no se omite la sección**: decisión del usuario en la exploración — el wireframe la incluye y se quiere mantener el layout completo, coordinado con backend para que llegue después.

## Risks / Trade-offs

- **[Riesgo] Retiros recientes mockeados pueden confundir si un rider realmente retira** → el monto/estado que ve en esa lista no reflejará el retiro que acaba de hacer (los datos son fijos). Mitigación: ninguna por ahora — es una limitación aceptada y temporal, coordinada explícitamente con el usuario; se revisita en cuanto backend exponga el endpoint real.
- **[Riesgo] Mensajes de error no vienen del backend** → si backend cambia el significado exacto de un 422 sin avisar (ej. otra causa además de saldo insuficiente), el mensaje del frontend quedaría desalineado. Mitigación: el mapeo vive en un único archivo (`withdrawalErrorMessage.ts`), fácil de ajustar cuando cambie el contrato.
- **[Riesgo confirmado, resuelto] El backend tardó en aplicar el umbral de $0.1** → verificado en prueba manual (2026-07-04): con balance de $14.0 (por encima de $0.1, por debajo del antiguo $15), `POST /riders/withdrawal` devolvió inicialmente `422` con cuerpo `"insufficient balance for withdrawal"` — el ambiente probado no tenía desplegado el nuevo umbral coordinado con backend en ese momento. El frontend se comportó correctamente (botón habilitado, mensaje de "saldo insuficiente" bien traducido desde el 422 real) — no era un bug del frontend. El log de depuración temporal usado para diagnosticarlo (`console.error` en `useWithdrawal.ts`) ya se retiró del código. El camino de éxito (retiro aprobado, `WithdrawalSuccess` con el monto correcto, "Entendido" vuelve a Balance) fue confirmado manualmente por el usuario en una segunda pasada.
- **[Riesgo] Cruce de imports entre `features/withdrawal` y `features/balance`** (`useBalance`, `formatAmount`) → si `balance-screen` cambia su forma interna, este change se rompe. Mitigación: son imports de funciones/hooks públicos y estables (mismo tipo de dependencia que ya existe entre pantallas y `constants/theme.ts`), no de detalles internos.

## Open Questions

- Ninguna pendiente — todas las decisiones de scope (umbral, mensajes de error, datos mockeados, patrón de éxito, ubicación del módulo) se confirmaron con el usuario durante la exploración previa a este change.
