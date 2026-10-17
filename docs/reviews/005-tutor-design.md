# Contextual tutor draft design check

**Status:** Draft review preparation, 17 October 2026. The owner has not accepted Slice 005. D-501 and D-502 remain unanswered. No product source or implementation plan was written.

**Packet:** [Slice 005 draft](../specs/005-contextual-tutor.md), [request and Apply diagram](../diagrams/contextual-tutor.html) and [editable source](../diagrams/contextual-tutor.sequence.json). This packet is on feature/contextual-tutor, based on learning head 4ff498c. PRs #8 and #9 remain open; no merge or additional PR is authorized by a generic Continue.

## Existing authority and source inventory

The accepted technical specification already requires an integrated Next.js tutor route, local Ollama for development, provider independence, current-state reconstruction, validation, cancellation, explicit Apply, bounded anonymous requests and authored fallback. Existing engine and learning contracts remain authoritative.

Read-only source inventory found the player retains original input and trace but no active command/run ID. Graph alone holds an activeCommand in its playground. Resting and active snapshots can both use s0; heap insertion s0 is byte-identical to rest. Reconstruction therefore needs explicit command/run metadata without changing the deterministic engines. The shared hook already publishes every learning transition and is the cancellation seam. The proposed provider context must project current guidance and must never serialize the full learning module, because that object contains answer keys, feedback and future checkpoints.

No missing workflow capability blocks this design. Blueprint, brainstorming, Ponytail, grill-me and Archify are installed. No matt-pocock TypeScript skill is exposed; the interim route is the pinned package types, repository conventions and official runtime documentation. No install or dependency change was made.

## Fresh builder check and resolution

A fresh read-only builder reviewed the written draft. The two owner policy choices were explicitly excluded from new findings. It raised three questions that existing authority and precise draft wording resolve:

| Question | Resolution in the draft | Cost if wrong |
| --- | --- | --- |
| How can the provider distinguish resting and insertion s0 if snapshot bytes match? | Verified context includes rest/run status and the normalized command, and the panel shows that active command caption. AC-1 requires explicit reconstruction semantics rather than unequal snapshot bytes. | One provider context field/caption and associated reconstruction checks. |
| Do command proposals reset graph layout and selection like examples? | Command Apply retains positions and still-inspectable selection. Example Apply uses explicit seed replacement, clearing selection/resetting graph positions while keeping camera. Failed preview/Apply preserves the old scene. | Adapter behavior would diverge from ordinary operations unless regression journeys catch it. |
| Can a cancelled call free its slot merely because its result is fenced off? | No. The single application transport slot remains occupied until fetch/body cleanup settles. Deadline/cancellation immediately invalidates display, but cannot prove remote GPU computation stopped. | A misbehaving adapter can keep the local service busy; authored fallback stays usable. |

These are draft implementation proposals or clarifications of accepted behavior, not recorded owner acceptance. No additional product question was identified beyond D-501/D-502.

The draft stress pass also checked: pending challenge rewind cannot unlock AI accidentally; Apply stays in Explore and respects the true heap boundary; graph uses one final Keep/Apply dialog; selected extracted items can still be referenced; a change away and back invalidates old exchange IDs; unsafe output is rejected as a whole; no future trace/answer data reaches the provider; cancellation releases transport resources before another provider request; guest cookie limits make no deployment abuse guarantee. The fixed live evaluation lists 20 provider-answer questions. Pending-policy and cancellation checks are additional and cannot be counted as completed model answers.

## Checks performed

The Blueprint checker passes with four draft decision records and two explicitly open questions. Context guard and whitespace checks pass. No application tests/build were repeated because no application source changed. Ollama is installed at the configured host machine, but http://127.0.0.1:11434/api/tags was unreachable during this run. No model was selected/downloaded, and no live tutor correctness or latency result is claimed.

Archify initially diagnosed unreadable projected labels, then desktop vertical overflow. The source was narrowed and redundant return arrows were removed; message spacing was corrected to the supported timeline. The final artifact passes all nine showcase checks with zero composition errors/warnings. Automated browser collection passes at 1440x900, 1600x1000, 1920x1080 and 2048x1320, including light/dark endpoint themes. All four endpoint screenshots were visually inspected: labels fit, routes are clear, cards are readable and the desktop page does not overflow. This validates a diagram, not the future application.

```text
diagram_type: sequence
validation: 9/9 showcase, 0 errors, 0 warnings
browser_evidence: passed
visual_review: passed
correction_rounds: 2
specification_sha256: d6a7925ffb3bf56110dd3e2dbf4ab66baa73fcad138fb1fcf37ef6ae9197b30a
artifact_sha256: 369e40c1db9cbc47fa923dd0ff32814169503100a048bb17f393f57e5f4d9ce4
```

Receipts: [delivery](../diagrams/contextual-tutor.delivery.json), [validation](../diagrams/contextual-tutor.validation.json), [browser collection](../diagrams/contextual-tutor.visual-check.json), [browser report](../diagrams/contextual-tutor.visual-check.html). Screenshots: [1440 light](../diagrams/contextual-tutor.visual-check.1440x900.light.png), [1440 dark](../diagrams/contextual-tutor.visual-check.1440x900.dark.png), [2048 light](../diagrams/contextual-tutor.visual-check.2048x1320.light.png), [2048 dark](../diagrams/contextual-tutor.visual-check.2048x1320.dark.png).

## Owner questions and gate

D-501 asks authored guidance until Submit/Reveal versus live AI hints before answering. Recommendation remains authored guidance until the attempt is resolved. D-502 asks curated examples plus validated commands versus additional AI-generated inputs. Recommendation remains curated examples for this first tutor slice. Neither recommendation is treated as an answer.

Review reconstruction/correlation, preview versus Apply, and cleanup/concurrency most closely. After the owner answers, revise the packet and request acceptance of the specification and diagram before writing a build plan. The root workflow requires a separately reviewed plan before implementation. Keep one completed feature PR per slice, and do not merge the existing PRs without an owner merge instruction.
