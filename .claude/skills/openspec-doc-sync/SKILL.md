---
name: openspec-doc-sync
description: Sincroniza el flujo custom de OpenSpec entre la documentación de referencia local y el proyecto, en cualquier dirección. Documentación → proyecto instala o actualiza comandos/skills a partir de lo documentado. Proyecto → documentación propaga cambios hechos directamente en las skills locales hacia la documentación central para que otros proyectos los hereden. Usar cuando el usuario pide instalar/actualizar OpenSpec en un proyecto, o cuando pide actualizar la documentación con lo que ya tiene el proyecto.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: encargalo-custom
  version: "1.2"
---

Sincroniza el flujo custom de OpenSpec (`/opsx:*` + `openspec-*` skills) entre la documentación de referencia local y este proyecto — en cualquier dirección.

**Input**: Opcionalmente, una ruta a la carpeta de documentación, y/o una indicación de dirección (`--to-project`, `--to-docs`, o lenguaje natural equivalente: "actualiza el proyecto con la documentación" vs "actualiza la documentación con lo que tiene el proyecto"). Si no se da nada, resolver según el paso 1.

---

## Paso 1 — Resolver la fuente de documentación

Resolver primero el origen y su tipo (`docSync.type`), en este orden:
1. Si el usuario dio una ruta explícita en el input → usarla como fuente `local`.
2. Si no, leer `.claude/openspec-config.json` → bloque `docSync`, si existe:
   - `docSync.type: "local"` (o `docSync.sourcePath` sin `type` explícito, por compatibilidad) → usar `docSync.sourcePath`.
   - `docSync.type: "notion"` → usar `docSync.mcpServer` y `docSync.pageId`.
   - `docSync.type: "web"` → usar `docSync.endpoint` y `docSync.tokenPath`.
3. Si no hay bloque `docSync` → usar el default `local`: `/home/runbex13/Documentos/Proyectos/Instalación openspec`.

Según el tipo resuelto, verificar acceso ANTES de leer contenido:
- **`local`** → verificar que la ruta exista en disco. Si no existe, preguntar al usuario con **AskUserQuestion** (abierta) dónde está la documentación de referencia.
- **`notion`** → verificar que el servidor MCP de Notion esté conectado (no asumirlo). Si no lo está, preguntar al usuario cómo proceder (conectar el MCP, o cambiar a otra fuente).
- **`web`** → llamar al `endpoint` configurado con el token de `tokenPath` vía Python `urllib.request` (nunca curl) para confirmar acceso antes de sincronizar.

Si la fuente resuelta no existe o no es accesible, preguntar al usuario dónde está — nunca inventar contenido si no se encuentra la fuente.

Leer todos los `.md` de esa carpeta (o las páginas/documentos equivalentes si la fuente es `notion` o `web`). Actualmente son:
- `openspec-custom-instalacion-configuracion.md` — instalación, flujo, reglas del sistema custom
- `prompt-universal-instalacion.md` — prompt de instalación rápida para proyectos nuevos

---

## Paso 2 — Determinar dirección de sincronización

- Si el input incluye `--to-project`, o pide instalar/actualizar el proyecto, o el proyecto no tiene OpenSpec instalado todavía → **dirección Documentación → Proyecto** (ir al bloque A).
- Si el input incluye `--to-docs`, o pide explícitamente actualizar/subir la documentación con lo que tiene el proyecto → **dirección Proyecto → Documentación** (ir al bloque B).
- Si no se especifica y ambos lados existen: comparar rápidamente (sin aplicar nada todavía) y ver si hay diferencias en ambos sentidos.
  - Si solo un lado tiene cambios que el otro no → seguir esa dirección sin preguntar (es el caso obvio).
  - Si **ambos** lados cambiaron cosas distintas → mostrar un resumen corto de qué difiere en cada lado y usar **AskUserQuestion** para que el usuario elija la dirección, o "ambas" (aplicar primero A, después B, mostrando cada resultado por separado).

---

## Bloque A — Documentación → Proyecto (instalar / actualizar el proyecto)

La implementación de referencia del flujo custom es `encargalo-mobile-v2` (la app de clientes, repo hermano). Si hay diferencia entre lo documentado y lo que hace cualquier repo específico, **la documentación gana** (salvo que el usuario diga lo contrario).

### A.1 — Detectar el estado del proyecto actual

- ¿Existe la carpeta `openspec/`?
- ¿Existe `.claude/skills/openspec-propose/SKILL.md` (o equivalente)?

**Si NO existe nada de esto → modo Instalación** (A.2).
**Si SÍ existe → modo Actualización** (A.3).

