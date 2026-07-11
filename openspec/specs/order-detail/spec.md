## Purpose

Pantalla de Orden Activa del rider (`app/(app)/orders/[id].tsx`): una sola ruta que cubre todo el ciclo de una orden desde oferta sin decidir hasta entrega confirmada — aceptar, ver código de recogida y productos, confirmar entrega con el código del cliente, y ver el resumen de pedido completado — leyendo siempre desde las órdenes ya recibidas por el WebSocket del rider, sin depender de un endpoint HTTP adicional.

## Requirements

### Requirement: Visualización base de la orden en el Detalle
El sistema SHALL mostrar, para la orden identificada por el parámetro de ruta, un header con badge de estado (que distingue una oferta sin decidir de una orden ya aceptada, aunque compartan color) y los bloques de Restaurante y Cliente (icono, nombre, dirección) más la comisión del rider (`delivery_fee`), leyendo los datos desde las órdenes ya recibidas por el WebSocket del rider. El sistema NO SHALL depender de una petición HTTP adicional para obtener la orden.

#### Scenario: Orden presente en el store
- **WHEN** el rider navega al Detalle de una orden que ya llegó por el WebSocket
- **THEN** el sistema muestra el header, los bloques de Restaurante y Cliente, y la comisión con los datos de esa orden

#### Scenario: Oferta sin decidir vs. orden ya aceptada
- **WHEN** la orden mostrada está en el bucket de color "pending" (recogida pendiente) y no tiene `riderId` asignado
- **THEN** el sistema muestra el texto "Esperando rider" en el badge en vez de "Recogida pendiente"

#### Scenario: Orden no encontrada
- **WHEN** el rider navega al Detalle de un identificador que no existe en las órdenes recibidas por el WebSocket
- **THEN** el sistema muestra un estado vacío indicando que la orden no está disponible, sin bloquear la navegación de vuelta

### Requirement: Aceptar orden desde el Detalle
El sistema SHALL mostrar, cuando la orden mostrada aún no tiene `riderId` asignado, un botón primario "Aceptar orden" en el footer. Al presionarlo, el sistema SHALL enviar la aceptación por el transporte existente y SHALL deshabilitar el botón mientras espera la confirmación. El sistema SHALL reconocer como confirmación tanto un mensaje `order_update` como un mensaje `order_accepted` para esa orden.

#### Scenario: Rider acepta desde el Detalle
- **WHEN** el rider toca "Aceptar orden" en una orden sin `riderId` asignado
- **THEN** el sistema envía la aceptación por el WebSocket y deshabilita el botón hasta que llegue la actualización de esa orden

#### Scenario: El backend confirma con `order_accepted`
- **WHEN** el backend responde a la aceptación con un mensaje de tipo `order_accepted` que incluye `rider_id` propio
- **THEN** el sistema trata esa respuesta como confirmación de la aceptación, igual que si hubiera llegado como `order_update`

#### Scenario: Orden tomada por otro rider mientras se ve el Detalle
- **WHEN** llega una actualización de la orden mostrada con un `riderId` distinto al del rider actual
- **THEN** el sistema deja de ofrecer la acción de aceptar y refleja que la orden ya no está disponible

### Requirement: Código de recogida y productos del pedido
El sistema SHALL mostrar, cuando la orden tiene `riderId` propio, un código de recogida asignado, y aún no está "En camino", un bloque destacado con ese código. El sistema SHALL mostrar la lista de productos del pedido (nombre, cantidad, y sabores/adiciones cuando existan) embebida dentro del bloque de Cliente cuando la orden traiga productos. El sistema NO SHALL mostrar el bloque de código de recogida si la orden todavía no tiene código asignado, ni una vez que la orden pasa a "En camino".

#### Scenario: Orden aceptada con código de recogida
- **WHEN** la orden mostrada tiene `riderId` propio, trae código de recogida, y no está "En camino"
- **THEN** el sistema muestra el bloque de código de recogida

#### Scenario: Orden sin código de recogida todavía
- **WHEN** la orden mostrada no trae código de recogida
- **THEN** el sistema no muestra el bloque de código de recogida

#### Scenario: Orden ya en camino
- **WHEN** la orden mostrada pasa a estado "En camino"
- **THEN** el sistema deja de mostrar el bloque de código de recogida, aunque el campo siga presente en los datos de la orden

#### Scenario: Pedido con productos
- **WHEN** la orden mostrada trae al menos un producto en `items`
- **THEN** el sistema muestra la lista de productos (colapsable) dentro del bloque de Cliente

### Requirement: Footer informativo mientras se espera la validación del negocio
El sistema SHALL mostrar, mientras la orden está en un estado previo a "En camino" y ya fue aceptada por el rider, un mensaje informativo en el footer indicando que el código se muestra en el negocio, sin ofrecer ninguna acción — la transición a "En camino" ocurre por una actualización recibida del WebSocket, no por una acción del rider en esta pantalla.

