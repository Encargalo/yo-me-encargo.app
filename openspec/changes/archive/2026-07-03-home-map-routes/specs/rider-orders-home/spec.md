## MODIFIED Requirements

### Requirement: Mapa con posición del rider, restaurante y cliente
El sistema SHALL mostrar en la zona superior de Inicio un mapa con un marcador de la posición actual del rider obtenida por GPS del dispositivo. El sistema SHALL mostrar los marcadores de restaurante y cliente únicamente cuando exista una orden **aceptada** por el rider (con `riderId` propio) que incluya sus coordenadas; una orden sin decidir (oferta sin `riderId`) NO SHALL mostrar marcadores de restaurante/cliente en el mapa. Los marcadores de restaurante y cliente SHALL usar los assets de pin `shop-location` y `user-location` respectivamente (no un pin genérico con letra), y su color YA NO SHALL depender del estado de la orden.

#### Scenario: Ubicación del rider disponible
- **WHEN** el rider concede el permiso de ubicación y el dispositivo entrega una posición
- **THEN** el sistema centra el mapa en el rider y muestra su marcador

#### Scenario: Orden aceptada con coordenadas
- **WHEN** existe una orden aceptada por el rider (con `riderId` propio) que incluye coordenadas de restaurante y/o cliente
- **THEN** el sistema muestra los marcadores de restaurante (`shop-location`) y cliente (`user-location`) en el mapa

#### Scenario: Solo hay ofertas sin decidir
- **WHEN** las órdenes activas del rider son únicamente ofertas sin `riderId` (todavía no aceptadas)
- **THEN** el sistema NO muestra marcadores de restaurante ni cliente en el mapa, solo el marcador del rider

#### Scenario: Permiso de ubicación denegado
- **WHEN** el rider no concede el permiso de ubicación
- **THEN** el sistema muestra el mapa sin el marcador del rider y no bloquea el resto de la pantalla (las órdenes siguen siendo visibles y utilizables)

### Requirement: Estado vacío sin órdenes activas
El sistema SHALL deshabilitar el mapa (sin montar el componente nativo de mapa ni solicitar la ubicación del dispositivo) cuando el rider no tiene ninguna orden activa (ni ofertas ni aceptadas), mostrando en su lugar un placeholder estático del mismo tamaño con un mensaje breve y tranquilo invitando a que aparezcan órdenes.

#### Scenario: Rider sin órdenes
- **WHEN** el rider está conectado pero no tiene ninguna orden activa
- **THEN** el sistema muestra un placeholder estático en el área del mapa (sin marcadores, sin solicitar ubicación) junto con el mensaje "Sin órdenes activas" en la zona de la lista

## ADDED Requirements

### Requirement: Ruta trazada según la etapa de la orden aceptada
Cuando exista una orden aceptada por el rider enfocada en el mapa, el sistema SHALL trazar una línea de ruta entre la posición del rider y el destino correspondiente a la etapa actual de esa orden: hacia el restaurante mientras la orden está en recogida pendiente, y hacia el cliente una vez la orden pasa a "En camino". El color de la línea SHALL corresponder al color de estado de esa etapa (ámbar para recogida pendiente, azul para en camino). Los marcadores de restaurante y cliente SHALL reflejar la etapa con opacidad: el destino de la etapa actual a opacidad normal, el otro a opacidad reducida. La ruta SHALL recalcularse cuando la orden cambia de etapa; el sistema NO SHALL recalcular la ruta de forma continua mientras el rider se desplaza dentro de la misma etapa.

#### Scenario: Orden en recogida pendiente
- **WHEN** la orden aceptada enfocada está en un estado de recogida pendiente (Pending/Accepted/In Preparation/Ready)
- **THEN** el sistema traza la ruta desde el rider hasta el restaurante con línea ámbar, muestra el pin de restaurante a opacidad normal y el de cliente a opacidad reducida

#### Scenario: Orden en camino
- **WHEN** la orden aceptada enfocada pasa a estado "On The Way"
- **THEN** el sistema traza la ruta desde el rider hasta el cliente con línea azul, muestra el pin de cliente a opacidad normal y el de restaurante a opacidad reducida

#### Scenario: Orden completada
- **WHEN** la orden aceptada enfocada pasa a estado "Completed"
- **THEN** el sistema deja de mostrar la ruta y los marcadores de restaurante/cliente de esa orden

### Requirement: Mapa deshabilitado cuando el rider no está disponible
El sistema SHALL deshabilitar el mapa (sin montar el componente nativo de mapa ni solicitar la ubicación del dispositivo) cuando el toggle de disponibilidad del rider está en "No disponible", independientemente de si tiene órdenes en curso, mostrando en su lugar el mismo placeholder estático del mapa.

#### Scenario: Rider se marca como No disponible
- **WHEN** el rider cambia el toggle de disponibilidad a "No disponible"
- **THEN** el sistema deja de renderizar el mapa activo y muestra el placeholder estático en su lugar, sin solicitar la ubicación del dispositivo

#### Scenario: Rider vuelve a marcarse como Disponible
- **WHEN** el rider con el toggle en "No disponible" y al menos una orden activa lo cambia a "Disponible"
- **THEN** el sistema vuelve a solicitar la ubicación del dispositivo y renderiza el mapa activo con los marcadores correspondientes
