# OpenSpec Custom — Instalacion y Configuracion del Flujo

App: General
Creada por: ClaudeIA
Fecha de Ultima actualizacion: 18 de junio de 2026 13:08
Hora de creacion: 15 de junio de 2026 16:15
Ultima edicion por: ClaudeIA

<aside>
📋 Esta pagina es la fuente de verdad del flujo custom de OpenSpec usado en proyectos Encargalo. Cualquier IA puede leer esta pagina y instalar/actualizar la configuracion en cualquier proyecto, sin importar el lenguaje.

</aside>

# 1. Que es OpenSpec

OpenSpec es un framework de desarrollo guiado por especificaciones, disenado para trabajar con asistentes de IA. En vez de escribir codigo directamente, primero se acuerda que construir (propuesta + specs + diseno + tareas) y luego la IA implementa siguiendo esos artefactos. Funciona con cualquier lenguaje o framework.

Repo oficial: https://github.com/Fission-AI/OpenSpec

---

# 2. Instalacion desde cero

## Requisitos

- Node.js 20.19.0 o superior
- Claude Code CLI u otro asistente compatible con slash commands
- Git inicializado en el proyecto

## Paso 1 — Instalar el CLI globalmente

```bash
npm install -g @fission-ai/openspec@latest
```

Verificar:

```bash
openspec --version
```

## Paso 2 — Inicializar en el proyecto

```bash
cd tu-proyecto
openspec init
```

Esto crea la carpeta openspec/ con la estructura base: changes/, specs/ y el schema spec-driven.

## Paso 3 — Configurar el perfil de workflow

```bash
openspec config profile
```

Seleccionar el perfil "core". Luego actualizar los instruction files para la IA:

```bash
openspec update
```

