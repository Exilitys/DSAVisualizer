# Slice 002: heap extraction and shared autoplay

**Status.** Accepted 2026-10-07 by @Exilitys.
**Reviewed.** Version 1 at `339de4bd788a132bb5c6ae5acdad250e86f11062` in PR #5,
accepted through the owner's "Continue" after the written-spec review request.
**Owner.** Jonathan Carlo (@Exilitys).
**Version.** 1.
**Source.** [Technical contracts](../prd/prd.md), data model and interfaces;
[product requirements](../../prd.md), heap operations and playback.
**Diagram.** The existing [architecture](../architecture/system.md) remains
the ownership model. No engine or network boundary moves in this slice.

## 1. Problem

A learner can now follow insertion, but cannot yet inspect removal of the minimum
or replay an operation automatically. Students and self-directed developers need
to connect the removed root, the last item's replacement, and sift-down decisions.
Today they can use the insertion playground and inspect code separately.

## 2. Users

Students and self-directed developers use the existing insertion lesson. They
will be able to inspect removal and control automatic replay without an account.

## 3. The core assumption

Following stable IDs through removal and repair, while controlling semantic-step
playback, helps a learner explain why the smaller child is chosen. The assumption
fails if a learner cannot distinguish the removed root from its replacement or
explain a comparison after pausing on a fresh example.

## 4. Scope

**In.** Extract minimum, an inspectable result card, shared Play/Pause and speed
controls, exact rewind/seek, authored extraction explanations and pseudocode,
keyboard, reduced motion, and existing semantic fallback.

**Adjacent, later.** Editable graph with BFS/DFS, tutoring, prediction challenges,
and persistence remain required release work. No provider call is needed here.

**Not this slice.** Arbitrary starting-array editor, build-heap, a separate 3D
result object, or a universal scene-description language.

## 5. Decisions and provenance

### D-201: result presentation

- **Chosen.** A selectable result card; active heap items retain linked 3D views.
- **Rejected.** A separate 3D result object plus card.
- **Because.** The card makes removal and identity inspectable without widening
  the stage or complicating camera recovery.
- **Revisit when.** Learner feedback shows spatial separation teaches removal
  better than the card, after required release modules work.
- **Provenance.** Chosen with @Exilitys on 7 October 2026 in the result-presentation reply.

### D-202: extraction and autoplay together

- **Chosen.** Ship extraction with shared autoplay and speed controls.
- **Rejected.** Extraction first with autoplay in a later slice.
- **Because.** The owner selected a complete removal-and-replay journey, and the
  same playback controls must serve the required graph module next.
- **Revisit when.** A demonstrated delivery blocker requires the owner to split
  the slice; both capabilities remain required.
- **Provenance.** Chosen with @Exilitys on 7 October 2026: "Extraction plus autoplay".

Detailed data fields and timing rules below were accepted with the written review;
the earlier two scope replies alone did not approve an unwritten artifact.

## 6. Data and interfaces

Keep the accepted `LessonEngine`, `Snapshot`, and `Inspection` interfaces.
Keep `HeapInput = {items: readonly HeapItem[]; nextId: number}`.
Extend the heap-specific types:

```typescript
type HeapCommand = {type:'insert'; value:number} | {type:'extract'};
type HeapState = HeapInput & {result: HeapItem | null};
```

Heap version: `1.1.0`. Every initial snapshot has `result:null`.
Insertion also uses this shape; its existing event ordering, IDs, counters,
values, and nine-step fixture remain unchanged.

An extraction stores the old root in `result`. It exists either in active `items`
or as the result, never both. Replacement and last-slot removal are atomic.
All snapshots, including the result object, are deeply immutable.
Extraction never increments or resets `nextId`; subsequent insertion cannot
recycle a removed ID. A new operation clears the previous result at its initial
snapshot. Restart restores that operation's original heap and clears its result.

`validateInput` continues to validate active items/counter, not an old operation's
result. Starting from a completed extraction reconstructs the next input from
active items. `validateCommand` accepts extraction even from an empty heap.
The finish/restart boundary rule remains identical for both heap commands.

`inspect` also accepts the result ID. Its fields show value and location
"Extracted minimum" with absent index, parent, and children. Selecting the card
uses the same selected ID as inspection. Camera Focus is disabled for a result
outside the active heap; Fit still recovers the active heap view.

## 7. Extraction trace and acceptance fixture

Use the existing seven-item preset: values `[3,7,5,12,9,8,6]`, IDs H1 through H7,
`nextId:8`. Extract H1 (value 3); H7 replaces the root.

| Ordinal | Event | H7 index | Comparisons | Swaps |
| --- | --- | --- | --- | --- |
| 0 | initial | 6 | 0 | 0 |
| 1 | replace/remove: H1 becomes result, H7 becomes root | 0 | 0 | 0 |
| 2 | compare children H2=7 and H3=5; choose H3 | 0 | 1 | 0 |
| 3 | compare H7=6 with H3=5 | 0 | 2 | 0 |
| 4 | swap H7/H3 | 2 | 2 | 1 |
| 5 | compare H7=6 with its only child H6=8; stop | 2 | 3 | 1 |
| 6 | complete | 2 | 3 | 1 |

