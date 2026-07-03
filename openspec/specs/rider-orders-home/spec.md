## Purpose

Pantalla de Inicio del rider: recepción y visualización en tiempo real de las órdenes activas asignadas (vía WebSocket `GET /orders/rider`), representación en mapa (rider/restaurante/cliente) con color por estado, tarjetas de orden navegables, control de disponibilidad para recibir nuevas órdenes, y estados de carga/vacío.

## Requirements

### Requirement: Conexión en tiempo real a las órdenes del rider
El sistema SHALL abrir una conexión WebSocket a `GET /orders/rider` mientras la pantalla de Inicio está montada, y SHALL cerrarla al desmontarla. La conexión SHALL ser un singleton compartido (un solo socket aunque varios consumidores lo usen) y SHALL reintentar la conexión automáticamente si se cae de forma no intencional.

#### Scenario: Apertura al entrar a Inicio
- **WHEN** el rider autenticado entra a la pantalla de Inicio
- **THEN** el sistema abre la conexión WebSocket a `GET /orders/rider` y refleja el estado "conectando" hasta que el socket confirma la conexión

#### Scenario: Reintento tras caída inesperada
- **WHEN** la conexión WebSocket se cierra sin que el rider haya salido de Inicio
- **THEN** el sistema programa un reintento de conexión y actualiza el estado de conexión mientras tanto

#### Scenario: Cierre al salir de Inicio
- **WHEN** el rider abandona la pantalla de Inicio y no queda ningún consumidor del socket
- **THEN** el sistema cierra la conexión WebSocket y limpia el estado de órdenes en memoria

### Requirement: Visualización de órdenes activas
El sistema SHALL mostrar en la zona inferior de Inicio una tarjeta por cada orden activa asignada al rider, con badge de estado (color según estado), nombre del restaurante e información de distancia/dirección. El sistema SHALL actualizar, agregar o quitar tarjetas en respuesta a los mensajes de actualización recibidos por el WebSocket, sin recargar la pantalla.

#### Scenario: Recepción de una nueva orden
- **WHEN** el WebSocket entrega un mensaje de orden que el rider aún no tenía
- **THEN** el sistema agrega su tarjeta a la lista de órdenes activas con el badge de estado correspondiente

#### Scenario: Actualización de estado de una orden existente
- **WHEN** el WebSocket entrega una actualización de una orden ya visible con un nuevo estado
- **THEN** el sistema actualiza el badge y el color de esa tarjeta sin duplicarla

#### Scenario: Orden que llega a estado terminal
- **WHEN** una orden activa alcanza un estado terminal (entregada/completada)
- **THEN** el sistema la retira de la lista de órdenes activas

### Requirement: Mapa con posición del rider, restaurante y cliente
El sistema SHALL mostrar en la zona superior de Inicio un mapa con un marcador de la posición actual del rider obtenida por GPS del dispositivo. Cuando exista una orden activa con coordenadas, el sistema SHALL mostrar además los marcadores del restaurante y del cliente, y el color del marcador de la orden SHALL corresponder al estado de esa orden.

#### Scenario: Ubicación del rider disponible
- **WHEN** el rider concede el permiso de ubicación y el dispositivo entrega una posición
- **THEN** el sistema centra el mapa en el rider y muestra su marcador

#### Scenario: Orden activa con coordenadas
- **WHEN** existe una orden activa que incluye coordenadas de restaurante y/o cliente
- **THEN** el sistema muestra esos marcadores en el mapa con el color correspondiente al estado de la orden

#### Scenario: Permiso de ubicación denegado
- **WHEN** el rider no concede el permiso de ubicación
- **THEN** el sistema muestra el mapa sin el marcador del rider y no bloquea el resto de la pantalla (las órdenes siguen siendo visibles y utilizables)

### Requirement: Estado de carga del mapa
El sistema SHALL mostrar un skeleton que ocupe el espacio del mapa mientras se resuelve la ubicación inicial, y NO SHALL usar un spinner o `ActivityIndicator` genérico para ese estado de carga.

#### Scenario: Mapa inicializando
- **WHEN** la pantalla de Inicio se monta y la ubicación inicial aún no está resuelta
- **THEN** el sistema muestra el skeleton en el área del mapa hasta que la ubicación esté lista

### Requirement: Estado vacío sin órdenes activas
El sistema SHALL mostrar, cuando no hay órdenes activas, un mapa centrado en el rider sin marcadores de orden y un mensaje breve y tranquilo "Sin órdenes activas".

#### Scenario: Rider sin órdenes
- **WHEN** el rider está conectado pero no tiene ninguna orden activa
- **THEN** el sistema muestra el mensaje "Sin órdenes activas" y el mapa centrado en el rider sin marcadores A/B

### Requirement: Navegación al detalle de la orden
El sistema SHALL navegar a la pantalla de Detalle de Orden cuando el rider toca una tarjeta de orden, usando una ruta definida en `constants/routes.ts`.

#### Scenario: Tap en una tarjeta de orden
- **WHEN** el rider toca la tarjeta de una orden activa
- **THEN** el sistema navega a la ruta de Detalle de Orden pasando el identificador de esa orden

### Requirement: Control de disponibilidad del rider
El sistema SHALL mostrar en el header de Inicio un toggle de disponibilidad (Disponible / No disponible) que controla si el rider recibe nuevas órdenes. Cambiar el toggle NO SHALL cerrar la conexión WebSocket: el rider "No disponible" SHALL seguir conectado para ver y gestionar sus órdenes en curso. El estado de disponibilidad SHALL comunicarse al backend a través de una única función de servicio, de modo que el mecanismo de transporte sea intercambiable en un solo punto.

#### Scenario: Rider se marca como No disponible
- **WHEN** el rider con el toggle en "Disponible" lo cambia a "No disponible"
- **THEN** el sistema comunica el nuevo estado al backend y mantiene abierta la conexión WebSocket y visibles las órdenes en curso

#### Scenario: Rider se marca como Disponible
- **WHEN** el rider con el toggle en "No disponible" lo cambia a "Disponible"
- **THEN** el sistema comunica el nuevo estado al backend para volver a recibir nuevas órdenes

### Requirement: Acceso rápido a balance desde el header
El sistema SHALL ofrecer en el header de Inicio un acceso rápido a la pantalla de Balance.

#### Scenario: Tap en acceso a balance
- **WHEN** el rider toca el acceso rápido a balance del header
- **THEN** el sistema navega a la sección de Balance
