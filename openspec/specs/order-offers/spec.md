## Purpose

Modela el concepto de **oferta** — una orden `new_order` que aún no tiene `rider_id` asignado y espera decisión del rider — como estado separado de las órdenes activas del Home. Cubre la recepción por WebSocket, la cola FIFO de ofertas pendientes, el overlay modal global con temporizador regresivo y comisión destacada, el flujo aceptar/rechazar/timeout, el cierre cuando otro rider toma la oferta, y la suspensión por fatiga de rechazos.

## Requirements

### Requirement: Recepción de ofertas por WebSocket

El sistema SHALL tratar cada mensaje `new_order` del WebSocket `/orders/rider` como una **oferta** pendiente de decisión y encolarla en el store de ofertas, sin insertarla directamente como orden aceptada del rider.

#### Scenario: Llega una oferta nueva
- **WHEN** el WS recibe un mensaje `{ type: "new_order", order }` cuyo `order.id` no ha sido decidido antes y no está en la cola
- **THEN** la orden normalizada se agrega al final de la cola de ofertas
- **AND** si no hay ninguna oferta visible en ese momento, se muestra como oferta actual

#### Scenario: La oferta ya fue decidida (dedupe)
- **WHEN** el WS recibe un `new_order` cuyo `order.id` ya está en el set de ids decididos (aceptado, rechazado, expirado o tomado por otro)
- **THEN** el mensaje se ignora y no se vuelve a encolar ni a mostrar

#### Scenario: Ráfaga repetida al reconectar
- **WHEN** el WS se reconecta y reenvía la ráfaga de ofertas ya vistas
- **THEN** ninguna oferta ya decidida o ya encolada se duplica en la cola

#### Scenario: La orden ya es mía (ya la acepté)
- **WHEN** llega un `new_order` para una orden que ya figura entre mis órdenes aceptadas (existe en las órdenes activas con `rider_id` propio), aunque este mensaje venga sin `rider_id`
- **THEN** la oferta no se encola ni se muestra en el overlay
- **AND** su id se marca como decidido para no volver a ofrecerla aunque un mensaje posterior la reenvíe sin `rider_id`

### Requirement: Cola de ofertas una a una

El sistema SHALL mostrar las ofertas de una en una en orden de llegada (FIFO); al resolverse la oferta visible, SHALL mostrar inmediatamente la siguiente en cola o cerrar el overlay si la cola queda vacía.

#### Scenario: Avanza a la siguiente al resolver
- **WHEN** la oferta visible se resuelve (aceptar, rechazar, expirar o ser tomada por otro rider)
- **THEN** su id se agrega al set de decididos y se retira de la cola
- **AND** si quedan ofertas en cola, la primera pasa a ser la oferta visible con su temporizador reiniciado
- **AND** si la cola queda vacía, el overlay se cierra

### Requirement: Overlay modal global con prioridad máxima

El sistema SHALL presentar la oferta visible en un `Modal` de React Native montado a nivel global (sobre la tab bar y el detalle de orden), con fondo atenuado, que solo se cierra al Aceptar, Rechazar o al expirar el temporizador — nunca por gesto de deslizamiento.

#### Scenario: Interrumpe cualquier pantalla
- **WHEN** hay una oferta visible y el rider está en Inicio, Balance, Historial, Perfil o Detalle
- **THEN** el modal se muestra por encima de la pantalla actual con el fondo atenuado

#### Scenario: No se cierra por gesto
- **WHEN** el rider intenta descartar el modal con un gesto o toque en el fondo
- **THEN** el modal permanece abierto hasta Aceptar, Rechazar o expirar

### Requirement: Contenido de la oferta

El overlay SHALL mostrar el nombre del restaurante, la dirección de entrega con distancia estimada al cliente, y la **comisión en USD** (`delivery_fee`) como el dato destacado de mayor tamaño.

#### Scenario: Comisión destacada en USD
- **WHEN** se muestra una oferta con `delivery_fee`
- **THEN** el monto se presenta en USD como el elemento tipográfico más grande del overlay

#### Scenario: Distancia al cliente
- **WHEN** se conoce la ubicación del rider y las coordenadas de entrega de la oferta
- **THEN** el overlay muestra la distancia estimada rider → cliente calculada con la utilidad haversine existente

