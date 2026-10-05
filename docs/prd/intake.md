# DSA Atlas: Blueprint intake

**Status:** Draft; scope, build capacity, application packaging, scene adapters,
and snapshot replay confirmed.
**Updated:** 5 October 2026
**Source:** [Product PRD](../../prd.md). Intake started from version 1.1, dated
1 October 2026; confirmed changes are reflected in version 1.2.

## Problem and audience

The PRD describes learners who must mentally reconstruct algorithm execution
from code, static diagrams, or animations that hide important state. DSA Atlas
lets them manipulate a structure, inspect a semantic step, rewind, and explain
what happened using synchronized representations.

DSA means data structures and algorithms. A DSA learner can be a university
student, a self-directed developer, or someone preparing for interviews. The
PRD names students and self-directed developers as the primary audience and
teachers and mentors as a secondary audience. A narrower beginner demo persona
has not yet been confirmed.

## Requirements confirmed in conversation

| ID | Requirement | Provenance |
| --- | --- | --- |
| IN-01 | The first slice demonstrates heap insertion with synchronized tree and array views. | User confirmed the second intake inference on 3 October 2026: "two is yes". |
| IN-02 | Provide a general reusable framework. | User added on 3 October 2026: "but provide a general reusbale frmaework". IN-03 records the subsequent authoring choice. |
| IN-03 | New lessons are code modules using a shared DSA framework. | User selected "Code modules using a shared DSA framework (Recommended)" on 3 October 2026. |
| IN-04 | Both the complete heap module and graph BFS/DFS are required for submission. | User selected "Heap and BFS/DFS both required" on 3 October 2026, overriding the recommended heap-required, graph-optional release. |
| IN-05 | Build capacity is one person, 2–3 hours per day. | User answered "2-3 hours and solo" on 3 October 2026. |
| IN-06 | Use main for production, development for integration, and feature branches with PRs into development for user review and acceptance. | User requested this workflow for Exilitys/DSAVisualizer on 3 October 2026. |
| IN-07 | Use Next.js with React Three Fiber and an integrated tutor endpoint. | User selected this option over the recommended static React frontend with a separate serverless endpoint on 3 October 2026. |
| IN-08 | Share visual primitives and controls; provide a scene adapter per lesson. | User selected this option over a universal renderer driven entirely by scene data on 3 October 2026. |
| IN-09 | Store immutable snapshots for every semantic step. | User selected this option over reconstructing snapshots from an event log on 3 October 2026. |
| IN-10 | Test with Ollama in development and keep production provider options open. | User answered on 5 October 2026: "For now in development keep options open, but i test with ollmaa". |
| IN-11 | Finish or restart before a new heap operation. | User selected "Finish or restart first (Recommended)" on 5 October 2026. |

## Confirmed framework scope

The framework supports multiple DSA lessons. Playback, rewind, inspection,
selection, learning controls, and validated tutor context are shared. Each
lesson supplies its algorithm behavior, invariants, representations, and
authored learning content. Heap insertion is the first working use of that
framework.

New lessons are code modules. A visual editor without coding was offered as
an alternative and was not selected. The exact module interface still needs
technical review in Blueprint.

Both heap and graph modules must ship. The rejected heap-required,
graph-optional proposal would have left more time for visual polish, AI, and
challenges within the solo build window. The selected scope instead proves
the reusable framework across both tree/array and graph/frontier behavior.
At 2–3 hours for each of seven build days, planned effort is approximately
14–21 hours; optional capabilities remain outside the release.

## Confirmed technical direction

Next.js packages the React interface and tutor route together. The rejected
static frontend plus serverless endpoint would have kept the frontend build
independent of server/client conventions, but required separate endpoint
packaging. The selected approach uses one application project.

Shared visual primitives and controls are used by lesson-specific scene
adapters. A universal scene-data renderer was not selected because it adds a
rendering format before the required heap and graph journeys are complete.

Replay stores immutable semantic snapshots. Reconstructing state from an
event log was not selected: it saves trace storage but makes restoration depend
on event replay behavior in every lesson. The PRD's scene-size limits bound
the snapshot approach.

## Issues to resolve in Blueprint

- **Module interface:** exact function and data shapes still need review in
  the technical specification. Next.js is selected; the deployment host is
  still open.
- **AI integration:** Ollama is selected for development. Production provider,
  model and spending cap are explicitly deferred until deployment integration.
- **Heap edits during repair:** resolved on 5 October 2026. New operations
  start at ordinal 0 or completion; finish or restart first.
- **Education prompt:** published when rechecked on 5 October 2026. It asks
  for conceptual understanding, connections, and application. The technical
  spec maps paired views, explanations, and fresh predictions to that prompt.
  Source: [ForgeHacks tracks](https://www.forgehacks.dev/#tracks).
- **Deadline timezone:** Devpost's deadline display says 10 October 2026 at noon
  EDT, equivalent to 23:00 in Bangkok; its rules text labels noon EST instead.
  Resolve this discrepancy before recording a final submission cutoff. Sources:
  [Devpost event](https://forgehacks-2026.devpost.com/) and
  [rules](https://forgehacks-2026.devpost.com/rules).

## Continuation

PR #1 was merged into development by @Exilitys on 5 October 2026; merge commit
2bd928145d93c3c2b65a84fb6fb4181d7e53dd2c. The new technical spec and slice 001
are drafts on feature/dsa-atlas-technical-spec. Continue with their validation
and review diagram. Following human acceptance of the spec, run Groundwork
Mode A to establish the project context and workflow around those artifacts.

The owner subsequently instructed "Continue" after the final technical review
packet on 5 October 2026. This accepts version 1 at d8b8f34, together with slice
001 and the reviewed architecture artifact. Acceptance metadata is recorded in
those documents. PR #2 remains open for the owner's merge.

Groundwork Mode A inventory resolves product, architecture, design direction,
progress, and provenance to existing artifacts. The proposed gaps are root
AGENTS.md, docs/development.md, docs/architecture/invariants.md, docs/backlog.md,
and scripts/check-context.py. File-list confirmation is pending; UI tokens,
component registry configuration, and Git hooks are proposed for later setup.
