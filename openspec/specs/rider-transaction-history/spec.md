## Purpose

Pantalla de Historial del rider: fetch paginado, scroll infinito y presentación del historial completo de movimientos desde `GET /riders/transactions`, con sus estados de carga/vacío/error.

## Requirements

### Requirement: Pantalla de Historial lista movimientos paginados
La pantalla de Historial (tab `Historial`) SHALL obtener y mostrar los movimientos del rider desde `GET /riders/transactions`, comenzando por la página 1, usando el mismo formato de fila que la pantalla de Balance (etiqueta legible de `movement_type`, monto con signo, fecha y distancia si está presente; sin `payment_method`).

#### Scenario: Carga de la primera página
- **WHEN** la pantalla se monta
- **THEN** se pide `GET /riders/transactions` con `page=1` y se muestran las transacciones recibidas con el mismo formato de fila que Balance

#### Scenario: Sin movimientos
- **WHEN** la primera página responde con `total = 0` (sin transacciones)
- **THEN** la pantalla muestra un estado vacío explicativo en vez de una lista en blanco

### Requirement: Scroll infinito carga páginas siguientes
La pantalla SHALL cargar automáticamente la siguiente página de movimientos cuando el rider se acerca al final de la lista, siempre que existan más movimientos por cargar (`transactions.length < total`), y SHALL evitar disparar más de una carga simultánea para la misma página.

#### Scenario: Rider llega al final de la lista con más páginas disponibles
- **WHEN** el rider hace scroll cerca del final de la lista y quedan movimientos por cargar
- **THEN** la app pide la siguiente página y agrega los nuevos movimientos al final de la lista existente

#### Scenario: No hay más páginas
- **WHEN** ya se cargaron todos los movimientos (`transactions.length >= total`)
- **THEN** la app no dispara más peticiones al llegar al final de la lista

#### Scenario: Carga de página siguiente ya en curso
- **WHEN** una carga de página siguiente ya está en curso
- **THEN** un nuevo disparo del scroll no inicia una segunda petición para la misma página

### Requirement: Pull-to-refresh reinicia la paginación
El gesto de pull-to-refresh SHALL volver a pedir la página 1 y reemplazar por completo la lista de movimientos ya cargada (descarta las páginas siguientes que se hubieran cargado antes del refresh).

#### Scenario: Rider hace pull-to-refresh con páginas ya cargadas
- **WHEN** el rider ya cargó varias páginas y hace el gesto de pull-to-refresh
- **THEN** la pantalla vuelve a pedir la página 1 y la lista mostrada queda reemplazada solo por esa página

### Requirement: Estados de carga inicial y de página siguiente
La pantalla SHALL mostrar un skeleton que replica el layout real durante la carga de la primera página, y SHALL mostrar un indicador de carga con el mismo estilo (fila-skeleton, no un spinner genérico) al pie de la lista mientras se carga una página siguiente, sin ocultar los movimientos ya visibles.

#### Scenario: Carga inicial
- **WHEN** la pantalla se monta y la petición de la página 1 está en curso
- **THEN** se muestra el skeleton en vez de contenido vacío o un spinner genérico

#### Scenario: Carga de página siguiente
- **WHEN** se está cargando una página siguiente por scroll infinito
- **THEN** los movimientos ya cargados permanecen visibles y se muestra el indicador de carga al pie de la lista

### Requirement: Errores de red no descartan datos ya cargados
Si la petición de la primera página falla, la pantalla SHALL mostrar un mensaje de error con una acción para reintentar, sin datos parciales. Si falla la petición de una página siguiente (durante scroll infinito), la pantalla SHALL conservar los movimientos ya cargados y mostrar una forma de reintentar esa página, sin descartar la lista visible.

#### Scenario: Falla la primera página
- **WHEN** `GET /riders/transactions` falla en la carga inicial (network error o 5xx)
- **THEN** la pantalla muestra un mensaje de error con una acción para reintentar, sin dejar la pantalla en blanco

#### Scenario: Falla una página siguiente
- **WHEN** `GET /riders/transactions` falla al pedir una página siguiente durante scroll infinito
- **THEN** los movimientos ya cargados permanecen visibles y la pantalla ofrece una forma de reintentar esa página
