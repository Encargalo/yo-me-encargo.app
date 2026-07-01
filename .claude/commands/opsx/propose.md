---
name: "OPSX: Propose"
description: Propose a new change - create it and generate all artifacts in one step
category: Workflow
tags: [workflow, artifacts, experimental]
---

Propose a new change - create the change and generate all artifacts in one step.

I'll create a change with artifacts:
- proposal.md (what & why)
- design.md (how)
- tasks.md (implementation steps)

When ready to implement, run /opsx:apply

---

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: The argument after `/opsx:propose` is the change name (kebab-case), OR a description of what the user wants to build.

**Steps**

1. **If no input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Leer configuración del proyecto**

   Leer `.claude/openspec-config.json` si existe. Este archivo es opcional — si no existe o le falta un bloque, los pasos de integración correspondientes se omiten silenciosamente.

   Estructura esperada (todos los campos son opcionales):
   ```json
   {
     "taskManager": {
       "type": "notion | jira | github-projects",
       "tokenPath": "/ruta/absoluta/al/token.txt",
       ...campos específicos del tipo...
     },
     "docManager": {
       "type": "notion",
       "tokenPath": "/ruta/absoluta/al/token.txt",
       "pageId": "ID-de-pagina"
     }
   }
   ```

   - Si `taskManager` no existe → omitir pasos 7 y 7b completamente.
   - Guardar la config en memoria para usarla en pasos posteriores.

3. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change in the planning home resolved by the CLI with `.openspec.yaml`.

4. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context. Use these instead of assuming repo-local paths.

5. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `resolvedOutputPath`: Resolved path or pattern to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure and write it to `resolvedOutputPath`
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

6. **Crear rama git**

   Una vez que todos los artifacts estén creados:

   a. Determinar prefijo de rama según el tipo de change:
      - Feature nuevo → `feat/<change-name>`
      - Corrección de bug → `fix/<change-name>`
      - Tarea de mantenimiento → `chore/<change-name>`
      - Refactor sin cambio funcional → `refactor/<change-name>`
      - Si no es claro, usar `feat/<change-name>`

   b. Verificar si la rama ya existe:
      ```bash
      git branch --list <prefijo>/<change-name>
      ```

   c. Si NO existe → crear y cambiar a ella:
      ```bash
      git checkout -b <prefijo>/<change-name>
      ```

      Si YA existe → simplemente cambiar a ella:
      ```bash
      git checkout <prefijo>/<change-name>
      ```

7. **Crear tarea en gestor externo** *(solo si `taskManager` está en config)*

   Leer el token desde `config.taskManager.tokenPath`. NUNCA hardcodear tokens.

   Buscar primero si ya existe una tarea para este change — si existe, no duplicar.

   **Si `type` es `notion`:**

   Config esperada:
   ```json
   {
     "type": "notion",
     "tokenPath": "/ruta/token.txt",
     "database": "ID-base-de-datos",
     "project": "ID-pagina-proyecto",
     "assignee": "ID-usuario-responsable"
   }
   ```

   Usar Python con `urllib.request` — NUNCA curl (falla con caracteres especiales).

   Buscar existente via POST `https://api.notion.com/v1/databases/<database>/query`:
   ```json
   {"filter": {"property": "Change OpenSpec", "rich_text": {"equals": "<change-name>"}}}
   ```

   Si no existe, crear via POST `https://api.notion.com/v1/pages`:
   - `Tarea` → nombre legible derivado de la rama (ej. rama `feat/checkout-redesign` → `feat(checkout): rediseño del flujo de checkout`)
   - `Estado` → `En curso`
   - `Prioridad` → inferir del change (Alta / Media / Baja)
   - `Tipo` → inferir del change (Feature / Bug / Mejora / Investigacion / Documentacion / DevOps / Chore)
   - `Area` → inferir del proyecto o del CLAUDE.md
   - `Rama Git` → nombre exacto de la rama
   - `Change OpenSpec` → `<change-name>`
   - `Proyecto` → relación con `config.taskManager.project`
   - `Responsable` → `config.taskManager.assignee`

   **Si `type` es `jira`:**

   Config esperada:
   ```json
   {
     "type": "jira",
     "tokenPath": "/ruta/token.txt",
     "email": "usuario@dominio.com",
     "baseUrl": "https://workspace.atlassian.net",
     "projectKey": "CLAVE",
     "assigneeAccountId": "ID-atlassian"
   }
   ```

   Auth: Basic con `email:token` en base64. Usar Python `base64` + `urllib.request`.

   Buscar existente: GET `<baseUrl>/rest/api/3/issue/picker?query=<change-name>&projectKeys=<projectKey>`

   Si no existe, crear via POST `<baseUrl>/rest/api/3/issue`:
   ```json
   {
     "fields": {
       "project": {"key": "<projectKey>"},
       "summary": "<nombre legible del change>",
       "issuetype": {"name": "Story"},
       "assignee": {"accountId": "<assigneeAccountId>"},
       "labels": ["openspec", "<change-name>"]
     }
   }
   ```

   **Si `type` es `github-projects`:**

   Config esperada:
   ```json
   {
     "type": "github-projects",
     "tokenPath": "/ruta/token.txt",
     "owner": "usuario-u-org",
     "repo": "nombre-repo",
     "projectNumber": 1
   }
   ```

   Usar GraphQL API: `https://api.github.com/graphql` con header `Authorization: Bearer <token>`.

   Crear issue via REST: POST `https://api.github.com/repos/<owner>/<repo>/issues`:
   ```json
   {"title": "<nombre legible>", "labels": ["openspec"]}
   ```

   Luego agregar al project via GraphQL mutation `addProjectV2ItemById`.

   Guardar el ID de la tarea creada para usarlo en pasos posteriores.

