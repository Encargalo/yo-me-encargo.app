---
name: openspec-status
description: Show a dashboard of all active OpenSpec changes — their schema, artifact completeness, task progress, and blockers. Use when the user wants a quick overview of where everything stands.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.5.0"
---

Muestra un dashboard de todos los changes activos de OpenSpec.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Steps**

1. **Obtener lista de changes activos**
   ```bash
   openspec list --json
   ```

2. **Para cada change activo, obtener su estado**
   ```bash
   openspec status --change "<name>" --json
   ```

   Extraer para cada change:
   - `schemaName`: schema usado
   - `artifacts`: lista de artifacts con su status (`done` / pendiente)
   - Leer el archivo `tasks.md` del change para contar `- [x]` vs `- [ ]`
   - Detectar si hay bloqueadores mencionados en tasks.md (buscar "⚠️", "BLOQUEADO", "Paso 0", "confirmar con")

3. **Mostrar dashboard**

   Formato de salida:

   ```
   ## OpenSpec — Estado general

   | Change | Schema | Artifacts | Tareas | Estado |
   |--------|--------|-----------|--------|--------|
   | p1-error-boundaries | spec-driven | 3/3 ✓ | 0/37 | Listo para implementar |
   | p1-orders-feature   | spec-driven | 3/3 ✓ | 0/7  | ⚠️ Bloqueado (confirmar endpoint) |
   | ssd-encargalo       | spec-driven | 4/4 ✓ | 26/26 ✓ | Completo — listo para archivar |

   ### Próximo paso recomendado
   → Implementar `p1-error-boundaries` (`/opsx:apply p1-error-boundaries`)
   ```

   Reglas del dashboard:
   - Ordenar por prioridad: bloqueados al final, listos para implementar primero, completos al final
   - Si hay un bloqueador detectado en tasks.md, mostrarlo como nota debajo de la tabla
   - Si no hay changes activos: indicarlo claramente y sugerir `/opsx:propose`
   - Siempre sugerir el próximo paso lógico

**Guardrails**
- Solo leer archivos, nunca modificar nada
- Si `openspec list` no devuelve changes, informar al usuario y detenerse
- No auto-seleccionar ni auto-ejecutar pasos — solo informar
