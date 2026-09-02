---
name: "OPSX: Live"
description: "Modo de edición en vivo — investiga y edita en el mismo turno; al cerrar reconstruye proposal/design/tasks y archiva"
category: "Workflow"
tags: [workflow, live, explore, apply, archive, experimental]
---

Modo de edición en vivo. Investiga y edita en el mismo turno — sin fases bloqueantes, sin `propose` previo. Al cerrar, arma retroactivamente los artifacts de OpenSpec con lo que realmente se hizo y archiva el change de una vez.

**Cuándo usar esto en vez del flujo normal:**
- Estás en vivo con el usuario haciendo cambios rápidos e iterativos (fixes, ajustes, pulido) y el ida-y-vuelta de `/opsx:explore` → `/opsx:propose` → `/opsx:apply` es fricción, no ayuda.
- El usuario quiere ver el código investigado y editado en el mismo mensaje, no en pasos separados.

**Cuándo NO usar esto:**
- El pedido es una feature grande, con muchas decisiones de diseño por adelantado o que se beneficia de planear antes de tocar código. Ahí, sugerir `/opsx:propose` (o `/opsx:explore` primero si hace falta pensar). Decirlo explícitamente al usuario si detectas este caso al iniciar.

---

## Concepto

Este modo tiene dos estados: **sesión abierta** (investigando y editando turno a turno) y **cierre** (se reconstruye el change de OpenSpec con lo ya hecho y se archiva). No hay estados intermedios ni artifacts que revisar antes de implementar — la implementación YA pasó cuando se genera el proposal.

```
/opsx:live <descripción>     /opsx:live end (o frase de cierre confirmada)
        |                              |
        v                              v
   +---------+   turno 1    +---------------------+
   |  rama    |----------->  | investigar -> explicar|--+
   |  creada  |              | -> editar -> registrar |  | se repite
   |  log     |<-------------+---------------------+<-+ cada turno
   |  creado  |
   +---------+                        |
                                       v
                          reconstruir proposal/design/tasks
                          desde .live-log.md + git diff
                                       |
                                       v
                          confirmar con el usuario -> archivar
                          (mismos pasos que /opsx:archive)
```

---

## Paso 0 — Detectar si ya hay una sesión live activa

Antes de nada, revisar si hay un change con `.live-log.md` sin archivar en la rama actual (buscar en `openspec/changes/*/.live-log.md`, excluyendo `archive/`). Si existe:
- Si el mensaje del usuario es continuación natural del trabajo → seguir esa sesión, no crear una nueva.
- Si el usuario está claramente empezando algo distinto → preguntar con **AskUserQuestion**: "Hay una sesión live abierta (`<nombre>`, N entradas en el log). ¿Seguimos ahí o cerramos esa primero y abrimos una nueva?"

---

## Apertura de sesión (`/opsx:live <nombre-o-descripción>`)

1. **Derivar nombre kebab-case** del argumento, igual que `/opsx:propose`. Si no viene descripción, preguntar con **AskUserQuestion** (una sola pregunta, abierta): "¿Nombre corto para esta sesión live? (ej: `fix-checkout-edge-cases`)".

2. **Evaluar si el pedido realmente es para modo live.** Si al escuchar la descripción es evidente que es una feature grande sin iterar en vivo (muchas pantallas nuevas, arquitectura por decidir), decirlo y ofrecer `/opsx:propose` en su lugar. Si el usuario insiste en modo live, respetarlo.

3. **Leer el archivo de reglas del agente del proyecto** (`CLAUDE.md`/`AGENTS.md` u equivalente) si existe — rige toda la sesión, no solo lecturas por turno. Y **leer `.claude/openspec-config.json`** igual que el resto de skills — si no existe o falta un bloque, omitir esos pasos silenciosamente.

4. **Crear el change:**
   ```bash
   openspec new change "<name>"
   ```
   ```bash
   openspec status --change "<name>" --json
   ```
   Guardar `changeRoot` de la respuesta.

5. **Crear rama git ANTES de tocar cualquier archivo** (regla dura del proyecto — nunca se edita código sin rama):
   - Determinar prefijo igual que `/opsx:propose` paso 7a (`feat/`, `fix/`, `chore/`, `refactor/`; si no es claro, `feat/`).
   - `git branch --list <prefijo>/<name>` → si no existe, `git checkout -b <prefijo>/<name>`; si existe, `git checkout <prefijo>/<name>`.

