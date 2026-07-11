## Purpose

Pantalla de Historial del rider: tabla con paginación numerada, filtro de rango de fechas (resuelto en cliente) y detalle simple de cada transacción, sobre el historial completo de movimientos desde `GET /riders/transactions`, con sus estados de carga/vacío/error.

## Requirements

### Requirement: Pantalla de Historial lista movimientos paginados
La pantalla de Historial (tab `Historial`) SHALL obtener y mostrar los movimientos del rider desde `GET /riders/transactions` como una tabla con paginación numerada, usando el mismo formato de fila que la pantalla de Balance (etiqueta legible de `movement_type`, monto con signo, fecha y distancia si está presente; sin `payment_method` ni `order_id`). Cada fila SHALL ser táctil y abrir el detalle simple de esa transacción (ver requirement de detalle).

#### Scenario: Carga de la primera página sin filtro activo
- **WHEN** la pantalla se monta sin ningún filtro de fecha activo
- **THEN** se pide `GET /riders/transactions` con `page=1` y el límite de página de la UI, y se muestran las transacciones recibidas con `movement_type`, monto, fecha y distancia

#### Scenario: Sin movimientos
- **WHEN** la página solicitada (con o sin filtro) responde sin transacciones
- **THEN** la pantalla muestra un estado vacío explicativo en vez de una tabla en blanco

### Requirement: Paginación numerada de la tabla
La pantalla SHALL presentar los movimientos como una tabla con paginación numerada (página actual y total de páginas), permitiendo navegar a una página específica, en vez de acumular movimientos por scroll infinito.

#### Scenario: Navegación a página siguiente
- **WHEN** el rider avanza a la página siguiente y existen más páginas (`page < totalPages`)
- **THEN** la tabla reemplaza su contenido por los movimientos de esa página

#### Scenario: No hay página siguiente
- **WHEN** la página actual es la última (`page === totalPages`)
- **THEN** el control de "página siguiente" queda deshabilitado

#### Scenario: Navegación a página anterior
- **WHEN** el rider retrocede desde una página distinta de la primera
- **THEN** la tabla reemplaza su contenido por los movimientos de la página anterior

### Requirement: Filtro de rango de fechas combinado con la paginación sin pérdida de datos
La pantalla SHALL permitir filtrar los movimientos por un rango de fechas (desde/hasta). El filtro SHALL aplicarse automáticamente en cuanto ambas fechas queden elegidas (en cualquier orden), sin requerir una confirmación manual — un botón "Aplicar" SHALL estar disponible como confirmación redundante, deshabilitado mientras falte alguna fecha. Dado que `GET /riders/transactions` no soporta filtro de fecha, SHALL resolver el filtro completamente en el cliente: al activarse, SHALL traer todas las páginas de movimientos disponibles en el servidor, filtrar el resultado por el rango elegido, y paginar la tabla sobre ese resultado filtrado, de forma que ningún movimiento dentro del rango quede fuera de alguna página ni se muestre duplicado.

#### Scenario: Rider elige ambas fechas
- **WHEN** el rider elige una fecha "desde" y una fecha "hasta" (en cualquier orden)
- **THEN** la pantalla trae el set completo de movimientos, lo filtra por ese rango, y muestra la tabla paginada sobre el resultado filtrado con un total de páginas consistente con la cantidad de movimientos filtrados, sin requerir que el rider toque "Aplicar"

#### Scenario: Rider toca "Aplicar" con ambas fechas ya elegidas
- **WHEN** el rider toca el botón "Aplicar" después de que el filtro ya se aplicó automáticamente
- **THEN** la pantalla vuelve a aplicar el mismo rango (no-op visible, sin efecto adicional)

#### Scenario: Rider cambia el rango de fechas con el set completo ya cacheado
- **WHEN** el rider ya tiene el set completo de movimientos cacheado en esta sesión de pantalla y cambia el rango de fechas
- **THEN** la pantalla re-filtra y re-pagina en cliente sin volver a pedir todas las páginas al servidor

#### Scenario: Rider limpia el filtro de fecha
- **WHEN** el rider quita el filtro de fecha activo
- **THEN** la pantalla vuelve al modo de paginación directa contra el servidor, comenzando por la página 1

### Requirement: Detalle simple de una transacción
Al tocar una fila de la tabla, la pantalla SHALL mostrar un detalle simple de esa transacción con los mismos campos ya visibles en la fila (`movement_type`, monto, fecha, distancia), sin realizar una petición adicional al servidor y sin mostrar `payment_method` ni `order_id`.

#### Scenario: Rider toca una fila
- **WHEN** el rider toca una fila de la tabla
- **THEN** se muestra el detalle de esa transacción con sus campos, usando los datos ya cargados en memoria

#### Scenario: Rider cierra el detalle
- **WHEN** el rider cierra la vista de detalle
- **THEN** vuelve a la tabla en la misma página en la que estaba

### Requirement: Estados de carga inicial y por cambio de página
La pantalla SHALL mostrar un skeleton que replica el layout real durante la carga de la primera página, y SHALL mostrar el mismo skeleton al navegar a otra página numerada mientras se espera la respuesta, sin mostrar un spinner genérico. Si hay un filtro de fecha activo que requiere traer el set completo de movimientos por primera vez, la pantalla SHALL mostrar un estado de carga explícito distinto ("cargando historial completo para aplicar el filtro") antes de mostrar la tabla paginada en cliente.

#### Scenario: Carga inicial
- **WHEN** la pantalla se monta y la petición de la página 1 está en curso
- **THEN** se muestra el skeleton en vez de contenido vacío o un spinner genérico

#### Scenario: Cambio de página numerada
- **WHEN** el rider navega a otra página de la tabla (modo sin filtro)
- **THEN** se muestra el skeleton mientras se espera la respuesta de esa página, reemplazando la tabla al llegar los datos

#### Scenario: Primera carga del set completo para un filtro de fecha
- **WHEN** el rider activa un filtro de fecha y todavía no se cacheó el set completo de movimientos en esta sesión de pantalla
- **THEN** se muestra un estado de carga explícito distinto al skeleton de página mientras se agotan todas las páginas del servidor

### Requirement: Errores de red no dejan la pantalla en un estado inconsistente
Si la petición de una página (con o sin filtro) falla, la pantalla SHALL conservar la última página mostrada con éxito y ofrecer una acción para reintentar la navegación fallida, sin perder la tabla visible. Si falla el fetch del set completo requerido por un filtro de fecha, la pantalla SHALL mantener la vista sin filtrar (o el último filtro aplicado con éxito) y ofrecer una acción para reintentar.

#### Scenario: Falla la carga de una página numerada
- **WHEN** `GET /riders/transactions` falla al pedir una página específica (con o sin filtro)
- **THEN** la tabla conserva la última página mostrada con éxito y la pantalla ofrece una forma de reintentar esa navegación

#### Scenario: Falla el fetch del set completo para un filtro de fecha
- **WHEN** falla alguna de las peticiones necesarias para traer el set completo de movimientos requerido por un filtro de fecha
- **THEN** la pantalla mantiene la última vista válida (sin filtro o con el filtro previamente aplicado) y ofrece una forma de reintentar
