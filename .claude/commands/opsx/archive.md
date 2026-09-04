---
name: "OPSX: Archive"
description: "Archive a completed change in the experimental workflow"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "archive", "experimental"]
---

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `schemas`, `view`). Once selected, treat `--store <id>` as sticky for the rest of the workflow. Every unscoped example of those commands below is shorthand: before running it, append the flag. For example, run `openspec status --change "<name>" --json --store "<id>"`, not the unscoped form shown below. Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

`<capability-path>` is the spec directory relative to `specs/` (for example, `user-auth` or `identity/user-auth`). Preserve the full path from each delta spec when resolving its main spec.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and ask the user to select one

   When prompting, show only active changes (not already archived).
   Include the schema used for each change if available.

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx:archive <other>`).

   **Load current archive inputs before the existing archive checks:**

   After resolving the selected change and planning root, run:
   ```bash
   openspec instructions archive --change "<name>" --json
   ```
   Keep the same selected-root flags on this command. This lookup is advisory and
   optional: it only supplies extra prompt inputs, so it must never block archiving.
   If it exits non-zero or returns invalid JSON — for example on an older CLI that
   does not support this command yet — continue the archive workflow with no
   context and no operation guidance. Do not report an error and do not stop.

   A successful response may omit both optional fields. Treat `context` as a
   required prompt-level input: read and consider it, and apply relevant project
   facts, conventions, and constraints. Treat `operationGuidance` as optional
   additive advice: read and consider every entry, and follow entries that are
   applicable and compatible with the built-in archive workflow.

   Keep both fields separate from built-in steps, explicit user choices, resolved
   paths, CLI checks, and command contracts. If context conflicts with one of those
   controlling inputs, report the conflict and preserve the controlling value. If
   guidance is inapplicable or conflicts with a controlling input, do not follow it
   and explain why. Do not infer replacement paths, skipped prompts, or flags from
   either field, and do not copy their text verbatim into specs, change artifacts,
   or archive summaries unless the user separately asks for it. These are
   prompt-level behavior contracts, not enforceable checks.

2. **Leer configuración del proyecto**

   Leer `.claude/openspec-config.json` si existe. Si no existe o falta un bloque, los pasos de integración correspondientes se omiten silenciosamente.
   - Si `taskManager` no existe → omitir el paso 8 completamente.
   - Guardar la config en memoria para usarla en pasos posteriores.

3. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done`, `skipped`, or other)

   If status reports `actionContext.mode: "workspace-planning"`, explain that workspace archive is not supported in this slice and STOP.

   **If any artifacts are neither `done` nor `skipped`** (skipped artifacts satisfy the requirement - the change declares skip_specs):
   - Display warning listing incomplete artifacts
   - Ask the user to confirm they want to proceed
   - Proceed if user confirms

4. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Ask the user to confirm they want to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

5. **Assess delta spec sync state**

   Use `artifactPaths.specs.existingOutputPaths` from status JSON as the only
   delta-spec source. If the `specs` entry is missing or
   `existingOutputPaths` is empty, proceed without a sync prompt and do not infer
   delta specs from other artifacts.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `<planningHome.root>/openspec/specs/<capability-path>/spec.md` (use the store-aware `planningHome.root` from step 3, not a hardcoded repo path)
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   Route on the answer:
   - "Cancel" — stop, do not archive
   - "Archive without syncing" or "Archive now" — proceed to archive
   - "Sync now" or "Sync anyway" — sync, then verify (below)
   - Anything else — ask again rather than archiving

   Before a selected sync writes any main spec, run
   `openspec instructions specs --change "<name>" --json` once with the same
   selected-root flags. Require a zero exit status and valid artifact-instruction
   JSON. If the lookup fails or returns invalid JSON, report the error and stop
   before writing any main spec or moving the change. A valid response with omitted
   `rules` is the no-rules case. Apply returned `rules` only to the content and
   form of main specs produced by this merge; do not use them as archive guidance,
   change CLI behavior, or copy the rule text into any output file.

   Then run the `openspec-sync-specs` workflow inline (agent-driven intelligent merge) for change '<name>', passing the delta spec analysis and the fetched specs-rule snapshot from above, and wait for it to finish. The inline sync must reuse that snapshot without fetching `specs` instructions again. Pasar el flag `--from-archive` para que el sync NO gestione rama ni commit por su cuenta — el commit lo hace este archive en el paso 7. Do not delegate it to a background task — step 6 would move `changeRoot` out from under a sync that is still reading it, leaving the change archived and the main specs never updated. If your agent can only run it by delegation, delegate synchronously and wait for the result.

   Then re-run the comparison from the top of this step against every capability that has a delta spec in `artifactPaths.specs.existingOutputPaths` — not only the ones the sync reports it touched. A successful sync leaves nothing left to apply, so each capability must now read as already synced:
   - ADDED requirements present
   - MODIFIED requirements carrying the scenario and description changes named in the delta, with their other scenarios intact
   - REMOVED requirements gone — and where this sync retired a capability (removed its last requirement, leaving `## Requirements` empty), its main spec deleted rather than left empty; a spec the sync deliberately kept and reported is also a match
   - RENAMED requirements present under the new name and absent under the old one

   If the sync failed, or any capability does not match, report what differs and stop — do not archive. Nothing has moved and `changeRoot` is intact, so the user can fix the mismatch or re-run the sync and start the archive again.

