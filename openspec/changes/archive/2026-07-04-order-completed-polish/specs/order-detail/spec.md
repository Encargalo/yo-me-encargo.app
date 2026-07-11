## MODIFIED Requirements

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
