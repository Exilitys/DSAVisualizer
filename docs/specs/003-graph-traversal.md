# Slice 003: editable graph, BFS and frame-based DFS

**Status.** Draft for owner review, 2026-10-13. Not accepted for implementation.
**Owner.** Jonathan Carlo (@Exilitys).
**Version.** 1.
**Source.** [Accepted technical contracts](../prd/prd.md), sections 6–7;
[product graph requirements](../../prd.md#6-graph-module-specification).
**Baseline.** PR #7 merged into development at `3b3fe653291302f47baf4c6345ef41a676f75188`.
**Diagram.** The accepted [architecture](../architecture/system.md) still owns
engine/player/view boundaries. Its artifact and evidence remain unchanged.

## 1. Problem

The heap framework works, but a learner cannot yet edit a graph or compare how
a queue and a frame stack change exploration order.

## 2. Users

Students and self-directed developers should see frontier changes, inspect a
chosen identity, and explain a different BFS/DFS path.

## 3. The core assumption

The working assumption is that reversible discovery, frontier and return steps
help a learner distinguish discovery from processing and explain the ordering.
It remains an assumption until a target learner explains a fresh example.

## 4. Scope

Already accepted: both traversals are required; undirected/unweighted graphs;
20 nodes/40 edges; creation-order neighbors; immutable snapshots; reachable
component only; separate graph layout; input edits invalidate the old future.
The concrete shapes, event boundaries and editor below are proposals implementing
those requirements. This document does not record its own acceptance.

**In this slice:** graph editing, node positioning, BFS and DFS, selection and
inspection, linked graph/adjacency/frontier views, authored explanations and
pseudocode, shared playback, keyboard/reduced-motion/semantic fallback, and
navigation between heap and graph.

**Required later:** guided lesson/challenge grading and evidence, tutor integration,
the authored Browse relationships, and full release verification. Each module
still needs its required lessons and three challenges. Dijkstra, arbitrary lesson
authoring and a universal scene-description language remain outside this slice.

## 5. Decisions proposed for review

In these draft records, Chosen means the proposed choice and Rejected names the
proposed alternatives. Neither field records an owner decision until acceptance.

### D-301: explicit graph editing controls

- **Chosen.** Proposed: native controls add/delete nodes, connect/disconnect edges,
  choose traversal/start, and set the selected node's X/Y coordinates. Canvas
  dragging continues to orbit the camera; clicking nodes/edges selects them.
- **Rejected.** Proposed alternative: direct drag-to-move and two-node connection gestures in a
  separate edit mode, with keyboard equivalents.
- **Because.** Compact controls reuse the current accessible interaction pattern
  and keep editing distinct from camera navigation without a new gesture system.
- **Revisit when.** The owner prefers direct manipulation or learner feedback
  shows coordinate controls impede exploration after the graph journey works.
- **Provenance.** Proposed 2026-10-13 by Codex; awaiting a decision with @Exilitys.

### D-302: small shared input-replacement seam

- **Chosen.** Proposed: add one pure player transition and hook action for validated
  input replacement. Graph controls retain the last successfully started command.
  Engine and Snapshot interfaces, playback controller and controls stay generic.
- **Rejected.** Proposed alternatives: store command/edit policy in a new registry or widen PlayerState
  to own all lesson editing behavior.
- **Because.** The current interfaces already support traversals; only replacing
  logical input and rebuilding its run is missing. Graph editing belongs to graph.
- **Revisit when.** Another lesson needs the same command ownership or editing model.
- **Provenance.** Proposed 2026-10-13 by Codex; awaiting a decision with @Exilitys.

### D-303: reuse existing scene primitives

- **Chosen.** Proposed: extract the existing node, camera/Canvas and fallback code
  into shared components used by both scene adapters. Graph supplies node positions
  and edge lines; its queue/stack remains a selectable semantic auxiliary view.
- **Rejected.** Proposed alternatives: duplicate the heap scene shell or introduce a universal renderer.
- **Because.** Both lessons need the same picking, labels, Fit/Focus, motion and
  WebGL recovery. Reuse makes the accepted shared-primitives choice concrete.
- **Revisit when.** A demonstrated scene requirement no longer fits these primitives.
- **Provenance.** Proposed 2026-10-13 by Codex; awaiting a decision with @Exilitys
  within accepted D-004. No new dependency.

## 6. Data and engine surface

```typescript
type GraphNode = {id:string; creationOrder:number};
type GraphEdge = {id:string; a:string; b:string};
type GraphInput = {
  nodes:readonly GraphNode[];
  edges:readonly GraphEdge[];
  nextNodeId:number;
  nextEdgeId:number;
};
type GraphCommand = {type:'bfs'|'dfs'; startId:string};
type GraphEdit =
  | {type:'add-node'}
  | {type:'remove-node'; id:string}
  | {type:'connect'; a:string; b:string}
  | {type:'disconnect'; edgeId:string};
type GraphState = GraphInput & {
  algorithm:'bfs'|'dfs'|null;
  startId:string|null;
  currentId:string|null;
  examinedEdgeId:string|null;
  queue:readonly string[];
  frames:readonly {nodeId:string; nextNeighborIndex:number}[];
  discovered:readonly string[];
  processed:readonly string[];
  predecessors:Readonly<Record<string,string|null>>;
  depthById:Readonly<Record<string,number>>;
  discoveryOrder:readonly string[];
  backtracking:readonly string[];
};
```

`graphEngine` implements the existing LessonEngine with id `graph`, version
`1.0.0`, and `commandStart:'any-step'`. Initial/resting state has no algorithm,
start/current/edge, frontier or traversal evidence; counters are zero.

The authored module generates alphabetic node IDs A…Z, AA… from the positive
creation counter, and edge IDs E1, E2… from the edge counter. Node creationOrder
is that node counter. Validate this canonical ID/order relationship, unique safe
positive creation orders, unique IDs, safe positive next counters beyond existing
orders/edge numbers, both capacities, and every endpoint. Reject reversed duplicate
edges as well as self-loops. Counter exhaustion rejects addition without mutation.
No positions, timestamps, camera state or renderer objects enter GraphInput.

The module exports the following edit boundary:

```typescript
editGraph(input:GraphInput, raw:unknown):Validation<GraphInput>
```

It validates the edit,
returns an allocated immutable input, and never mutates its argument. Add increments
only the node counter; connect increments only the edge counter. Remove/disconnect
preserve both counters. Remove deletes incident edges atomically. Missing removals,
unsupported commands, duplicate edges and capacity failures preserve the scene.

Neighbors are sorted by node creationOrder, never edge order, input-array order,
ID text or position. Disconnection/reconnection may replace an edge ID but cannot
change neighbor ordering. Start must name an existing node. Empty input is valid
resting input, with traversal disabled until a node/start exists.

## 7. Semantic trace rules

Each emitted snapshot owns all nested arrays/maps and is deeply frozen. Every
referenced ID exists in its input. Initial is ordinal 0; complete is final;
ordinals are contiguous and at most 512 snapshots. Engine failures preserve the
previous valid player scene. No step silently truncates traversal.

Common counters are `discoveries`, `edgeExaminations`, `frontierAdds` and
`frontierRemovals`. Discovery increments once per reached node; examine increments
once per inspected directed adjacency entry of the undirected graph. Enqueue/push
and dequeue/return increment their respective frontier counters. Bounds tests do
not count. Queue and frames are mutually exclusive by algorithm.

Invariant annotations `graph.input-valid`, `graph.unique-discovery` and
`graph.frontier-discovered` hold throughout. Discovery before enqueue/push is a
valid inspectable state. Completion has an empty frontier, no current/edge and
exactly the reachable nodes processed. Disconnected nodes remain undiscovered.

**BFS:** discover the start, then enqueue it in a separate step. Dequeue one node
into current. Examine each ordered neighbor in a separate step; an undiscovered
neighbor gets its predecessor/depth and discovery step, then enqueue step. An
already discovered neighbor produces no duplicate discovery/enqueue. Emit process
after all neighbors, clear current, then dequeue the next FIFO item. Complete only
when the queue is empty. Predecessor depth plus one gives shortest edge distance.

**DFS:** discover the start, then push `{nodeId:start,nextNeighborIndex:0}` separately.
The top frame is current. Examine one neighbor and advance that frame's index in
the examine snapshot. If undiscovered, record predecessor/depth, emit discover,
then push its new frame. Otherwise continue that same frame. When its neighbors
are exhausted, emit return: pop it, mark it processed, append its ID to backtracking,
and make the parent frame current (or null for the root). Never bulk-push neighbors.
Depth is DFS tree depth, not a shortest-path claim.

Affected IDs, operands, variables, explanation and code line come from that
snapshot. Examine distinguishes an already discovered neighbor from a new one;
discover and frontier insertion remain separate. Variables include current/source,
neighbor, edge and frame index as applicable, using the existing primitive-only map.

## 8. Exact acceptance fixture

Preset nodes are A–F, creation orders 1–6, nextNodeId 7. Edges are E1 A–B,
E2 A–C, E3 B–D, E4 C–D, E5 D–E; nextEdgeId 6. F is isolated. Start at A.

| Observation | BFS | DFS |
| --- | --- | --- |
| Discovery | A, B, C, D, E | A, B, D, C, E |
| Processing/return order | A, B, C, D, E | C, E, D, B, A |
| Predecessors | A:null, B:A, C:A, D:B, E:D | A:null, B:A, D:B, C:D, E:D |
| Depths | A:0, B:1, C:1, D:2, E:3 | A:0, B:1, D:2, C:3, E:3 |
| Final counters | 5 discoveries, 10 examinations, 5 adds, 5 removals | Same |
| Trace length | 32 snapshots, ordinals 0–31 | 27 snapshots, ordinals 0–26 |
| F | Undiscovered; no predecessor/depth | Same |

Key BFS steps: 5 discovers B with an empty queue; 6 enqueues B; 9 has queue B,C;
15 has queue C,D; 25 discovers E; 31 completes. At 5, discovery is observable
before enqueue. Seeking backward restores frontier and counters exactly.

Key DFS steps: 13 pushes C with stack A(1),B(2),D(2),C(0); 16 returns C to D;
17 examines D–E; 18 discovers E; 19 pushes E; 25 returns A; 26 completes.
At 16, C is processed and E is undiscovered. At 13, indexes are next-neighbor
positions in each frame's creation-ordered adjacency, not node array indexes.
Selecting C shows BFS distance 1 versus DFS tree depth 3, a concrete path counterexample.

## 9. Input replacement and run lifecycle

Proposed shared API:

```typescript
replaceInput<I,C,S>(
  state:PlayerState<I,S>, engine:LessonEngine<I,C,S>,
  rawInput:unknown, selectedCommand:unknown|null
):PlayerState<I,S>
```

It respects the engine's commandStart policy; adding this API must not bypass
the heap finish/restart boundary. Invalid input retains input, resting snapshot,
steps, ordinal and selection, with an actionable error. Null command commits valid
resting input. A command invalidated by deleting its start also commits resting
input, clears the old trace and requires a new start. A still-valid command creates
a fresh trace and selects its first action step, paused. A trace/initial-snapshot
failure retains the previous valid scene. Keep a selected entity only if it exists
and is inspectable in the replacement snapshot.

The shared hook exposes replacement through the same cancellation controller,
pausing before publishing and returning the resulting player state. The graph UI
holds only the last successfully started GraphCommand, separate from unsubmitted
form choices. It clears that command when the committed input invalidates its start.
It reconciles positions only after a successful input replacement; invalid/cancelled
edits do not move nodes or change layout.

Validate before asking to replace progress. A valid edit or new traversal at an
intermediate ordinal (0 < ordinal < lastOrdinal) pauses and presents a native
confirmation with Apply and Keep traversal. Escape keeps the traversal. Cancelling
retains the paused cursor and full future. At resting, ordinal 0 or completion,
apply without this prompt. Deleting all nodes produces a usable empty resting view.

Existing timer generation and run/cursor checks invalidate old scheduled callbacks.
Restart replays the current run's original edited input, not the authored preset.
Layout edits, selection, Fit/Focus and view toggles never alter input, steps or
ordinal. Separate heap/graph routes mount separate lesson components; navigation
resets that lesson's transient scene. Persistence remains required later work.

## 10. Presentation and authored content

Keep the current page tokens and shell. Add a graph route `/graph` and native
Heap/Graph navigation. Reuse PlaybackControls, InspectionPanel, useLessonPlayer,
and the existing speed/visibility policy. Make empty inspection copy lesson-neutral.
No provider call, registry installation or dependency is needed.

The graph adapter uses shared selectable nodes, labels, camera recovery and WebGL
fallback. Node Focus is enabled for an existing node; edge selection supports
inspection/highlight and Fit. Picking an edge does not invent a focusable node.
Node status text distinguishes Undiscovered, Discovered, Frontier, Current and
Processed with labels as well as color. The examined edge is highlighted in both
the graph and semantic edge list.

The auxiliary BFS view labels Front → Back and preserves FIFO order. The DFS view
labels Bottom → Top, shows every frame's neighbors examined/total and next neighbor,
and identifies the active top. Node buttons in frontier, adjacency and discovery
sequence select the same ID as the graph. Semantic views remain available on WebGL
failure and in semantic-only mode. Inspection also supports edges/endpoints and
shows node state, ordered neighbors, predecessor, depth, frontier position and
the current/last examined edge where applicable. Missing values say Absent.

Authored pseudocode uses stable line IDs: BFS discover/enqueue/dequeue/examine/process/
complete; DFS discover/push/examine/return/complete. Snapshot operands drive guidance.
The comparison explains why BFS's edge distance is shortest while DFS's tree path
can be longer; it does not claim one visits fewer reached nodes.

Positions are browser-only `{[nodeId]:[x,y,0]}`. Use an authored readable preset
layout; added nodes take an available slot in a centered 5×4 grid. Retain existing
positions on adjacency edits, prune deleted IDs, and keep algorithm ordering
independent. Coordinate controls accept finite X/Y in −10…10 with 0.5 step.
Reset layout restores readable positions without touching the trace; Fit restores
the camera. Arbitrary user overlap is recoverable through Reset layout.

## 11. Failure behaviour

| Condition | Required outcome |
| --- | --- |
| Invalid input/edit/coordinates | Actionable error; old logical scene and trace retained. |
| Keep traversal or Escape | Remain paused at the same ordinal with the same future. |
| Deleted start/all nodes | Valid edited resting input; no old trace; require an existing start. |
| Engine or malformed trace failure | Retain the previous valid scene; never publish a partial replacement. |
| WebGL creation/context failure | Semantic graph, frontier, inspection and playback remain usable. |
| Overlapping user positions | Reset layout and Fit recover presentation without changing traversal. |

## 12. Verification and review

Native execution remains the owner's selected method. A written build plan still
requires review before implementation. Use the existing Node runner and add the
graph test file to npm test. Keep all 19 heap/playback regressions passing.

Test the literal fixtures, separate discover/frontier steps, frame indexes/return,
deep immutability, replay, array/edge ordering permutations, reconnect ordering,
cycles, isolated/single/empty graphs, capacities, missing/reversed/self edges,
counter exhaustion and non-recycled IDs. Verify invalid input and failed traces
preserve the old run; start deletion/all-node deletion rest; valid editing reruns;
cancelled callbacks cannot move the replacement run; heap boundaries still apply.

Production browser checks cover the A–F journey in both algorithms, frontier/edge
inspection and rewind, input-edit confirmation/cancel, deletion of the start/all
nodes, keyboard editing, layout changes preserving trace equality, motion and
semantic modes, WebGL loss/creation failure, route unmount cleanup, and heap regression.
Check 360/1280 px controls, at least 44 px native targets and default labels;
measure supported 20-node/40-edge
feedback against 100 ms p95 on a named device. Record rendering observations against
the 60 fps laptop/30 fps phone aims and explicitly identify untested devices.

Run npm test, typecheck, production build, context guard and whitespace checks;
obtain one fresh whole-branch review; then open one completed feature PR to
development containing the spec, plan, code and evidence. The owner merges.
Report learner understanding separately from technical verification.

## 13. Deferred

- **Required later work.** Guided lessons/challenges, evidence, tutor integration and authored Browse relationships. **Revisit when.** Graph editing/traversal pass this slice; finish these before declaring the release complete.
- **Dijkstra and lesson authoring.** Their authority remains [technical spec section 11](../prd/prd.md#11-deferred). **Revisit when.** Its accepted conditions and owner authorization are met; this slice does not revive them.

## 14. The first slice

**Done when.** Both literal traversals and editing/reset paths pass through the
shared player and playback, frontiers/inspection rewind exactly, positioning
preserves logical trace equality, and the keyboard/fallback journeys work.
The target learner can explain discovery versus processing and the C path
counterexample on a fresh graph. Report missing learner evidence explicitly.

## 15. Open questions and acceptance

There is no missing product-scope answer. The proposed choices and concrete
contracts above await owner review; draft status does not authorize implementation.
On acceptance, record the owner/date/reviewed commit, then write and present the
Native build plan on the same feature branch. No planning-only PR is needed.

Self-review: compared with accepted graph data/edit/replay contracts and the real
player/hook/controls. Hand-checked the 32-step BFS and 27-step DFS fixture, including
C's return before E's discovery. Architecture and lesson interfaces stay unchanged;
the proposed replacement transition is named explicitly rather than hidden in UI.