6. **Perform the archive**

   Create an `archive` directory under `planningHome.changesDir` if it doesn't exist:
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   Generate the target name: use the change name as-is when it already starts with a `YYYY-MM-DD-` prefix; otherwise prepend the current date as `YYYY-MM-DD-<change-name>`. Never stack a second date (same rule as `openspec archive`).

   **Check if target already exists:**
   - If yes: Fail with error, suggest renaming existing archive or using different date
   - If no: Move `changeRoot` to the archive directory

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/<target-name>"
   ```

7. **Gestionar rama y hacer commit**

   a. **Verificar rama actual:**
      ```bash
      git branch --show-current
      ```
      - Si la rama actual es `main`, `master`, `develop` o cualquier rama que NO sea específica del change → preguntar al usuario con **AskUserQuestion** si quiere crear una rama nueva antes de commitear. Opciones: "Sí, crear rama `chore/<change-name>`", "No, commitear en la rama actual". Preguntar UNA sola vez.
      - Si ya está en una rama específica del change o feature → no preguntar, continuar en esa rama.
      - Si el usuario elige crear rama: `git checkout -b chore/<change-name>`

   b. **Stagear y commitear:**
      ```bash
      git add -A
      git commit -m "<tipo>(<scope>): <descripción del change>

      <lista de los cambios principales según tasks.md, máximo 8 items>

      Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
      ```

      El tipo del mensaje debe coincidir con el prefijo de la rama (`feat`, `fix`, `chore`, `refactor`, etc.). Hacer commit DESPUÉS del archive (el directorio archivado debe quedar incluido en el commit). Si el commit falla (pre-commit hook, conflicto) → reportar el error y esperar instrucción del usuario, no forzar.

8. **Marcar tarea en gestor externo como "En revisión"** *(solo si `taskManager` está en config)*

   Sin preguntar al usuario. Leer token desde `config.taskManager.tokenPath`. Usar Python `urllib.request` — NUNCA curl.

   **Si `type` es `notion`:** obtener el schema de la DB (GET `https://api.notion.com/v1/databases/<database>`) para conocer las propiedades disponibles, buscar la tarea principal (por `Change OpenSpec` = `<change-name>`, o `Descripcion` contains, o `Tarea` title contains el scope), y PATCH `https://api.notion.com/v1/pages/<page_id>` con `{"properties": {"Estado": {"status": {"name": "En revision"}}}}`. Si existen subtareas vinculadas (solo si se crearon — umbral >20), marcarlas también "En revisión".

   **Si `type` es `jira`:** mover el issue a "In Review" via POST `<baseUrl>/rest/api/3/issue/<key>/transitions` (auth Basic `email:token` en base64).

   **Si `type` es `github-projects`:** agregar label `in-review` via PATCH `https://api.github.com/repos/<owner>/<repo>/issues/<number>`.

   **Si falla:** loguear warning — no revertir el archive ni el commit.

9. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Whether specs were synced (if applicable)
   - Commit hash creado
   - Si `taskManager` configurado: estado actualizado en el gestor externo (o warning si falló). Si no está configurado: indicar que no hay gestor externo.
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** <"✓ Synced to main specs" only if the step 5 verification passed; otherwise "No delta specs" or "Sync skipped">
**Commit:** <hash> — <mensaje corto>
**Gestor externo:** ✓ Tarea marcada como "En revisión" (o "No configurado")

<"All artifacts complete. All tasks complete." — or, if archived with warnings, list them instead (e.g. "Archived with 2 incomplete tasks")>
```

**Guardrails**
- Leer `.claude/openspec-config.json` al inicio — si no existe, continuar sin integración externa
- NUNCA hardcodear tokens, IDs ni credenciales — SIEMPRE leer el token desde `tokenPath`
- NUNCA usar curl para llamadas HTTP — siempre Python con `urllib.request`
- Announce the selected change; prompt for selection when it is ambiguous
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, run the `openspec-sync-specs` workflow inline (agent-driven) con `--from-archive`
- Never archive while a spec sync is still in flight — run the sync inline and verify the main specs before moving `changeRoot`
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- El commit es AUTOMÁTICO salvo por la pregunta de rama (si la rama actual es main/master/develop) — se hace UNA sola vez
- Hacer commit DESPUÉS del archive, nunca antes — el directorio archivado debe estar incluido en el commit
- Si el commit falla (pre-commit hook, conflicto), reportar el error y esperar instrucción del usuario — no forzar
- Llamar a archive significa que el usuario ya revisó el código — el flujo commit + gestor externo es la conclusión natural
- Apply relevant runtime context and report conflicts; operation guidance remains advisory
- Consider every guidance entry and explain any inapplicable or conflicting advice
- Existing CLI checks, resolved paths, prompts, and command contracts are unchanged
- Artifact rules constrain only the specs being written and are never operation guidance
- Never copy runtime context, operation guidance, or artifact-rule text verbatim into output files
