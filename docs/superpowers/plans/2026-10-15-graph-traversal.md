# Editable Graph, BFS and DFS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the owner's selected Native execution. Implement task by task with TDD and one fresh whole-branch review. Steps use checkbox (`- [x]`) syntax.

**Status:** Accepted 2026-10-15 by @Exilitys through “Continue”; reviewed at `306f75fcca917f04acad554ecf6421b20f25d197`. Native implementation in progress.
**Goal:** Edit a bounded graph and compare FIFO BFS with frame-based DFS through the shared player, inspection and 3D primitives.
**Architecture:** Graph supplies one pure engine and authored content. One shared input-replacement transition handles edited runs; the existing timer and controls remain generic. Extract the existing scene shell/node primitive for both adapters, then mount the graph at its own route.
**Tech Stack:** Existing Node 24.15 or newer within Node 24, Next.js 16.3.8, React 19.3.0, R3F 9.8.1, Drei 10.7.9, Three 0.186.1 and TypeScript 5.9.3. No new dependency.
**Spec:** [Slice 003](../../specs/003-graph-traversal.md), version 1 reviewed at `177d52f403a8e457e1b02a0be2c1172bf20696a4`, accepted by @Exilitys through "Continue" on 15 October 2026.
**Execution:** Native is already selected. Keep `feature/graph-traversal` and the existing managed worktree. Open one completed feature PR to development after verification; the owner merges.

## Global Constraints

- Both BFS and DFS ship in this slice; heap behavior remains covered.
- Undirected/unweighted, at most 20 nodes and 40 edges. Reject reversed duplicates, self-loops and missing endpoints.
- "Neighbors are sorted by node creationOrder, never edge order, input-array order, ID text or position."
- Alphabetic node IDs derive from their positive creation counters; edge IDs are E1, E2…; deleted IDs are not recycled.
- "Discovery before enqueue/push is a valid inspectable state."
- DFS has `{nodeId,nextNeighborIndex}` frames and separate visible returns; no bulk neighbor push.
- "Initial is ordinal 0; complete is final; ordinals are contiguous and at most 512 snapshots."
- A valid command selects its first action paused; edits can rerun a valid command or clear into resting state when its start disappears.
- Invalid edits/failed traces preserve the old scene. Confirm replacement only at `0 < ordinal < lastOrdinal`; Keep/Escape retains the paused future.
- Positions are browser-only `[x,y,0]`; coordinate controls use −10…10 and 0.5 steps. Layout/selection/camera changes never alter a trace.
- Retain 0.5×/1×/2× playback, visibility cancellation, fallback, 360/1280 px layouts and at least 44 px native targets.
- Tutor, challenge grading/evidence, authored Browse relationships, persistence and Dijkstra are not implemented by this plan; required release work stays required.

## Review Focus

1. An edit staged at an intermediate step must not mutate the current input/layout; Keep/Escape retains the same trace. Task 4 exercises the native dialog and focus restoration.
2. A deleted start must commit valid resting input, while a malformed replacement trace must preserve the old input and run. Task 2 tests these distinct outcomes and stale scheduled callbacks.
3. Reconnected edges, permuted input arrays and alphabetic IDs beyond Z must not change creation-order traversal. Task 1 tests ordering and non-recycled counters explicitly.
4. Extracting the shared scene shell can break the heap's label portal, Fit/Focus or WebGL recovery. Task 3 verifies both scene adapters and Task 5 repeats the heap journey.
5. Browser back/navigation, empty graphs and 20-node/40-edge graphs must remain usable without duplicate timers or unreadable default labels. Tasks 3–5 cover bounds/layout and real route cleanup.

## File map and dependency order

| Task | Files and responsibility |
| --- | --- |
| 1 | New `src/lessons/graph/engine.ts`, `content.ts`, `tests/graph-slice.test.ts`; update package test command. Model, edits, both traces, inspection and authored content. |
| 2 | `src/core/player.ts`, `src/components/useLessonPlayer.ts`; new `tests/graph-player.test.ts`; update package test command. Atomic replacement and cancellation binding. |
| 3 | New `src/components/ScenePrimitives.tsx`, `src/lessons/graph/layout.ts`, `GraphScene.tsx`, `tests/graph-layout.test.ts`; modify heap adapter and package test command. Shared 3D shell/node and graph positioning. |
| 4 | New `src/components/GraphPlayground.tsx`, `GraphViews.tsx`, `LessonNavigation.tsx`, `src/app/graph/page.tsx`; modify LessonPlayground, LessonControls and globals.css. Editor, dialog, semantic/frontier UI and routes. |
| 5 | New `docs/reviews/003-graph-traversal.md` and actual evidence under `docs/reviews/graph-traversal/`; update README, backlog, AGENTS/source pointers, plan status and contract mirrors. Verification and owner PR. |

Tasks 1→2→3→4→5 are sequential under Native. Read installed library source/docs before changing a version-sensitive API; use the current components and tokens, not registry setup. All code blocks below are plan content, not already implemented code.

### Task 1: deterministic graph engine, edits and content

**Files:** Create engine.ts, content.ts and graph-slice.test.ts from the file map; modify package.json.
**Consumes:** Existing `LessonEngine`, `Snapshot`, `Validation`, `Inspection`, `deepFreeze` in `src/core/lesson.ts`.
**Produces:** The exact GraphInput/GraphCommand/GraphState/GraphEdit types from spec section 6, plus:

```typescript
export const graphEngine:LessonEngine<GraphInput,GraphCommand,GraphState>;
export function createGraphPreset():GraphInput;
export function editGraph(input:GraphInput,raw:unknown):Validation<GraphInput>;
export function orderedNeighbors(input:GraphInput,id:string):readonly {nodeId:string;edgeId:string}[];
export function nodeStatus(state:GraphState,id:string):string;
// content.ts
export function getGraphPseudocode(snapshot:Snapshot<GraphState>):readonly {id:string;text:string}[];
export function explainGraphStep(snapshot:Snapshot<GraphState>):string;
```

- [x] Add the new test path to the existing package script. Import the engine and add the literal fixture before implementing behavior. A missing module is setup feedback; the behavioral RED gate is a wrong/rejected trace after exports exist.

```json
"test": "node --test tests/heap-slice.test.ts tests/playback.test.ts tests/graph-slice.test.ts"
```

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {graphEngine,createGraphPreset,editGraph,orderedNeighbors} from '../src/lessons/graph/engine.ts';
import {getGraphPseudocode,explainGraphStep} from '../src/lessons/graph/content.ts';

test('BFS separates discovery from enqueue and uses a FIFO frontier',()=>{
  const input=createGraphPreset();
  const steps=graphEngine.createTrace(input,{type:'bfs',startId:'A'});
  assert.equal(steps.length,32);
  assert.equal(steps[5].event.type,'discover');
  assert.deepEqual(steps[5].state.discovered,['A','B']);
  assert.deepEqual(steps[5].state.queue,[]);
  assert.deepEqual(steps[6].state.queue,['B']);
  assert.deepEqual(steps[9].state.queue,['B','C']);
  assert.deepEqual(steps[15].state.queue,['C','D']);
  assert.deepEqual(steps[31].state.discoveryOrder,['A','B','C','D','E']);
  assert.deepEqual(steps[31].state.processed,['A','B','C','D','E']);
  assert.deepEqual(steps[31].state.predecessors,{A:null,B:'A',C:'A',D:'B',E:'D'});
  assert.deepEqual(steps[31].state.depthById,{A:0,B:1,C:1,D:2,E:3});
  assert.deepEqual(steps[31].counters,{discoveries:5,edgeExaminations:10,frontierAdds:5,frontierRemovals:5});
  assert.equal(steps[31].state.discovered.includes('F'),false);
  assert.deepEqual(steps,graphEngine.createTrace(input,{type:'bfs',startId:'A'}));
  assert.ok(Object.isFrozen(steps[6].state.queue));
  assert.ok(Object.isFrozen(steps[31].state.predecessors));
});

