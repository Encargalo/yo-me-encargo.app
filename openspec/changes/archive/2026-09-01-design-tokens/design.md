## Context

Ver `proposal.md` — Why. Restricciones que condicionan el enfoque:

- Los tokens viven hoy duplicados en dos sitios que deben mantenerse en sync a mano: `tailwind.config.js` (clases de NativeWind) y `constants/theme.ts` (constantes para props que reciben color). Un comentario en cada archivo pide sincronizarlos manualmente.
- Hay 20 archivos ya construidos sobre los tokens obsoletos, más cuatro snapshots de test con los colores serializados.
- El proyecto usa Continuous Native Generation: `app.config.ts` aplica `withAndroidManifest` y los scripts de build ejecutan `expo prebuild`. Esto habilita config plugins que tocan el proyecto nativo.
- `expo-font@~14.0.11` y `expo-splash-screen@~31.0.13` ya son dependencias; falta el gradiente y los archivos de fuente.
- El System Design vive en Figma (`fileKey B51r7Cg37bv7znMRiqk7vs`) y sus rótulos de texto están desincronizados de los fills reales — la fuente de verdad son los fills, no las etiquetas.

## Goals / Non-Goals

**Goals:**

- Una sola definición de cada token, sin duplicación manual entre Tailwind y TypeScript.
- Que la migración sea verificable: ningún uso del token viejo debe poder sobrevivir en silencio.
- Nombres semánticos en español coherentes con el System Design, no nombres de color crudos.

**Non-Goals:**

- Soporte de tema oscuro. La estructura `Colors.light` / `Colors.dark` del template se retira; el System Design define un solo tema.
- Rediseñar componentes para igualar los mockups de Figma. Este change cambia los valores, no las formas.

## Decisions

### Una fuente de verdad en TypeScript, derivada hacia Tailwind

`constants/theme.ts` declara los tokens como objetos `as const`; `tailwind.config.js` los importa y los expande dentro de `theme.extend`. Se elimina así la sincronización manual que hoy piden los comentarios de ambos archivos.

Alternativa considerada: mantener los dos archivos independientes y añadir un test que compare sus valores. Se descartó porque detecta la divergencia en vez de impedirla, y añade un test que existe solo para vigilar una duplicación evitable.

Restricción a verificar durante la implementación: `tailwind.config.js` es CommonJS y se evalúa fuera del pipeline de TypeScript. La importación debe funcionar en ese contexto; si no lo hace, la salida es mover los valores planos a un `constants/palette.js` neutral que ambos importen, antes que volver a duplicarlos.

### Nombres semánticos, no nombres de color

Los tokens se nombran por rol (`marca`, `contraste`, `exito`, `error`, `texto`, `superficie`, `borde`) y no por color literal. El System Design ya demuestra el problema del nombre literal: su swatch "Naranja Claro" contiene un azul `#60A5FA` y su rótulo "Principal F83D25" quedó desincronizado del fill azul real. Un nombre por rol sobrevive a un cambio de paleta; uno por color miente en cuanto la paleta cambia.

### El estado "en camino" usa Azul Intenso, no el azul de marca

`app-navigation` exige que ningún color de estado de orden aparezca en la tab bar, apoyándose en que el color de marca era naranja y los de estado no. Al pasar la marca a azul `#2563EB`, esa separación se pierde si "en camino" toma el mismo azul.

Decisión: marca `#2563EB` (Principal) y estado "en camino" `#1D4ED8` (Azul Intenso). Ambos vienen de la paleta, la regla de `app-navigation` se sostiene y los dos azules quedan distinguibles.

Alternativa considerada: dejar ambos en `#2563EB` y relajar el requisito de `app-navigation`. Se descartó porque haría que el ítem activo de la tab bar fuese indistinguible de un indicador de estado, que es justo lo que ese requisito protege.

### Fuentes por `useFonts`, no por config plugin

