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
El sistema SHALL mostrar en la zona superior de Inicio un mapa con un marcador de la posición actual del rider obtenida por GPS del dispositivo. El sistema SHALL mostrar los marcadores de restaurante y cliente de cada orden **aceptada** por el rider (con `riderId` propio) que incluya sus coordenadas, hasta un máximo de 2 órdenes aceptadas simultáneas; una orden sin decidir (oferta sin `riderId`) NO SHALL mostrar marcadores de restaurante/cliente en el mapa, y una eventual 3ª orden aceptada (fuera del límite normal que impone el backend) NO SHALL mostrar marcadores adicionales. Los marcadores de restaurante y cliente SHALL usar los assets de pin `shop-location` y `user-location` respectivamente (no un pin genérico con letra), y su color YA NO SHALL depender del estado de la orden.

#### Scenario: Ubicación del rider disponible
- **WHEN** el rider concede el permiso de ubicación y el dispositivo entrega una posición
- **THEN** el sistema centra el mapa en el rider y muestra su marcador

#### Scenario: Orden aceptada con coordenadas
- **WHEN** existe una orden aceptada por el rider (con `riderId` propio) que incluye coordenadas de restaurante y/o cliente
- **THEN** el sistema muestra los marcadores de restaurante (`shop-location`) y cliente (`user-location`) en el mapa

#### Scenario: Dos órdenes aceptadas simultáneas
- **WHEN** el rider tiene 2 órdenes aceptadas simultáneas (ambas con `riderId` propio) con coordenadas de restaurante y/o cliente
- **THEN** el sistema muestra los marcadores de restaurante y cliente de ambas órdenes en el mapa, cada uno direccionable individualmente

#### Scenario: Solo hay ofertas sin decidir
- **WHEN** las órdenes activas del rider son únicamente ofertas sin `riderId` (todavía no aceptadas)
- **THEN** el sistema NO muestra marcadores de restaurante ni cliente en el mapa, solo el marcador del rider

#### Scenario: Permiso de ubicación denegado
- **WHEN** el rider no concede el permiso de ubicación
- **THEN** el sistema muestra el mapa sin el marcador del rider y no bloquea el resto de la pantalla (las órdenes siguen siendo visibles y utilizables)

### Requirement: Estado de carga del mapa
El sistema SHALL mostrar un skeleton que ocupe el espacio del mapa mientras se resuelve la ubicación inicial, y NO SHALL usar un spinner o `ActivityIndicator` genérico para ese estado de carga.

#### Scenario: Mapa inicializando
- **WHEN** la pantalla de Inicio se monta y la ubicación inicial aún no está resuelta
- **THEN** el sistema muestra el skeleton en el área del mapa hasta que la ubicación esté lista

### Requirement: Estado vacío sin órdenes activas
El sistema SHALL deshabilitar el mapa (sin montar el componente nativo de mapa ni solicitar la ubicación del dispositivo) cuando el rider no tiene ninguna orden activa (ni ofertas ni aceptadas), mostrando en su lugar un placeholder estático del mismo tamaño con un mensaje breve y tranquilo invitando a que aparezcan órdenes.

#### Scenario: Rider sin órdenes
- **WHEN** el rider está conectado pero no tiene ninguna orden activa
- **THEN** el sistema muestra un placeholder estático en el área del mapa (sin marcadores, sin solicitar ubicación) junto con el mensaje "Sin órdenes activas" en la zona de la lista

### Requirement: Ruta trazada según la etapa de la orden aceptada
Para cada orden aceptada por el rider (hasta 2 simultáneas), el sistema SHALL trazar una línea de ruta entre la posición del rider y el destino correspondiente a la etapa actual de esa orden: hacia el restaurante mientras la orden está en recogida pendiente, y hacia el cliente una vez la orden pasa a "En camino". El color base de cada línea SHALL corresponder al color de estado de esa etapa (ámbar para recogida pendiente, azul para en camino). Los marcadores de restaurante y cliente de cada orden SHALL reflejar la etapa de esa orden con opacidad: el destino de la etapa actual a opacidad normal, el otro a opacidad reducida. Las rutas SHALL recalcularse cuando una orden cambia de etapa; el sistema NO SHALL recalcular las rutas de forma continua mientras el rider se desplaza dentro de la misma etapa.

Cuando hay 2 órdenes aceptadas con ruta simultánea, el sistema SHALL marcar una como prioritaria y la otra como secundaria: prioritaria la de mayor prioridad de estado (En camino sobre Recogida pendiente); si ambas están en la misma etapa, prioritaria la de destino más cercano a la posición del rider. La ruta secundaria SHALL usar una variante más clara (mezclada hacia blanco) del mismo color base de su etapa, sin cambiar de bucket de color (una ruta en recogida pendiente secundaria sigue siendo ámbar clarificado, nunca azul, y viceversa).

El encuadre de cámara del mapa SHALL incluir la posición del rider y, por cada orden aceptada enfocada, únicamente su destino de etapa actual (no ambos puntos de esa orden) — con 1 orden aceptada esto encuadra `[rider, destino]`, con 2, `[rider, destinoA, destinoB]`.

#### Scenario: Orden en recogida pendiente
- **WHEN** una orden aceptada está en un estado de recogida pendiente (Pending/Accepted/In Preparation/Ready)
- **THEN** el sistema traza su ruta desde el rider hasta el restaurante con línea ámbar, muestra el pin de restaurante a opacidad normal y el de cliente a opacidad reducida, y encuadra la cámara sobre `[rider, restaurante]`