test('DFS resumes frames and returns from C before discovering E',()=>{
  const steps=graphEngine.createTrace(createGraphPreset(),{type:'dfs',startId:'A'});
  assert.equal(steps.length,27);
  assert.deepEqual(steps[13].state.frames,[
    {nodeId:'A',nextNeighborIndex:1},{nodeId:'B',nextNeighborIndex:2},
    {nodeId:'D',nextNeighborIndex:2},{nodeId:'C',nextNeighborIndex:0}]);
  assert.equal(steps[16].event.type,'return');
  assert.equal(steps[16].state.currentId,'D');
  assert.deepEqual(steps[16].state.processed,['C']);
  assert.equal(steps[16].state.discovered.includes('E'),false);
  assert.equal(steps[18].event.type,'discover');
  assert.deepEqual(steps[26].state.discoveryOrder,['A','B','D','C','E']);
  assert.deepEqual(steps[26].state.backtracking,['C','E','D','B','A']);
  assert.deepEqual(steps[26].state.depthById,{A:0,B:1,D:2,C:3,E:3});
  assert.deepEqual(steps[26].state.frames,[]);
  assert.ok(Object.isFrozen(steps[13].state.frames[0]));
  assert.throws(()=>{(steps[13].state.frames[0] as {nextNeighborIndex:number}).nextNeighborIndex=99;},TypeError);
});
```

- [x] Implement the public types exactly as spec section 6. Set `id:'graph'`, `version:'1.0.0'`, `commandStart:'any-step'`. `createGraphPreset` returns A–F (orders 1–6), E1 A–B, E2 A–C, E3 B–D, E4 C–D, E5 D–E, counters 7/6. Resting state has null algorithm/start/current/edge, empty traversal arrays/maps, zero counters, three holding invariants, initial event and no code line.

Use these bounded primitives in engine.ts; keep them lesson-local:

```typescript
const object=(raw:unknown):raw is Record<string,unknown>=>
  raw!==null && typeof raw==='object' && !Array.isArray(raw);
const positive=(raw:unknown):raw is number=>
  typeof raw==='number' && Number.isSafeInteger(raw) && raw>0;
