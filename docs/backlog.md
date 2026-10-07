# Next work and deferrals

**Status:** Accepted 2026-10-05 by @Exilitys; reviewed at 220124f and merged in PR #2.

The source of release scope is the accepted [technical spec](prd/prd.md).
This file routes next work; it does not replace that spec or a build plan.

## Next

1. Review the implementation feature PR and [verification evidence](reviews/001-heap-insertion.md) for [slice 001](specs/001-heap-insertion.md).
2. After owner acceptance, plan the next required release slice below.

The first slice's acceptance is defined by its insertion fixture and user
journey. The owner accepted the written plan and Native execution on 6 October 2026.

## Required release work after the first slice

| Work | Authority |
| --- | --- |
| Complete heap extraction and playback controls | Product PRD FR05/FR07 and technical spec scope. |
| Editable graph, BFS and frame-based DFS | Product PRD FR08 and technical spec data/algorithm contracts. |
| Authored lessons, three challenges per module, and local evidence | Product PRD FR09/FR11/FR13. |
| Ollama development tutor and validated context/actions | Technical spec D-006 and tutor contract. |
| Responsive, keyboard, reduced-motion and fallback journeys | Product PRD FR14 and quality targets. |
| Release verification and submission material | Product PRD release checklist. |

## Deferred items

The sole list of product deferrals and revisit conditions is
[technical spec section 11](prd/prd.md#11-deferred). It includes Dijkstra,
additional curriculum, authoring tools, accounts, sharing, deployment/provider
choices, dependency patches, and benchmark hardware.

Context-specific deferrals are registry setup and Git hooks at scaffolding,
and source-dependent checks when actual application files exist. Their owner
is the [development guide](development.md#deferred-tooling).

## Progress

Use Git history, PR state and artifact status headers. Heap insertion is built
on its feature branch, pending owner review. Keep measured results in verification
reports; do not turn proposed targets into accomplishments.
