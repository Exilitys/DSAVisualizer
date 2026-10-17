# Slice 004: guided lessons, predictions and local continuity

**Status.** Accepted 2026-10-16 by @Exilitys.
**Reviewed.** Version 1 at `0ff8f4ab951d86d50b34be9601222d9e1bbd90e0`, including
the flow diagram bound in the design-check receipt. The owner selected
"Accept specification and diagram"; the written build plan still requires review.
**Owner.** Jonathan Carlo (@Exilitys).
**Version.** 1.
**Source.** [Product requirements](../../prd.md), FR09/FR11/FR13/FR17;
[technical contracts](../prd/prd.md), D-002 and learning evidence.
**Baseline.** Graph head `6e211a65198b377c79814a8a211bf7b02aa48125`.
[PR #8](https://github.com/Exilitys/DSAVisualizer/pull/8) is awaiting owner review;
this slice lives on `feature/learning-challenges` and depends on that work.
**Diagram.** [Proposed challenge flow](../diagrams/learning-challenges.html), with
[editable source](../diagrams/learning-challenges.workflow.json). The accepted
[engine/player/view architecture](../architecture/system.md) remains the foundation.
**Design checks.** [Builder check, fixture probes and diagram evidence](../reviews/004-learning-design.md).

## 1. Problem

Both visualizers explain individual events, but learners cannot follow a short
lesson, submit a prediction before seeing its answer, or keep practice outcomes
between visits. Watching a trace currently leaves no evidence of understanding.

## 2. Users

Guest learners use the same heap and graph scenes for exploration, an authored
walkthrough, and a fresh prediction. A developer adds content in a code module
without rebuilding playback, grading controls or storage.

## 3. The core assumption

Asking for a prediction before revealing a deterministic next event helps a
learner explain the algorithm on a different input. One correct response is
evidence for that objective only. Watching, revealing, or finishing a walkthrough
does not demonstrate mastery. The release still needs the PRD's target-learner
pilot; passing software tests cannot establish a learning benefit.

## 4. Scope

Already settled: both modules ship; one short lesson and three challenges per
module; code-authored content; shared controls and scene adapters; immutable
snapshots; local, resettable progress; deterministic grading; free exploration
remains available. Tutor development will use Ollama with provider choice open.

This slice supplies Explore/Explain/Challenge controls, two short guide
segments per module, all six prediction challenges, a shared playback gate,
recent local evidence, saved settings and one explicitly saved input per module.
Its acceptance amends the player seek/input-replacement integration for these
activities; existing Explore behavior and engine semantics remain required.

The tutor endpoint, authored Browse relationships and release-wide learner/device
evaluation remain required later work. No dependency, account, server storage,
visual content editor, random question generator or adaptive diagnosis is needed.

## 5. Decisions

The owner chose D-401 and D-402 on 2026-10-16 through the two asynchronous
question responses, then accepted the complete version-1 specification and
diagram through the explicit review-packet response recorded above.

### D-401: one answer closes a prediction attempt

- **Chosen.** One valid submission gives immediate authored feedback
  and unlocks the trace. Reveal without answering unlocks it without graded
  evidence. Retry creates a fresh attempt on the same authored fixture.
- **Rejected.** Repeated guesses against the same hidden answer before feedback.
- **Because.** It preserves an interpretable first response and keeps attempts
  distinct from practice after an answer has been shown.
- **Revisit when.** The owner chooses multi-guess practice or learner observation
  shows a need for a separate practice policy.
- **Provenance.** Decided 2026-10-16 with @Exilitys through the explicit response
  "One answer, then feedback and reveal".

### D-402: one guide with two segments for each module

- **Chosen.** Heap insertion/extraction and graph BFS/DFS, each with
  authored pauses. A module's guide finishes after both segments are acknowledged.
- **Rejected.** One operation per guide, or a separate lesson system for each engine.
- **Because.** It covers both supported operations through the existing player.
- **Revisit when.** The owner chooses a shorter guide or pilot completion takes
  more than five minutes per module excluding idle time.
- **Provenance.** Decided 2026-10-16 with @Exilitys through the explicit response
  "Two guided segments per module".

### D-403: content plus a shared learning controller

- **Chosen.** Module files supply versioned objectives, seeds, guide checkpoints,
  question options and literal answer keys. A shared controller and panel own
  activity lifecycle, gate, grading and evidence for both modules.
- **Rejected.** Engine-owned grading, duplicated heap/graph learning UIs, or a
  universal scene format.
- **Because.** The two existing engines already produce every required state;
  learning policy can hide its complexity behind one shared integration.
- **Revisit when.** A third real module needs content or grading the interface
  cannot express; do not generalize for hypothetical algorithms.
- **Provenance.** Decided 2026-10-16 with @Exilitys through version-1 packet
  acceptance, implementing settled D-002/D-004.

### D-404: bounded local continuity with explicit input loading

- **Chosen.** Browser-local settings, the latest 100 submitted challenge attempts
  across modules, guide completion receipts, and one saved logical input per
  module. Loading an input is explicit and starts at rest, without restoring a run.
- **Rejected.** Automatic restoration of an unfinished heap, unlimited attempt
  history, or cloud synchronization.
- **Because.** This satisfies local continuity while retaining the existing route
  reset and heap finish/restart rules. Storage remains bounded and resettable.
- **Revisit when.** Learners need history beyond 100 attempts, multiple saved
  inputs, cross-device access or session resumption.
- **Provenance.** Decided 2026-10-16 with @Exilitys through version-1 packet
  acceptance, implementing FR13/P0 persistence.

## 6. Activity lifecycle and scene ownership

Explore, Explain and Challenge are learning layers over the mounted scene.
Switching layers pauses playback and preserves the logical input, current
snapshot, selection, positions and camera. Explain adds authored guidance;
Challenge presents its three activities. Selecting a layer alone never seeds a run.

Starting a guide segment or challenge is a separate, labelled action that replaces
the current run with that activity's seed. The old run is not retained for return.
Validate all content, seed, command, trace and checkpoints before committing either
the new player state or learning state. Failure preserves the previous scene and
selection; playback stays paused. This transaction must not publish a seed before
discovering a bad command or checkpoint.

The accepted heap boundary applies even if an intermediate snapshot is ordered.
At an unfinished operation, activity start/load/retry requires Finish or Restart
to ordinal 0 first. There is no bypass through a seed replacement. Graph activity
replacement during a run uses its existing Apply/Keep confirmation; cancelling
retains that run and any learning gate, paused.

During an activity, logical edit/operation controls require returning to Explore.
Inspection, layout, Fit/Focus, speed, semantic view and camera remain usable.
Leaving an unanswered challenge abandons its attempt and unlocks the current
trace with no grade; returning to Challenge does not re-arm that attempt.
Leaving a guide abandons its uncompleted segment. Completed segment receipts in
the current guide session remain; starting a different guide version clears them.

Seed replacement clears selection. Heap retains its camera; graph uses the
authored layout for that seed and retains the mounted camera, with Fit available.
Route navigation/refresh resets transient scene/activity as in slice 003; saved
settings, receipts and inputs are independent of that reset.

## 7. Guides and the shared playback gate

Each module has one version-1 guide. Each segment has its own validated seed and
command, an initial annotation at ordinal 0, two teaching checkpoints and a final
checkpoint. Segments start explicitly, paused at 0. They may be completed in
either order. Each heap segment uses the original authored preset independently;
the extraction segment does not silently inherit the insertion result.

| Segment | Seed/command | Teaching checkpoints | Final |
| --- | --- | --- | --- |
| Heap insert | Existing `[3,7,5,12,9,8,6]`, insert 1 | 1: complete shape/parent index; 3: stable identity through a swap | 8: heap order does not mean sorted order |
| Heap extract | Same original heap, extract minimum | 1: removed result/replacement; 4: smaller child swaps upward | 6 |
| Graph BFS | Existing A–F preset, start A | 5: discovery before enqueue; 9: FIFO queue B,C | 31 |
| Graph DFS | Same A–F preset, start A | 13: active frames; 16: C returns to D | 26 |

The next unacknowledged checkpoint is the maximum visible ordinal. Continue
is enabled only at that checkpoint. It acknowledges it and opens the next range, without starting
autoplay. Before the final checkpoint, it advances one semantic step, paused.
At the final checkpoint, Finish segment records completion for that segment.
Both segments must finish in this session before a guide completion receipt is
stored. A partial guide is deliberately not resumed after navigation or refresh.

For challenges, the maximum visible ordinal is the prediction checkpoint until
the learner submits or reveals. Starting a challenge opens paused at that ordinal;
previous snapshots remain inspectable. The selected answer may be submitted only
at the checkpoint; rewinding keeps the question pending and offers Return to question.

One guard controls manual Next, range seek, keyboard actions and autoplay. Requests
past the ceiling clamp there and stop playback. Existing timer generation/run
checks still reject old callbacks after a new attempt, seed, mode or reset. Restart
rewinds this run without opening the gate or creating another attempt. Replaying
a revealed/graded trace never grades it again. Gate state never changes a snapshot.
The timeline shows the accessible range and says when later steps are locked.

## 8. Six authored predictions and their oracles

Every question has three labelled radio options with one correct stable option
ID. Submit requires a choice. Correct and incorrect outcomes both show the
authored reason and correct choice. Submission/reveal unlocks the trace, advances
exactly one semantic step to checkpoint + 1, and stays paused. Reveal shows
the same explanation labelled ungraded. No AI call or arbitrary free-text grading.
Retry clears the choice/feedback and uses a new attempt token; it does not remove
earlier evidence. Feedback explains only its stated objective.

Heap fixtures assign H1..Hn in array order and nextId n+1. Graph fixture nodes
A..E have creationOrder 1..5, edges E1..E5 in this exact order: A–B, A–C, B–D,
D–C, C–E; nextNodeId and nextEdgeId are 6. Graph challenges start at A. These
inputs differ from the guides' presets. Option wording may be polished without
changing the literal oracle; changing the seed, checkpoint, meaning or key bumps
the affected content version and reruns its fixture checks.

| ID / objective | Seed/command; paused ordinal | Prediction and literal answer | Next-state oracle |
| --- | --- | --- | --- |
| heap-swap / heap.index-mapping | `[4,9,7,15,12]`, insert 3; 2 | Where does H6 move in the next swap? **Index 2, exchanging with H3; IDs travel with their values**; distractors index 1/H2 and index 0/H1. | 3 is swap; H6 at index 2, H3 at index 5, swaps 1. |
| heap-tie / heap.sift-down | `[2,6,6,10,9,8,11]`, extract; 1 | Which child is chosen next? **H2, left child, value 6**; distractors H3/right child and H7/replacement. | 2 is heap.extract.choose-child; chosenChildId H2. |
| heap-order / heap.order-vs-sorted | `[4,9,7,15,12]`, insert 3; 5 | What does the next completion guarantee? **Valid min heap `[3,9,4,15,12,7]`, without fully sorting it**; distractors full sorted output `[3,4,7,9,12,15]` and an invalid heap because 9 precedes 4. | 6 is complete; exact values `[3,9,4,15,12,7]`, every parent no greater than its children, array not sorted. |
| graph-enqueue / graph.discovery-frontier | Fixture graph, BFS; 8 | What happens next? **Enqueue C behind B; C is discovered and not processed**; distractors process C and dequeue B immediately. | 9 queue `[B,C]`; C absent from processed. |
| graph-return / graph.frame-return | Fixture graph, DFS; 20 | After exhausted C returns, which frame resumes? **D at nextNeighborIndex 2**; distractors A at 1 and B at 2. | 21 return C→D; top frame D(2); C processed. |
| graph-depth / graph.distance-vs-depth | Fixture graph, DFS; 11 | At C's next discovery, what do its distances mean? **DFS tree depth 3; shortest A→C distance 1**; distractors both 3 and both 1. | 12 discovers C at depth 3; independent BFS finishes with C distance 1. |

Draft feasibility check on 2026-10-16: assertions against the existing engines
confirmed all six literal oracles and the guide event ordinals. These are design
checks; implementation regression tests and learner evidence are still required.

## 9. Content, attempts and integration seam

Content records contain module/content ID, positive integer content version,
engine version, objective IDs, input/command, checkpoint ordinals, expected event
types/explanation keys and annotations.
Challenges also contain prompt, three unique option IDs, correct option ID and
feedback. Guides contain the two segments and their checkpoint annotations.
Content validation rejects duplicate IDs, invalid versions, missing options/keys,
out-of-range or unordered checkpoints, and incompatible engine versions. An
engine error or a checkpoint event mismatch disables that activity with an error;
Explore stays available. Oracle tests catch content drift before release.

A transient attempt owns a fresh attemptId, content identity/version, exact run
reference, checkpoint and status: pending, graded or revealed/abandoned. Grading
requires the same pending attempt and run, an authored option ID, and the player
at its checkpoint. Double click, stale callbacks and rewind cannot grade twice.
Create the attempt token outside deterministic engine state. Raw future snapshots
and answer keys must not enter pre-submission learner-facing annotations or DOM.
This client-side teaching gate does not claim to hide code from browser developer tools.

Keep the engine/Snapshot interfaces unchanged. Put learning data beside each
module's current content, with shared lifecycle/grading/gate logic and one shared
panel. Reuse useLessonPlayer, PlaybackControls, existing scene primitives and
native controls. The smallest coherent hook/player extension must validate a
prepared activity atomically and apply one ceiling to every advance path. Do not
make a second timer, duplicate engine states in the learning store, or pass
heap/graph conditionals into the generic playback controller.

Expected change reach: both playground callers and module content files; shared
learning logic/panel; player/hook/controls advance paths; a local storage boundary;
new focused learning/persistence tests and the manifest's explicit test list;
app styles for shared controls; verification/backlog/development context. Changes
to current contract paths require this spec's acceptance first. The build plan
will name the final file boundaries after acceptance.

## 10. Local continuity and reset

Use separate version-1, app-owned browser storage records for settings, evidence
and saved inputs. Read only on the client after mount; defaults must render
without a hydration mismatch. Apply restored settings before accepting an initial
write, so defaults cannot overwrite saved data during mount or StrictMode replay.

- Settings: global playback speed from 0.5/1/2 and the explicit semantic-view
  preference. Reduced motion continues to follow the OS preference and is not
  overridden by a stored value. Autoplay never restores as playing.
- Evidence: at most 100 graded attempts in submission order, each with attemptId,
  module, challenge ID/version, objective ID, selected option ID, correct/incorrect
  outcome and timestamp. Keep only the latest guide ID/version/completedAt per
  module separately. A guide
  completion is labelled completed, never a scored attempt or mastery.
- Inputs: one slot per module containing input schema version, engine version
  and a normalized logical input. Save current input is available in Explore on
  a validated state and at the heap boundary. Load saved input requires the same
  replacement guards as activity start, clears transient activity/selection, and
  creates a resting scene; no snapshot, command, camera or playback is restored.

Record at most one evidence item per attemptId; retain new evidence in memory
before attempting storage. Evict oldest submissions above 100 and label the UI
Recent practice (latest 100 attempts), without an all-time accuracy claim. Show
current-content correct/incorrect counts and latest outcome per challenge; old
content versions do not count toward current results. Reveal/abandon/guide viewing
creates no graded attempt. Store no chat, raw learner questions or analytics.

Validate record type, schema version, bounded strings/arrays, finite nonnegative
timestamps, allowed outcomes/speeds and unique attempt IDs. Reject a record over
65,536 characters before parsing. Revalidate saved inputs with their actual
engine and current limits. Invalid/old records fall back independently to defaults
with a visible recovery notice; valid records in other keys remain intact. Do not
write over an unreadable or unknown-schema record automatically: keep that record's
updates in memory until the learner explicitly resets saved data. No migration is
required for this first schema. A storage read/write exception also falls back to
session memory and a notice; it must never undo a grade or break scene entry.

Reset saved data uses an explicit confirmation. Cancel changes nothing. Confirm
removes only this app's owned keys, clears in-memory receipts/inputs/attempts and
settings, invalidates any pending attempt/timer, and returns the current module to
its authored resting preset in Explore. A failed removal keeps the session usable
and reports that reload may restore old data; it must not claim a durable reset.

Storage is guest convenience, not an authoritative gradebook. Concurrent tabs may
overwrite local history; this slice promises reload continuity for one active tab,
not cross-tab merging or tamper-proof evidence.

## 11. Failure behaviour

| Failure | Required result |
| --- | --- |
| Bad seed, trace, answer key or checkpoint | Activity fails before scene replacement; retain valid run and selection, paused. |
| Attempt mismatch, duplicate submission or unknown option | Reject without evidence or unlocking a different activity. |
| Delayed autoplay after a gate/seed/mode/reset change | No movement beyond the current ceiling; stale work has no effect. |
| Unfinished heap / cancelled graph confirmation | Preserve the existing boundary/Apply-Keep behavior; do not discard that run. |
| Missing, malformed, old or blocked browser storage | Defaults or session memory plus notice; authored preset and Explore stay usable. |
| WebGL unavailable / reduced motion / narrow viewport | Same questions, feedback, inspection and playback in the existing semantic view. |

## 12. Non-functional targets and verification

No provider/network request is needed to complete either guide or six challenges.
All learning controls must work at 360 px and 1280 px, by keyboard and in the
semantic fallback. Use existing design tokens, visible focus, labelled radios,
44 px effective targets and a polite live region for grade/storage status. Move
focus to the prompt on activity start and to feedback on submission/reveal.

Target one local action's first visible response within 100 ms at p95; measure
representative module/gate interactions and report device and sample count. Do
not claim target-device frame rate, cold-entry timing or learning benefit from
logic tests or desktop emulation.

Verify fixture oracles independently, correct/incorrect/reveal/retry/double-submit,
mode exit and restart, all advance paths at gates, timer cancellation, failed
activity rollback, storage validation/quota/unknown-version recovery, idempotent
restore, explicit input loading and reset failure. Exercise the full guide and
challenge journey on both routes, including heap boundary and graph cancellation.
Run all existing application checks, context guard and diff whitespace checks;
have a fresh reviewer inspect the whole branch after Native implementation.

## 13. The first slice

The first build milestone proves the shared gate with one heap prediction and
one graph prediction, then applies that same seam to the remaining content and
guides. This is an implementation sequence within one substantial feature PR.

**Done when.** Both guides finish; all six authored challenges grade deterministically
without early revelation through playback; retry/rewind cannot duplicate evidence;
settings, graded outcomes and explicitly saved inputs survive reload; malformed
storage remains recoverable; semantic and keyboard journeys work on both routes;
required checks and fresh review pass with measured evidence recorded.

Keep one learning feature PR to development after implementation and review.
Do not add this scope to graph PR #8 or merge either PR without owner instruction.
The written build plan follows acceptance of this spec and diagram, using the
owner's standing Native execution choice.

## 14. Open questions

None. The owner answered both pedagogy questions and accepted the complete
packet on 2026-10-16. No additional provider, deployment or budget choice blocks it.

## 15. Deferred

- Tutor context/hints and Ollama adapter: required next release work; revisit when
  this learning lifecycle is accepted and implemented, so hints use the active gate.
- Authored Browse relationships: required release work; revisit when learning
  content is available to link to, before release verification.
- More than 100 attempts, multiple saved inputs and cross-tab merging: revisit when
  observed learner use exceeds the bounded single-tab continuity requirement.
- Adaptive prerequisite suggestions: revisit when repeated, versioned attempts
  support an explanation; never infer a misconception from one error.
- Run/camera restoration and content authoring UI: revisit when the owner explicitly
  expands the release scope; current routes deliberately reset transient sessions.