function nodeId(order:number):string {
  let result='';
  for(let n=order;n>0;n=Math.floor((n-1)/26)) result=String.fromCharCode(65+(n-1)%26)+result;
  return result;
}
```

`validateInput` must allocate a copy and check every row before publishing it:

| Input | Check and error |
| --- | --- |
| Shape | Object with nodes/edges arrays and positive safe next counters; otherwise `Choose a valid graph.` |
| Capacities | nodes≤20, edges≤40; `Use at most 20 nodes and 40 edges.` |
| Nodes | Each object has positive safe creationOrder and id exactly nodeId(order); unique IDs/orders; `Graph node identities are invalid.` |
| Node counter | nextNodeId > every existing creationOrder; `The next node ID must be unused.` |
| Edges | ID matches `^E([1-9]\d*)$` with a safe positive numeric suffix; unique IDs; `Graph edge identities are invalid.` |
| Endpoints | Both are existing distinct node IDs; `Connect two different existing nodes.` |
| Undirected duplicates | A sorted endpoint-pair key must be unique; `These nodes are already connected.` |
| Edge counter | nextEdgeId > every numeric edge suffix; `The next edge ID must be unused.` |

Return deep-frozen copied nodes sorted by creationOrder and edges by numeric edge suffix. Do not mutate raw arrays. `validateCommand` accepts only bfs/dfs plus an existing startId; missing start returns `Choose an existing start node.` with field `startId`.

Public createTrace validates both arguments before calling private createGraphTrace; direct callers receive the same boundary protection as the player:

```typescript
createTrace(rawInput,rawCommand) {
  const input=graphEngine.validateInput(rawInput);
  if(!input.ok)throw new Error(input.message);
  const command=graphEngine.validateCommand(rawCommand,input.value);
  if(!command.ok)throw new Error(command.message);
  return createGraphTrace(input.value,command.value);
}
```

createInitialSnapshot also validates/copies its input before building the specified resting snapshot; invalid input throws instead of publishing a partial graph.

```typescript
export function orderedNeighbors(input:GraphInput,id:string) {
  return input.nodes.filter(node=>input.edges.some(edge=>
    (edge.a===id && edge.b===node.id)||(edge.b===id && edge.a===node.id)))
    .toSorted((a,b)=>a.creationOrder-b.creationOrder)
    .map(node=>({nodeId:node.id,edgeId:input.edges.find(edge=>
      (edge.a===id && edge.b===node.id)||(edge.b===id && edge.a===node.id))!.id}));
}
```

- [x] Implement editGraph by validating input and raw edit, constructing only the changed arrays, then validating the candidate. Use this operation table, preserving counters unless explicitly incremented:

| Edit | Candidate change |
| --- | --- |
| add-node | Reject 20 nodes or nextNodeId≥MAX_SAFE_INTEGER; append `{id:nodeId(nextNodeId),creationOrder:nextNodeId}`, increment nextNodeId. |
| remove-node | Require id exists; remove it and all edges whose a/b is id atomically. |
| connect | Require two existing distinct nodes and no pair in either orientation; reject 40 edges or exhausted counter; append `{id:'E'+nextEdgeId,a,b}`, increment nextEdgeId. |
| disconnect | Require edgeId exists; remove only that edge. |

Missing deletion says `Choose an existing node.`/`Choose an existing edge.`; exhausted counters say `The node ID counter is exhausted.`/`The edge ID counter is exhausted.` Unsupported edits say `Choose a valid graph edit.` Rejected edits return Validation failure without touching the argument.

- [x] Implement both traversal loops using private mutable frontier/evidence arrays; build immutable snapshots only in emit. The emitter clones the entire candidate with structuredClone before deepFreeze, so it never freezes a working frame/map. Clone input arrays too. Every snapshot has local ID `s${ordinal}`, contiguous ordinal, codeLineId `${command.type}.${event}` except initial=null, explanationKey `graph.${command.type}.${event}`, and the three spec invariants holding. Throw before snapshot 513.

The initial trace state matches the resting state; its variables may carry the chosen algorithm/start for pseudocode. Set working algorithm/start immediately before discovery. Emit variables `{algorithm,startId,currentId,neighborId,edgeId,frameIndex,alreadyDiscovered}` with null for inapplicable values, using the command for initial algorithm/start. Affected IDs include only existing nodes/edges.

The exact loop/emitter call contract is:

```typescript
// Body of private createGraphTrace(input:GraphInput,command:GraphCommand).
const queue:string[]=[],discovered:string[]=[],processed:string[]=[],discoveryOrder:string[]=[],backtracking:string[]=[];
const frames:{nodeId:string;nextNeighborIndex:number}[]=[];
const predecessors:Record<string,string|null>={},depthById:Record<string,number>={};
let algorithm:GraphState['algorithm']=null;
let startId:string|null=null,currentId:string|null=null,examinedEdgeId:string|null=null;
const counters={discoveries:0,edgeExaminations:0,frontierAdds:0,frontierRemovals:0};
const steps:Snapshot<GraphState>[]=[];
const emit=(type:string,affectedIds:string[],operands:(string|number)[],
  details:Record<string,string|number|boolean|null>={})=>{
  const ordinal=steps.length;
  if(ordinal>=512)throw new Error('Graph trace exceeds 512 snapshots.');
  const candidate:Snapshot<GraphState>={id:`s${ordinal}`,ordinal,
    state:{...input,algorithm,startId,currentId,examinedEdgeId,queue,frames,
      discovered,processed,predecessors,depthById,discoveryOrder,backtracking},
    event:{type,affectedIds,operands,codeLineId:type==='initial'?null:`${command.type}.${type}`,
      explanationKey:`graph.${command.type}.${type}`},
    variables:{algorithm:command.type,startId:command.startId,currentId,edgeId:examinedEdgeId,
      neighborId:null,frameIndex:null,alreadyDiscovered:null,...details},
    counters,invariants:[{id:'graph.input-valid',status:'holds'},
      {id:'graph.unique-discovery',status:'holds'},{id:'graph.frontier-discovered',status:'holds'}]};
  steps.push(deepFreeze(structuredClone(candidate)));
};
function discover(id:string,parent:string|null) {
  discovered.push(id);discoveryOrder.push(id);predecessors[id]=parent;
  depthById[id]=parent===null ? 0 : depthById[parent]+1;
  counters.discoveries++;
  emit('discover',parent===null ? [id] : [parent,id],[id,parent??'start',depthById[id]]);
}
emit('initial',[],[]);
algorithm=command.type;startId=command.startId;
discover(startId,null);
if(command.type==='bfs') {
  queue.push(startId);counters.frontierAdds++;emit('enqueue',[startId],[startId]);
  while(queue.length) {
    currentId=queue.shift()!;examinedEdgeId=null;
    counters.frontierRemovals++;emit('dequeue',[currentId],[currentId]);
    const source=currentId;
    for(const neighbor of orderedNeighbors(input,source)) {
      examinedEdgeId=neighbor.edgeId;counters.edgeExaminations++;
      const seen=discovered.includes(neighbor.nodeId);
      emit('examine',[source,neighbor.nodeId,neighbor.edgeId],
        [source,neighbor.nodeId,neighbor.edgeId,seen?1:0],
        {neighborId:neighbor.nodeId,alreadyDiscovered:seen});
      if(seen) continue;
      discover(neighbor.nodeId,source);
      queue.push(neighbor.nodeId);counters.frontierAdds++;
      emit('enqueue',[neighbor.nodeId],[neighbor.nodeId]);
    }
    processed.push(source);currentId=null;examinedEdgeId=null;
    emit('process',[source],[source]);
  }
} else {
  frames.push({nodeId:startId,nextNeighborIndex:0});currentId=startId;
  counters.frontierAdds++;emit('push',[startId],[startId]);
  while(frames.length) {
    const frame=frames.at(-1)!;
    const neighbors=orderedNeighbors(input,frame.nodeId);
    if(frame.nextNeighborIndex>=neighbors.length) {
      frames.pop();processed.push(frame.nodeId);backtracking.push(frame.nodeId);
      currentId=frames.at(-1)?.nodeId??null;examinedEdgeId=null;
      counters.frontierRemovals++;
      emit('return',currentId ? [frame.nodeId,currentId] : [frame.nodeId],
        [frame.nodeId,currentId??'none']);
      continue;
    }
    const index=frame.nextNeighborIndex++;
    const neighbor=neighbors[index];examinedEdgeId=neighbor.edgeId;
    counters.edgeExaminations++;
    const seen=discovered.includes(neighbor.nodeId);
    emit('examine',[frame.nodeId,neighbor.nodeId,neighbor.edgeId],
      [frame.nodeId,neighbor.nodeId,neighbor.edgeId,seen?1:0],
      {neighborId:neighbor.nodeId,frameIndex:index,alreadyDiscovered:seen});
    if(seen) continue;
    discover(neighbor.nodeId,frame.nodeId);
    frames.push({nodeId:neighbor.nodeId,nextNeighborIndex:0});currentId=neighbor.nodeId;
    counters.frontierAdds++;emit('push',[neighbor.nodeId],[neighbor.nodeId]);
  }
}
currentId=null;examinedEdgeId=null;
emit('complete',discoveryOrder.slice(),[discoveryOrder.length,input.nodes.length-discoveryOrder.length]);
return deepFreeze(steps);
```

- [x] Add node/edge inspection and authored content. Status precedence is Current, Processed, Frontier (queue/frames), Discovered, Undiscovered. Node fields: State, ordered Neighbors, Predecessor, Shortest distance (edges) for BFS or DFS tree depth (edges), frontier position, discovery position and DFS next-neighbor progress. Node and edge inspectors also show snapshot Current node and Examined edge, or Absent. Edge fields show Endpoints, Examined now/Present and endpoint states. Unknown IDs return null.

Use these exact pseudocode lines and event mapping; initial has no current line:

| Line ID | Text |
| --- | --- |
| bfs.discover | Mark the node discovered and record its predecessor and distance |
| bfs.enqueue | Add the discovered node to the back of the queue |
| bfs.dequeue | Remove the front node to process its neighbors |
| bfs.examine | Examine the next neighbor in creation order |
| bfs.process | Mark the current node processed after all neighbors |
| bfs.complete | Finish when the queue is empty; other components stay unvisited |
| dfs.discover | Mark the node discovered and record its predecessor and tree depth |
| dfs.push | Push a frame beginning at the first neighbor |
| dfs.examine | Examine one neighbor and advance the frame's next-neighbor index |
| dfs.return | Pop the exhausted frame and return to its parent |
| dfs.complete | Finish when the stack is empty; other components stay unvisited |

`getGraphPseudocode` derives algorithm from snapshot.state.algorithm or the initial snapshot's variables.algorithm, never unsent form values. Resting has no selected algorithm and returns an empty list. `explainGraphStep` switches on event type and operands: discover names node/parent/depth; enqueue/push names the added ID; dequeue names the FIFO removal; examine says whether its neighbor is already discovered; process/return explains completion of that node; complete reports reached/unvisited counts. Initial uses variables.startId; resting invites choosing a start. No inference from a future snapshot.

```typescript
test('authored content follows the selected snapshot',()=>{
  const bfs=graphEngine.createTrace(createGraphPreset(),{type:'bfs',startId:'A'});
  const dfs=graphEngine.createTrace(createGraphPreset(),{type:'dfs',startId:'A'});
  assert.equal(bfs[5].event.codeLineId,'bfs.discover');
  assert.ok(explainGraphStep(bfs[5]).includes('B'));
  assert.ok(explainGraphStep(dfs[16]).includes('C'));
  assert.ok(explainGraphStep(dfs[16]).includes('D'));
  assert.ok(getGraphPseudocode(dfs[16]).some(line=>line.id==='dfs.return'));
  assert.equal(graphEngine.inspect(bfs[31],'F')!.fields.find(f=>f.label==='Predecessor')!.value,'Absent');
  assert.equal(graphEngine.inspect(dfs[26],'C')!.fields.find(f=>f.label==='DFS tree depth (edges)')!.value,'3');
});
```

- [x] Before closing the task, add independent edge-case assertions using the following literal setups and outputs. Use assertions on public outputs rather than tests of private helpers:

| Case | Assertion |
| --- | --- |
| Reversed nodes/edges arrays of preset | Same event types/operands, discovery and counters; full normalized traces equal. |
| Disconnect E2 then reconnect A,C | New edge E6, nextEdgeId 7, A's neighbors B,C, same discovery in both algorithms. |
| Remove B then add | New node G/order7, nextNodeId8; E1/E3 absent; no B reuse. |
| Retain A, add/remove B…Y, retain Z, then add AA | AA/order27, nextNodeId28. Connect A–AA first and A–Z second; ordered neighbors and BFS discovery from A must be Z before AA, despite ID text and edge order. |
| Empty | Resting valid; bfs/dfs start rejected; no invented traversal. |
| Start at isolated F | Discovery [F], depth0, zero examinations, one add/removal; no A–E discovery. |
| Single A | BFS six snapshots; DFS five; root predecessor null and empty final frontier. |
| Capacity | A…T with 20 cycle edges plus 20 distance-two edges (E1…E40) validates; all reached once and examinations80; 21 nodes/41 edges rejected. |
| Validation | Duplicate ID/order/edge, E01, unsafe/behind counters, missing endpoint, reversed pair, self-loop and bad start all fail without input mutation. |
| Exhaustion | Empty graph with safe next counter MAX_SAFE_INTEGER validates; relevant add/connect fails without mutation or counter change. Use two valid nodes for edge exhaustion. |

Run `npm test`, inspect failures then passing output, and `npm run typecheck`. Commit engine/content/tests/script together with message `feat: add deterministic BFS and frame-based DFS`.

```text
git add src/lessons/graph/engine.ts src/lessons/graph/content.ts tests/graph-slice.test.ts package.json
git commit -m "feat: add deterministic BFS and frame-based DFS"
```

### Task 2: atomic shared input replacement

**Files:** Modify core/player.ts and components/useLessonPlayer.ts; create tests/graph-player.test.ts and append it to npm test.
**Consumes:** Existing player and graphEngine/editGraph from Task 1.
**Produces:** `replaceInput<I,C,S>(state,engine,rawInput,selectedCommand):PlayerState<I,S>` and hook `replaceInput(rawInput,command)` returning the published state. Also make existing hook start return its published state so graph controls can record only successful commands. Heap callers can ignore that return.

- [x] Write the transition tests before exporting implementation; run them to establish the behavioral RED:

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,startCommand,seek,replaceInput,selectEntity} from '../src/core/player.ts';
import {graphEngine,createGraphPreset,editGraph} from '../src/lessons/graph/engine.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';

test('valid edit reruns but deleting the start commits resting input',()=>{
  const command={type:'dfs',startId:'A'};
  const run=selectEntity(seek(startCommand(createPlayer(graphEngine,createGraphPreset()),graphEngine,command),13),graphEngine,'C');
  const changed=editGraph(run.input,{type:'disconnect',edgeId:'E2'});
  assert.ok(changed.ok);if(!changed.ok)return;
  const rerun=replaceInput(run,graphEngine,changed.value,command);
  assert.notEqual(rerun.steps,run.steps);assert.equal(rerun.ordinal,1);
  assert.equal(rerun.selectedId,'C');assert.equal(rerun.input.nextEdgeId,6);
  const deleted=editGraph(rerun.input,{type:'remove-node',id:'A'});
  assert.ok(deleted.ok);if(!deleted.ok)return;
  const rest=replaceInput(rerun,graphEngine,deleted.value,command);
  assert.equal(rest.steps,null);assert.equal(rest.ordinal,0);
  assert.equal(rest.input.nodes.some(n=>n.id==='A'),false);
  assert.deepEqual(rest.resting.state.discoveryOrder,[]);
  assert.match(rest.error!,/start node/);
});

test('invalid input and broken edited traces preserve the old input and run',()=>{
  const run=seek(startCommand(createPlayer(graphEngine,createGraphPreset()),graphEngine,{type:'bfs',startId:'A'}),9);
  const invalid=replaceInput(run,graphEngine,{...run.input,edges:[{id:'E1',a:'A',b:'A'}]},null);
  assert.equal(invalid.steps,run.steps);assert.equal(invalid.input,run.input);
  assert.equal(invalid.ordinal,9);
  const broken={...graphEngine,createTrace:(input:typeof run.input)=>graphEngine.createTrace(input,{type:'bfs',startId:'A'}).slice(0,-1)};
  const failed=replaceInput(run,broken,run.input,{type:'bfs',startId:'A'});
  assert.equal(failed.steps,run.steps);assert.equal(failed.input,run.input);
  assert.equal(failed.ordinal,9);assert.ok(failed.error);
});

test('replacement cannot bypass the heap command boundary',()=>{
  const run=seek(startCommand(createPlayer(heapEngine,createPreset()),heapEngine,{type:'insert',value:1}),3);
  const rejected=replaceInput(run,heapEngine,createPreset(),null);
  assert.equal(rejected.steps,run.steps);assert.equal(rejected.ordinal,3);
  assert.equal(rejected.error,'Finish or restart first.');
});
```