### Requirement: Temporizador regresivo de 15 segundos

Cada oferta visible SHALL tener un temporizador circular regresivo de 15 segundos; al llegar a 0 sin respuesta, la oferta se cierra como **rechazo implícito** y se avanza a la siguiente.

#### Scenario: Expira sin respuesta
- **WHEN** el temporizador de la oferta visible llega a 0 sin que el rider pulse Aceptar ni Rechazar
- **THEN** la oferta se marca como decidida (expirada), no se envía `reject_order` obligatoriamente por acción del rider, y se avanza a la siguiente oferta o se cierra el overlay
- **AND** el rechazo por expiración NO incrementa la racha de fatiga de rechazos

### Requirement: Aceptar una oferta

Al Aceptar, el sistema SHALL enviar la intención de aceptación al backend por el WebSocket, cerrar la oferta visible optimistamente y reiniciar la racha de fatiga de rechazos.

#### Scenario: Rider acepta la oferta
- **WHEN** el rider pulsa Aceptar en la oferta visible
- **THEN** se envía el mensaje saliente `accept_order` con el `order_id`
- **AND** la oferta se marca como decidida y se retira de la cola
- **AND** la racha de rechazos consecutivos se reinicia a 0
- **AND** se avanza a la siguiente oferta o se cierra el overlay

### Requirement: Rechazar una oferta

Al Rechazar, el sistema SHALL enviar la intención de rechazo al backend por el WebSocket, cerrar la oferta visible e incrementar la racha de rechazos consecutivos.

#### Scenario: Rider rechaza la oferta
- **WHEN** el rider pulsa Rechazar en la oferta visible
- **THEN** se envía el mensaje saliente `reject_order` con el `order_id`
- **AND** la oferta se marca como decidida y se retira de la cola
- **AND** la racha de rechazos consecutivos se incrementa en 1
- **AND** se avanza a la siguiente oferta o se cierra el overlay

### Requirement: Cierre cuando otro rider toma la oferta

El sistema SHALL retirar de la cola cualquier oferta que reaparezca por el WS con un `rider_id` no vacío (asignada a algún rider); si es la oferta visible, SHALL cerrarla de inmediato y avanzar a la siguiente.

#### Scenario: La oferta visible es tomada por otro rider
- **WHEN** llega un `order_update` o `new_order` para el `id` de la oferta visible con `rider_id` no vacío
- **THEN** la oferta se marca como decidida (tomada), se cierra de inmediato y se avanza a la siguiente
- **AND** este cierre NO incrementa la racha de fatiga de rechazos

#### Scenario: Una oferta encolada (no visible) es tomada
- **WHEN** llega una actualización con `rider_id` no vacío para una oferta que está en la cola pero no es la visible
- **THEN** esa oferta se retira silenciosamente de la cola sin afectar a la oferta visible

### Requirement: Suspensión por fatiga de rechazos

Tras 10 rechazos **explícitos** consecutivos (solo el botón Rechazar), el sistema SHALL suspender la aparición de nuevos overlays hasta que transcurran 5 minutos o el rider vuelva a poner la app en primer plano, lo que ocurra primero.

#### Scenario: Se alcanza el umbral de 10 rechazos
- **WHEN** la racha de rechazos explícitos consecutivos llega a 10
- **THEN** se activa una suspensión con vencimiento a 5 minutos
- **AND** mientras esté suspendida, las nuevas ofertas `new_order` no se muestran como overlay

#### Scenario: La app vuelve a primer plano durante la suspensión
- **WHEN** la app pasa a estado `active` (`AppState`) mientras la suspensión está vigente
- **THEN** la suspensión se levanta y la racha de rechazos se reinicia a 0

#### Scenario: La suspensión vence por tiempo
- **WHEN** transcurren 5 minutos desde que se activó la suspensión sin que la app vuelva a primer plano
- **THEN** la suspensión se levanta y la racha de rechazos se reinicia a 0

#### Scenario: Solo el rechazo explícito cuenta
- **WHEN** una oferta se resuelve por expiración del temporizador o por ser tomada por otro rider
- **THEN** la racha de rechazos consecutivos NO se incrementa
