---
name: "OPSX: Verify"
description: Verify that the implementation of a change matches its artifacts (proposal, design, tasks)
category: Workflow
tags: [workflow, verify, experimental]
---

Verify that a change's implementation matches its planning artifacts.

**Input**: Optionally specify a change name after `/opsx:verify` (e.g., `/opsx:verify add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Verifying change: <name>"

2. **Check status and resolve paths**

   ```bash
   openspec status --change "<name>" --json
   ```

   Parse the JSON to get:
   - `schemaName`: The workflow being used
   - `changeRoot`: Root path of the change artifacts
   - `artifactPaths`: Concrete paths for proposal, design, tasks, specs
   - `artifacts`: List with their status (`done` or not)

3. **Read all planning artifacts**

   Read every artifact that has `status: "done"`:
   - `proposal.md` — intent, scope, what's in/out
   - `design.md` — technical decisions, files affected, data flow
   - `tasks.md` — full task list with completion status
   - Delta specs under `specs/` — what was added/modified/removed

4. **Read the relevant source files**

   From `design.md`, extract the list of files affected. Read each one.
   If `design.md` is not specific enough, infer from task descriptions which files were changed.

5. **Run verification across three dimensions**

   **A — Completitud (Completeness)**
   - Count tasks marked `[x]` vs `[ ]` in `tasks.md`
   - For each completed task, confirm the corresponding code change exists in the source files
   - Check that every requirement in `proposal.md` (in-scope items) has a code counterpart
   - Check that each scenario or acceptance criterion in delta specs is satisfied

   **B — Corrección (Correctness)**
   - Verify the implementation matches the *intent* described in `proposal.md`
   - Check that out-of-scope items from `proposal.md` were NOT implemented
   - Verify that data types, interfaces, and function signatures in the code match what design.md specified

   **C — Coherencia (Coherence)**
   - Verify decisions documented in `design.md` are reflected in the code
     (e.g., if design.md says "use Reanimated 3 instead of Animated", confirm Animated is not used)
   - Check that file locations match what design.md described
   - Verify naming conventions from design.md are followed in the code

6. **Build the verification report**

   For each issue found, classify it as:
   - `PASS` — dimension verified, no issues
   - `WARN` — minor deviation, low risk (e.g., extra helper added, naming slightly different)
   - `FAIL` — clear mismatch between artifact and implementation

7. **Display the report**

**Output — Full Pass**

```
## Verification Complete: <change-name>

**Schema:** <schema-name>
**Tasks:** N/N complete

### A — Completitud
PASS All N tasks implemented and verified in source files.

### B — Corrección
PASS Implementation matches the intent of proposal.md.
PASS Out-of-scope items not present in code.

### C — Coherencia
PASS All design decisions reflected in code.
PASS File locations and naming match design.md.

All checks passed. Ready to archive with `/opsx:archive`.
```

**Output — With Issues**

```
## Verification Report: <change-name>

**Schema:** <schema-name>
**Tasks:** N/M complete

### A — Completitud
PASS Tasks 1–4 verified in source files.
FAIL Task 5 marked [x] but no corresponding change found in <file>.
WARN Task 6: implementation exists but differs from task description.

### B — Corrección
PASS Implementation matches proposal intent.
WARN <file> includes logic not mentioned in proposal.md (may be out of scope).

### C — Coherencia
FAIL design.md specifies useSharedValue for animations, but <file>:42 still uses Animated.Value.
PASS File locations match design.md.

---
### Issues to Resolve (2 FAIL, 1 WARN)

**FAIL 1** — Task 5 not found in source
- Expected: change in <file> related to "<task description>"
- Found: no matching change
- Suggested fix: implement the task or remove it from tasks.md if intentionally skipped

**FAIL 2** — design.md decision not reflected
- Decision: "use Reanimated 3 instead of Animated"
- Violation: <file>:42 uses `Animated.Value`
- Suggested fix: migrate line 42 to `useSharedValue`

**WARN 1** — Extra logic in <file>
- Not mentioned in proposal or design
- Risk: low — may be fine, but review intentionality
```

**Output — Incomplete Tasks**

```
## Verification Report: <change-name>

**Tasks:** N/M complete — M-N tasks still pending

### Pending Tasks
- [ ] Task description 1
- [ ] Task description 2

Run `/opsx:apply` to implement the remaining tasks before verifying.
```

**Guardrails**
- Always read all available planning artifacts before verifying
- Verify against the artifacts, not against your own opinion of what the code should look like
- WARN for deviations that are minor or clearly intentional; FAIL for clear mismatches
- Never auto-fix issues — report them and let the user decide
- If tasks.md has no incomplete tasks but issues are found, still report them
- If delta specs exist, use them as the primary correctness reference alongside proposal.md
- Keep the report concise: group related issues, don't repeat the same issue multiple times
