## MODIFIED Requirements

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

## ADDED Requirements

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
