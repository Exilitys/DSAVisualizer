# Invariants and contract paths

**Status:** Accepted 2026-10-05 by @Exilitys; reviewed at 220124f and merged in PR #2.

The accepted [technical specification](../prd/prd.md) owns the behavior and
decision reasons. This document indexes those commitments and owns the literal
contract path list used by the root router and any later hook.

## Invariants

| Must hold | Source | Verification state |
| --- | --- | --- |
| The pure engine decides logical behavior; views consume its snapshots | Technical spec sections 6-7 | `npm test`; pure Node engine/player checks. |
| Snapshots, including nested state, remain immutable | D-005 and trace contract | Frozen fixture/replay checks in `npm test`. |
| One selected ordinal supplies values, counts, pseudocode and explanations | Player contract | [Runtime evidence](../reviews/001-heap-insertion.md). |
| Stable IDs link representations and preserve extraction results | Data model and slice 001 | Insertion identity checks pass; extraction remains later work. |
| Heap commands start at original/completed boundaries | D-007 | Player boundary checks and runtime evidence. |
| Tutor replies are validated, correlated, and unable to mutate runs directly | Tutor contract | Route and stale-response checks in implementation. |
| Declared context paths are real; diagram evidence matches its HTML | Context integrity | `python scripts/check-context.py` is runnable now. |

Verification covers slice 001; later capabilities retain their own checks.

## Contract paths

```text
prd.md
docs/prd/prd.md
docs/specs/
docs/architecture/
src/core/lesson.ts
src/core/player.ts
src/lessons/heap/engine.ts
src/app/globals.css
```

Each line is a file or directory prefix. These paths exist now. Add actual
engine interface, API schema, theme-root, and prompt paths when those files
are introduced; do not list imaginary source locations. Update the root mirror
at the same time; the context guard fails if the lists differ.

## Gate

Changing accepted behavior or a contract requires an amended spec and human
acceptance. The gate is membership in the list, rather than a subjective
importance score. Existing authorization covers acceptance metadata, typo
correction, and broken-link fixes without changing settled behavior.

Reviving a deferred capability is also a contract decision. Follow the revisit
conditions in [technical spec section 11](../prd/prd.md#11-deferred); the
backlog points there rather than inventing a second set of conditions.

Enforcement is currently manual. The owner deferred Git hooks until application
scaffolding; installation must show the proposed configuration first.
