## Purpose

Shell de navegación de la app autenticada de YoMeEncargo: una tab bar global de cuatro secciones (Inicio, Balance, Historial, Perfil) presente en las pantallas principales, y la relación con las pantallas empujadas por encima (Detalle de Orden) que ocultan la tab bar. Centraliza las rutas en `constants/routes.ts` y aplica los tokens visuales del proyecto.

## Requirements

### Requirement: Tab bar global de navegación

La app autenticada SHALL presentar una tab bar global fija con exactamente cuatro secciones en este orden: **Inicio**, **Balance**, **Historial** y **Perfil**. La tab bar SHALL estar presente en cada una de esas cuatro pantallas y permitir cambiar entre ellas con un solo tap.

#### Scenario: Tab bar visible en las secciones principales

- **WHEN** el rider autenticado está en Inicio, Balance, Historial o Perfil
- **THEN** la tab bar muestra los cuatro ítems (Inicio · Balance · Historial · Perfil) y permanece visible

#### Scenario: Cambiar de sección con un tap

- **WHEN** el rider toca un ítem de la tab bar distinto al actual
- **THEN** la app navega a esa sección sin salir del shell de navegación (la tab bar sigue visible)

#### Scenario: Inicio es la sección por defecto

- **WHEN** el rider entra a la zona autenticada de la app tras iniciar sesión
- **THEN** la sección activa inicial es Inicio

### Requirement: Estilo de la tab bar según el sistema visual

La tab bar SHALL resaltar el ítem activo con el color de marca `Primary` (`#fc6b2b`) y mostrar los ítems inactivos en `Neutrals.placeholder` (`#a9a69d`), con borde superior `Neutrals.borderCard` y fondo blanco. La altura base SHALL ser 60px más el safe area inferior del dispositivo. Cada ítem SHALL mostrar un icono monocromo y su etiqueta. Ningún color de estado de orden (pending/enroute/completed/error) SHALL usarse en la tab bar; el naranja es color de marca, no de estado.

#### Scenario: Resaltar la sección activa

- **WHEN** una sección está activa
- **THEN** su icono y etiqueta se muestran en naranja de marca `#fc6b2b` y los demás ítems en gris `#a9a69d`

#### Scenario: Respetar el safe area inferior

- **WHEN** la tab bar se renderiza en un dispositivo con safe area inferior (notch/gesture bar)
- **THEN** la tab bar reserva ese espacio y su contenido no queda tapado por la barra del sistema

### Requirement: Pantallas empujadas ocultan la tab bar

Las pantallas que se empujan por encima del shell de tabs (empezando por el Detalle de Orden) SHALL presentarse **sin** la tab bar, y al volver atrás la tab bar SHALL reaparecer en la sección de origen.

#### Scenario: Abrir el Detalle de Orden

- **WHEN** el rider toca una orden activa en Inicio
- **THEN** se abre el Detalle de Orden como pantalla empujada por encima, sin tab bar visible

#### Scenario: Volver del Detalle a Inicio

- **WHEN** el rider vuelve atrás desde el Detalle de Orden
- **THEN** regresa a Inicio con la tab bar visible y la sección Inicio activa

### Requirement: Rutas de navegación centralizadas

Las nuevas secciones Historial y Perfil SHALL ser navegables mediante constantes de ruta en `constants/routes.ts` (`ROUTES.APP.HISTORIAL` y `ROUTES.APP.PERFIL`), sin strings literales. Las rutas existentes `ROUTES.APP.HOME` (`/home`) y `ROUTES.APP.BALANCE` (`/balance`) SHALL permanecer sin cambios de URL pese a la reestructuración en grupo `(tabs)`.

#### Scenario: Navegar a una sección por su constante

- **WHEN** el código necesita navegar a Historial o Perfil
- **THEN** usa `ROUTES.APP.HISTORIAL` o `ROUTES.APP.PERFIL` y llega a la pantalla correcta

#### Scenario: Las rutas existentes no se rompen

- **WHEN** se navega a `ROUTES.APP.HOME` o `ROUTES.APP.BALANCE` tras la reestructuración
- **THEN** las URLs siguen siendo `/home` y `/balance` respectivamente
