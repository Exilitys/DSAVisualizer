# Slice 001 - heap insertion through the shared lesson framework

**Status.** Draft

**Version.** 1, 5 October 2026

**Owner.** Jonathan Carlo (@Exilitys)

**Source.** [Technical specification](../prd/prd.md), D-002 through D-005;
intake IN-01 confirms heap insertion as the first slice.

**Diagram.** [Architecture and first-slice path](../architecture/system.md).

## 1. Problem

Learners need to see why an inserted heap item moves and how its tree position
matches its array index. A scene with unrelated animation and array state
cannot teach that connection.

## 2. Users

Students and self-directed developers trying to explain heap insertion.
The observable task is an insertion followed by inspection and rewind.

## 3. The core assumption

Following one stable item through linked views and inspectable steps makes
the parent/index relationship understandable on a fresh example. The slice
can fail if a learner sees motion but cannot explain the comparison or index.

## 4. Scope

**In.** Next.js lesson entry, pure heap insertion trace, shared selection and
step controls, tree/array views, item inspection, authored step explanations,
camera recovery, keyboard operations, semantic fallback, and reduced motion.
The first player supports next, previous, restart, and seek.

**Adjacent, later.** Autoplay/speed controls, extraction, graph module,
live tutor integration, persistence, and the complete challenge set remain
required release work outside this first slice.

**Not this slice.** Arbitrary initial arrays, build-heap, Dijkstra, an atlas
catalog beyond implemented lesson links, or a configurable scene language.

## 5. Decisions

### D-101 - Heap insertion as the first end-to-end slice

- **Chosen.** Insert into a min heap with synchronized tree and array views.
- **Rejected.** Default, not evaluated: no competing first-slice choices were
  put to the owner when this inference was confirmed. Whole-release scope was
  considered separately in D-001 of the technical specification.
- **Because.** One operation exercises input validation, semantic events,
  identity-preserving movement, shared playback, and two representations.
- **Revisit when.** The first-slice journey cannot demonstrate the intended
  connection or the product owner changes the learning objective.
- **Provenance.** Confirmed 2026-10-03 with @Exilitys: "two is yes"; intake IN-01.

## 6. Interfaces and acceptance

Use the LessonEngine and Snapshot contracts in the technical specification.
Initial state is the authored valid heap with values
`[3, 7, 5, 12, 9, 8, 6]` and stable IDs H1 through H7 in that order.
Insert 1 as H8, keeping its ID through every swap.

| Ordinal | Event | H8 index | Comparisons | Swaps |
| --- | --- | --- | --- | --- |
| 0 | initial | absent | 0 | 0 |
| 1 | append H8 | 7 | 0 | 0 |
| 2 | compare H8 with H4 | 7 | 1 | 0 |
| 3 | swap H8/H4 | 3 | 1 | 1 |
| 4 | compare H8 with H2 | 3 | 2 | 1 |
| 5 | swap H8/H2 | 1 | 2 | 2 |
| 6 | compare H8 with H1 | 1 | 3 | 2 |
| 7 | swap H8/H1 | 0 | 3 | 3 |
| 8 | complete | 0 | 3 | 3 |

The final values are `[1, 3, 5, 7, 9, 8, 6, 12]`. The final item-ID order is
`[H8, H1, H3, H2, H5, H6, H7, H4]`. Each comparison and swap has an authored
explanation and pseudocode line. Repair snapshots label the temporary ordering
violation; the completed heap has complete shape and parent-child order.

Further checks: empty/single-item heaps, duplicate equality without swapping,
values 0 and 99, size-15 insertion rejection, out-of-range/non-integer input,
and identical trace output for identical input/version. Rejected input keeps
the current run. Camera, layout, and selected view cannot alter execution.
Starting a new insertion is enabled only at ordinal 0 or ordinal 8 for this
fixture. At ordinal 3, offer finish or restart; restart restores the seven-item
input. Completing the run allows the eight-item result to be the next input.

The 3D and semantic views highlight H8 together at every ordinal. Previous and
seek restore the exact snapshot, counts, indices, and authored explanation.
Tree labels and array cells show actual values and zero-based indices. Pointer
and semantic object-list selection produce the same selected ID.

## 7. Failure behaviour

Reject invalid input beside the operation control. Recover camera orientation
with focus/fit. If WebGL fails, keep the semantic structure and step controls.
Reduced motion snaps between snapshots. A broken engine trace preserves the
previous valid run and reports an error rather than displaying partial output.

## 8. Non-functional targets

Render the preset without label overlap at 360 px and 1280 px widths. A local
action should show feedback within 100 ms at p95, measured on a named device.
All operation and step controls must be keyboard accessible; camera gestures
are not a prerequisite for the semantic journey.

## 9. Deferred

- **Extraction and graph BFS/DFS.** Revisit when this slice passes its core
  journey; both modules remain mandatory for release.
- **Live tutor.** Revisit when provider/budget selection and the validated
  context route are ready; no model call is needed to verify insertion replay.
- **Autoplay, speed, and complete challenges.** Revisit when selected-step
  state and identity restoration pass; complete them before release.
- **Persistent presets/progress.** Revisit when the two lesson inputs and
  challenge versions are established; browser persistence is a release requirement.

## 10. The first slice

**It proves.** A real insertion can be followed through the shared selected
snapshot and stable identity in paired representations.
**Done when.** The ordinal table above passes engine checks and the user can
perform the insertion, select H8, seek to ordinal 3, inspect index 3 and counts
1/1, rewind to ordinal 2, and restart. Repeat through keyboard controls with
reduced motion. A fresh input then tests the parent/index explanation.

## 11. Open questions

No clarification remains unanswered. D-007 defines finish/restart behavior.
The written slice contract remains Draft pending human acceptance of its
interface and step definitions.