6. **Crear el log de sesión** en `<changeRoot>/.live-log.md`:
   ```markdown
   # Live log: <name>

   Rama: <prefijo>/<name>
   Inicio: <fecha y hora>

   ## Entradas
   ```
   Este archivo es la fuente de verdad para reconstruir `tasks.md` al cerrar — no depender solo de la memoria de la conversación, que puede compactarse en sesiones largas.

7. **Confirmar apertura al usuario**, breve:
   > Modo live activo — `<name>` en `<rama>`. Investigo y edito en cada turno; decime "ya terminamos" o `/opsx:live end` cuando quieras que arme el proposal y archive.

---

## Turno en vivo (se repite en cada mensaje mientras la sesión está abierta)

Por cada pedido del usuario dentro de la sesión:

1. **Investigar antes de tocar nada.** Leer los archivos relevantes, entender CÓMO funciona hoy y POR QUÉ está hecho así (patrones existentes, convenciones del CLAUDE.md, decisiones previas visibles en el código). Nunca editar a ciegas.

2. **Aplicar el checklist mínimo antes de escribir código** (CLAUDE.md — "Antes de escribir código"): ¿ya existe en una librería instalada? ¿React Native/Expo lo resuelve nativo? ¿se puede en una línea? Solo si no, implementar lo mínimo necesario.

3. **Explicar brevemente** qué se encontró y qué se va a cambiar — estilo explore: conciso, no un reporte exhaustivo. Si la instrucción del usuario ya es explícita e inequívoca ("cambia X por Y"), no hace falta re-confirmar antes de aplicar — proceder directo para no generar fricción redundante. Si hay ambigüedad o varias formas razonables de resolverlo, sí preguntar antes de editar.

4. **Editar.** Cambios mínimos y enfocados, siguiendo las convenciones del CLAUDE.md del proyecto (animaciones, testing, componentes, etc. — las mismas reglas que aplican en `/opsx:apply`).

5. **Registrar la entrada en `.live-log.md`** inmediatamente después de cada edición (append, no reescribir el archivo entero):
   ```markdown
   ### <hora> — <resumen corto en imperativo>
   - Archivos: `<ruta1>`, `<ruta2>`
   - Qué: <qué cambió, una o dos líneas>
   - Por qué: <la razón, solo si no es obvia del código>
   ```

6. **Evaluar testing según el árbol de decisión del CLAUDE.md** para lo que se acaba de tocar. Si el archivo modificado lo requiere (utils, hooks con estado, stores, servicios, componentes con lógica), escribir el test correspondiente en el mismo turno o el siguiente, y registrarlo también en el log como su propia entrada. Correr solo los tests relacionados con esos archivos (nunca la suite completa, salvo pedido explícito del usuario). Si el cambio se presta a revisión visual o de flujo de usuario, preguntar con **AskUserQuestion** si la prueba la hace el agente o el usuario — si la hace el agente, revisar primero si ya hay un dev server activo y reusarlo en vez de reiniciarlo (reiniciarlo puede tumbar la sesión que el usuario ya tenía abierta).

7. **Seguir esperando el siguiente turno.** No cerrar la sesión, no pedir permiso para "seguir en modo live" — el modo permanece activo hasta cierre explícito.

**Pausar y preguntar si:**
- La instrucción es ambigua y hay más de un camino razonable.
- La edición revela un problema de diseño más grande de lo esperado — en ese caso, sugerir migrar ese punto específico a `/opsx:propose` en vez de forzarlo en modo live, sin cerrar la sesión live actual.
- Hay un error o bloqueante real.

---

## Cierre de sesión (`/opsx:live end`, o frase de cierre del usuario confirmada)

Frases como "ya terminamos", "eso es todo", "ciérralo", "archívalo" disparan el cierre — pero antes de ejecutar nada, **confirmar con una pregunta corta** ("¿Cerramos la sesión live y armo el proposal con todo esto?") salvo que el usuario haya usado el comando explícito `/opsx:live end`, que no necesita reconfirmación.

1. **Leer `.live-log.md` completo** y correr `git diff <rama-base>...HEAD` (o `git status --short` + diff por archivo) para tener la lista real y completa de archivos tocados — el log puede no capturar el 100% si hubo ediciones fuera del flujo descrito.

