# AGENTS.md

**Context status:** Accepted 2026-10-05 by @Exilitys. Reviewed at 220124f;
the owner merged PR #2 and explicitly said "continue accpeted".

This file routes work to its source. Keep product descriptions, architecture,
and decision explanations in their owning documents.

## Where truth lives

| Concern | Source |
| --- | --- |
| Product features and release acceptance | [Product PRD](prd.md) |
| Development contracts and decision provenance | [Technical specification](docs/prd/prd.md) |
| First slice | [Heap insertion](docs/specs/001-heap-insertion.md) |
| First-slice implementation plan | [Heap insertion plan](docs/superpowers/plans/2026-10-05-heap-insertion.md) |
| Architecture and data ownership | [Architecture review](docs/architecture/system.md) |
| Invariants and contract paths | [Invariants](docs/architecture/invariants.md) |
| Standards and library authority | [Development guide](docs/development.md) |
| Next work and deferred-item pointers | [Backlog](docs/backlog.md) |
| Progress | Git history, PR state, and document status headers |

## How work happens

| Lane | Trigger | Flow |
| --- | --- | --- |
| Slice | New user-visible capability | Intent, contract check, accepted spec, reviewed build plan, implement, verify, review, feature PR to development, sync. |
| Bug | Incorrect behavior | Reproduce, isolate cause, failing regression check, minimum fix, verify. |
| Chore | Refactor, rename or tooling maintenance | Keep behavior; plan if the scope needs it; existing checks pass. |
| Spike | Feasibility question | Agree on the probe, keep it disposable, report findings before promotion. |

The accepted slice is a specification, not an implementation plan. Application
scaffolding and implementation follow review of the written build plan.
Follow the [branch workflow](README.md#branch-workflow). The owner reviews and
accepts feature PRs; merging needs the owner's instruction.

## Contract paths

The invariants document owns this list. This readable mirror is checked by
the context guard. Before editing, check literal membership:

```text
prd.md
docs/prd/prd.md
docs/specs/
docs/architecture/
```

Changes to accepted behavior, interfaces, or deferred decisions require an
amended spec and human acceptance. Recording acceptance, fixing a typo, or
correcting a link uses existing authorization without reopening settled design.
The gate is currently manual; Git hook installation is deferred.

## Skills this workflow assumes

Check the host's available skills before a lane. Report missing capabilities
and follow Groundwork's host-specific fallback; retain the human review gates.

| Step | Installed skill |
| --- | --- |
| Specification and context | `groundwork:blueprint`, `groundwork:groundwork` |
| Intent and planning | `superpowers:brainstorming`, `superpowers:writing-plans` |
| Execution and logic checks | `superpowers:executing-plans`, `superpowers:test-driven-development` |
| Bugs | `superpowers:systematic-debugging` |
| Verification | `superpowers:verification-before-completion`, `check` |
| Code review | `superpowers:requesting-code-review`, `superpowers:receiving-code-review` |
| Context maintenance | `sync` |

## Verification

From the repository root:

```text
python scripts/check-context.py
git diff --check
```

The context guard checks documentation integrity. Discover application checks
from the real package manifest once it exists; do not claim an unrun app check.

## Non-negotiables

1. Use the accepted [invariants](docs/architecture/invariants.md); presentation
   must not change algorithm state.
2. Preserve user instructions and curated prose; update only owned context.
3. Run relevant checks and read their output before reporting success.

## graphify

- **graphify** (`~/.Codex/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.