Esto genera/actualiza los archivos .claude/commands/opsx/*.md que la IA usa como slash commands.

## Paso 4 — Instalar las skills custom

<aside>
⚡ Este paso es lo que diferencia esta configuracion del OpenSpec vanilla. Las skills custom extienden el flujo base con integraciones opcionales (gestor de tareas, documentacion externa, rama git automatica).

</aside>

Copiar la carpeta .claude/skills/ del repo de referencia al proyecto nuevo. Contiene:

- openspec-propose/SKILL.md — crea artefactos + rama git + tarea en gestor externo
- openspec-apply-change/SKILL.md — implementa tasks + sincroniza estado con gestor externo
- openspec-archive-change/SKILL.md — archiva, hace commit, cierra tarea en gestor externo
- openspec-explore/SKILL.md — modo exploracion sin codigo
- openspec-sync-specs/SKILL.md — sincroniza delta specs a main specs
- openspec-status/SKILL.md — dashboard de changes activos

## Paso 5 — Crear el archivo de configuracion por proyecto

Crear .claude/openspec-config.json en la raiz del proyecto. Este archivo activa/desactiva los pasos opcionales del flujo. Si un bloque no esta presente, ese paso se omite silenciosamente.

```json
{
  "taskManager": {
    "type": "notion",
    "tokenPath": "/ruta/absoluta/a/token.txt",
    "database": "ID-de-la-base-de-datos",
    "project": "ID-del-proyecto",
    "assignee": "ID-del-responsable"
  },
  "docManager": {
    "type": "notion",
    "tokenPath": "/ruta/absoluta/a/token.txt",
    "pageId": "ID-de-la-pagina-de-documentacion"
  }
}
```

Si no quieres gestor de tareas externo: omitir el bloque "taskManager" completo.

Si no quieres documentacion externa: omitir el bloque "docManager" completo.

---

# 3. Flujo de trabajo custom

El flujo sigue este orden. Cada paso es un slash command que la IA ejecuta:

## /opsx:explore

Modo exploracion. La IA lee el codigo, responde preguntas, compara opciones, dibuja diagramas. NO escribe codigo. Ideal antes de proponer un change.

## /opsx:propose <nombre>

Crea un change completo en un paso:

1. Genera proposal.md (que y por que)
2. Genera specs/ (requisitos por capacidad)
3. Genera design.md (como se implementa)
4. Genera tasks.md (lista de tareas con checkboxes)
5. Crea rama git feat/<nombre> (o fix/, chore/ segun el tipo)
6. Si taskManager esta configurado: crea tarea en el gestor externo con estado "En curso"
7. Si taskManager tiene muchas subtareas (>20): las sube tambien al gestor externo

## /opsx:apply [nombre]

Implementa las tareas del change activo:

1. Verifica que la rama git correcta esta activa
2. Si taskManager configurado: recupera el page_id/issue_id de la tarea existente
3. Implementa tarea por tarea, marcando checkboxes en tasks.md
4. Si taskManager configurado: actualiza estado de subtareas al completarlas
5. Al terminar: PREGUNTA al usuario antes de hacer commit (nunca commitea solo)

## /opsx:archive [nombre]

Cierra el change cuando el usuario esta listo:

1. Verifica completion de artefactos y tareas
2. Sincroniza delta specs a main specs (con confirmacion)
3. Mueve el change a openspec/changes/archive/YYYY-MM-DD-<nombre>/
4. Hace commit automatico con mensaje convencional
5. Si taskManager configurado: marca tarea como "En revision"

## /opsx:sync [nombre]

Sincroniza las specs del change activo a las main specs sin archivar. Util cuando las specs cambian durante implementacion.

## /opsx:status

Dashboard de todos los changes activos: nombre, schema, artefactos completados, tareas pendientes, bloqueadores detectados.

---

# 4. Configuracion por gestor de tareas

<aside>
🔑 Cada gestor requiere credenciales distintas en openspec-config.json. La IA lee el campo "type" y sigue las instrucciones del gestor correspondiente.

</aside>

## Notion

Obtener token de integracion: https://www.notion.so/my-integrations

Crear una integracion, copiar el "Internal Integration Token". Guardarlo en un archivo de texto fuera del repo (nunca en el repo).

```json
{
  "taskManager": {
    "type": "notion",
    "tokenPath": "/ruta/al/token.txt",
    "database": "ID de la base de datos de tareas (ver URL de la DB en Notion)",
    "project": "ID de la pagina del proyecto (campo de relacion)",
    "assignee": "ID del usuario responsable (GET /v1/users)"
  }
}
```

Obtener IDs: abrir la base de datos en Notion, copiar el UUID de la URL. Para el assignee: GET https://api.notion.com/v1/users con el token.

## Jira

Obtener API token: https://id.atlassian.com/manage-profile/security/api-tokens

```json
{
  "taskManager": {
    "type": "jira",
    "tokenPath": "/ruta/al/token.txt",
    "email": "tu@email.com",
    "baseUrl": "https://tu-workspace.atlassian.net",
    "projectKey": "CLAVE-DEL-PROYECTO",
    "assigneeAccountId": "ID de cuenta Atlassian del responsable"
  }
}
```

Nota: el token de Jira se usa con Basic Auth (email:token en base64). Las skills deben implementar esto.

## GitHub Projects

Obtener Personal Access Token con permisos project y repo: https://github.com/settings/tokens

```json
{
  "taskManager": {
    "type": "github-projects",
    "tokenPath": "/ruta/al/token.txt",
    "owner": "usuario-u-org",
    "repo": "nombre-del-repo",
    "projectNumber": 1
  }
}
```

GitHub Projects usa GraphQL API (api.github.com/graphql). Las skills deben usar ese endpoint.

## Sin gestor externo

Omitir el bloque taskManager en openspec-config.json. El flujo funciona igual pero sin sincronizacion externa: las tareas solo viven en tasks.md localmente.

---

# 5. Como actualizar el flujo desde cualquier proyecto

<aside>
🔄 Cuando esta documentacion se actualiza (se agrega un paso nuevo, se cambia como funciona algo), cualquier proyecto puede sincronizar sus skills locales leyendo esta pagina.

</aside>

Decirle a la IA:

```
Lee la documentacion de OpenSpec Custom en Notion (pagina: OpenSpec Custom — Instalacion y Configuracion del Flujo) y actualiza los SKILL.md locales de este proyecto para que coincidan con el flujo documentado. Mantener los valores del openspec-config.json sin cambios.
```

La IA lee esta pagina, compara con los SKILL.md actuales y aplica solo los cambios del flujo global. La configuracion local (credenciales, IDs) no se toca.

## Que se actualiza vs que NO se actualiza

- SE ACTUALIZA: logica del flujo en los SKILL.md (nuevos pasos, cambios de comportamiento)
- SE ACTUALIZA: documentacion de nuevos gestores de tareas o documentacion soportados
- NO SE TOCA: .claude/openspec-config.json — es configuracion local del proyecto
- NO SE TOCA: openspec/changes/ ni openspec/specs/ — son artefactos del proyecto
- NO SE TOCA: credenciales ni tokens

---

# 6. Estructura de archivos resultante

```
tu-proyecto/
├── .claude/
│   ├── openspec-config.json          ← configuracion local (no commitear tokens)
│   ├── settings.local.json           ← permisos de Claude Code
│   ├── commands/opsx/                ← slash commands generados por openspec update
│   │   ├── apply.md
│   │   ├── archive.md
│   │   ├── explore.md
│   │   ├── propose.md
│   │   ├── status.md
│   │   ├── sync.md
│   │   └── verify.md
│   └── skills/                       ← skills custom (este flujo)
│       ├── openspec-propose/SKILL.md
│       ├── openspec-apply-change/SKILL.md
│       ├── openspec-archive-change/SKILL.md
│       ├── openspec-explore/SKILL.md
│       ├── openspec-sync-specs/SKILL.md
│       └── openspec-status/SKILL.md
└── openspec/
    ├── changes/
    │   ├── nombre-del-change/        ← change activo
    │   │   ├── .openspec.yaml
    │   │   ├── proposal.md
    │   │   ├── design.md
    │   │   ├── specs/
    │   │   └── tasks.md
    │   └── archive/                  ← changes completados
    └── specs/                        ← main specs sincronizadas
```

---

# 7. Reglas del flujo custom

## Git

- Siempre crear rama antes de tocar codigo: feat/, fix/, chore/, refactor/
- Una rama por change de OpenSpec
- Nunca commitear sin confirmacion explicita del usuario
- /opsx:propose crea la rama automaticamente
- /opsx:archive hace el commit automaticamente DESPUES de que el usuario aprobo

## Tareas externas

- Si taskManager no esta en config: omitir todo lo relacionado a tareas externas
- Si falla la conexion al gestor externo: loguear warning y continuar — no bloquear el flujo
- Nunca duplicar tareas: buscar primero por campo "Change OpenSpec" o equivalente
- El token SIEMPRE se lee desde tokenPath — nunca hardcodeado en el codigo

## Umbrales de subtareas en Notion

- Si el change tiene <= 20 tareas de nivel 1: no crear subtareas en Notion, solo la tarea principal
- Si tiene > 20: crear cada tarea de nivel 1 en Notion vinculada a la principal
- El umbral aplica por nivel independientemente — evaluar nivel 1 y nivel 2 por separado

## Implementacion HTTP

- Siempre usar Python con urllib.request para llamadas a APIs externas
- NUNCA usar curl — falla con caracteres especiales en el body JSON
- Errores de API: loguear y continuar, nunca bloquear el flujo principal

---

# 8. Instalacion en un proyecto existente (sin OpenSpec previo)

1. Instalar CLI globalmente (ver Seccion 2, Paso 1)
2. Inicializar: openspec init en la raiz del proyecto
3. Configurar perfil: openspec config profile → seleccionar "core"
4. Actualizar instruction files: openspec update
5. Copiar .claude/skills/ desde el proyecto de referencia
6. Crear .claude/openspec-config.json con las credenciales del proyecto nuevo
7. Decirle a la IA: "Lee la documentacion de OpenSpec Custom en Notion y verifica que las skills esten al dia"

El proyecto existente no necesita tener ningun artefacto previo. OpenSpec init crea la estructura vacia y el primer /opsx:propose genera el primer change.

---

# 7. Comandos vs Skills — deben ser identicos

<aside>
⚠️ Regla critica: los comandos /opsx:* y las skills openspec-* son dos puntos de entrada al mismo flujo. Deben producir exactamente el mismo comportamiento. Si uno se actualiza, el otro tambien.

</aside>

## Por que existen los dos

- Los comandos (/opsx:archive, /opsx:apply, /opsx:propose...) viven en .claude/commands/opsx/*.md — los genera openspec update
- Las skills (openspec-archive-change, openspec-apply-change, openspec-propose...) viven en .claude/skills/openspec-*/SKILL.md — se copian del repo de referencia
- Ambos son invocables por el usuario. El usuario puede usar /opsx:archive o la skill openspec-archive-change — el resultado debe ser identico

