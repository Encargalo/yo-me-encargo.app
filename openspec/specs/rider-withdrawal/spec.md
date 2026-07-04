## Purpose

Pantalla de Solicitud de retiro del rider: muestra el saldo disponible (mismo dato que Balance), aplica el umbral mínimo de retiro, ejecuta `POST /riders/withdrawal` y maneja sus estados de envío, éxito y error, además de una sección de retiros recientes.

## Requirements

### Requirement: Pantalla de Solicitud de retiro muestra el saldo disponible
La pantalla de Solicitud de retiro SHALL obtener y mostrar el saldo disponible para retiro reutilizando el mismo dato que la pantalla de Balance (`GET /riders/balance`), con sus propios estados de carga y error mientras ese dato no esté disponible.

#### Scenario: Saldo disponible cargado
- **WHEN** la pantalla obtiene el saldo exitosamente
- **THEN** muestra el monto disponible en una tarjeta destacada

#### Scenario: Error al obtener el saldo
- **WHEN** la obtención del saldo falla
- **THEN** la pantalla muestra un estado de error con opción de reintentar, sin mostrar el formulario de retiro

### Requirement: Umbral mínimo de retiro
El botón "Solicitar retiro" SHALL estar deshabilitado cuando el saldo disponible sea menor a $0.1, y SHALL mostrarse habilitado en cualquier otro caso (sin tope máximo). La pantalla SHALL mostrar siempre un aviso indicando el umbral mínimo.

#### Scenario: Saldo por debajo del umbral
- **WHEN** el saldo disponible es menor a $0.1
- **THEN** el botón "Solicitar retiro" se muestra deshabilitado

#### Scenario: Saldo igual o por encima del umbral
- **WHEN** el saldo disponible es mayor o igual a $0.1
- **THEN** el botón "Solicitar retiro" se muestra habilitado

### Requirement: Solicitud de retiro
Al tocar "Solicitar retiro" con el botón habilitado, la pantalla SHALL invocar `POST /riders/withdrawal` y SHALL mostrar un indicador de envío en el propio botón mientras la petición está en curso, sin bloquear el resto de la pantalla con un estado de carga genérico.

#### Scenario: Envío en curso
- **WHEN** el rider toca "Solicitar retiro" y la petición está en curso
- **THEN** el botón muestra un indicador de carga en vez de su texto, y permanece deshabilitado hasta que la petición resuelva

### Requirement: Confirmación de éxito con el monto retirado
Cuando `POST /riders/withdrawal` responde `200`, la pantalla SHALL mostrar una confirmación de éxito con el monto retirado (`amount_withdrawn`) como un cambio de contenido dentro de la misma pantalla, sin navegar a una ruta nueva. Un botón "Entendido" SHALL volver a la pantalla de Balance.

#### Scenario: Retiro exitoso
- **WHEN** `POST /riders/withdrawal` responde `200` con `amount_withdrawn`
- **THEN** la pantalla muestra una confirmación con ese monto y un botón "Entendido"

#### Scenario: Volver tras confirmar
- **WHEN** el rider toca "Entendido" en la confirmación de éxito
- **THEN** la app vuelve a la pantalla de Balance

### Requirement: Manejo de errores de la solicitud
Cuando `POST /riders/withdrawal` responde con un error, la pantalla SHALL mostrar un mensaje específico por código de estado (no un mensaje genérico único), determinado por el frontend, sin depender del cuerpo de la respuesta del backend.

#### Scenario: Balance insuficiente (422)
- **WHEN** `POST /riders/withdrawal` responde `422`
- **THEN** la pantalla muestra un mensaje indicando que el saldo es insuficiente para retirar

#### Scenario: No autorizado (401)
- **WHEN** `POST /riders/withdrawal` responde `401`
- **THEN** la pantalla muestra un mensaje indicando que la sesión expiró

#### Scenario: Error inesperado (500 o red)
- **WHEN** `POST /riders/withdrawal` responde `500` o falla por red
- **THEN** la pantalla muestra un mensaje genérico de reintento

### Requirement: Retiros recientes (datos mockeados)
La pantalla SHALL mostrar una sección "Retiros recientes" con una lista de retiros, cada uno con su monto, fecha y estado (`Pendiente` o `Retirado`). Mientras no exista un endpoint real para este dato, la lista SHALL construirse a partir de datos mockeados en el frontend.

#### Scenario: Lista de retiros recientes
- **WHEN** la pantalla se muestra
- **THEN** la sección "Retiros recientes" lista los retiros mockeados con su monto, fecha y una píldora de estado (ámbar para "Pendiente", verde para "Retirado")
