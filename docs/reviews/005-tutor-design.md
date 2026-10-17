# Contextual tutor v1 design check

**Status:** Version 1 accepted by @Exilitys on 17 October 2026 through "Accept specification and diagram (Recommended)", reviewed at `f2604fd039b6a8314ba6670da3cb10eca69dae51`. The [Native build plan](../superpowers/plans/2026-10-17-contextual-tutor.md) is drafted for a separate owner review gate; no product code is authorized by specification acceptance alone.

**Packet:** [Slice 005 v1](../specs/005-contextual-tutor.md), [request and Apply diagram](../diagrams/contextual-tutor.html) and [editable source](../diagrams/contextual-tutor.sequence.json). This packet is on feature/contextual-tutor, based on learning head 4ff498c. PRs #8 and #9 remain open; no merge or additional PR is authorized by a generic Continue.

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

These resolutions were included in version 1 before its owner acceptance. No additional product question was identified. The owner has since resolved D-501/D-502.

The draft stress pass also checked: pending challenge rewind cannot unlock AI accidentally; Apply stays in Explore and respects the true heap boundary; graph uses one final Keep/Apply dialog; selected extracted items can still be referenced; a change away and back invalidates old exchange IDs; unsafe output is rejected as a whole; no future trace/answer data reaches the provider; cancellation releases transport resources before another provider request; guest cookie limits make no deployment abuse guarantee. The fixed live evaluation lists 20 provider-answer questions. Pending-policy and cancellation checks are additional and cannot be counted as completed model answers.

## Checks performed

The Blueprint checker passes with four decision records and no open product questions. Context guard and whitespace checks pass. No application tests/build were repeated because no application source changed. Ollama is installed at the configured host machine, but http://127.0.0.1:11434/api/tags was unreachable during the earlier draft check on 17 October 2026. No model was selected/downloaded, and no live tutor correctness or latency result is claimed.

Archify initially diagnosed unreadable projected labels, then desktop vertical overflow. The source was narrowed and redundant return arrows were removed; message spacing was corrected to the supported timeline. After the v1 policy-card update, validation and browser collection were rerun and all four endpoint images were inspected again. The final artifact passes all nine showcase checks with zero composition errors/warnings. Automated browser collection passes at 1440x900, 1600x1000, 1920x1080 and 2048x1320, including light/dark endpoint themes. All four endpoint screenshots were visually inspected: labels fit, routes are clear, cards are readable and the desktop page does not overflow. This validates a diagram, not the future application.

```text
diagram_type: sequence
validation: 9/9 showcase, 0 errors, 0 warnings
browser_evidence: passed
visual_review: passed
correction_rounds: 2
specification_sha256: 12ee48dc09b784bacecf5cab177f9ea949981f989741af03a9da97f75453af11
artifact_sha256: 8dc9b59667c72a3cc5835e7b7de746702dcfb9db7aee18e6d7caf48895fb772e
```

Receipts: [delivery](../diagrams/contextual-tutor.delivery.json), [validation](../diagrams/contextual-tutor.validation.json), [browser collection](../diagrams/contextual-tutor.visual-check.json), [browser report](../diagrams/contextual-tutor.visual-check.html). Screenshots: [1440 light](../diagrams/contextual-tutor.visual-check.1440x900.light.png), [1440 dark](../diagrams/contextual-tutor.visual-check.1440x900.dark.png), [2048 light](../diagrams/contextual-tutor.visual-check.2048x1320.light.png), [2048 dark](../diagrams/contextual-tutor.visual-check.2048x1320.dark.png).

## Owner decisions and packet gate

On 17 October 2026, @Exilitys answered D-501: "Authored guidance until Submit/Reveal (Recommended)" and D-502: "Curated examples plus validated commands (Recommended)". Version 1 records those choices, removes conditional policy branches and updates the diagram policy card. It also aligns AC-7 with the separate pending-policy check and the timeout row with transport cleanup; no other technical decision changes. The policy answers settled these choices. In a subsequent reply, @Exilitys explicitly accepted version 1 and its diagram, reviewed at `f2604fd039b6a8314ba6670da3cb10eca69dae51`; build-plan acceptance remains separate.

Review reconstruction/correlation, preview versus Apply, and cleanup/concurrency most closely. Specification/diagram acceptance is recorded; the five-task Native build plan is now drafted for owner review. Its author checked spec coverage, interface consistency and failure cases; read-only inventories informed file/caller mapping without delegating that self-review. No implementation has started. The root workflow requires a separately reviewed plan before implementation. Keep one completed feature PR per slice, and do not merge the existing PRs without an owner merge instruction.
