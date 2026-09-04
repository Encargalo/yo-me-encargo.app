## Purpose

Pantalla de Solicitud de retiro del rider: muestra el saldo disponible en bolívares (mismo dato que Balance), habilita el retiro según la zona del rider (`zone`) y el mínimo dinámico (`withdrawal_min_bs`), ejecuta `POST /riders/withdrawal` y maneja sus estados de envío, éxito y error, además de una sección de retiros recientes.

## Requirements

### Requirement: Pantalla de Solicitud de retiro muestra el saldo disponible
La pantalla de Solicitud de retiro SHALL obtener y mostrar el saldo disponible para retiro reutilizando el mismo dato que la pantalla de Balance (`GET /riders/balance`), presentando `balance_bs` en bolívares como cifra destacada con `balance_usd` como subtítulo referencial (`Ref. N$`), con sus propios estados de carga y error mientras ese dato no esté disponible.

#### Scenario: Saldo disponible cargado
- **WHEN** la pantalla obtiene el saldo exitosamente
- **THEN** muestra `balance_bs` en Bs en una tarjeta destacada, con `balance_usd` como subtítulo referencial

#### Scenario: Error al obtener el saldo
- **WHEN** la obtención del saldo falla
- **THEN** la pantalla muestra un estado de error con opción de reintentar, sin mostrar el formulario de retiro

### Requirement: Umbral mínimo de retiro
El botón "Solicitar retiro" SHALL habilitarse únicamente cuando `zone === "withdrawal_available"` en la respuesta de `GET /riders/balance`, y SHALL mostrarse deshabilitado en cualquier otro valor de `zone`. La pantalla SHALL NOT usar un umbral numérico hardcodeado en el frontend. La pantalla SHALL mostrar siempre un aviso del mínimo de retiro vigente usando `withdrawal_min_bs` (en Bs) provisto por el backend; cuando el botón esté deshabilitado por saldo insuficiente, el aviso SHALL indicar cuánto falta, calculado como `withdrawal_min_bs - balance_bs`.

#### Scenario: Zona habilitada para retiro
- **WHEN** `GET /riders/balance` responde con `zone === "withdrawal_available"`
- **THEN** el botón "Solicitar retiro" se muestra habilitado

#### Scenario: Zona normal
- **WHEN** `GET /riders/balance` responde con `zone === "normal"` (o cualquier valor distinto de `withdrawal_available`)
- **THEN** el botón "Solicitar retiro" se muestra deshabilitado

#### Scenario: Aviso de cuánto falta para el mínimo
- **WHEN** el botón está deshabilitado y `balance_bs < withdrawal_min_bs`
- **THEN** el aviso indica el faltante en Bs calculado como `withdrawal_min_bs - balance_bs`, sin restar contra un mínimo fijo

#### Scenario: Aviso del mínimo vigente
- **WHEN** la pantalla se muestra
- **THEN** el aviso del mínimo de retiro usa el valor de `withdrawal_min_bs` del backend, nunca un número hardcodeado

### Requirement: Solicitud de retiro
Al tocar "Solicitar retiro" con el botón habilitado, la pantalla SHALL invocar `POST /riders/withdrawal` y SHALL mostrar un indicador de envío en el propio botón mientras la petición está en curso, sin bloquear el resto de la pantalla con un estado de carga genérico.

#### Scenario: Envío en curso
- **WHEN** el rider toca "Solicitar retiro" y la petición está en curso
- **THEN** el botón muestra un indicador de carga en vez de su texto, y permanece deshabilitado hasta que la petición resuelva

### Requirement: Confirmación de éxito con el monto retirado
Cuando `POST /riders/withdrawal` responde `200`, la pantalla SHALL mostrar una confirmación de éxito con el monto retirado (`amount_withdrawn`) en bolívares, como un cambio de contenido dentro de la misma pantalla, sin navegar a una ruta nueva. Un botón "Entendido" SHALL volver a la pantalla de Balance.

#### Scenario: Retiro exitoso
- **WHEN** `POST /riders/withdrawal` responde `200` con `amount_withdrawn`
- **THEN** la pantalla muestra una confirmación con ese monto en Bs y un botón "Entendido"

#### Scenario: Volver tras confirmar
- **WHEN** el rider toca "Entendido" en la confirmación de éxito
- **THEN** la app vuelve a la pantalla de Balance

### Requirement: Manejo de errores de la solicitud
Cuando `POST /riders/withdrawal` responde con un error, la pantalla SHALL mostrar un mensaje específico por código de estado (no un mensaje genérico único), determinado por el frontend, sin depender del cuerpo de la respuesta del backend.

#### Scenario: Balance insuficiente (422)
- **WHEN** `POST /riders/withdrawal` responde `422`
- **THEN** la pantalla muestra un mensaje indicando que el saldo es insuficiente para retirar

#### Scenario: Tasa BCV no disponible (503)
- **WHEN** `POST /riders/withdrawal` responde `503`
- **THEN** la pantalla muestra un mensaje específico indicando que la tasa BCV no está disponible en este momento y que reintente en unos minutos, distinto del mensaje genérico de error

#### Scenario: No autorizado (401)
- **WHEN** `POST /riders/withdrawal` responde `401`
- **THEN** la pantalla muestra un mensaje indicando que la sesión expiró

#### Scenario: Error inesperado (500 o red)
- **WHEN** `POST /riders/withdrawal` responde `500` o falla por red
- **THEN** la pantalla muestra un mensaje genérico de reintento

### Requirement: Retiros recientes (datos mockeados)
La pantalla SHALL mostrar una sección "Retiros recientes" con una lista de retiros, cada uno con su monto en bolívares, fecha y estado (`Pendiente` o `Retirado`). Mientras no exista un endpoint real para este dato, la lista SHALL construirse a partir de datos mockeados en el frontend.

#### Scenario: Lista de retiros recientes
- **WHEN** la pantalla se muestra
- **THEN** la sección "Retiros recientes" lista los retiros mockeados con su monto en Bs, fecha y una píldora de estado (ámbar para "Pendiente", verde para "Retirado")