## El problema historico

openspec update regenera los comandos .md desde el CLI vanilla, sin las integraciones custom (git, Notion, gestor de tareas). Las skills custom SÍ las tienen. Resultado: comportamiento diferente segun por donde entre el usuario.

## Regla de instalacion

Despues de instalar las skills custom (Paso 4), los comandos generados por openspec update deben sincronizarse manualmente para incluir las mismas integraciones. Decirle a la IA:

```
Lee los SKILL.md de .claude/skills/openspec-*/SKILL.md y sincroniza .claude/commands/opsx/*.md para que tengan exactamente los mismos pasos, incluyendo config, rama git y gestor de tareas. No toques openspec-config.json.
```

## Que sincronizar por comando

- /opsx:propose ↔ openspec-propose — agregar: leer config, crear rama git, crear tarea en gestor externo, crear subtareas (umbral >20)
- /opsx:apply ↔ openspec-apply-change — agregar: leer config, verificar rama git, buscar tarea en gestor externo, preguntar antes de commitear
- /opsx:archive ↔ openspec-archive-change — agregar: leer config, commit automatico post-archive, marcar tarea como En revision en gestor externo

## Cuando vuelve a desincronizarse

Cada vez que se corre openspec update, regenera los comandos vanilla y borra las integraciones. Despues de cada update, volver a sincronizar con el mismo prompt de arriba.

