# Prompt Universal de Instalacion — OpenSpec + CLAUDE.md + Checklist Minimo

App: General
Creada por: ClaudeIA
Fecha de Ultima actualizacion: 18 de junio de 2026 13:09
Hora de creacion: 18 de junio de 2026 13:09
Ultima edicion por: ClaudeIA

Prompt listo para copiar y pegar en cualquier agente de IA (Claude Code, Cursor, Copilot, etc.). Configura OpenSpec + flujo custom + CLAUDE.md + checklist de codigo minimo en un solo paso. Se adapta al stack del proyecto automaticamente.

---

# Para que sirve este prompt

Con un solo prompt, cualquier programador configura en un proyecto nuevo:

- OpenSpec CLI instalado e inicializado
- Skills custom del flujo (propose, apply, archive, explore, sync, status)
- openspec-config.json con el gestor de tareas del equipo (Notion, Jira, GitHub Projects, o ninguno)
- CLAUDE.md con secciones obligatorias adaptadas al stack del proyecto
- Checklist de codigo minimo (filosofia ponytail) integrado en CLAUDE.md

El agente se adapta automaticamente al lenguaje y framework del proyecto.

---

# Compatibilidad

- Claude Code (principal) — pegar como primer mensaje de la sesion
- Cursor — pegar en el chat
- GitHub Copilot (editor) — pegar en el chat
- Cualquier agente con acceso a terminal y sistema de archivos

---

# El Prompt — copiar todo lo de abajo

<aside>
📋 Copiar TODOS los bloques de abajo en orden y pegarlos como un solo mensaje al agente. El agente hara las preguntas necesarias y configurara todo automaticamente.

</aside>

```
Eres un asistente de programacion configurando el flujo de trabajo completo para este proyecto. Voy a darte instrucciones paso a paso. Adaptate al stack y lenguaje del proyecto automaticamente.

## FASE 1 — Instalar OpenSpec CLI

npm install -g @fission-ai/openspec@latest
openspec --version
openspec init
openspec config profile

Selecciona el perfil "core". Luego ejecuta:
openspec update

Esto genera .claude/commands/opsx/*.md con los slash commands del flujo.
```

```
## FASE 2 — Instalar las skills custom de OpenSpec

Crea los siguientes archivos en .claude/skills/ copiando el contenido desde el proyecto de referencia (encargalo-mobile-v2) o desde la documentacion en Notion ('OpenSpec Custom — Instalacion y Configuracion del Flujo'):

- .claude/skills/openspec-propose/SKILL.md
- .claude/skills/openspec-apply-change/SKILL.md
- .claude/skills/openspec-archive-change/SKILL.md
- .claude/skills/openspec-explore/SKILL.md
- .claude/skills/openspec-sync-specs/SKILL.md
- .claude/skills/openspec-status/SKILL.md
```

```
## FASE 3 — Crear .claude/openspec-config.json

Para Notion:
{
  "taskManager": {
    "type": "notion",
    "tokenPath": "/ruta/absoluta/a/token.txt",
    "database": "ID-base-de-datos",
    "project": "ID-proyecto",
    "assignee": "ID-responsable"
  }
}

Para Jira:
{
  "taskManager": {
    "type": "jira",
    "tokenPath": "/ruta/al/token.txt",
    "email": "tu@email.com",
    "baseUrl": "https://workspace.atlassian.net",
    "projectKey": "CLAVE",
    "assigneeAccountId": "ID-atlassian"
  }
}

Para GitHub Projects:
{
  "taskManager": {
    "type": "github-projects",
    "tokenPath": "/ruta/al/token.txt",
    "owner": "usuario-u-org",
    "repo": "nombre-repo",
    "projectNumber": 1
  }
}

Sin gestor externo: archivo vacio {}

IMPORTANTE: el token NUNCA se escribe en el archivo. Solo la ruta al .txt que lo contiene.
```

```
## FASE 4 — Crear o actualizar CLAUDE.md

Si el proyecto ya tiene CLAUDE.md, agrega las secciones que falten. Si no tiene, crealo adaptado al stack del proyecto.

Secciones obligatorias:

### 1. Stack y comandos basicos
Lenguaje, framework, package manager, comandos clave (dev, build, test, install deps).

### 2. Estructura de carpetas
Donde vive cada tipo de archivo en este proyecto especifico.

### 3. Git workflow — obligatorio
- Crear branch antes de tocar cualquier archivo (feat/, fix/, refactor/, chore/)
- Nunca trabajar directo en main
- Una rama por change de OpenSpec — crearla ANTES de tocar archivos
- Nunca hacer commit sin preguntar primero al usuario

### 4. Antes de escribir codigo — checklist obligatorio
Antes de implementar cualquier cosa, evaluar en orden:
1. La funcion ya existe en una libreria instalada? → usarla directamente
2. La plataforma/framework tiene una feature nativa? → usarla
3. Se puede hacer en una linea? → hacerlo asi
4. Solo entonces: implementar lo minimo necesario

Lo que NUNCA se reduce: validacion, manejo de errores, seguridad, accesibilidad.
```

```
### 5. Testing — obligatorio
Adaptar al stack:
- JS/TS: Jest + testing-library (unit para utils/hooks, integration para componentes con estado)
- Python: pytest (unit para funciones puras, integration para endpoints/servicios)
- Go: testing nativo + testify
Regla universal: cada cambio incluye tests. Happy path + al menos un caso de error por archivo.

### 6. Lo que el agente NO debe hacer
Listar restricciones especificas del proyecto: que librerias no usar, que patrones evitar, que carpetas no tocar.

## FASE 5 — Verificar instalacion

openspec status

Debe mostrar el dashboard sin errores.

## RESULTADO ESPERADO
1. /opsx:explore → explorar antes de proponer (opcional)
2. /opsx:propose <nombre> → propuesta + specs + design + tasks + rama git + tarea en gestor
3. /opsx:apply → implementar tarea por tarea (checklist de codigo minimo en cada una)
4. /opsx:archive → cerrar change, sincronizar specs, commit
```

---

# Notas de uso

## Cuando el proyecto no tiene CLAUDE.md

El agente lo crea desde cero adaptado al stack detectado automaticamente.

## Cuando el proyecto ya tiene CLAUDE.md

El agente agrega solo las secciones que falten sin tocar las existentes.

## Sin gestor de tareas externo

Decirle al agente que omita el bloque taskManager. El flujo funciona igual — las tareas solo viven en tasks.md localmente.

## Para actualizar el flujo en proyectos existentes

Usar el comando documentado en 'OpenSpec Custom — Instalacion y Configuracion del Flujo', seccion 5.

---

# Relacion con otros documentos

- OpenSpec Custom — Instalacion y Configuracion del Flujo: documentacion tecnica completa, incluyendo seccion 7 sobre el checklist de codigo minimo
- Este prompt es el punto de entrada rapido — la documentacion completa es la referencia para casos avanzados