Se usa el hook `useFonts` de `expo-font` en el layout raíz, junto a `SplashScreen.preventAutoHideAsync()`, con los `.ttf` versionados en `assets/fonts/`. El splash se mantiene hasta que las fuentes están listas, de modo que el primer frame visible ya lleva la tipografía correcta.

Alternativa considerada y descartada: el config plugin de `expo-font`, que embebe las fuentes en el binario y las deja disponibles sin código asíncrono. Es más eficiente, pero la documentación de SDK 54 confirma dos consecuencias que lo hacen inviable aquí:

1. **El nombre de familia difiere por plataforma** — Android resuelve por nombre de archivo e iOS por PostScript name, obligando a un `Platform.select()` en cada uso. `tailwind.config.js` declara `fontFamily` como un único string, así que la divergencia no se puede expresar en el token y reaparecería en cada componente. Esto contradice el objetivo de una sola definición por token.
2. **No funciona en Expo Go** — requiere development build, mientras `CLAUDE.md` documenta `npx expo start` como el comando principal del proyecto.

`useFonts` da nombres de familia idénticos en ambas plataformas —los define quien llama al hook— y funciona en Expo Go. El coste es el estado asíncrono en el layout raíz, acotado a mantener el splash visible mientras carga.

Los `.ttf` se versionan en el repo en vez de depender de las rutas dentro de `node_modules/@expo-google-fonts/*`, para que el build no dependa de la estructura interna de un paquete.

### El gradiente se expone como datos, no como componente

El token de gradiente es un objeto con `colors`, `locations`, `start` y `end`, consumible directamente por `LinearGradient` de `expo-linear-gradient`. No se crea un componente envoltorio: aún no hay un segundo consumidor que justifique la abstracción, y el ángulo de 135.93° del System Design se traduce una sola vez a los vectores `start`/`end` que la librería espera.

### La migración se fuerza por eliminación

Los tokens viejos se borran en el mismo change que introduce los nuevos, en lugar de convivir con un período de deprecación. Con `Neutrals` y `Primary` fuera de `constants/theme.ts`, cualquier import pendiente rompe `npx tsc --noEmit`; con los tokens fuera de `tailwind.config.js`, cualquier clase pendiente aparece en el grep de verificación. Un período de convivencia dejaría dos paletas activas sin nada que obligue a terminar la migración.

## Risks / Trade-offs

- **Las clases de NativeWind no fallan en compilación** → una clase `bg-canvas` que sobreviva se degrada en silencio a "sin estilo" en vez de dar error. Mitigación: un grep explícito de los diez nombres retirados como paso de verificación con salida vacía obligatoria, además del chequeo de tipos.
- **Los snapshots enmascaran regresiones si se regeneran a ciegas** → `jest -u` haría pasar los tests aunque la migración hubiera pintado mal un componente. Mitigación: regenerar los cuatro snapshots en un paso propio y revisar su diff, verificando que solo cambian valores de color y no la estructura del árbol.
- **El cambio de marca a azul es amplio y visual** → un error queda visible para el rider. Mitigación: el change no altera formas ni layout, solo valores; y la verificación incluye abrir las cinco pantallas afectadas.
- **`tailwind.config.js` importando TypeScript puede fallar** → riesgo acotado y con salida definida (un módulo `.js` compartido), pero puede costar una iteración durante la implementación.

## Migration Plan

El change es autocontenido y no tiene estado persistido que migrar: se aplica en un solo despliegue y se revierte revirtiendo el commit. El orden importa solo dentro de la implementación — introducir los tokens nuevos, migrar los consumidores, y recién entonces borrar los viejos, de forma que el árbol nunca quede en un estado donde falten ambos.

## Open Questions

- El System Design define `Skin Tone` (`#F5C2A0`) y `Amarillo Claro` (`#FEF3C7`) pero ninguna pantalla actual los usa. Se incorporan a la paleta por completitud; su rol semántico se puede nombrar cuando aparezca el primer consumidor, sin afectar a este change.