- [x] Add replaceInput after startCommand, reusing that function's trace-envelope validation rather than inventing a second guard:

```typescript
export function replaceInput<I,C,S>(state:PlayerState<I,S>,engine:LessonEngine<I,C,S>,
  rawInput:unknown,selectedCommand:unknown|null):PlayerState<I,S> {
  const boundary=!state.steps || state.ordinal===0 || state.ordinal===state.steps.length-1;
  if(engine.commandStart==='run-boundary' && !boundary)
    return {...state,error:'Finish or restart first.'};
  try {
    const input=engine.validateInput(rawInput);
    if(!input.ok)return {...state,error:input.message};
    const candidate:PlayerState<I,S>={input:input.value,
      resting:engine.createInitialSnapshot(input.value),steps:null,ordinal:0,
      selectedId:state.selectedId,error:null};
    if(selectedCommand===null)return selectEntity(candidate,engine,state.selectedId);
    const command=engine.validateCommand(selectedCommand,input.value);
    if(!command.ok)return {...selectEntity(candidate,engine,state.selectedId),error:command.message};
    const next=startCommand(candidate,engine,command.value);
    return next.error ? {...state,error:next.error} : next;
  } catch {
    return {...state,error:'The operation could not start. Your scene is preserved.'};
  }
}
```

Add the import to the hook under an alias to keep method naming clear, and return the exact state published:

```typescript
import {replaceInput as replacePlayerInput} from '../core/player.ts';
// In the hook's returned object:
start:(raw:unknown)=>{
  controller.pause();const next=startCommand(current.current,engine,raw);publish(next);return next;
},
replaceInput:(rawInput:unknown,command:unknown|null)=>{
  controller.pause();const next=replacePlayerInput(current.current,engine,rawInput,command);
  publish(next);return next;
},
```

- [x] Add tests for null-command resting input, deleting all nodes, retained/removed selected edge, and an initial-snapshot exception. For broken traces test empty, noncontiguous and missing-complete variants, plus the 513-snapshot guard, using the existing player regression pattern. Valid graph edits must not change any heap policy.
- [x] In graph-player.test.ts use the existing createPlayback injection seam with a local player variable and captured callback. Start BFS, play, pause, replaceInput with edited input, deliberately fire the old callback, and assert new trace identity and ordinal1 remain. Repeat for resting-after-start-deletion and disposal. No real waits or heap-specific scheduler changes.