7b. **Crear subtareas en gestor externo — umbral por nivel** *(solo si `taskManager` está en config)*

   El umbral de 20 aplica **por nivel de forma independiente**:

   ```
   Tarea principal (gestor externo — siempre)
     └── Nivel 1: tareas N. del tasks.md
           └── Nivel 2: tareas N.M del tasks.md
   ```

   **Nivel 1 — tareas principales del tasks.md:**
   - Si ≤ 20 → quedan solo en local, NO se crean en el gestor externo.
   - Si > 20 → crear cada una vinculada a la tarea principal.

   **Nivel 2 — sub-tareas de cada tarea de nivel 1:**
   - Para cada tarea de nivel 1 subida al gestor, contar sus sub-tareas.
   - Si esa tarea tiene ≤ 20 → quedan solo en local.
   - Si esa tarea tiene > 20 → crear cada una vinculada a su tarea padre de nivel 1.
   - Evaluar independientemente por cada tarea padre.

   **Regla clave:** el umbral no es global. Es por grupo del mismo nivel y mismo padre.

   Para Notion: campos de subtareas: `Tarea` → texto de tasks.md (sin `- [ ]`), `Estado` → `Backlog`, `Area` → inferir. NO añadir `Proyecto`, `Responsable`, `Prioridad`, `Tipo`.

   Para Jira: crear sub-issues con `issuetype: Subtask` vinculados al issue padre.

   Para GitHub Projects: crear issues hijos y agregarlos al mismo project.

   El orden de creación DEBE ser el mismo que en tasks.md.

   **Si falla alguna subtarea:** loguear warning, continuar — no bloquear.
   **Si falla la tarea principal:** loguear warning, no crear subtareas — no bloquear.

8. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- Rama git creada: `<prefijo>/<change-name>`
- Si taskManager configurado: tarea creada/encontrada con N subtareas (o warning si falló)
- Si taskManager no configurado: indicar que no hay gestor externo configurado
- Prompt: "Todo listo. Cuando quieras implementar, usa `/opsx:apply`."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Guardrails**
- Leer `.claude/openspec-config.json` al inicio — si no existe, continuar sin integración externa
- NUNCA hardcodear tokens, IDs de bases de datos, IDs de proyectos ni IDs de usuarios en este archivo
- SIEMPRE leer el token desde `tokenPath` en la config
- NUNCA usar curl para llamadas HTTP — siempre Python con `urllib.request`
- Crear TODOS los artifacts necesarios para implementación (según `apply.requires` del schema)
- Leer siempre los artifacts de dependencia antes de crear el siguiente
- Si el contexto es crítico y poco claro, preguntar al usuario - pero prefer making reasonable decisions to keep momentum
- Si ya existe un change con ese nombre, preguntar si continuar o crear uno nuevo
- Verificar que cada artifact existe antes de pasar al siguiente
- Crear la rama git DESPUÉS de que todos los artifacts estén completos — nunca antes
- NUNCA crear la rama sin verificar si ya existe — usar `git branch --list` primero
- Si el gestor externo falla, loguear warning y continuar — no bloquear el flujo
- El nombre de la tarea SIEMPRE debe coincidir con el formato de la rama git — nunca inventar un nombre distinto
- Las subtareas deben crearse en el mismo orden que aparecen en tasks.md
- Crear subtareas SOLO después de que la tarea principal existe — no en paralelo
