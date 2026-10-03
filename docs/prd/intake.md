# DSA Atlas: Blueprint intake

**Status:** Draft; module authoring, release scope, and build capacity confirmed.
**Updated:** 3 October 2026
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

## Issues to resolve in Blueprint

- **Technical decisions:** the shared module interface, application packaging,
  and hosting approach remain proposals rather than accepted decisions.
- **AI integration:** provider and spending limit remain open. These need
  agreement before connecting a paid provider.
- **Education prompt:** the official site still displayed "Prompt locked" when
  checked on 3 October 2026. Prompt alignment remains open. Source:
  [ForgeHacks tracks](https://www.forgehacks.dev/).
- **Deadline timezone:** Devpost's deadline display says 10 October 2026 at noon
  EDT, equivalent to 23:00 in Bangkok; its rules text labels noon EST instead.
  Resolve this discrepancy before recording a final submission cutoff. Sources:
  [Devpost event](https://forgehacks-2026.devpost.com/) and
  [rules](https://forgehacks-2026.devpost.com/rules).

## Continuation

Continue Blueprint with technical decision proposals, a product spec,
first-slice spec, validation, and a review
diagram. Following human acceptance of the spec, run Groundwork Mode A to
establish the project context and workflow around those artifacts.
