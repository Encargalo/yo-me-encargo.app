---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.11.0"
---

Implement tasks from an OpenSpec change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`, `schemas`, `view`). Once selected, treat `--store <id>` as sticky for the rest of the workflow. Every unscoped example of those commands below is shorthand: before running it, append the flag. For example, run `openspec status --change "<name>" --json --store "<id>"`, not the unscoped form shown below. Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name (e.g., `/opsx:apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and ask the user to select one

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx:apply <other>`).

2. **Leer configuración y reglas del proyecto**

   Leer el archivo de reglas del agente del proyecto (`CLAUDE.md` para Claude Code, `AGENTS.md` u otro equivalente) si existe — las convenciones ahí definidas (stack, estructura, testing, restricciones, checklist mínimo antes de escribir código) tienen prioridad sobre patrones genéricos al implementar cada tarea.

   Leer `.claude/openspec-config.json` si existe. Si no existe o falta un bloque, los pasos de integración correspondientes se omiten silenciosamente.
   - Si `taskManager` no existe → omitir toda sincronización con gestor externo.
   - Guardar la config en memoria para usarla en pasos posteriores.

3. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - `planningHome`, `changeRoot`, and `actionContext`: planning scope and edit constraints
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

4. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state
   - Optional `context`: current required project instruction input from the selected root
   - Optional `operationGuidance`: current advisory guidance for apply

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using `/opsx:continue` (if it is not installed, run `openspec status --change "<name>" --json` to see the next artifact and `openspec instructions <artifact-id> --change "<name>" --json` for how to create it)
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

   Treat `context` as a required prompt-level input. Read and consider it, and
   apply relevant project facts, conventions, and constraints while implementing.
   Treat `operationGuidance` as optional additive advice. Read and consider every
   entry, and follow entries that are applicable and compatible with the built-in
   workflow.

   Keep both fields separate from CLI-returned state, missing artifacts, tasks,
   progress, `contextFiles`, and the built-in `instruction`. They are not
   evidence of task completion, do not replace the built-in instruction, and do
   not permit bypassing a blocked state. If context conflicts with the built-in
   instruction, an explicit user choice, or a CLI-controlled value, report the
   conflict and preserve the controlling value. If guidance is inapplicable or
   conflicts with those controlling inputs, do not follow it and explain why.
   These are prompt-level behavior contracts, not enforceable checks.

5. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

   Do not copy `context` or `operationGuidance` verbatim into implementation
   files or planning artifacts unless the user separately asks for that content.

6. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

7. **Verificar rama git y tarea en gestor externo**

   a. Confirmar que la rama activa es la correcta para este change:
      ```bash
      git branch --show-current
      ```
      Si no es la rama correcta, cambiar a ella usando el MISMO nombre con que fue creada por `/opsx:propose` (`git checkout <branch-name>`). NUNCA crear una rama nueva si ya existe — siempre reusar la rama original del change.

   b. *(Solo si `taskManager` está en config)* Buscar la tarea del change en el gestor externo (filtrando por el identificador del change) para recuperar su ID — se necesita al archivar. Leer token desde `config.taskManager.tokenPath`, usar Python `urllib.request` (nunca curl).
      - Si la tarea existe pero está en "En revisión" (retrabajo tras revisión) → cambiarla automáticamente a "En curso" sin preguntar.
      - Si no existe → crearla con estado "En curso" (flujo apply sin propose previo).
      - Si falla → loguear warning y continuar sin bloquear la implementación.

   **Caso retrabajo** (el change ya fue archivado pero hay que corregir algo): reusar la MISMA rama git del change original — nunca crear una nueva —, cambiar el estado del gestor externo a "En curso" automáticamente, implementar la corrección y volver a llamar `/opsx:archive` cuando esté lista.

8. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Antes de escribir código, aplicar el checklist mínimo del CLAUDE.md (¿ya existe en una librería instalada? ¿la plataforma lo resuelve nativo? ¿se puede en una línea? solo entonces implementar lo mínimo)
   - Make the code changes required
   - Keep changes minimal and focused
   - **Verificar el cambio antes de continuar:**
     - Correr solo los tests de los archivos tocados en esa tarea (incluyendo tests nuevos o editados) — nunca la suite completa, salvo pedido explícito del usuario.
     - Si la tarea toca algo visual o de flujo de usuario, preguntar con **AskUserQuestion** si la prueba la hace el agente o el usuario — nunca asumir.
     - Si la prueba la hace el agente: revisar primero si ya hay un dev server corriendo (puerto/proceso activo) y, de ser así, usar ese servidor directamente. Reiniciarlo puede tumbar la sesión que el usuario ya tenía abierta — solo levantar uno nuevo si no hay ninguno activo.
     - Si la prueba la hace el usuario: esperar su confirmación antes de dar la tarea por probada.
   - Mark task complete in the tasks file: `- [ ]` → `- [x]`
   - *(Solo si `taskManager` configurado y la subtarea fue subida al gestor)* Marcar la subtarea como completada en el gestor externo (Notion: PATCH `Estado: Hecho`; Jira: transición a "Done"; GitHub Projects: cerrar el issue).
   - Continue to next task

   **Reglas de estado en cascada para subtareas con hijos** (gestor que soporte jerarquía):
   - Primera sub-tarea hija completada → la tarea padre pasa a "En revisión" (señal de progreso)
   - Última sub-tarea hija completada → la tarea padre pasa a "Hecho"
   - Sub-tareas intermedias completadas no cambian el estado del padre

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - A task needs work beyond what the spec and tasks describe, or you are tempted to drop, narrow, defer, or accept exceptions to specified behavior to make it fit → surface the added scope and ask; do not absorb it silently
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

9. **Al terminar: preguntar antes de commitear**

   Cuando todas las tareas estén completas:
   - Preguntar al usuario: "¿Quieres hacer commit ahora o prefieres revisar/probar algo más primero?"
   - Esperar confirmación explícita antes de commitear.
   - Cuando el usuario confirme: `git add <archivos relevantes>` + `git commit -m "<mensaje convencional>"`.

   **IMPORTANTE:** NO marcar la tarea del gestor externo como "En revisión" aquí. Eso lo hace `/opsx:archive`.

10. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - If all done: recordar al usuario que el siguiente paso es `/opsx:archive` cuando esté listo — el usuario decide cuándo. NO correr `/opsx:verify` ni sugerirlo como paso estándar; es un chequeo que solo se hace si el usuario lo pide explícitamente.
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete. Cuando estés listo, usa `/opsx:archive` para cerrar el change.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Leer siempre el archivo de reglas del agente del proyecto (CLAUDE.md/AGENTS.md u equivalente) si existe, antes de implementar — sus convenciones tienen prioridad sobre patrones genéricos
- Verificar cada tarea antes de continuar: correr solo los tests de los archivos tocados (nunca la suite completa salvo pedido explícito), y para verificación visual/manual preguntar siempre con AskUserQuestion si la hace el agente o el usuario — si la hace el agente, reusar el dev server activo en vez de reiniciarlo
- Leer `.claude/openspec-config.json` al inicio — si no existe, continuar sin integración externa
- NUNCA hardcodear tokens, IDs ni credenciales — SIEMPRE leer el token desde `tokenPath`
- NUNCA usar curl para llamadas HTTP — siempre Python con `urllib.request`
- NUNCA hacer commit sin preguntar primero al usuario — siempre esperar confirmación explícita
- La rama git y la tarea del gestor las crea `/opsx:propose` — este skill solo las verifica; NUNCA crear una nueva rama si ya existe una para el change
- Si la tarea del gestor está "En revisión" al iniciar apply, cambiarla a "En curso" automáticamente (flujo de retrabajo)
- Si el gestor externo falla, loguear warning y continuar — no bloquear la implementación
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- When a task needs work beyond what the spec describes, surface the added scope and pause - never silently narrow, defer, or simplify away specified behavior
- Only mark a task `- [x]` when its specified behavior is fully implemented, not when it is partially done or deferred
- Use contextFiles from CLI output, don't assume specific file names
- Do not use context or operation guidance as proof that a task is complete
- Apply relevant project context; report conflicts with controlling workflow inputs
- Consider every guidance entry; explain any inapplicable or conflicting advice
- Do not copy runtime context or operation guidance into implementation files or planning artifacts
- Preserve CLI-controlled blocked/ready/all-done behavior and completion criteria

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