### A.2 — Modo Instalación (proyecto nuevo)

Seguir el "Prompt Universal de Instalación" documentado en la fuente, adaptado al stack detectado (leer `package.json`, `go.mod`, `requirements.txt`, etc.):

1. **Instalar CLI e inicializar:**
   ```bash
   npm install -g @fission-ai/openspec@latest
   openspec --version
   openspec init
   openspec config profile
   ```
   Seleccionar el set de workflows deseado (como mínimo el perfil "core": `propose`, `explore`, `apply`, `update`, `sync`, `archive`). Si se quiere `/opsx:verify` disponible (el flujo custom lo usa), configurar un perfil `custom` que incluya además `verify`. Luego:
   ```bash
   openspec update
   ```
   Esto genera `.claude/commands/opsx/*.md` y `.claude/skills/openspec-*/` en su versión vanilla, sin las integraciones custom todavía.

2. **Aplicar las integraciones custom** a las skills/comandos vanilla generados (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-sync-specs`), y **crear las skills custom que no genera el CLI**: `openspec-status`, `openspec-live-edit`, `openspec-doc-sync`. Usar como contenido lo documentado en la fuente. `openspec-verify-change` y `openspec-update-change` quedan vanilla (los regenera `openspec update`, no llevan integración custom).

3. **Crear `.claude/openspec-config.json`**: preguntar al usuario con **AskUserQuestion** qué gestor de tareas usar (Notion / Jira / GitHub Projects / ninguno) y con qué credenciales (rutas a token, IDs). Nunca escribir el token en el archivo — solo `tokenPath`. Si el usuario elige "ninguno", crear el archivo `{}`.

4. **Crear o actualizar `CLAUDE.md`**: si no existe, crearlo desde cero adaptado al stack detectado, con las secciones obligatorias documentadas en la fuente (stack y comandos, estructura de carpetas, git workflow, checklist mínimo antes de escribir código, testing, restricciones). Si ya existe, agregar solo las secciones que falten sin tocar las existentes.

5. **Sincronizar comandos con skills** (ver A.4).

6. **Verificar:**
   ```bash
   openspec status
   ```

### A.3 — Modo Actualización (proyecto existente)

1. **Leer cada `SKILL.md` local** en `.claude/skills/openspec-*/`.

2. **Comparar contra lo documentado en la fuente**, sección por sección de flujo (no formato). Para cada skill:
   - ¿La documentación describe un paso nuevo que el SKILL.md local no tiene? → agregarlo.
   - ¿La documentación cambió el comportamiento de un paso existente? → actualizarlo para que coincida.
   - ¿La documentación menciona una skill nueva completa que no existe localmente? → crearla con el contenido correspondiente.
   - ¿Un SKILL.md local tiene un paso que la documentación ya no menciona? → NO borrarlo automáticamente. Marcarlo en el resumen final y preguntar antes de quitarlo — puede ser una extensión local intencional (candidata a propagarse con el Bloque B).

   Si `openspec update` corrió recientemente, las skills vanilla (`openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-sync-specs`) vuelven a estar sin integraciones custom — este bloque es exactamente lo que hace falta para re-aplicarlas.

3. **Qué se actualiza vs qué NO se toca:**
   - SE ACTUALIZA: lógica de flujo en los `SKILL.md` (pasos nuevos, cambios de comportamiento), documentación de nuevos gestores de tareas soportados.
   - NUNCA SE TOCA: `.claude/openspec-config.json` (valores — credenciales, IDs, `database`, `project`, `assignee`, etc.).
   - NUNCA SE TOCA: `openspec/changes/` ni `openspec/specs/` — son artefactos del proyecto.
   - NUNCA SE TOCA: credenciales ni tokens.

### A.4 — Sincronizar comandos con skills (siempre, tras A.2 o A.3)

Regla del sistema: los comandos `.claude/commands/opsx/*.md` y las skills `openspec-*` son dos puntos de entrada al mismo flujo y deben producir el mismo comportamiento.

1. Para cada skill, verificar si existe su comando equivalente:
   - `openspec-propose` ↔ `propose.md` · `openspec-apply-change` ↔ `apply.md` · `openspec-archive-change` ↔ `archive.md` · `openspec-explore` ↔ `explore.md` · `openspec-sync-specs` ↔ `sync.md` · `openspec-status` ↔ `status.md` · `openspec-live-edit` ↔ `live.md` · `openspec-doc-sync` ↔ `doc-sync.md` · `openspec-verify-change` ↔ `verify.md` (vanilla) · `openspec-update-change` ↔ `update.md` (vanilla)
2. Si el comando no existe, crearlo con el mismo contenido que la skill, ajustando solo el frontmatter al formato de comando (`name`, `description`, `category`, `tags`).
3. Si el comando existe pero difiere de la skill en pasos o guardrails, actualizarlo para que coincida exactamente.

---

## Bloque B — Proyecto → Documentación (propagar cambios locales a la documentación central)

Usar cuando el proyecto evolucionó primero (se agregó o cambió un paso directo en un `SKILL.md` local, sin pasar antes por la documentación) y hay que propagar eso a la fuente central para que otros proyectos lo hereden con el Bloque A.

1. **Leer cada `SKILL.md` local** en `.claude/skills/openspec-*/`.

2. **Comparar contra la sección correspondiente de la documentación** en `sourcePath`. Para cada diferencia:
   - Paso nuevo en la skill local que la documentación no tiene → agregarlo a la sección correspondiente del `.md` de documentación (`openspec-custom-instalacion-configuracion.md`, sección 3 para el flujo general, o la sección numerada propia del comando si es sustancial — seguir el patrón de las secciones 8 y 9 existentes).
   - Comportamiento cambiado en la skill local → actualizar la documentación para que lo refleje.
   - Skill/comando completamente nuevo en el proyecto que la documentación no menciona → agregar su sección en la documentación y listarlo en `README.md` y en la tabla de la sección 3.

3. **Mantener el estilo y estructura del documento existente** (numeración de secciones, formato de bloques de código, tono). No reescribir secciones que no cambiaron.

4. **Nunca escribir datos específicos de un proyecto en la documentación** — la documentación es genérica para cualquier proyecto. No copiar rutas absolutas, credenciales, IDs de Notion/Jira/GitHub, ni nombres de changes activos.

5. **Actualizar la fecha de "Última actualización"** en la cabecera del documento tocado.

6. Este bloque **no** toca nada dentro de `.claude/` ni `openspec/` del proyecto — solo escribe en la carpeta de documentación (`sourcePath`).

---

## Paso 3 — Mostrar resumen

```
## OpenSpec doc-sync: <Documentación → Proyecto | Proyecto → Documentación | Ambas direcciones>

**Fuente/destino:** <ruta de la documentación>

### Skills (si aplica Bloque A)
- <nombre>: creada / actualizada (<qué cambió>) / sin cambios

### Comandos (si aplica Bloque A)
- <nombre>: creado / sincronizado con su skill / sin cambios

### Documentación (si aplica Bloque B)
- <archivo>: sección <N> actualizada (<qué cambió>)

### No tocado
- .claude/openspec-config.json — valores intactos
- openspec/changes/, openspec/specs/ — intactos

### Pendiente de decisión
- <cualquier paso local que la documentación ya no menciona, sin borrar>
```

No hacer commit automático en ninguno de los dos lados — dejar los cambios en el working tree para que el usuario los revise y confirme el commit él mismo (regla general del proyecto: nunca commitear sin preguntar). Si el destino de la escritura es la carpeta de documentación (Bloque B) y esa carpeta es un repo git distinto, aplicar la misma regla ahí también.

---

## Guardrails

- Nunca tocar valores de `.claude/openspec-config.json` (credenciales, IDs, tokens) — solo su documentación/estructura.
- Nunca tocar `openspec/changes/` ni `openspec/specs/` — son artefactos del proyecto, no parte del flujo a sincronizar.
- Nunca borrar una skill o un paso local que la documentación ya no menciona sin preguntar antes — puede ser una extensión intencional de este proyecto específico (candidata al Bloque B, no a un borrado silencioso).
- Nunca inventar contenido si la fuente de documentación no se encuentra o no es accesible — preguntar antes de continuar.
- Para fuentes `web`, usar siempre Python `urllib.request` — nunca curl.
- Nunca escribir datos específicos de un proyecto (rutas, credenciales, IDs) dentro de la documentación genérica al correr el Bloque B.
- Si ambos lados tienen cambios distintos y no se especificó dirección, preguntar antes de aplicar nada — nunca elegir un lado arbitrariamente.
- Los comandos y las skills deben quedar idénticos en lógica al terminar el Bloque A — esa sincronización (A.4) es obligatoria en cada corrida, no opcional.
- No hacer commit automático en ningún lado — el usuario revisa y commitea cuando esté listo.
- Si `openspec update` se corrió recientemente (skills/comandos vanilla sin integraciones), el Bloque A es exactamente lo que hace falta correr después — mencionarlo en el resumen si se detecta.