Run `npm test` and typecheck; commit `feat: support atomic lesson input replacement` after reading results.

```text
git add src/core/player.ts src/components/useLessonPlayer.ts tests/graph-player.test.ts package.json
git commit -m "feat: support atomic lesson input replacement"
```

### Task 3: shared scene primitives and graph layout

**Files:** Create ScenePrimitives.tsx, graph/layout.ts, graph/GraphScene.tsx, graph-layout.test.ts; modify heap/HeapScene.tsx and package.json.
**Consumes:** Existing heap scene functions, SceneAdapterProps, GraphState, orderedNeighbors/nodeStatus.
**Produces:** SceneNode and SceneFrame used by both adapters, plus these pure layout exports:

```typescript
export type GraphPosition=[number,number,0];
export type GraphPositions=Readonly<Record<string,GraphPosition>>;
export function reconcileGraphPositions(nodes:readonly GraphNode[],previous:GraphPositions):GraphPositions;
export function parseGraphPosition(x:string,y:string):Validation<GraphPosition>;
```

- [x] Add graph-layout.test.ts to npm test and establish RED for placement/validation before implementing layout.ts:

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGraphPreset,editGraph} from '../src/lessons/graph/engine.ts';
import {reconcileGraphPositions,parseGraphPosition} from '../src/lessons/graph/layout.ts';

test('layout retains positions by ID and prunes deleted nodes without editing input',()=>{
  const input=createGraphPreset();const before=structuredClone(input);
  const positions=reconcileGraphPositions(input.nodes,{});
  const removed=editGraph(input,{type:'remove-node',id:'B'});
  assert.ok(removed.ok);if(!removed.ok)return;
  const next=reconcileGraphPositions(removed.value.nodes,{...positions,A:[1,2,0]});
  assert.deepEqual(next.A,[1,2,0]);assert.equal(next.B,undefined);
  assert.deepEqual(input,before);
  assert.deepEqual(reconcileGraphPositions([...input.nodes].reverse(),{}),positions);
});
test('coordinates reject blank, nonfinite, out of range and off-step values',()=>{
  for(const x of ['', ' ', 'Infinity','NaN','10.5','-10.5','0.25'])
    assert.equal(parseGraphPosition(x,'0').ok,false);
  assert.deepEqual(parseGraphPosition('-10','10'),{ok:true,value:[-10,10,0]});
});
test('twenty default positions are distinct finite slots',()=>{
  const nodes=[...'ABCDEFGHIJKLMNOPQRST'].map((id,index)=>({id,creationOrder:index+1}));
  const positions=reconcileGraphPositions(nodes,{});
  assert.equal(new Set(Object.values(positions).map(p=>p.join(','))).size,20);
  assert.ok(Object.values(positions).every(p=>p.every(Number.isFinite)));
});
```

- [x] Implement layout.ts using a centered grid and the authored preset below. Preserve positions only for surviving IDs, fill missing IDs in creation order, and choose an unoccupied exact slot. A valid ≤20-node input always has a slot; fail explicitly if an invalid caller exhausts it. Copy tuples on output; never write into previous or engine input.

```typescript
const grid:GraphPosition[]=Array.from({length:20},(_,index)=>
  [(index%5-2)*2.5,3-Math.floor(index/5)*2,0]);
const preset:GraphPositions={A:[-5,1,0],B:[-2.5,3,0],C:[-2.5,-1,0],
  D:[0,1,0],E:[2.5,1,0],F:[5,-3,0]};
export function reconcileGraphPositions(nodes:readonly GraphNode[],previous:GraphPositions):GraphPositions {
  const next:Record<string,GraphPosition>={};
  const ordered=[...nodes].sort((a,b)=>a.creationOrder-b.creationOrder);
  for(const node of ordered) {
    const p=previous[node.id];
    if(p && p[2]===0 && p.every(Number.isFinite) && Math.abs(p[0])<=10 && Math.abs(p[1])<=10)
      next[node.id]=[p[0],p[1],0];
  }
  const free=(p:GraphPosition)=>Object.values(next).every(q=>q[0]!==p[0] || q[1]!==p[1]);
  for(const node of ordered) {
    if(next[node.id])continue;
    const authored=preset[node.id];
    const p=authored && free(authored) ? authored : grid.find(free);
    if(!p)throw new Error('No graph layout slot is available.');
    next[node.id]=[p[0],p[1],0];
  }
  return next;
}
export function parseGraphPosition(x:string,y:string):Validation<GraphPosition> {
  const a=Number(x),b=Number(y);
  if(!x.trim() || !y.trim() || !Number.isFinite(a) || !Number.isFinite(b) ||
    Math.abs(a)>10 || Math.abs(b)>10 || !Number.isInteger(a*2) || !Number.isInteger(b*2))
    return {ok:false,message:'Use X and Y from −10 to 10 in 0.5 steps.',field:'position'};
  return {ok:true,value:[a,b,0]};
}
```

- [x] Extract the existing ValueNode implementation into ScenePrimitives.tsx as SceneNode. Its public props replace heap item/index assumptions with a label and shape; retain the existing geometries, material parameters, click propagation and Html portal behavior:

```typescript
export type SceneNodeProps={
  id:string;position:[number,number,number];label:ReactNode;shape:'sphere'|'box';
  selected:boolean;active:boolean;color?:string;labelClassName?:string;
  select(id:string):void;register?:(mesh:Mesh|null)=>void;
  labelPortal:RefObject<HTMLDivElement>;
};
export function SceneNode(props:SceneNodeProps) {
  return <mesh ref={props.register} position={props.position}
    onClick={event=>{event.stopPropagation();props.select(props.id);}}>
    {props.shape==='sphere' ? <sphereGeometry args={[0.45,24,16]}/> : <boxGeometry args={[0.7,0.7,0.7]}/>}
    <meshStandardMaterial color={props.selected ? '#a5b4fc' : props.active ? '#f5d49a' : props.color??'#dbe5f5'} roughness={0.38} metalness={0.08}/>
    <Html center portal={props.labelPortal} style={{pointerEvents:'none'}}>
      <span aria-hidden="true" className={`node-label ${props.selected?'is-selected':''} ${props.labelClassName??''}`}>{props.label}</span>
    </Html>
  </mesh>;
}
```

Keep ReactNode/RefObject and Mesh imports type-only; this module has no lesson-engine import.

- [x] Move CameraActions, ContextLoss, SceneBoundary and fallbackText from HeapScene into that same shared module with their existing bodies. Build SceneFrame by moving the existing Canvas/Bounds/lighting/OrbitControls/portal wrapper unchanged except for children, refs, selectedId and floorY props:

```typescript
export type SceneFrameProps={
  children:ReactNode;meshRefs:RefObject<Map<string,Mesh>>;labelPortal:RefObject<HTMLDivElement>;
  selectedId:string|undefined;fitRequest:number;focusRequest:number;
  reducedMotion:boolean;floorY:number;unavailable():void;
};
```

Inside Bounds render props.children, then CameraActions with the supplied refs/selection. The portal div stays after Canvas so its DOM target exists before the asynchronous scene root. Keep demand rendering, dpr[1,1.5], resize.scroll=false, camera[0,2,17]/42°, Bounds margin1.3 and maxDuration0/0.3, orbit limits3…35, cleanup listeners and the fallback callback. Floor stays outside Bounds; use props.floorY.

Update both existing heap node call sites to SceneNode. Tree uses sphere, label ID/value, and the same registered mesh. Array uses box, label ID/value/index and labelClassName `array-label`. HeapScene retains its two refs and wraps HeapStructures with SceneFrame, floorY −3.65. Retain exact heap positions, links, colors and keys. Run the heap suite and a real Insert1→step3→H8/Focus/Fit check before proceeding.

- [x] Create GraphScene with SceneAdapterProps<GraphState> plus GraphPositions and the existing fitRequest/focusRequest/unavailable callbacks. It owns the same mesh-map and label-portal refs, and uses SceneFrame with floorY −10.65 so every allowed graph Y coordinate remains above the floor. Node positions come only from props.positions. Register node meshes for Focus; do not register an invented mesh for edges.

Graph edges use existing Drei Line between endpoint positions, key=edge.id, color selected indigo/examined amber/ordinary neutral, width3/3/1.5. onClick stops propagation and selects edge.id. Graph nodes use SceneNode sphere, label ID plus nodeStatus, current/event-affected flags and a status base color. Colors: undiscovered `#dbe5f5`, discovered `#d1d5f9`, frontier `#b9c8fa`, processed `#c7e2cf`; the shared selected/current overrides stay visible. Include state text in labels as well as color.

