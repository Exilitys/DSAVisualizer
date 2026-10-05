# DSA Atlas - technical specification

**Status.** Accepted 2026-10-05 by @Exilitys

**Reviewed.** Version 1 at commit d8b8f34e493d57b065cb071f4aaad43d57817f7b,
together with slice 001 and the architecture diagram. The owner instructed
"Continue" after the final review packet; this records that instruction.

**Version.** 1, 5 October 2026

**Owner.** Jonathan Carlo (@Exilitys)

**Source.** [Product requirements](../../prd.md) and [confirmed choices](intake.md).
PR #1 was merged into development by @Exilitys on 5 October 2026. That review
established the brief and selected architecture; this technical artifact is
presented separately for review.

**Authority.** This document defines the module interfaces and state rules.
The source PRD retains the feature catalog and FR01-FR17 acceptance requirements.
Implementation details below are draft proposals until this artifact is accepted.

**Diagram.** [Architecture and state flow](../architecture/system.md).

## 1. Problem

A learner reading heap code or watching traversal must reconstruct which object
moved, which comparison caused it, and what the auxiliary structure contains.
An animation alone can hide those facts. The playground exposes the selected
execution step through linked 3D, semantic, and pseudocode views.

**What they do instead today.** Read code, draw diagrams, or use an algorithm
visualizer. [VisuAlgo](https://visualgo.net/en) already offers interactive
algorithm input and quizzes. DSA Atlas must demonstrate a useful combination
of direct 3D interaction, synchronized representations, and explanations tied
to the learner's exact step. Learner validation will test that proposition.

## 2. Users

| Who | Current task | Observable change |
| --- | --- | --- |
| Students and self-directed developers learning DSA | Reconstruct execution from code and diagrams | Insert a value, inspect a comparison, follow its identity through both representations, and rewind. |
| Interview candidates practicing reasoning | Predict an algorithm's behavior on changed input | Answer an authored prediction on an unfamiliar input and inspect the deterministic answer. |
| Teachers and mentors | Explain one operation without losing the rest of the structure | Focus an entity and advance the same scene one semantic step at a time. |

The term DSA learner does not require university enrollment. English, guest
access, and browser-local progress come from the source PRD. Accounts and
institution administration are outside this release.

## 3. The core assumption

> Manipulating a structure, inspecting synchronized state, and explaining a
> fresh example helps learners reason about operations beyond memorizing code.

The [released AI + Education prompt](https://www.forgehacks.dev/#tracks) asks
for conceptual understanding, connections, and application. Heap tree/array
links teach a connection; graph/frontier links explain traversal; fresh
prediction tasks test application. The AI tutor explains a verified selected
step and offers an applicable example, with authored guidance alongside it.

**How we would know it is false.** In the source PRD's 5-8 learner pilot, fewer
than 80% complete a useful action within 60 seconds, or fewer than 70% explain
the targeted concept on a fresh input. Report counts and observed difficulties;
these small samples do not establish a causal learning benefit.

## 4. Scope

**In.** A min heap with insert/extract and paired tree/array views; an editable
undirected, unweighted graph with BFS and frame-based DFS; one shared player,
inspection and selection behavior, lesson/challenge controls, and tutor route.
Each module has one authored lesson and three prediction challenges. Essential
controls, semantic fallback, reduced motion, and AI failure recovery apply to
both modules. FR01-FR15 and FR17 are the release requirements.

**Adjacent, later.** Build-heap from arbitrary arrays, Dijkstra, presenter mode,
share links, comparison layouts, and additional curriculum.

**Not this product release.** Arbitrary code execution, AI-invented algorithms,
a visual lesson-authoring editor, accounts, multiplayer, VR, or a shared
database. A new lesson is a code module, not a new player implementation.

The release requires both modules. A heap-only result is incomplete. The solo
builder has 2-3 hours per day. The initial 14-21 hour estimate assumed all seven
days; from 5 October there are five full build dates before 10 October, or
roughly 10-15 hours at that rate, plus any available submission-day time.
The [Devpost deadline display](https://forgehacks-2026.devpost.com/) shows
10 October at noon EDT, equivalent to 23:00 Bangkok. The rules use EST; use the
earlier displayed time for planning while confirming the event cutoff.

## 5. Decisions

### D-001 - Both heap and graph journeys in the release

- **Chosen.** Complete heap and graph BFS/DFS journeys are required.
- **Rejected.** A required heap with graphs conditional on remaining time.
  That recommendation protected polish and verification time but did not meet
  the product owner's chosen scope.
- **Because.** The owner requires both structures; they also exercise reuse
  across paired representations and frontier-based traversal.
- **Revisit when.** The owner changes scope, or a required journey cannot be
  delivered before the event cutoff. Report the shortfall rather than silently
  redefining acceptance.
- **Provenance.** Chosen 2026-10-03 with @Exilitys; intake IN-04; included in
  PR #1 merged by @Exilitys on 2026-10-05.

### D-002 - Code-authored lessons sharing one framework

- **Chosen.** Lesson modules supply algorithm behavior and learning content;
  playback, selection, inspection, challenge UI, and tutor integration are shared.
- **Rejected.** A visual authoring editor without coding, which adds an editor
  and content format to the hackathon build.
- **Because.** The owner requested a reusable framework and selected code
  modules. The source PRD requires authored, validated algorithms.
- **Revisit when.** Educators need to author lessons themselves and the two
  required journeys are already verified.
- **Provenance.** Chosen 2026-10-03 with @Exilitys; intake IN-02 and IN-03.

### D-003 - Next.js application with an integrated tutor route

- **Chosen.** Next.js, React, TypeScript, and React Three Fiber; POST /api/tutor
  runs on the server inside the same application project.
- **Rejected.** A static React frontend plus a separately packaged serverless
  endpoint. It avoided Next.js server/client conventions but split endpoint
  packaging from the frontend.
- **Because.** The owner selected the integrated application after considering
  both approaches. Simulation stays pure TypeScript and runs independently of
  the React renderer.
- **Revisit when.** A deployment constraint requires a separate API service or
  the integrated runtime cannot satisfy tutor execution limits.
- **Provenance.** Chosen 2026-10-03 with @Exilitys; intake IN-07.

### D-004 - Shared visual primitives with lesson scene adapters

- **Chosen.** Each lesson has a scene adapter composed from shared value,
  node, link, container, label, camera, and picking primitives.
- **Rejected.** A universal renderer driven entirely by a new scene-data
  language. That approach required a broader rendering format before either
  required journey was complete.
- **Because.** Heap tree/array movement and graph/frontier movement differ,
  while their controls and identity-based selection must remain consistent.
- **Revisit when.** A third authored lesson reveals duplicated scene behavior
  that existing primitives cannot express.
- **Provenance.** Chosen 2026-10-03 with @Exilitys; intake IN-08.

### D-005 - Immutable snapshots for semantic replay

- **Chosen.** Store the complete logical snapshot for each semantic step.
- **Rejected.** Reconstruct previous state from an event log. It stores less
  data but adds restoration logic every lesson must satisfy.
- **Because.** The source limits of 15 heap items and 20 graph nodes/40 edges
  bound the data; previous/seek must restore exact state and counts.
- **Revisit when.** A larger module exceeds the trace memory budget measured
  on supported devices. Add checkpoints only after a measurement justifies them.
- **Provenance.** Chosen 2026-10-03 with @Exilitys; intake IN-09.

### D-006 - Ollama for development; production provider deferred

- **Chosen.** Test the server-side tutor with local Ollama. Preserve the
  provider-independent request/response contract for later deployment choices.
- **Rejected.** Finalizing a production provider and paid budget during this
  draft; the owner explicitly wants those options kept open in development.
- **Because.** The owner already tests with Ollama and wants provider choice
  separated from lesson behavior.
- **Revisit when.** A deployed AI endpoint is required; choose its reachable
  provider, model, limits, and spending cap before connecting it.
- **Provenance.** Chosen 2026-10-05 with @Exilitys: "For now in development
  keep options open, but i test with ollmaa"; intake IN-10.

### D-007 - New heap commands start at run boundaries

- **Chosen.** Finish or restart before starting another heap operation.
  Commands may start at ordinal 0 or the completed final snapshot.
- **Rejected.** New operations from intermediate repair states, which require
  branching and further repair behavior.
- **Because.** The selected rule keeps the next operation's starting heap
  valid and the lesson trace unambiguous.
- **Revisit when.** Learner testing demonstrates a need to interrupt repairs
  and there is time to specify and validate that interaction.
- **Provenance.** Chosen 2026-10-05 with @Exilitys: "Finish or restart first
  (Recommended)"; intake IN-11.

## 6. Data model

| Record | Shape and authority | Owner and lifetime |
| --- | --- | --- |
| LessonDefinition | Stable id/version, input and command validation, trace generation, inspection, pseudocode, objectives, challenges | Authored source, versioned with the application. |
| LessonInput | Heap items or graph nodes/edges with stable IDs and creation order | Guest's local scene; validate on entry and restoration. |
| RestingSnapshot | Engine-built initial snapshot of the validated input, without an active command | Browser entry/edit state before the first run; all views read it. |
| Run | Unique runId, lesson version, original input, command, immutable ordered steps | Active browser session; a logical edit creates a new run. |
| Snapshot | Deterministic local id, ordinal, logical state, event, variables, counters, invariant annotations | Generated by the engine; read-only for every consumer. |
| SceneLayout | Entity positions, camera and view preset | Browser view state; never part of algorithm ordering. |
| LearningEvidence | Objective/challenge version, attempt, outcome, timestamp | Browser-local progress; resettable by the learner. |
| TutorExchange | RequestId, runId, snapshotId, selected IDs, status and validated response | Request/session lifetime; raw questions are not persisted or collected as analytics by default. |

Heap items are `{ id, value }`; their array position is derived, not their
identity. Values are integers 0-99; size is at most 15. Duplicates are valid.
Tree and array representations use the same item IDs. Rendering keys may also
include a view ID; a selected logical ID highlights every representation.
The input preserves a next-item counter so deletion does not recycle an ID.
Extraction stores the removed minimum as a result entity. Root replacement
and last-slot removal form one atomic transition, preserving the moved item's
ID without duplicating it in the array. The result entity remains inspectable
with no active heap index; sift-down comparisons and swaps are separate steps.
Extracting from an empty heap completes with no minimum and no invented
entity; extracting its only item leaves an empty heap and that item as result.

Graph nodes have `{ id, creationOrder }`; undirected edges have `{ id, a, b }`.
Node creation order determines neighbor order, including after repositioning
or disconnect/reconnect. Reject duplicate edges, self-loops, missing endpoints,
more than 20 nodes, and more than 40 edges. Deleting a node removes incident
edges. BFS stores its FIFO queue, discovered/processed IDs, predecessors, and
discovery order. DFS stores frames `{ nodeId, nextNeighborIndex }`, discovered
IDs, backtracking, and discovery order. Both traverse the start's reachable
component; disconnected nodes remain unvisited.
Input stores the next node/edge creation counters; deleted IDs are not recycled
within the scene. Learning evidence is graded against authored deterministic
answers, rather than an AI correctness judgment.

Run IDs are correlation identifiers and can differ between executions.
Snapshot local IDs and algorithm data are deterministic for identical input,
command, lesson version, and seed. Wall-clock timestamps and camera positions
are excluded from that equality.

## 7. Interfaces and seams

The proposed interface below is the complete engine surface used by the player
and server. It contains no React, Three.js, renderer resources, or network calls.
JSON state contains finite numbers and is validated at input boundaries.

```typescript
type EntityId = string;
type DeepReadonly<T> =
  T extends string | number | boolean | null ? T :
  T extends readonly (infer U)[] ? readonly DeepReadonly<U>[] :
  { readonly [K in keyof T]: DeepReadonly<T[K]> };
type Validation<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; field?: string };

type Snapshot<S> = DeepReadonly<{
  id: string;
  ordinal: number;
  state: S;
  event: {
    type: string;
    affectedIds: readonly EntityId[];
    operands: readonly (string | number)[];
    codeLineId: string | null;
    explanationKey: string;
  };
  variables: Readonly<Record<string, string | number | boolean | null>>;
  counters: Readonly<Record<string, number>>;
  invariants: readonly { id: string; status: "holds" | "repairing" }[];
}>;

type LessonEngine<I, C, S> = {
  id: string;
  version: string;
  commandStart: "run-boundary" | "any-step";
  validateInput(raw: unknown): Validation<I>;
  validateCommand(raw: unknown, input: I): Validation<C>;
  createInitialSnapshot(input: I): Snapshot<S>;
  createTrace(input: I, command: C): readonly Snapshot<S>[];
  inspect(snapshot: Snapshot<S>, id: EntityId): Inspection | null;
};

type Inspection = {
  id: EntityId;
  label: string;
  fields: readonly { label: string; value: string }[];
};

type SceneAdapterProps<S> = {
  snapshot: Snapshot<S>;
  selectedIds: readonly EntityId[];
  select(id: EntityId): void;
  reducedMotion: boolean;
};
```

Browser lesson registration associates an engine with its React scene adapter
and authored content. The server imports the pure engine registry only.
Registrations are ordinary code for heap and graph; no dynamic plugin loader,
factory hierarchy, or arbitrary algorithm execution is required.

Before a command starts, the engine's initial snapshot feeds every view and
trace controls are disabled. A valid operation creates a run and selects its
first action step. Trace ordinal 0 contains the same logical input as the
resting snapshot, with any command-specific initial variables. This avoids
inventing an operation just to display an empty heap or graph.

**Trace contract.** Ordinal 0 is the original state with an initial event.
Every comparison is a step even when data does not change. The final step is
complete and satisfies completed-operation invariants. A draft guard limits
each trace to 512 snapshots; exceeding it is an engine error, never silent
truncation. Array lengths and entity IDs must validate in every snapshot.
Nested state is immutable too: allocation must not alias a later mutable
working state. Use development freezes and a replay check to catch mutation.

**Player contract.** There is one selected ordinal. Next/previous/seek select
an existing snapshot; restart selects ordinal 0. Logical state, variables,
counters, pseudocode and authored explanation all read that snapshot. Motion
interpolates presentation only. Seek cancels interpolation and snaps to the
selected state; pause settles the active transition at its selected boundary.
Speed, camera movement, and selection cannot change a trace. Play at complete
does not implicitly create another run.

**Editing contract.** Logical input changes cancel playback and create a new
run, with confirmation before discarding a meaningful lesson's future. Camera
and graph position edits only change layout. The heap engine declares
`commandStart: "run-boundary"`: the shared player enables a new command only
at ordinal 0 or the final complete step. Restart selects the original valid
heap and permits a different command; completion supplies the final valid
heap as the next input. In-between command controls explain "Finish or restart
first", even if an intermediate snapshot happens to satisfy heap ordering.
Graph input edits use `commandStart: "any-step"` and reset traversal state.
If the selected traversal command remains valid, create a new run. Otherwise
show the validated resting snapshot and require a new start node, including
after deleting the start node or every node. The server applies the same policy
before returning executable command proposals.

**Algorithm conventions.** Insert swaps only when strictly smaller than its
parent. Extract prefers the left child when equal. Heap comparisons count
numeric value comparisons, not bounds checks. BFS marks discovery immediately
before enqueue; discovery/enqueue are inspectable in order and each node enters
the queue once. DFS uses frames, not a bulk-push approximation of recursive DFS.

**Tutor route.** The following fields permit server reconstruction of the
requested step using the same bounded engine. Request IDs are correlation
fields, not authority for algorithm correctness.

```typescript
type TutorRequest = {
  requestId: string;
  runId: string;
  lessonId: "heap" | "graph";
  lessonVersion: string;
  input: unknown;
  command: unknown;
  ordinal: number;
  snapshotId: string;
  selectedIds: readonly string[];
  question: string;
  mode: "explain" | "hint";
  objectiveId?: string;
};

type TutorReply = {
  requestId: string;
  runId: string;
  snapshotId: string;
  explanation: string;
  referencedIds: readonly string[];
  proposedCommands: readonly unknown[];
  followUp?: string;
};
```

POST /api/tutor validates the lesson version, input, command, ordinal, and
selected IDs, reconstructs the snapshot, and supplies only current visible
state and authored concept guidance to the provider. It validates returned IDs
and proposed commands against that state. A proposal is previewed and applied
only when the learner selects Apply. A response cannot mutate the run.
The client accepts a response only while its requestId/runId/snapshotId still
match the active exchange. A change of run, ordinal, selection, learning mode,
or challenge cancels the exchange and invalidates its request ID; camera-only
movement does not. Hints do not receive future trace snapshots or a
challenge's hidden answer. Evaluate free-text hints for answer leakage.

Draft route limits for review: 32 KiB request body, 2,000 characters per
question, 3,000 characters per explanation, and at most 3 proposed commands.
Local development allows one provider request at a time and proposes 6 tutor
requests per minute per guest, with a bounded process-local limiter. Deployment
must use limits that remain effective in its actual runtime; a process-local
counter is not a global limit across serverless instances. No streaming protocol
is required. Review these proposed numerical guards with this artifact.

**Ollama development integration.** The Next.js Node server calls
`POST http://127.0.0.1:11434/api/chat` using built-in fetch, a configured local
model, `stream: false`, and a JSON schema in `format`. Parse `message.content`
as JSON and apply the route's schema, entity, and command validation afterward.
The provider function returns lesson-neutral tutor content; the route adds its
own request/run/snapshot correlation fields. Start with a 512 generated-token
cap, measure the chosen model, and retain the 15-second timeout behavior.
`OLLAMA_BASE_URL` and `OLLAMA_MODEL` are server configuration, never request
fields supplied by the browser. The configured URL defaults to loopback; the
model must name an installed chat-capable model. No model download is part of
this specification or first slice. The official [chat API](https://docs.ollama.com/api/chat)
and [structured-output guide](https://docs.ollama.com/capabilities/structured-outputs)
support this integration. Schema-shaped output still requires semantic checking.

A deployed Next.js server cannot reach the developer's local Ollama through
its own loopback address. Production provider/model/access remain an explicit
deployment deferral under D-006, rather than an assumption about that connection.

## 8. Failure behaviour

| Failure | Behavior | Learner-visible result |
| --- | --- | --- |
| Invalid input/command | Reject before starting a new run; preserve the valid scene | Error beside the operation control. |
| Invalid trace or excessive trace length | Retain the previous valid run; surface an engine error | Retry/restart a preset; no partly accepted trace. |
| Provider unavailable or timeout | Cancel at 15 seconds; keep playback and authored guidance available | Failure status and explicit retry. |
| Missing or unconfigured provider | Keep authored guidance; report unavailable AI | No fabricated model response. |
| Stale/cancelled response | Discard its state effects and proposals | Current run remains selected. |
| Invalid referenced ID/command | Reject the response or unsafe proposal | Authored explanation and retry remain available. |
| Rate limit | Return 429 with retry guidance; no automatic retry loop | Clear request status. |
| Malformed or old browser storage | Validate/version restored data; recover to an authored preset | Entry remains usable; describe the reset. |
| WebGL unsupported/context lost | Switch to semantic/2D operation and trace controls | The same operation remains usable outside the canvas. |

The route uses 400 for invalid input/state, 429 for limits, 503 for unavailable
provider, and 504 for timeout, with a typed error code and request correlation.
Provider credentials exist only in server configuration. Server logs exclude
credentials and raw learner questions. Resources and listeners are disposed
when a scene adapter unmounts.

## 9. Non-functional targets

| Target | Threshold | Verification |
| --- | --- | --- |
| Local action feedback | p95 within 100 ms at supported scene sizes | Event-to-first-visible-response measurements. |
| Rendering | Aim for 60 fps laptop and 30 fps phone | Named device/browser runs at heap 15 and graph 20/40. |
| Cold entry | First usable preset within 3 seconds | Documented device and network profile; lazy-load the other lesson. |
| Responsive controls | Usable at 360 px and 1280 px widths | Portrait/landscape, browser zoom, and open panels. |
| Touch targets | Approximately 44 px effective size | Inspect controls and test touch operations. |
| Tutor waiting | Cancellation after 15 seconds | Timeout, abort, failure, and late-response checks. |
| Accessibility | Keyboard operation, readable focus, AA text contrast, reduced motion | Run the core journeys without pointer input and without animation. |

These are source-PRD targets, not measured results. Record actual devices,
browser versions, inputs, and timings before reporting success. Reduce idle
frame work, drawing-buffer resolution, shadows and effects while preserving
labels and operation controls; compatible dependency versions are pinned at build.

## 10. Risks

| Risk | Early signal | Response |
| --- | --- | --- |
| Both required modules exceed remaining effort | Heap slice cannot pass its acceptance journey | Report the schedule shortfall; remove optional work and seek an explicit scope decision if required. |
| Identity differs between views | Selecting a moving item highlights a different array item | Derive both views from item ID and the same snapshot. |
| UI changes logical execution | Camera/speed changes alter trace equality | Keep layout and animation outside the engine. |
| Tutor contradicts state or reveals a challenge answer | A critical contradiction in the 20-question evaluation | Block release of that behavior; fix grounding and fall back to authored hints. |
| Reuse becomes a speculative framework | Lesson authors must learn a rendering language or bypass the player | Keep two code registrations, shared primitives, and the reviewed engine surface. |

## 11. Deferred

- **Dijkstra and other algorithms.** Revisit when both P0 journeys pass release
  verification and submission material is complete.
- **Visual lesson editor.** Revisit when educators request authoring without
  code and authored module interfaces have proven sufficient.
- **Accounts/shared database.** Revisit when browser-local continuity fails a
  stated cross-device or collaboration requirement.
- **Share links and presenter mode.** Revisit when required journeys are
  verified and a teaching session establishes a need.
- **Deployment host.** Revisit when the accepted Next.js build is ready to
  deploy; confirm an existing account and runtime fit before provisioning.
- **Production AI provider, model and spend.** Revisit when a deployed tutor is
  required; the owner left these options open and selected Ollama for development.
- **Local Ollama model tag.** Revisit when live tutor integration starts; select
  an installed chat-capable model and evaluate schema behavior and timeout.
- **Exact dependency patches.** Revisit when implementation creates the lockfile;
  use supported React/R3F major pairs and verify the installed build.
- **Named benchmark devices.** Revisit when the first runnable slice is ready;
  record available hardware and network conditions rather than inventing them.

## 12. The first slice

Heap insertion through the shared lesson engine, player, and paired 3D/semantic
views. [Slice 001](../specs/001-heap-insertion.md) specifies its observable finish.

**It proves.** A learner can manipulate one structure and follow the same
identity through exact selected snapshots and synchronized representations.
**Done when.** Insert 1 into the authored seven-item heap, inspect each compare
and swap, select the same item in both views, rewind, and restore its prior
identity/index/counts; keyboard and reduced-motion paths also work.
This slice is not the complete submission; extraction, graph traversal,
live tutor use, and the full challenge set remain required release work.

## 13. Open questions

No clarification remains unanswered for this development design. The owner
explicitly deferred production AI selection in D-006; its trigger is recorded
above. The written interface, guards, and diagram were accepted through the
owner's instruction to continue after the final review packet.

## 14. Review log

| Round | Date | Reviewer | Outcome | Artifact |
| --- | --- | --- | --- | --- |
| Brief | 2026-10-05 | @Exilitys | PR #1 merged into development | Source PRD and intake through IN-09; merge 2bd9281. |
| Technical 1 | 2026-10-05 | @Exilitys | Accepted through "Continue" after the review packet | Version 1 at d8b8f34, slice 001, and the reviewed architecture artifact. |
| Consistency | 2026-10-05 | Codex, drafting agent | Clarifications resolved; self-review fixes applied | Deep immutability, resting state, unique extraction identities, command boundaries, and tutor context invalidation. |