2. **Generar los artifacts retroactivamente**, usando `openspec instructions <artifact-id> --change "<name>" --json` para obtener `template`/`resolvedOutputPath` igual que `/opsx:propose`, pero con una fuente de contenido distinta — en vez de preguntar "qué quieres construir", el contenido sale del log + diff:

   - **`proposal.md`** — redactar en pasado: qué se hizo y por qué (la sesión ya ocurrió). Alcance = lo que efectivamente se tocó, no lo que se planeó.
   - **`design.md`** — decisiones técnicas reales tomadas durante la sesión (tomarlas del log), archivos afectados (tomarlos del diff), no decisiones hipotéticas.
   - **`tasks.md`** — una tarea por cada entrada relevante del log, **todas marcadas `[x]`** porque ya se implementaron. No inventar tareas que no están en el log ni en el diff.
   - **specs delta** — solo si durante la sesión se identificó un requisito nuevo o modificado de forma clara (buscar en el log). Si no hubo cambios de comportamiento identificables como requisito, omitir esta parte sin bloquear el cierre.

3. **Mostrar resumen y pedir confirmación final antes de archivar y commitear** (nunca se commitea sin que el usuario confirme — regla dura del CLAUDE.md):
   ```
   ## Live session lista para cerrar: <name>

   **Rama:** <rama>
   **Archivos tocados:** N
   **Tareas registradas:** M (todas completadas)

   ### Resumen
   - <bullet por entrada relevante del log>

   ¿Confirmas? Voy a: sincronizar specs, mover el change a archive/, y hacer commit.
   ```

4. **Si el usuario confirma**, ejecutar exactamente los mismos pasos que `/opsx:archive` (reusar esa lógica, no reinventarla):
   - Sincronizar delta specs a main specs (si las hay), inline vía `openspec-sync-specs --from-archive`.
   - Mover `changeRoot` a `openspec/changes/archive/YYYY-MM-DD-<name>/` — el `.live-log.md` se mueve junto con la carpeta y queda como registro histórico, nunca se borra.
   - `git add -A` + commit con mensaje convencional que resuma el change (mismo formato y atribución que archive).
   - *(Solo si `taskManager` configurado)* crear la tarea en el gestor externo. Como el trabajo ya está terminado, no pasar por el estado intermedio "En curso" — crearla directamente y marcarla en el mismo paso como "En revisión" (o el estado equivalente de cierre en el gestor configurado). Si falla, loguear warning y continuar — no bloquear el archive.

5. **Si el usuario NO confirma** (quiere revisar algo más): dejar el change activo sin archivar, decirle que puede seguir en modo live, correr `/opsx:apply` para completar algo puntual, o `/opsx:archive` manualmente cuando esté listo.

---

## Guardrails

- **Nunca editar código antes de que la rama exista.** La rama se crea en la apertura de sesión, siempre.
- **Nunca fabricar tareas o specs que no ocurrieron.** `tasks.md` y `design.md` se derivan del `.live-log.md` + `git diff` reales, no de suposiciones.
- **Nunca editar a ciegas** — entender cómo y por qué funciona el código actual antes de cada cambio, igual que exige el usuario explícitamente para este modo.
- **Nunca correr la suite completa de tests por turno** — solo los archivos tocados, salvo pedido explícito del usuario.
- **Nunca asumir quién prueba un cambio visual/de flujo** — preguntar siempre con AskUserQuestion si la prueba la hace el agente o el usuario; si la hace el agente, reusar el dev server activo en vez de reiniciarlo.
- **Nunca cerrar la sesión sin confirmación explícita**, salvo `/opsx:live end` literal.
- **Nunca commitear sin la confirmación del paso de cierre** — mismo principio que `/opsx:archive`.
- El `.live-log.md` se escribe a disco en cada turno, nunca solo en memoria de la conversación — es lo que sobrevive si el contexto se compacta en una sesión larga.
- Si el pedido inicial no encaja en "iterar rápido en vivo" sino en "feature grande", decirlo y ofrecer `/opsx:propose` — no forzar todo a modo live.
- Reusar la lógica de `/opsx:archive` para el cierre — no duplicar ni divergir de esos pasos (sync de specs, commit, gestor externo).
- Leer siempre `.claude/openspec-config.json` al abrir la sesión; si no existe, seguir sin integración externa.
- NUNCA usar curl para llamadas HTTP al gestor externo — siempre Python con `urllib.request`.
- NUNCA hardcodear tokens, IDs ni credenciales — siempre leer desde `tokenPath`.
