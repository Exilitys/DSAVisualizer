# Next work and deferrals

**Status:** Accepted 2026-10-05 by @Exilitys; reviewed at 220124f and merged in PR #2.

The source of release scope is the accepted [technical spec](prd/prd.md).
This file routes next work; it does not replace that spec or a build plan.

## Next

1. Review the [editable graph, BFS and DFS specification draft](specs/003-graph-traversal.md), then its Native build plan.
2. Implement the accepted graph slice through the shared player, playback and scene primitives. Bundle the spec, plan, implementation and evidence in one feature PR.

The first slice's acceptance is defined by its insertion fixture and user
journey. The owner accepted the written plan and Native execution on 6 October 2026.
Slice 002's written specification and build plan were accepted on 7 October 2026.
Native implementation and technical verification are complete; the owner merged
PR #7 on 13 October 2026. The target-learner explanation check remains outstanding.

## Required release work after the first slice

| Work | Authority |
| --- | --- |
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
and merged in [PR #4](https://github.com/Exilitys/DSAVisualizer/pull/4) on
7 October 2026. Extraction/playback was verified and merged in PR #7 on
13 October 2026. Graph slice 003 is a draft, not implemented. Keep measured results in verification
reports; do not turn proposed targets into accomplishments.
