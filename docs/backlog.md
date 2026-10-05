# Next work and deferrals

**Status:** Draft context for owner review, 5 October 2026.

The source of release scope is the accepted [technical spec](prd/prd.md).
This file routes next work; it does not replace that spec or a build plan.

## Next

1. Review the generated Groundwork context and accept or amend it.
2. Write and review an implementation plan for [slice 001](specs/001-heap-insertion.md).
3. Select the execution method, then implement and verify the accepted slice.

The first slice's acceptance is defined by its insertion fixture and user
journey. The approved file list does not approve an unwritten build plan.

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

Use Git history, PR state and artifact status headers. The application has not
been implemented by this planning work. Keep measured results in verification
reports; do not turn proposed targets into accomplishments.