```tsx
<SceneNode key={node.id} id={node.id} shape="sphere" position={positions[node.id]}
  selected={selectedIds.includes(node.id)} active={snapshot.state.currentId===node.id || snapshot.event.affectedIds.includes(node.id)}
  label={<><strong>{node.id}</strong><span>{nodeStatus(snapshot.state,node.id)}</span></>}
  color={statusColors[nodeStatus(snapshot.state,node.id)]} select={select} labelPortal={labelPortal}
  register={mesh=>{if(mesh)meshRefs.current.set(node.id,mesh);else meshRefs.current.delete(node.id);}}/>
```

`statusColors` is the local mapping just specified; include Current amber and both status fallbacks explicitly. Rendering never calls editGraph or mutates player data. Graph runtime picking/labels are verified with the caller in Task 4; no temporary product route is needed.

Run `npm test`, typecheck and build. Commit `refactor: share scene primitives for heap and graph` after the heap runtime check and output inspection.

```text
git add src/components/ScenePrimitives.tsx src/lessons/heap/HeapScene.tsx src/lessons/graph/layout.ts src/lessons/graph/GraphScene.tsx tests/graph-layout.test.ts package.json
git commit -m "refactor: share scene primitives for heap and graph"
```

### Task 4: graph editor, semantic frontiers and navigation

**Files:** Create GraphPlayground.tsx, GraphViews.tsx, LessonNavigation.tsx and app/graph/page.tsx; modify LessonControls.tsx, LessonPlayground.tsx and globals.css.
**Consumes:** Task 1 engine/content, Task 2 hook returns, Task 3 layout/scene. Use current core.currentSnapshot and shared PlaybackControls/InspectionPanel.
**Produces:** Working /graph and heap navigation; native editor, staged input replacement, stable selection and graph-specific semantic/code views.

- [x] Record browser RED that /graph is unavailable before adding the route. Then use the project's existing page/layout tokens and component patterns. Keep GraphScene dynamically imported with ssr:false as HeapScene is; semantic markup is the always-available accessible representation.

```tsx
// src/app/graph/page.tsx
import GraphPlayground from '../../components/GraphPlayground';
export const metadata={title:'Graph traversal · DSA Atlas'};
export default function Page(){return <GraphPlayground/>;}
```

```tsx
// src/components/LessonNavigation.tsx
'use client';
import {useEffect} from 'react';
export function LessonNavigation({active}:{active:'heap'|'graph'}) {
  useEffect(()=>{
    const restored=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
    window.addEventListener('pageshow',restored);
    return()=>window.removeEventListener('pageshow',restored);
  },[]);
  return <nav aria-label="Lessons">
    <a href="/" aria-current={active==='heap'?'page':undefined}>Heap</a>
    <a href="/graph" aria-current={active==='graph'?'page':undefined}>Graph</a>
  </nav>;
}
```

