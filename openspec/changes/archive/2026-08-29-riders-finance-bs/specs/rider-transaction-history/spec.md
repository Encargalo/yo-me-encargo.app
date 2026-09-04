## MODIFIED Requirements

### Requirement: Pantalla de Historial lista movimientos paginados
La pantalla de Historial (tab `Historial`) SHALL obtener y mostrar los movimientos del rider desde `GET /riders/transactions` como una tabla con paginación numerada, usando el mismo formato de fila que la pantalla de Balance (etiqueta legible de `movement_type`, monto en bolívares `amount_bs` con signo, fecha y distancia si está presente; sin `payment_method` ni `order_id`). Cada fila SHALL ser táctil y abrir el detalle simple de esa transacción (ver requirement de detalle).

#### Scenario: Carga de la primera página sin filtro activo
- **WHEN** la pantalla se monta sin ningún filtro de fecha activo
- **THEN** se pide `GET /riders/transactions` con `page=1` y el límite de página de la UI, y se muestran las transacciones recibidas con `movement_type`, monto en Bs, fecha y distancia

#### Scenario: Sin movimientos
- **WHEN** la página solicitada (con o sin filtro) responde sin transacciones
- **THEN** la pantalla muestra un estado vacío explicativo en vez de una tabla en blanco

### Requirement: Detalle simple de una transacción
Al tocar una fila de la tabla, la pantalla SHALL mostrar un detalle simple de esa transacción con los mismos campos ya visibles en la fila (`movement_type`, monto en bolívares `amount_bs`, fecha, distancia), más la tasa BCV usada para esa conversión (`bcv_rate`) como fila informativa cuando venga en la respuesta, sin realizar una petición adicional al servidor y sin mostrar `payment_method` ni `order_id`.

#### Scenario: Rider toca una fila
- **WHEN** el rider toca una fila de la tabla
- **THEN** se muestra el detalle de esa transacción con sus campos (monto en Bs), usando los datos ya cargados en memoria

#### Scenario: Movimiento con tasa BCV
- **WHEN** la transacción trae `bcv_rate`
- **THEN** el detalle muestra una fila informativa con la tasa BCV usada para esa conversión

#### Scenario: Movimiento sin tasa BCV
- **WHEN** la transacción no trae `bcv_rate`
- **THEN** el detalle se muestra sin esa fila, sin placeholder vacío

#### Scenario: Rider cierra el detalle
- **WHEN** el rider cierra la vista de detalle
- **THEN** vuelve a la tabla en la misma página en la que estaba
