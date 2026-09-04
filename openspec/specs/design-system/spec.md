## Purpose

Define la fuente única de verdad visual de la app de riders: la paleta de color con nombres semánticos, el gradiente de marca, las familias y escala tipográficas, y los radios y espaciados. Garantiza que toda la interfaz se pinte desde tokens derivados del System Design y no desde valores literales dispersos por las pantallas.

## Requirements

### Requirement: Paleta de color única derivada del System Design

El sistema SHALL exponer la paleta del System Design como tokens con nombre semántico, disponibles tanto como clases de utilidad (para componentes que usan `className`) como constantes de TypeScript (para props que reciben color, como iconos y marcadores de mapa). Ambas representaciones SHALL declarar los mismos valores.

La paleta SHALL ser: Principal `#2563EB`, Azul Intenso `#1D4ED8`, Azul Claro `#60A5FA`, Contraste `#F7AA28`, Amarillo Claro `#FEF3C7`, Gris `#BDBDBD`, Gris Suave `#F4F4F5`, Blanco `#FBFBFB`, Blanco Puro `#FFFFFF`, Verde Éxito `#09E55B`, Rojo Error `#DC2626`, Skin Tone `#F5C2A0` y Negro Suave `#1A1A1A`.

#### Scenario: Un color disponible en ambas representaciones

- **WHEN** un componente necesita el color principal como clase de utilidad y otro lo necesita como constante para una prop de icono
- **THEN** ambos obtienen `#2563EB`, sin que ninguno declare el hex de forma literal

#### Scenario: Color ausente de la paleta

- **WHEN** un desarrollador necesita un color que el System Design no define
- **THEN** el color SHALL incorporarse primero a la paleta como token con nombre semántico, en lugar de escribirse como hex en el componente

### Requirement: Ningún color literal en pantallas ni componentes

El código de pantallas y componentes NO SHALL contener valores de color literales (hex, `rgb()` o nombres CSS). Todo color SHALL referenciarse mediante un token de la paleta. Se exceptúan los valores derivados de un token en tiempo de ejecución, como aplicar opacidad a un color de estado.

#### Scenario: Componente que pinta un color de estado

- **WHEN** un componente muestra el badge de estado de una orden
- **THEN** toma el color del token de estado correspondiente, y no de un hex escrito en el propio componente

#### Scenario: Derivar una variante de un token

- **WHEN** un componente necesita un fondo tenue del color de error para una alerta
- **THEN** deriva la variante a partir del token de error aplicándole opacidad, sin introducir un segundo hex

### Requirement: Colores de estado de orden distinguibles del color de marca

El sistema SHALL asociar cada estado de orden a un color de la paleta: recogida pendiente a Contraste `#F7AA28`, en camino a Azul Intenso `#1D4ED8`, completado a Verde Éxito `#09E55B` y error o deuda a Rojo Error `#DC2626`.

El color de estado "en camino" SHALL ser distinto del color de marca Principal `#2563EB`, de modo que un elemento de marca nunca se confunda con un indicador de estado, aun siendo ambos azules.

#### Scenario: Estado en camino junto a un elemento de marca

- **WHEN** una pantalla muestra a la vez un elemento de marca y una orden en estado "en camino"
- **THEN** el elemento de marca se pinta en `#2563EB` y el indicador de estado en `#1D4ED8`, resultando distinguibles

#### Scenario: Estado con color propio en toda la app

- **WHEN** dos pantallas distintas representan una orden en el mismo estado
- **THEN** ambas usan el mismo color de estado, tomado del mismo token

### Requirement: Gradiente de marca disponible como token

El sistema SHALL exponer el gradiente de marca del System Design —de Azul Intenso a Principal a Azul Claro, en diagonal descendente— como un token reutilizable, de forma que los componentes que lo usen no redeclaren sus paradas de color ni su ángulo.

#### Scenario: Componente que usa el gradiente

- **WHEN** un componente necesita el fondo degradado de marca
- **THEN** lo obtiene del token de gradiente, sin declarar sus paradas ni su ángulo

### Requirement: Tipografía del System Design sin cambio visible de fuente

El sistema SHALL usar las familias tipográficas del System Design: Plus Jakarta Sans para encabezados, Inter para texto corrido y Manrope para subtítulos. El rider NO SHALL percibir un cambio de tipografía después de que la interfaz se hace visible.

El sistema SHALL exponer la escala tipográfica como tokens con nombre: Header 1 (20, Bold), Header 2 (16, SemiBold), H2 (32, SemiBold), H3 (32, Regular), Subtítulos (32, Medium, Manrope) y Text Regular (12, Regular, Inter).

#### Scenario: Arranque de la app

- **WHEN** la app arranca y muestra su primera pantalla
- **THEN** el texto ya aparece con las tipografías del System Design, sin un reemplazo visible de fuente posterior

#### Scenario: Texto de la interfaz

- **WHEN** una pantalla muestra cualquier texto visible
- **THEN** ese texto declara su familia mediante un token tipográfico del System Design, sin quedar en la familia por defecto del sistema operativo

#### Scenario: Fallo en la carga de fuentes

- **WHEN** la carga de las fuentes falla
- **THEN** la app arranca igualmente con la tipografía del sistema como respaldo, en lugar de quedar bloqueada en la pantalla de splash

### Requirement: Radios y espaciados tokenizados

El sistema SHALL exponer como tokens los radios de esquina (12 y 20) y los espaciados entre elementos (10 y 12) definidos en el System Design.

#### Scenario: Componente con esquinas redondeadas

- **WHEN** un componente necesita el radio de esquina estándar de una tarjeta
- **THEN** usa el token de radio correspondiente en vez de un valor numérico literal