#### Scenario: Esperando validación del negocio
- **WHEN** la orden mostrada es del rider y aún no está "En camino"
- **THEN** el sistema muestra el mensaje informativo en el footer sin ningún botón de acción

#### Scenario: El negocio valida el código y la orden pasa a En camino
- **WHEN** llega una actualización de la orden mostrada con estado "En camino"
- **THEN** el sistema reemplaza el footer informativo por el formulario de confirmación de entrega

### Requirement: Confirmación de entrega con código del cliente
El sistema SHALL mostrar, cuando la orden mostrada está "En camino", un campo de código numérico cuya longitud está determinada por una única constante configurable (`DELIVERY_CODE_LENGTH`, hoy 4 dígitos). El botón de confirmar SHALL permanecer deshabilitado hasta que el código tenga la longitud completa. Al confirmar, el sistema SHALL enviar el código al endpoint de confirmación de entrega y SHALL mostrar un mensaje de error específico según el código de respuesta, sin usar mensajes genéricos. El footer que contiene este formulario SHALL permanecer visible por encima del teclado del dispositivo mientras el rider escribe el código.

#### Scenario: Código incompleto
- **WHEN** el rider no ha completado todos los dígitos del código
- **THEN** el botón de confirmar entrega permanece deshabilitado

#### Scenario: Código inválido (400)
- **WHEN** el backend responde 400 al confirmar la entrega
- **THEN** el sistema vacía las casillas del código y muestra el mensaje de código inválido

#### Scenario: Pedido no encontrado (404)
- **WHEN** el backend responde 404 al confirmar la entrega
- **THEN** el sistema muestra el mensaje correspondiente a pedido no encontrado

#### Scenario: Código ya utilizado (409)
- **WHEN** el backend responde 409 al confirmar la entrega
- **THEN** el sistema muestra el mensaje de código ya utilizado

#### Scenario: Estado de pedido incorrecto (422)
- **WHEN** el backend responde 422 al confirmar la entrega
- **THEN** el sistema muestra el mensaje de estado de pedido incorrecto

### Requirement: Pantalla de pedido completado
El sistema SHALL mostrar, tras una confirmación de entrega exitosa (200), una confirmación visual de éxito con una animación de entrada (no un cambio de contenido instantáneo), una animación de éxito (Lottie) en vez de un ícono estático, y un resumen breve (cliente, distancia, comisión) antes de que el rider vuelva a Inicio. Debajo del título de confirmación, el sistema SHALL mostrar de forma sutil el número de la orden y el nombre del restaurante cuando estén disponibles. El botón para volver a Inicio SHALL permanecer anclado a un footer fijo en la parte inferior de la pantalla, no en medio del contenido. Esta confirmación SHALL permanecer visible aunque la orden salga de la lista de órdenes activas como consecuencia de haber llegado a un estado terminal.

#### Scenario: Confirmación de entrega exitosa
- **WHEN** el backend responde 200 al confirmar la entrega
- **THEN** el sistema anima la entrada de la confirmación de pedido completado y muestra el resumen de esa orden (cliente, distancia, comisión)

#### Scenario: Contexto de la orden bajo el título
- **WHEN** el sistema muestra la confirmación de pedido completado y la orden confirmada tenía número y/o nombre de restaurante capturados al momento de la confirmación
- **THEN** el sistema muestra ese número de orden y nombre de restaurante debajo del título, de forma visualmente sutil

#### Scenario: Restaurante sin nombre disponible
- **WHEN** el sistema muestra la confirmación de pedido completado y la orden confirmada no tenía nombre de restaurante disponible
- **THEN** el sistema omite ese dato del subtítulo en vez de mostrar un valor genérico

#### Scenario: Botón de volver a Inicio en el footer
- **WHEN** el rider ve la confirmación de pedido completado
- **THEN** el botón "Volver a Inicio" aparece anclado a un footer fijo en la parte inferior, no centrado entre el resto del contenido

### Requirement: Navegar y llamar desde los bloques de Restaurante y Cliente
El sistema SHALL ofrecer, en los bloques de Restaurante y Cliente, una acción para abrir la navegación al punto correspondiente y una acción para llamar por teléfono. Cuando falte el dato necesario para una de estas acciones (coordenadas o teléfono), el sistema SHALL ocultar esa acción en vez de mostrarla deshabilitada.

#### Scenario: Navegar al restaurante o al cliente
- **WHEN** el rider toca la acción de navegar en un bloque con coordenadas disponibles
- **THEN** el sistema abre la aplicación de mapas del dispositivo hacia esas coordenadas

#### Scenario: Llamar al restaurante o al cliente
- **WHEN** el rider toca la acción de llamar en un bloque con teléfono disponible
- **THEN** el sistema abre el marcador telefónico del dispositivo con ese número

#### Scenario: Teléfono no disponible
- **WHEN** un bloque no tiene teléfono en los datos de la orden
- **THEN** el sistema no muestra la acción de llamar para ese bloque
