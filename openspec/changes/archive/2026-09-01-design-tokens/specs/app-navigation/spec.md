## MODIFIED Requirements

### Requirement: Estilo de la tab bar según el sistema visual

La tab bar SHALL resaltar el ítem activo con el color de marca Principal (`#2563EB`) y mostrar los ítems inactivos en Gris (`#BDBDBD`), con borde superior en Gris Suave (`#F4F4F5`) y fondo Blanco Puro. La altura base SHALL ser 60px más el safe area inferior del dispositivo. Cada ítem SHALL mostrar un icono monocromo y su etiqueta. Ningún color de estado de orden (pending/enroute/completed/error) SHALL usarse en la tab bar; el azul Principal es color de marca, no de estado, y se distingue del azul de estado "en camino" (Azul Intenso `#1D4ED8`).

#### Scenario: Resaltar la sección activa

- **WHEN** una sección está activa
- **THEN** su icono y etiqueta se muestran en azul de marca `#2563EB` y los demás ítems en gris `#BDBDBD`

#### Scenario: Respetar el safe area inferior

- **WHEN** la tab bar se renderiza en un dispositivo con safe area inferior (notch/gesture bar)
- **THEN** la tab bar reserva ese espacio y su contenido no queda tapado por la barra del sistema
