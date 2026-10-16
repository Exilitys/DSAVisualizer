# Slice 004 draft design checks

**Status.** Design checks recorded 2026-10-16; owner acceptance of the complete
specification and diagram is pending. No application implementation in this change.
**Specification.** [Slice 004, version 1](../specs/004-learning-challenges.md).

## Requirement and builder checks

The owner chose one submitted answer before feedback/reveal and two guide
segments per module. Those choices are recorded as D-401 and D-402.

A fresh builder check identified a missing product requirement: the heap
challenges must distinguish heap order from sorted order. The revised set covers
the next swap and affected array index, child selection, and a valid unsorted
heap. The reviewer confirmed that no important planning question remained.
That confirmation is a design review, not an implementation or runtime review.

An assert based probe against the existing engines checked the six literal
prediction oracles and guide event ordinals. The valid unsorted heap oracle also
checked every parent/child inequality and compared against independently sorted
values. The implementation must add durable regression coverage after plan acceptance.

## Diagram receipt

[Standalone flow](../diagrams/learning-challenges.html),
[editable source](../diagrams/learning-challenges.workflow.json),
[delivery receipt](../diagrams/learning-challenges.delivery.json), and
[automated browser receipt](../diagrams/learning-challenges.visual-check.json).

```text
diagram_type: workflow
specification_sha256: 1136d067b1ea94879a54ed8a8f1ad920260a8ea5ea60924c0bf05004f3457eb1
specification_bytes: 2460
artifact_sha256: b5855dbdf8d9eee054157595f4a1014d52da1e72bc5720025800660836028551
artifact_bytes: 709962
validation: 9/9 showcase, 0 errors, 0 warnings
browser_evidence: passed
visual_review: passed (screenshot composition only)
correction_rounds: 2
```

The packaged browser check measured containment and readability at 1440×900,
1600×1000, 1920×1080 and 2048×1320 in the default still READ view. All four
viewports fit without document overflow. It captured light and dark themes at
1440×900 and 2048×1320; its receipt deliberately leaves perceptual review pending.

Separately, Codex inspected all four captured images. The main path, optional
ungraded branch and local evidence branch are readable in both themes, without
visible route/label overlap or clipped nodes/cards. The composition remains
readable at the largest viewport. The [contact sheet](../diagrams/learning-challenges.visual-check.html)
links those exact screenshots. Interactive viewer tools and exports were not tested.

Two focused candidate corrections increased widths after validation reported
label fit and context readability problems. The final source was frozen before
delivery. The existing accepted system architecture artifact/evidence were not edited.

## Check boundary

The Blueprint specification checker, repository context guard and Git whitespace
check must pass on the committed draft. Their results concern documentation.
Application tests, build, interaction timings, real device checks and learner
evaluation were not rerun for this documentation change and are not claimed here.

No planning PR was created. The learning branch depends on the still open graph
PR #8 and must be aligned with development after the owner integrates that work.