<aside>
🔁 Regla: openspec update siempre va seguido de sincronizacion de comandos con skills. Son dos pasos inseparables en este flujo custom.

</aside>

---

# 7. Checklist minimo antes de escribir codigo (filosofia ponytail)

Inspirado en **ponytail** (github.com/DietrichGebert/ponytail). Antes de implementar cualquier cosa, el agente evalua en orden:

1. La funcion ya existe en una libreria instalada? **usarla directamente**
2. La plataforma tiene una feature nativa que lo resuelve? **usarla sin abstracciones**
3. Se puede hacer en una linea? **hacerlo asi**
4. Solo entonces: **implementar lo minimo necesario**

Lo que NUNCA se reduce: validacion en boundaries externos, manejo de errores, seguridad, accesibilidad.

<aside>
💡 Por que esto existe: ponytail benchmarked ~54% menos codigo, ~20% menor costo, ~27% mas rapido sin romper ningun guardrail de seguridad. El codigo chico emerge de preguntar 'es necesario esto?' — no de sintaxis corta artificial.

</aside>

## Como se aplica en el flujo OpenSpec

Este checklist aplica **dentro de cada tarea de /opsx:apply**. Cuando el agente va a implementar una tarea de tasks.md, antes de escribir codigo debe evaluar los 4 puntos. Si la respuesta a cualquiera es 'si', esa es la solucion — no se escribe codigo adicional.

## Como se aplica en el CLAUDE.md

Agregar la seccion `'Antes de escribir codigo — checklist obligatorio'` al CLAUDE.md del proyecto. Esta seccion ya esta integrada en el CLAUDE.md de encargalo-mobile-v2. Para otros proyectos, el prompt universal de instalacion (ver pagina 'Prompt Universal de Instalacion') la incluye automaticamente adaptada al stack del proyecto.

## Diferencia vs instalar el plugin de ponytail

- El plugin de ponytail agrega contexto extra que puede competir con el CLAUDE.md y el openspec-config.json
- Esta implementacion integra la filosofia directamente en los artefactos que ya controla el proyecto — sin capa adicional
- Resultado: mismos beneficios, menos superficie de conflicto