#### Scenario: Orden en camino
- **WHEN** una orden aceptada pasa a estado "On The Way"
- **THEN** el sistema traza su ruta desde el rider hasta el cliente con línea azul, muestra el pin de cliente a opacidad normal y el de restaurante a opacidad reducida, y encuadra la cámara sobre `[rider, cliente]`

#### Scenario: Dos órdenes en etapas distintas
- **WHEN** el rider tiene una orden "On The Way" y otra en recogida pendiente aceptadas simultáneamente
- **THEN** el sistema traza ambas rutas (azul y ámbar respectivamente), muestra la ruta "On The Way" a color normal por ser prioritaria, muestra la ruta de recogida pendiente con su color ámbar clarificado por ser secundaria, y encuadra la cámara sobre `[rider, cliente de la orden en camino, restaurante de la orden en recogida]`

#### Scenario: Dos órdenes en la misma etapa
- **WHEN** el rider tiene 2 órdenes aceptadas simultáneamente en el mismo estado "On The Way"
- **THEN** el sistema traza ambas rutas en azul, muestra a color normal la ruta hacia el destino más cercano a la posición actual del rider, y muestra la otra ruta con azul clarificado por ser secundaria

#### Scenario: Orden completada
- **WHEN** una orden aceptada pasa a estado "Completed"
- **THEN** el sistema deja de mostrar la ruta y los marcadores de restaurante/cliente de esa orden, sin afectar la ruta de la otra orden aceptada si existe

### Requirement: Mapa en pantalla completa
El sistema SHALL mostrar sobre el mapa una etiqueta "Toca para ver en pantalla completa" en vez de "Mapa en tiempo real". El sistema SHALL abrir el mapa en un modal a pantalla completa dentro de Inicio cuando el rider toca el mapa sin arrastrar (un gesto de pan/zoom sobre el mapa NO SHALL abrir la pantalla completa). El mapa en pantalla completa SHALL ser el mismo componente que el mapa reducido (mismos pines, rutas y botón de seguimiento), sin duplicar la posición del rider ni las suscripciones de datos. El sistema SHALL ofrecer un control visible para cerrar la pantalla completa y volver al mapa reducido.

#### Scenario: Tap sobre el mapa reducido
- **WHEN** el rider toca el mapa reducido sin desplazar el dedo más allá del umbral de tap
- **THEN** el sistema abre el mapa en un modal a pantalla completa

#### Scenario: Pan o zoom sobre el mapa reducido
- **WHEN** el rider arrastra o hace pinch-zoom sobre el mapa reducido
- **THEN** el sistema mueve/acerca el mapa con normalidad y NO abre la pantalla completa

#### Scenario: Cierre de la pantalla completa
- **WHEN** el rider toca el control de cerrar en el mapa a pantalla completa
- **THEN** el sistema vuelve a mostrar el mapa reducido en su lugar habitual de Inicio

### Requirement: Seguimiento en vivo del rider
El sistema SHALL ofrecer un botón "Hacer seguimiento" sobre el mapa (reducido y a pantalla completa), apagado por defecto. Al activarlo, el sistema SHALL comenzar a obtener la posición del rider de forma continua (no una lectura única) y SHALL mover el marcador del rider en el mapa a medida que cambia su posición real. Mientras el seguimiento esté activo, el sistema SHALL mantener la cámara centrada sobre el rider con un nivel de zoom cercano, sin permitir que el encuadre de rutas de las órdenes enfocadas compita por el control de la cámara. Si el rider realiza un gesto de pan manual sobre el mapa mientras el seguimiento está activo, el sistema SHALL desactivar el seguimiento automáticamente. Esta posición en vivo SHALL ser visible únicamente para el propio rider (no se transmite al cliente/usuario final).

#### Scenario: Activar seguimiento
- **WHEN** el rider toca el botón "Hacer seguimiento" estando apagado
- **THEN** el sistema comienza a actualizar la posición del rider en vivo y centra la cámara sobre él con zoom cercano

#### Scenario: El rider se mueve con el seguimiento activo
- **WHEN** el seguimiento está activo y la posición del rider cambia
- **THEN** el sistema mueve el marcador del rider y recentra la cámara sobre la nueva posición

#### Scenario: Pan manual desactiva el seguimiento
- **WHEN** el seguimiento está activo y el rider arrastra el mapa manualmente
- **THEN** el sistema desactiva el seguimiento y deja de recentrar la cámara automáticamente

#### Scenario: Seguimiento apagado
- **WHEN** el seguimiento está apagado (estado por defecto)
- **THEN** el sistema muestra la posición del rider obtenida por lectura única, igual que hoy, sin actualizarla en vivo

### Requirement: Mapa deshabilitado cuando el rider no está disponible
El sistema SHALL deshabilitar el mapa (sin montar el componente nativo de mapa ni solicitar la ubicación del dispositivo) cuando el toggle de disponibilidad del rider está en "No disponible", independientemente de si tiene órdenes en curso, mostrando en su lugar el mismo placeholder estático del mapa.

#### Scenario: Rider se marca como No disponible
- **WHEN** el rider cambia el toggle de disponibilidad a "No disponible"
- **THEN** el sistema deja de renderizar el mapa activo y muestra el placeholder estático en su lugar, sin solicitar la ubicación del dispositivo

#### Scenario: Rider vuelve a marcarse como Disponible
- **WHEN** el rider con el toggle en "No disponible" y al menos una orden activa lo cambia a "Disponible"
- **THEN** el sistema vuelve a solicitar la ubicación del dispositivo y renderiza el mapa activo con los marcadores correspondientes

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
