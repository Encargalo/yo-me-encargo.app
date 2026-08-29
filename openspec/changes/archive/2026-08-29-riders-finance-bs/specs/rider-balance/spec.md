## MODIFIED Requirements

### Requirement: Pantalla de Balance muestra el saldo neto y la zona del rider
La pantalla de Balance SHALL obtener los datos de `GET /riders/balance` y presentar el saldo neto en bolívares (`balance_bs`) en tamaño grande, con el equivalente en dólares (`balance_usd`) como subtítulo referencial (formato `Ref. N$`), junto a un badge de la zona del rider (`zone`). El color del saldo SHALL decidirse sobre `balance_bs`: verde (`OrderStatusColors.completed`) cuando sea mayor o igual a cero, rojo (`OrderStatusColors.error`) cuando sea negativo. El saldo en Bs SHALL NOT mostrarse con el símbolo `$`.

#### Scenario: Saldo positivo o cero
- **WHEN** `GET /riders/balance` responde con `balance_bs >= 0`
- **THEN** la pantalla muestra el monto en Bs en verde, con `balance_usd` como subtítulo referencial y el badge de zona

#### Scenario: Saldo negativo
- **WHEN** `GET /riders/balance` responde con `balance_bs < 0`
- **THEN** la pantalla muestra el monto en Bs en rojo, con `balance_usd` como subtítulo referencial y el badge de zona

### Requirement: Desglose Ganado vs. Descontado
La pantalla SHALL mostrar un desglose "Ganado" (suma de los `amount_bs` positivos) y "Descontado" (suma absoluta de los `amount_bs` negativos) calculado a partir de los movimientos recibidos en la misma respuesta de `GET /riders/balance`, expresado en bolívares.

#### Scenario: Movimientos mixtos
- **WHEN** la respuesta trae movimientos con `amount_bs` positivos y negativos
- **THEN** "Ganado" muestra la suma en Bs de los positivos y "Descontado" la suma absoluta en Bs de los negativos, cada uno con su color (verde/rojo)

### Requirement: Lista de últimos movimientos
La pantalla SHALL listar los movimientos devueltos por `GET /riders/balance` (hasta 10), mostrando por cada uno: una etiqueta legible derivada de `movement_type` (nunca el slug crudo del backend), monto en bolívares (`amount_bs`) con signo (verde si positivo, rojo si negativo), fecha (`created_at`) y distancia (`distance_km`, si está presente). El método de pago (`payment_method`) SHALL NOT mostrarse — no es información relevante para el rider.

#### Scenario: Movimiento con distancia
- **WHEN** un movimiento trae `distance_km`
- **THEN** la fila muestra la etiqueta del tipo, monto en Bs con signo, fecha y distancia, sin el método de pago aunque venga en la respuesta

#### Scenario: Movimiento sin distancia
- **WHEN** un movimiento no trae `distance_km`
- **THEN** la fila se muestra sin ese dato, sin dejar espacios ni placeholders vacíos

#### Scenario: Tipo de movimiento conocido
- **WHEN** `movement_type` es `"ride_bank"`
- **THEN** la fila muestra la etiqueta "Carrera"

#### Scenario: Tipo de movimiento desconocido
- **WHEN** `movement_type` no está en el mapeo de etiquetas conocidas
- **THEN** la fila muestra una versión humanizada del slug (guiones bajos como espacios, solo la primera letra en mayúscula) en vez del slug crudo

#### Scenario: Sin movimientos
- **WHEN** `transactions` llega vacío
- **THEN** la lista muestra un estado vacío explicativo en vez de una lista en blanco

### Requirement: Estados de carga, recarga y error
La pantalla SHALL mostrar un skeleton que replica el layout real (card hero + filas de movimientos) durante la carga inicial, SHALL permitir recargar manualmente con un gesto de pull-to-refresh, y SHALL mostrar un mensaje de error específico si la petición falla, con una acción para reintentar. Una respuesta `200` con forma inesperada (sin `balance_bs` numérico o sin `transactions` como arreglo) SHALL tratarse como un error de carga — con su mensaje y acción de reintento — y NEVER como una excepción que rompa el render de la pantalla.

#### Scenario: Carga inicial
- **WHEN** la pantalla se monta y la petición a `GET /riders/balance` está en curso
- **THEN** se muestra el skeleton en vez de contenido vacío o un spinner genérico

#### Scenario: Recarga manual
- **WHEN** el rider hace el gesto de pull-to-refresh
- **THEN** la pantalla vuelve a pedir `GET /riders/balance` y actualiza el contenido al completarse

#### Scenario: Refetch al recuperar foco
- **WHEN** el rider vuelve a la pantalla de Balance después de haber estado en otra pantalla
- **THEN** la pantalla vuelve a pedir `GET /riders/balance`

#### Scenario: Error de red
- **WHEN** `GET /riders/balance` falla (network error o 5xx)
- **THEN** la pantalla muestra un mensaje de error con una acción para reintentar, sin dejar la pantalla en blanco

#### Scenario: Respuesta 200 con forma inesperada
- **WHEN** `GET /riders/balance` responde `200` pero el cuerpo no trae `balance_bs` numérico o `transactions` no es un arreglo
- **THEN** la pantalla muestra el estado de error con acción de reintento, sin lanzar una excepción que rompa el render

### Requirement: Acceso a Solicitud de retiro y a Historial
La pantalla SHALL mostrar un botón primario "Solicitar retiro" que navega a la ruta de Solicitud de retiro (`ROUTES.APP.WITHDRAWAL`), y un link secundario "Ver historial completo" que navega al tab Historial (`ROUTES.APP.HISTORIAL`).

#### Scenario: Tocar "Solicitar retiro"
- **WHEN** el rider toca el botón "Solicitar retiro"
- **THEN** la app navega a la ruta de Solicitud de retiro

#### Scenario: Tocar "Ver historial completo"
- **WHEN** el rider toca el link "Ver historial completo"
- **THEN** la app navega al tab Historial
