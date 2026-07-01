---
name: "OPSX: Apply"
description: Implement tasks from an OpenSpec change (Experimental)
category: Workflow
tags: [workflow, artifacts, experimental]
---

Implement tasks from an OpenSpec change.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name (e.g., `/opsx:apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx:apply <other>`).

2. **Leer configuración del proyecto**

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
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using `/opsx:continue`
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

   **Workspace guard:** If status JSON reports `actionContext.mode: "workspace-planning"` and `allowedEditRoots` is empty, explain that full workspace apply is not supported in this slice. Treat linked repos and folders as read-only context, ask the user to select an affected area through an explicit implementation workflow, and STOP before editing files.

5. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

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
      Si no es la rama correcta, cambiar a ella usando el MISMO nombre con que fue creada por `/opsx:propose`:
      ```bash
      git checkout <branch-name>
      ```
      NUNCA crear una rama nueva si ya existe — siempre reusar la rama original del change.

   b. *(Solo si `taskManager` está en config)* Buscar la tarea del change en el gestor externo para recuperar su ID.

      Leer token desde `config.taskManager.tokenPath`.

      **Si `type` es `notion`:**
      Buscar via Python + `urllib.request`, POST `https://api.notion.com/v1/databases/<database>/query`:
      ```json
      {"filter": {"property": "Change OpenSpec", "rich_text": {"equals": "<change-name>"}}}
      ```
      - Si la tarea existe pero está en "En revision" (retrabajo tras revisión) → cambiarla automáticamente a `En curso` sin preguntar.
      - Si no existe → crearla con `Estado: En curso` (flujo apply sin propose previo).

      **Si `type` es `jira`:**
      Buscar issue con label `<change-name>` via GET `<baseUrl>/rest/api/3/issue/picker?query=<change-name>`.
      - Si estado es "In Review" → moverlo a "In Progress" via POST `<baseUrl>/rest/api/3/issue/<key>/transitions`.

      **Si `type` es `github-projects`:**
      Buscar issue con label `openspec` y título que contenga `<change-name>` via GET `https://api.github.com/repos/<owner>/<repo>/issues`.

      Si falla → loguear warning y continuar sin bloquear la implementación.

   **Caso retrabajo:** Si el change ya fue archivado pero hay que corregir algo:
   - Usar la MISMA rama git del change original — nunca crear una nueva
   - Cambiar estado del gestor externo a "En curso" automáticamente
   - Implementar la corrección
   - Volver a llamar `/opsx:archive` cuando esté listo

8. **Implement tasks (loop until done or blocked)**

   Para cada tarea pendiente:
   - Mostrar qué tarea se está trabajando
   - Hacer los cambios de código necesarios
   - Mantener cambios mínimos y enfocados
   - Marcar tarea completada en tasks.md: `- [ ]` → `- [x]`
   - *(Solo si `taskManager` configurado y la subtarea fue subida al gestor)* Marcar la subtarea como completada en el gestor externo:
     - Notion: PATCH `https://api.notion.com/v1/pages/<subtask_page_id>` con `Estado: Hecho`
     - Jira: POST `<baseUrl>/rest/api/3/issue/<key>/transitions` con transición a "Done"
     - GitHub Projects: PATCH issue con label `closed` o cerrar el issue
   - Continuar a la siguiente tarea

   **Reglas de estado para subtareas con hijos (Notion):**
   - Primera sub-tarea completada → padre pasa a `En revision` (señal de progreso)
   - Última sub-tarea completada → padre pasa a `Hecho`
   - Sub-tareas intermedias no cambian el estado del padre

   **Pausar si:**
   - La tarea es ambigua → pedir aclaración
   - La implementación revela un problema de diseño → sugerir actualizar artifacts
   - Error o bloqueante → reportar y esperar
   - El usuario interrumpe

9. **Al terminar: preguntar antes de commitear**

   Cuando todas las tareas estén completas:

   a. Preguntar al usuario:
      > "¿Quieres hacer commit ahora o prefieres revisar/probar algo más primero?"

   b. Esperar confirmación explícita antes de commitear.

   c. Cuando el usuario confirme el commit:
      ```bash
      git add <archivos relevantes>
      git commit -m "<mensaje convencional>"
      ```

   **IMPORTANTE:** NO marcar la tarea del gestor externo como "En revision" aquí. Eso lo hace `/opsx:archive`.

10. **Mostrar estado final y parar**

   Mostrar:
   - Tareas completadas en esta sesión
   - Progreso total: "N/M tasks complete"
   - Si está pausado: explicar por qué y esperar

   Recordar al usuario que el siguiente paso es `/opsx:archive` cuando esté listo para cerrar el change.

   No sugerir pasos adicionales — el flujo termina aquí. El usuario decide cuándo archivar.

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
- Leer `.claude/openspec-config.json` al inicio — si no existe, continuar sin integración externa
- NUNCA hardcodear tokens, IDs ni credenciales en este archivo
- SIEMPRE leer el token desde `tokenPath` en la config
- NUNCA usar curl para llamadas HTTP — siempre Python con `urllib.request`
- NUNCA hacer commit sin preguntar primero al usuario — siempre esperar confirmación explícita
- La rama git y la tarea del gestor las crea `/opsx:propose` — este comando solo las verifica
- NUNCA crear una nueva rama si ya existe una para el change — siempre reusar la original
- Si la tarea del gestor está "En revision" al iniciar apply, cambiarla a "En curso" automáticamente (flujo de retrabajo)
- Si el gestor externo falla, loguear warning y continuar — no bloquear la implementación
- Buscar siempre la tarea existente filtrando por el identificador del change — nunca crear duplicada
- El commit lo hace el usuario DESPUÉS de revisar — solo `/opsx:archive` hace commit automático del archive
- Avanzar por todas las tareas hasta terminar o bloquearse
- Leer siempre los context files antes de empezar
- Si una tarea es ambigua, pausar y preguntar antes de implementar
- Mantener cambios de código mínimos y enfocados en cada tarea
- Marcar checkbox inmediatamente después de completar cada tarea
- Pausar ante errores, bloqueantes o requisitos poco claros — nunca adivinar

**Fluid Workflow Integration**

This command supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
