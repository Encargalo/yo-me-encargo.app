---
name: openspec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "2.0"
  generatedBy: "1.5.0"
---

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Leer configuración del proyecto**

   Leer `.claude/openspec-config.json` si existe. Si no existe o falta un bloque, los pasos de integración correspondientes se omiten silenciosamente.

   - Si `taskManager` no existe → omitir paso 8 completamente.
   - Guardar la config en memoria para usarla en pasos posteriores.

3. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   If status reports `actionContext.mode: "workspace-planning"`, explain that workspace archive is not supported in this slice and STOP. Do not move workspace changes into repo-local archives or edit linked repos.

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

4. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

5. **Assess delta spec sync state**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON to check for delta specs. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   **Si el usuario elige sincronizar, aplicar el sync INLINE — NO invocar el skill `openspec-sync-specs`:**
   - Leer cada delta spec (`## ADDED`, `## MODIFIED`, `## REMOVED`, `## RENAMED`)
   - Para cada capability:
     - Si la main spec no existe → crear `openspec/specs/<capability>/spec.md` con sección Purpose + Requirements
     - Si existe → aplicar los cambios inteligentemente (agregar requirements nuevos, modificar existentes, eliminar los marcados como REMOVED)
   - NO hacer commit aquí — el archive hará su propio commit en el paso 7 que incluye tanto los cambios de specs como el directorio archivado
   - Reportar brevemente qué se sincronizó antes de continuar al paso 6

   Proceder al archivo independientemente de la elección del usuario.

6. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   Generate target name using current date: `YYYY-MM-DD-<change-name>`

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move `changeRoot` to the archive directory

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/YYYY-MM-DD-<name>"
   ```

7. **Gestionar rama y hacer commit**

   a. **Verificar rama actual:**
      ```bash
      git branch --show-current
      ```

      - Si la rama actual es `main`, `master`, `develop` o cualquier rama que NO sea específica del change → preguntar al usuario con **AskUserQuestion** si quiere crear una rama nueva antes de commitear. Opciones: "Sí, crear rama `chore/<change-name>`", "No, commitear en la rama actual".
      - Si ya está en una rama específica del change o feature → no preguntar, continuar en esa rama.
      - Si el usuario elige crear rama: `git checkout -b chore/<change-name>`

   b. **Stagear y commitear:**
      ```bash
      git add -A
      ```

      Crear el commit con mensaje convencional que resuma el change:
      ```bash
      git commit -m "<tipo>(<scope>): <descripción del change>

      <lista de los cambios principales según tasks.md, máximo 8 items>

      Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
      ```

      El tipo del mensaje debe coincidir con el prefijo de la rama (`feat`, `fix`, `chore`, `refactor`, etc.).

8. **Marcar tarea en gestor externo como "En revision"** *(solo si `taskManager` está en config)*

   Sin preguntar al usuario. Leer token desde `config.taskManager.tokenPath`.

   **Si `type` es `notion`:**

   Usar Python con `urllib.request` — NUNCA curl.

   a. Obtener primero el schema de la DB para conocer las propiedades disponibles:
      GET `https://api.notion.com/v1/databases/<database>`
      Parsear `properties` para saber qué campos existen.

   b. Buscar la tarea principal — intentar en este orden hasta encontrarla:
      - Si existe propiedad `Change OpenSpec` → filtrar por `rich_text equals <change-name>`
      - Si no → filtrar por `Descripcion` contains `<change-name>`
      - Si no → filtrar por `Tarea` title contains el scope del change (ej: `shop` para `shop-loading-fix`)

      POST `https://api.notion.com/v1/databases/<database>/query` con el filtro correspondiente.

   c. Si se encuentra, PATCH `https://api.notion.com/v1/pages/<page_id>`:
      ```json
      {"properties": {"Estado": {"status": {"name": "En revision"}}}}
      ```

   d. Si existen subtareas vinculadas (solo si se crearon — umbral >20), buscarlas y marcarlas "En revision":
      POST `https://api.notion.com/v1/databases/<database>/query` filtrando por relación con la tarea principal.
      Para cada resultado, PATCH con `Estado: En revision`.

   **Si `type` es `jira`:**

   Mover el issue a "In Review" via POST `<baseUrl>/rest/api/3/issue/<key>/transitions`.
   Auth: Basic con `email:token` en base64 usando Python `base64` + `urllib.request`.

   **Si `type` es `github-projects`:**

   Actualizar el issue: agregar label `in-review` via PATCH `https://api.github.com/repos/<owner>/<repo>/issues/<number>`.

   **Si falla:** loguear warning — no revertir el archive ni el commit.

9. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Commit hash creado
   - Si taskManager configurado: estado actualizado en el gestor externo (o warning si falló)
   - Si taskManager no configurado: indicar que no hay gestor externo configurado

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs (or "No delta specs" or "Sync skipped")
**Commit:** <hash> — <mensaje corto>
**Gestor externo:** ✓ Tarea marcada como "En revision" (o "No configurado")

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** No delta specs
**Commit:** <hash> — <mensaje corto>
**Gestor externo:** ✓ Tarea marcada como "En revision" (o "No configurado")

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/
**Specs:** Sync skipped (user chose to skip)
**Commit:** <hash> — <mensaje corto>
**Gestor externo:** ✓ Tarea marcada como "En revision" (o "No configurado")

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```
## Archive Failed

**Change:** <change-name>
**Target:** the archive path derived from `planningHome.changesDir`/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**
- Leer `.claude/openspec-config.json` al inicio — si no existe, continuar sin integración externa
- NUNCA hardcodear tokens, IDs ni credenciales en este archivo
- SIEMPRE leer el token desde `tokenPath` en la config
- NUNCA usar curl para llamadas HTTP — siempre Python con `urllib.request`
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- Si el usuario elige sync, aplicarlo INLINE en el mismo agente — NUNCA invocar el skill openspec-sync-specs (el control no regresa al archive si se delega a otro agente)
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- El commit es AUTOMÁTICO salvo por la pregunta de rama (si la rama actual es main/master/develop)
- La pregunta de rama se hace UNA sola vez antes del commit — no volver a preguntar
- Hacer commit DESPUÉS del archive, nunca antes — el directorio archivado debe estar incluido en el commit
- Si el commit falla (pre-commit hook, conflicto), reportar el error y esperar instrucción del usuario — no intentar forzar
- Llamar a archive significa que el usuario ya revisó el código — el flujo commit + gestor externo es la conclusión natural