Final values: `[5,7,6,12,9,8]`. Final IDs: `[H3,H2,H7,H4,H5,H6]`.
Result: `{id:'H1',value:3}`. Counter remains 8.
Shape always holds; order is labelled repairing where required.

Each numeric comparison is its own step. With two children, compare their values
first and choose the left on equality. With one child, no invented child-choice
comparison occurs. Compare replacement to chosen child separately and swap only
when the child is strictly smaller. Bounds checks do not count as comparisons.
Comparison explanations and code lines distinguish choosing a child from
comparing it with the replacement. Each snapshot owns the current variables,
counters, affected IDs, and explanation operands.

Empty extraction has initial and complete snapshots, null result, no invented
entity, and zero comparisons/swaps. Single-item extraction has initial, removal,
and complete snapshots, an empty active heap, and the original item as result.
Equality, one-child repair, 0/99, maximum-size heaps, and repeated insert/extract
sequences must retain ordering and identity. The player must continue rejecting
broken trace envelopes before replacing a valid run.

## 8. Shared playback

The browser owns playback mode and a cancellable timer. The pure engine and player
remain independent of clocks, React, and renderer resources. Heap and graph use
the same browser playback logic and native control markup.

- A valid operation selects its first action step and starts paused.
- Play advances one existing ordinal per tick. No run means disabled Play;
  complete means disabled Play and never creates a new operation.
- Speeds are 0.5×, 1×, and 2×. At 1×, one semantic step lasts 1000 ms;
  the others use 2000 ms and 500 ms. These are teaching speeds, not runtime claims.
- Pause keeps the selected snapshot. Completion automatically stops playback.
- Previous, Next, seek, Restart, and operation submission stop playback before
  changing the cursor/run. Invalid input retains its valid run and ordinal.
- Speed changes retain the cursor and playing state, restart the delay, and
  invalidate ticks from the previous schedule.
- A cancelled or stale callback cannot advance a new run or a manually selected
  ordinal. Never catch up by skipping multiple semantic steps.
- Selection, camera gestures, and view toggles do not change trace/cursor state.
  Reduced motion keeps logical progression and snaps presentation as before.
- Leaving the document hidden pauses playback, with no automatic resume. Timer
  listeners and schedules are cleaned up on unmount.

## 9. Failure behaviour and verification

The learner extracts, selects H1 in the result card, seeks step 4, inspects H7 at
index 2 with counts 2/1, rewinds to 3, and restarts to the seven original items.
Then they replay with Play/Pause, change speed, seek during playback, and begin
another operation at a valid boundary. Repeat via keyboard and semantic mode.

Verify the exact fixture and edge cases with the existing native Node runner.
Use a controllable scheduling seam to prove cancelled/late ticks cannot move the
cursor; do not add a test framework or wait for real timer intervals in unit tests.
Browser verification covers actual timed progression, pause, speed changes,
completion, manual cancellation, result inspection, WebGL failure, and label
readability at 360/1280 pixels. Record device/browser and observed feedback latency.
Keep the existing insertion and broken-trace regression checks passing.

Run `npm test`, `npm run typecheck`, `npm run build`, the context guard, and Git
whitespace checks. Obtain a fresh whole-branch review before the feature PR.

## 10. Deferred

- **Graph BFS/DFS.** **Revisit when.** Extraction/playback pass acceptance;
  exercise the shared framework with different algorithm state.
- **Tutor, challenges, persistence.** **Revisit when.** The required lesson engines
  and run lifecycle work; complete them before declaring the release finished.
- **3D extraction-result object.** **Revisit when.** Learner feedback and
  required module delivery justify it.

## 11. The first slice

**Done when.** The extraction fixture, result inspection, automatic replay,
speed changes, pause/manual cancellation, and existing insertion checks pass
through the shared player. The learner can explain a smaller-child choice on a
fresh input, and a stale tick cannot change a replacement run.

## 12. Non-functional targets

Keep controls and labels usable at 360 and 1280 pixels, with 44 px native control
targets. Measure local feedback against the existing 100 ms p95 target on a named
device. Timers advance at most one semantic step per callback, including when the
browser delays execution. Do not claim physical-phone coverage without testing it.

## 13. Open questions and review gate

The written specification is accepted. The written implementation plan still
requires review before implementation; Native execution remains the selected
workflow. No unanswered scope question remains.

## Review record

On 7 October 2026, the draft was manually compared with the accepted extraction,
identity, comparison-count, and playback contracts. The seven-snapshot fixture
was hand checked. The Blueprint mechanical checker, repository context guard,
and Git whitespace check passed. This is a draft review record, not an independent
code review or a claim that extraction/autoplay have been implemented.