Mount navigation in both lesson mastheads; retain the existing brand/home link. Native links mount separate lesson components and reset transient state. Browser history can restore a live document, so the pageshow guard reloads only persisted restores to honor that accepted reset policy. Cost: Back/Forward starts a fresh lesson rather than instantly restoring its previous scene. This uses the [documented bfcache/pageshow lifecycle](https://web.dev/articles/bfcache); no cache-disabling headers or unload listener. Do not add a registry/router abstraction. Change InspectionPanel's empty text to `Select an item to inspect its state and relationships at this step.`

- [x] In GraphViews.tsx export `GraphSemanticViews({snapshot,selectedId,select})` with those exact typed props using Snapshot<GraphState>. One local node-button renderer sets aria-pressed, data-entity-id, data-view and label `Select node ${id}, ${nodeStatus(...)}`. Render these labeled sections from the selected snapshot:

| Accessible section | Content |
| --- | --- |
| Graph nodes and adjacency | Creation-ordered node buttons with state text and ordered neighbor buttons; empty: `This graph is empty. Add a node to begin.` |
| Graph edges | Edge buttons `Select edge E1, A to B`; selected/examined styling; empty: `No edges yet.` |
| BFS queue | Front → Back, zero-based position labels, first is Front; every ID selectable; empty text. |
| DFS stack | Bottom → Top, last is Top/current; each frame shows examined/total and next neighbor or Absent; every node selectable. |
| Discovery order | Ordered selectable node IDs; no invented F visit. |
| Backtracking | DFS completed node IDs in return order; visible after C returns. |

Only show the active algorithm's queue/stack, deriving the algorithm from state.algorithm or initial variables.algorithm. Resting says `Choose BFS or DFS and a start node.` Frame next-neighbor progress derives from orderedNeighbors and frame.nextNeighborIndex; do not reconstruct DFS from discovery order.

```tsx
{snapshot.state.frames.map((frame,index)=>{
  const neighbors=orderedNeighbors(snapshot.state,frame.nodeId);
  return <li key={frame.nodeId}>
    <button aria-pressed={selectedId===frame.nodeId} onClick={()=>select(frame.nodeId)}
      data-entity-id={frame.nodeId} data-view="frontier">
      {frame.nodeId} · {index===snapshot.state.frames.length-1?'Top':'Frame'}
    </button>
    <span>Neighbors examined {frame.nextNeighborIndex}/{neighbors.length}; next {neighbors[frame.nextNeighborIndex]?.nodeId??'Absent'}</span>
  </li>;
})}
```

- [x] Build GraphPlayground state and handlers. Initialize useLessonPlayer(graphEngine,createGraphPreset()), GraphPositions via reconcileGraphPositions, algorithmDraft bfs, startDraft empty, endpoint drafts empty, X/Y drafts empty, activeCommand GraphCommand|null, pending action, localError, dialog ref, and the existing heap pattern's view/motion/camera state. Copy its media listener and cleanup; useCallback for unavailable. A form draft never replaces activeCommand until a start succeeds.

```typescript
type PendingAction={kind:'start';command:GraphCommand}|{kind:'edit';input:GraphInput};
const apply=(action:PendingAction)=>{
  const before=lesson.player;
  const next=action.kind==='start' ? lesson.start(action.command)
    : lesson.replaceInput(action.input,activeCommand);
  if(action.kind==='start' && next.steps!==before.steps && !next.error)
    setActiveCommand(action.command);
  if(action.kind==='edit' && next.input!==before.input) {
    setPositions(previous=>reconcileGraphPositions(next.input.nodes,previous));
    if(!next.steps)setActiveCommand(null);
    if(!next.input.nodes.some(node=>node.id===startDraft))setStartDraft('');
  }
};
const request=(action:PendingAction)=>{
  lesson.pause();setLocalError(null);
  if(lesson.player.steps && lesson.player.ordinal>0 && lesson.player.ordinal<lesson.player.steps.length-1) {
    setPending(action);dialogRef.current!.showModal();
  } else apply(action);
};
const submitEdit=(raw:unknown)=>{
  lesson.pause();const result=editGraph(currentSnapshot(lesson.player).state,raw);
  if(!result.ok){setLocalError(result.message);return;}
  request({kind:'edit',input:result.value});
};
const submitTraversal=()=>{
  lesson.pause();const result=graphEngine.validateCommand({type:algorithmDraft,startId:startDraft},currentSnapshot(lesson.player).state);
  if(!result.ok){setLocalError(result.message);return;}
  request({kind:'start',command:result.value});
};
const keepTraversal=()=>{dialogRef.current!.close();setPending(null);};
const applyPending=()=>{
  const action=pending;dialogRef.current!.close();setPending(null);
  if(action)apply(action);
};
```

Commit detection deliberately uses input identity, not `!next.error`: deleting the start commits resting input with an explanatory error. An initial/trace failure preserves old input identity, so positions and activeCommand remain unchanged. After an invalid/cancelled operation, do not clear the old steps, selection or layout.

Use the native dialog unconditionally in the component tree; Keep receives initial focus. After cancellation, native close restores focus to the triggering control. Timer pauses before showModal, so the staged candidate cannot drift while the background is inert.

```tsx
<dialog ref={dialogRef} aria-labelledby="replace-title" onCancel={event=>{event.preventDefault();keepTraversal();}}>
  <h2 id="replace-title">Replace this traversal?</h2>
  <p>This starts a new traversal. Keep traversal retains the paused steps.</p>
  <button autoFocus onClick={keepTraversal}>Keep traversal</button>
  <button className="primary" onClick={applyPending}>Apply</button>
</dialog>
```

- [x] Add native operation forms with noValidate so every submission reaches the engine/parser and cancellation handlers rather than relying only on browser constraints. Endpoint/start selects have an empty `Choose a node` option and options from current nodes. Buttons use type=button unless submitting their own form; forms are siblings, never nested.

| Control/name | Handler |
| --- | --- |
| Add node | submitEdit({type:'add-node'}) |
| Remove selected node | submitEdit({type:'remove-node',id:selectedId}); disabled unless selection is an existing node |
| From node / To node, Connect nodes | submitEdit({type:'connect',a:fromDraft,b:toDraft}) |
| Disconnect selected edge | submitEdit({type:'disconnect',edgeId:selectedId}); disabled unless an edge is selected |
| Traversal (BFS/DFS), Start node, Start traversal | submitTraversal; disable start when no nodes exist |
| Node X / Node Y, Move selected node | parseGraphPosition, then setPositions for that surviving selected node only; local error on invalid coordinates |
| Reset layout | reconcileGraphPositions(snapshot.state.nodes,{}) and Fit request; do not alter player or activeCommand |

Coordinate drafts synchronize from the selected node's current position when selection/positions change, and clear for an edge/no selection. A valid move does not pause playback or modify steps/ordinal; invalid coordinates change neither layout nor player. Reset layout is available even after user-created overlaps. Fit/Focus requests are presentation-only; Focus requires a node and working 3D. Fit is disabled for an empty graph or semantic/unavailable view.

```typescript
const moveSelected=()=>{
  if(!selectedId || !snapshot.state.nodes.some(node=>node.id===selectedId))return;
  const point=parseGraphPosition(xDraft,yDraft);
  if(!point.ok){setLocalError(point.message);return;}
  setLocalError(null);setPositions(previous=>({...previous,[selectedId]:point.value}));
};
```

- [x] Assemble the established panel layout: intro `Follow the frontier.`, editor, scene/view controls, shared execution controls/counters/explanation, GraphSemanticViews, InspectionPanel and authored pseudocode. Main exposes data-ordinal/data-playing/data-selected-id as the heap does. Derive every execution field from currentSnapshot(player). A current-run caption comes from snapshot variables, not algorithm/start form drafts. Highlight the current code line with aria-current=step. Explain near code: `BFS distances are shortest in an unweighted graph. DFS tree depth describes the discovered path, which can be longer.` Do not infer a C-path comparison after changing the preset/start.

Render a role=alert for localError or player.error; local errors take precedence and clear on successful new submission. Changing selected ID after a deletion must not leave a native select displaying a nonexistent endpoint: clear invalid from/to drafts only after a committed input change. Form validation is repeated by the engine at apply time through the shared transition.

Use existing panel/item/scene/playback tokens. Add only wrapping nav/editor/frontier/dialog rules; native anchors need 44 px targets as buttons do. Preserve scene/node label sizes and constrain dialog to the viewport:

```css
.masthead { height:auto; min-height:80px; flex-wrap:wrap; gap:8px 16px; padding:12px 0; }
.masthead nav,.graph-editor form { display:flex; flex-wrap:wrap; align-items:center; gap:8px; }
.masthead nav a { display:inline-flex; align-items:center; min-height:44px; padding:8px; color:var(--ink); }
.masthead nav a[aria-current="page"] { color:var(--selected); font-weight:700; }
.graph-editor { display:flex; flex-direction:column; gap:12px; }
.graph-editor label { display:flex; flex-direction:column; gap:4px; font-size:12px; color:var(--muted); }
.graph-editor input,.graph-editor select { max-width:100%; padding:8px; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--ink); }
.graph-frontier { display:flex; flex-wrap:wrap; gap:8px; padding:0; list-style:none; }
.graph-frontier li { display:flex; flex-direction:column; gap:4px; }
dialog { max-width:min(440px,calc(100vw - 32px)); border:1px solid var(--border); border-radius:16px; padding:24px; color:var(--ink); background:var(--surface); }
dialog::backdrop { background:#17203366; }
@media(max-width:700px) {
  .masthead { height:auto; min-height:64px; }
  .masthead nav { order:1; flex-basis:100%; }
}
```

Additional status styling must preserve text labels; never encode node state with color alone. Native coordinate/select labels and all buttons remain reachable by keyboard at 360 px.

- [x] Browser GREEN: start BFS A, select B at5 before enqueue, seek9 for queue B,C, complete31/F unvisited; select C distance1. Start DFS A, seek13/16/18 and inspect frames/C return/E discovery, complete26/C depth3. Rewind and assert exact state/counters/code. During replay request an edit, Keep/Escape and confirm same paused ordinal/future; then Apply and confirm new paused run. Delete A, then all nodes; add G or the next retained ID and choose a new start. Move/reset nodes, choose unsent form values, and verify the active trace/caption do not change.

Run the full Node suite, typecheck and production build; commit `feat: add editable graph traversal playground` after browser feedback and fixes.

```text
git add src/components/GraphPlayground.tsx src/components/GraphViews.tsx src/components/LessonNavigation.tsx src/app/graph/page.tsx src/components/LessonControls.tsx src/components/LessonPlayground.tsx src/app/globals.css
git commit -m "feat: add editable graph traversal playground"
```

### Task 5: production verification, context and owner PR

**Files:** Create docs/reviews/003-graph-traversal.md and actual JSON/screenshots/probe source under docs/reviews/graph-traversal/. Update README, backlog, AGENTS.md, src/AGENTS.md, docs/architecture/invariants.md and this plan's checkboxes/status metadata.
**Consumes:** Completed graph/heap routes and all Node checks. **Produces:** Measured evidence, one fresh whole-branch review and one completed feature PR to development.

- [ ] Run the actual package checks and read their output. Record actual counts, dates and commands in the new report; do not forecast them from this plan.

```text
npm test
npm run typecheck
npm run build
python scripts/check-context.py
git diff --check
```

- [ ] Serve the production build and repeat the following real-browser journeys. Use the installed computer-use surface for UI and DOM reads; no application-store inspection or separate browser driver. Save evidence only after the displayed state matches the assertion.

| Journey | Expected proof |
| --- | --- |
| BFS A | Step5 B discovered but not queued; step9 queue B,C; final31 reached A–E, F Undiscovered, C shortest distance1. |
| DFS A | Step13 frames A1/B2/D2/C0; step16 C processed, D current, E undiscovered; step18 E discovered; final26 C tree depth3. |
| Rewind/selection | Nodes select across graph, adjacency/frontier and inspector; edges select across graph line, edge list and inspector. Previous/seek restore counters, frontier, code and text. Edges inspect endpoints; Focus only for nodes. |
| Input edit | Play then disconnect while intermediate; dialog pauses. Keep and Escape preserve displayed ordinal/frontier/future and return focus. Apply makes a new paused trace; old callbacks cannot move it. |
| Invalid/start deletion | Reversed duplicate/self-loop/full input error keeps current scene. Delete start A: valid edited resting scene, old future gone, explicit new start required. Delete all nodes: useful empty state; add uses retained ID counter. |
| Drafts/layout | Unsubmitted BFS/DFS/start choices do not change current code or caption. Move X/Y and Reset layout retain ordinal/counters/frontier. Use native keyboard controls and invalid-coordinate cases. |
| Playback/lifecycle | All three speeds, pause, completion, manual cancellation; simulated visibility if actual background switching is unavailable. Navigate graph→heap while playing, then Back/Forward: clean resting scenes, no old timer. If actual cached restoration cannot be observed, exercise persisted pageshow through an owned QA fixture and record that simulation separately. Check development Strict Mode once. |
| Fallback | Actual WEBGL_lose_context and before-boot WebGL creation failure still allow selection, graph edits and playback in semantic views. Fit/Focus are appropriately disabled. |
| Heap regression | Insert1, H8 at3/index3/counts1/1; extraction H1 result, H7 at4/index2/counts2/1; Play/Pause, Focus/Fit and fallback still work after scene extraction. |

Use the graph's own data-ordinal/data-playing/data-selected-id and visible controls for UI assertions. Pure tests establish trace identity/immutability; DOM evidence establishes the visible state, not private React state.

- [ ] At 360×780 and 1280×720, inspect screenshots and DOM rectangles: no page overflow, no intersecting default node labels, every control target at least 44 px, readable frontier/dialog/code and keyboard focus. Cover the preset and supported maximum 20-node/40-edge graph. Record manual user-overlap recovery separately from default layout readability.
- [ ] Adapt the existing committed heap browser probe as temporary QA instrumentation for /graph. Measure at least 40 trusted selection/Next/Previous actions on the maximum graph, event capture to second animation frame, and confirm each expected DOM response. Record p95/max/device/browser, separating teaching delays from feedback. During active camera orbit, record rendering cadence as an observation against the 60 fps laptop/30 fps phone aims; rAF cadence is a proxy, not proof of GPU/display completion. Do not claim phone coverage without a real phone run. Remove only this task's temporary public probe/fault files before committing; retain probe source in the review evidence directory.
- [ ] Ask a target learner to explain discovery versus processing and why C's BFS/DFS predecessor path differs on a fresh graph if one is available. Record actual observed understanding or explicitly record that the check did not happen; do not substitute a model for a learner or claim educational efficacy.
- [ ] Add actual src/lessons/graph/engine.ts to BOTH literal contract mirrors only after that file exists. Keep existing protected paths; preserve architecture artifact/evidence bytes. Route README/source context to both implemented lessons and the measured report, record accepted spec/plan provenance, and reconcile the backlog to required learning/tutor/release work. No speculative contract paths or hook/registry installs.
- [ ] Perform one fresh whole-branch review under the Native workflow, covering the complete range from development merge-base. Fix Critical/Important findings once with a failing regression followed by GREEN and the full suite. Record unfixed/minor findings and their costs in the durable report. Do not request a second review of the same fix pass. Review includes shared heap effects, edit rollback and cancellation—not just the graph's happy path.
- [ ] Commit verified source fixes and evidence/context, then push the existing feature branch. Reuse an existing PR for this exact head/base if one exists; otherwise use the GitHub connector to open the following single completed PR. Always attach its URL to the chat; retain the managed worktree for owner feedback. Never merge without the owner.

```json
{
  "repository_full_name":"Exilitys/DSAVisualizer",
  "base":"development",
  "head":"feature/graph-traversal",
  "title":"Add editable graph traversal with BFS and DFS",
  "body":"Learners can edit an undirected graph and compare FIFO BFS with frame-based DFS, inspect the frontier, and rewind each discovery and return. Heap and graph reuse playback, inspection and scene primitives. This PR bundles the accepted spec, Native plan, implementation and verification evidence. Actual checks and coverage limits are recorded in docs/reviews/003-graph-traversal.md. Tutor, challenges, persistence and final release verification remain required work.",
  "draft":false
}
```

Record the real PR URL in report/backlog after creation and push that metadata to the same PR. Finish the Native ledger and preserve its rulings in the durable report/final response before cleaning task-owned scratch. Report any blocked cleanup honestly; the feature worktree remains available.

## Self-review and handoff

Coverage: spec model/algorithm/edit contracts map to Task1; shared replacement and rollback to Task2; primitives/layout to Task3; editor/confirmation/semantic/navigation to Task4; runtime, device evidence, limits/context/review/PR to Task5. Each Review Focus case has its owning checks above. Baseline is 19 tests; final count is measured during execution.

Interface check: both algorithms implement one graphEngine and one GraphState; input replacement returns the same PlayerState shape as the existing player. Hook start/replacement return the state they publish. Graph holds activeCommand; the player does not gain lesson-specific command fields. GraphViews/GraphScene read the same snapshot; positions never enter the engine. The initial trace's algorithm/start live in variables while its state remains the accepted resting state.

Self-review corrected layout spacing to 2.5 so authored/default coordinates obey the editor's 0.5 step, made beyond-Z neighbor ordering an explicit test, and specified commit detection independent of error presence for deleted starts. Navigation wraps below the mobile masthead; the scene floor is below every allowed graph coordinate while preserving the heap's existing floor. Public trace/resting creation validates input even outside player calls. No accepted scope/behavior was changed by these implementation details.

Planning verification checks the spec acceptance record, document pointers, contract mirrors, diagram binding, plan placeholders and whitespace. Application tests/builds/browser checks above are execution steps, not results claimed by this plan.

Planning receipts on 15 October 2026: the accepted-spec mechanical checker passed;
the five-task/code-fence/unresolved-marker check passed; repository context and
Git whitespace checks passed. No product source or dependency was changed.

Execution receipt, 15 October 2026: Tasks 1–4 are implemented and verified. Task 5 evidence is recorded in [the review report](../../reviews/003-graph-traversal.md); fresh review and owner PR delivery follow before completion.
