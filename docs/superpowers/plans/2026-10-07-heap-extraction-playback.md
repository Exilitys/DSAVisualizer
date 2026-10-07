# Heap Extraction and Autoplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the owner's selected Native execution. Implement task by task with TDD and one fresh whole-branch review. Steps use checkbox (`- [ ]`) syntax.

**Status:** Draft for owner review, 7 October 2026.
**Goal:** Extract the minimum, inspect its stable identity, and replay either heap operation with shared cancellable autoplay.
**Architecture:** Extend the heap engine's immutable state with its result. A browser-only playback controller schedules cursor changes through a generic React binding; pure engine/player contracts remain unchanged. Move shared control markup out of the heap binding so graph can reuse it.
**Tech Stack:** Existing pinned Next.js 16.3.8, React 19.3.0, R3F 9.8.1, Drei 10.7.9, Three 0.186.1, TypeScript 5.9.3, Node 24.15.0. No new dependencies.
**Spec:** [Accepted slice 002](../../specs/002-heap-extraction-playback.md), version 1 at `339de4b`, and [technical contracts](../../prd/prd.md).
**Execution:** Native, preserved from the owner's prior selection. This plan needs review before product code changes.

## Global Constraints

- `HeapCommand = {type:'insert'; value:number} | {type:'extract'}`.
- `HeapState = HeapInput & {result: HeapItem | null}`; heap version `1.1.0`.
- "Replacement and last-slot removal are atomic."
- "Extraction never increments or resets `nextId`."
- "The finish/restart boundary rule remains identical for both heap commands."
- "The pure engine and player remain independent of clocks, React, and renderer resources."
- "Play advances one existing ordinal per tick."
- Speeds 0.5×/1×/2× use 2000/1000/500 ms per semantic step.
- "Previous, Next, seek, Restart, and operation submission stop playback before changing the cursor/run."
- "Leaving the document hidden pauses playback, with no automatic resume."
- Result selection remains available in semantic mode; Focus is disabled for a result outside the active heap.
- Retain the nine-step insertion fixture, broken-trace guards, keyboard paths, 360/1280 px layout, and 100 ms p95 feedback target.
- Graph, tutor, challenges, persistence, registry setup, and Git hooks stay outside this implementation.

## Review Focus

1. A timeout already queued when Pause, seek, Restart, or a new command occurs must not move the replacement cursor/run. Task 2 fires cancelled callbacks deliberately.
2. Speed changes and React effect cleanup must leave one live schedule; Strict Mode setup must remain usable. Tasks 2/3 cover disposal/reuse and browser behavior.
3. The removed result must remain inspectable without an active index, disappear on a new run, and return to the tree on Restart. Tasks 1/3 cover identity and selection.
4. Equal children prefer the left; a lone child contributes only its parent comparison. Task 1 uses literal inputs and counters.
5. Empty/full heaps, invalid entry while playing, hidden documents, and WebGL loss must preserve usable controls. Tasks 1/2/4 cover these conditions.

## File map

| File | Change |
| --- | --- |
| src/lessons/heap/engine.ts | Extract command, immutable result, inspection, version. |
| src/components/playback.ts | Injected cancellable scheduling, no React/DOM/heap imports. |
| src/components/useLessonPlayer.ts | Browser timer/visibility lifecycle and generic player actions. |
| src/components/LessonControls.tsx | Shared playback and inspection markup, no heap imports. |
| src/components/LessonPlayground.tsx | Heap operation buttons, result card, shared binding. |
| src/lessons/heap/content.ts | Extraction pseudocode and snapshot-only explanations. |
| src/app/globals.css | Result card and native speed control layout only. |
| tests/heap-slice.test.ts | Existing regression suite plus extraction. |
| tests/playback.test.ts, package.json | Native scheduler checks included in `npm test`. |
| docs/reviews/002-heap-extraction-playback.md | Actual evidence and fresh review results. |
| README.md, docs/backlog.md, AGENTS.md, docs/architecture/invariants.md | Actual commands, source pointers, progress. |

Reuse the existing worktree if clean; make implementation branch
`feature/heap-extraction-playback` from the accepted plan ref. The feature PR
targets `development`; the owner merges. Keep the accepted architecture bytes.

### Task 1: deterministic extraction and result inspection

**Files:** Modify engine.ts and tests/heap-slice.test.ts.
**Consumes:** Existing `HeapInput`, `HeapItem`, `Snapshot`, `deepFreeze`, validators.
**Produces:** Existing `heapEngine` with the new command/state and version;
`createPreset()` and pure player signatures remain unchanged.

- [ ] Write the fixture and run `npm test` before extending the engine. Expected: extraction rejection or wrong trace, not an unrelated import error.

```typescript
test('extracts the preset minimum in seven exact snapshots', () => {
  const input = createPreset();
  const steps = heapEngine.createTrace(input, {type:'extract'});
  assert.deepEqual(steps.map(s=>s.event.type),
    ['initial','replace','compare','compare','swap','compare','complete']);
  assert.deepEqual(steps.map(s=>[s.counters.comparisons,s.counters.swaps]),
    [[0,0],[0,0],[1,0],[2,0],[2,1],[3,1],[3,1]]);
  assert.deepEqual(steps[6].state.items.map(i=>i.value),[5,7,6,12,9,8]);
  assert.deepEqual(steps[6].state.items.map(i=>i.id),['H3','H2','H7','H4','H5','H6']);
  assert.deepEqual(steps[4].state.result,{id:'H1',value:3});
  assert.equal(steps[4].state.items.findIndex(i=>i.id==='H7'),2);
  assert.equal(steps[6].state.nextId,8);
  assert.equal(heapEngine.inspect(steps[4],'H1')!.fields.find(f=>f.label==='Index')!.value,'Absent');
  assert.equal(steps[0].state.result,null);
  assert.ok(Object.isFrozen(steps[4].state.result));
  assert.deepEqual(input.items.map(i=>i.value),[3,7,5,12,9,8,6]);
  assert.deepEqual(steps,heapEngine.createTrace(createPreset(),{type:'extract'}));
});
```

- [ ] Extend concrete types; set version `1.1.0`; add `result:null` to initial and insertion snapshot state. In `validateCommand`, accept `{type:'extract'}` after the object check, before insert-value/capacity checks. Keep insert checks unchanged.

```typescript
if (!object(raw)) return {ok:false,message:'Choose a valid heap operation.',field:'command'};
if (raw.type==='extract') return {ok:true,value:{type:'extract'}};
// Existing insert value, capacity, and ID-exhaustion checks follow.
```
- [ ] Split the existing insertion loop into private `createInsertTrace(input, command)` accepting a validated insert command. Public `createTrace` validates input/command once and dispatches by command.type. Use the existing loop and emitter unchanged except its result field.

```typescript
const command = validCommand.value;
return command.type==='insert'
  ? createInsertTrace(validInput.value,command)
  : createExtractTrace(validInput.value);
```

- [ ] Add private `createExtractTrace(input:HeapInput): readonly Snapshot<HeapState>[]`. Its complete emitter and loop are:

```typescript
const items=input.items.map(item=>({...item}));
let result:HeapItem|null=null;
let index:number|null=null;
let chosenChildId:string|null=null;
let comparisons=0, swaps=0;
const initial=createInitialSnapshot(input);
const steps:Snapshot<HeapState>[]=[deepFreeze({...initial,
  event:{...initial.event,explanationKey:'heap.extract.initial'}})];
const emit=(type:string,ids:string[],operands:(string|number)[],code:string,
  key=`heap.extract.${type}`)=>{
  const ordinal=steps.length;
  steps.push(deepFreeze<Snapshot<HeapState>>({
    id:`s${ordinal}`,ordinal,
    state:{items:items.map(item=>({...item})),nextId:input.nextId,
      result:result ? {...result} : null},
    event:{type,affectedIds:ids,operands,codeLineId:code,explanationKey:key},
    variables:{index,removedId:result?.id??null,
      replacementId:index===null ? null : items[index].id,chosenChildId},
    counters:{comparisons,swaps},
    invariants:[{id:'heap-shape',status:'holds'},
      {id:'heap-order',status:ordered(items)?'holds':'repairing'}]
  }));
};
if (!items.length) {
  emit('complete',[],[],'return','heap.extract.empty');
  return deepFreeze(steps);
}
result={...items[0]};
const last=items.pop()!;
if (items.length) items[0]=last;
index=items.length ? 0 : null;
emit('replace',items.length ? [result.id,last.id] : [result.id],
  items.length ? [result.value,last.value] : [result.value],'replace');
while(index!==null && 2*index+1<items.length) {
  const left=2*index+1, right=left+1;
  let chosen=left;
  if(right<items.length) {
    chosen=items[left].value<=items[right].value ? left : right;
    chosenChildId=items[chosen].id;
    comparisons++;
    emit('compare',[items[left].id,items[right].id],
      [items[left].value,items[right].value],'choose-child','heap.extract.choose-child');
  } else chosenChildId=items[left].id;
  const parent=items[index], child=items[chosen];
  comparisons++;
  emit('compare',[parent.id,child.id],[parent.value,child.value],
    'compare-child','heap.extract.compare-child');
  if(child.value>=parent.value) break;
  const before=index;
  [items[index],items[chosen]]=[child,parent];
  swaps++;
  index=chosen;
  emit('swap',[parent.id,child.id],[before,index,parent.value,child.value],'swap');
  chosenChildId=null;
}
emit('complete',[result.id],[result.value],'return');
return deepFreeze(steps);
```

- [ ] Extend inspect's missing-active-item branch to return the result's value,
location `Extracted minimum`, and absent index/parent/children, otherwise null.
Keep active-item inspection unchanged. Add a `Location: Active heap` field there.

```typescript
if (index<0) {
  const result=snapshot.state.result;
  if (!result || result.id!==id) return null;
  return {id,label:`Item ${id}`,fields:[
    {label:'Value',value:String(result.value)},
    {label:'Location',value:'Extracted minimum'},
    ...['Index','Parent','Left child','Right child'].map(label=>({label,value:'Absent'}))
  ]};
}
```
- [ ] Add literal edge assertions before implementing their missing behavior:

```typescript
const empty=heapEngine.createTrace({items:[],nextId:8},{type:'extract'});
assert.deepEqual(empty.map(s=>s.event.type),['initial','complete']);
assert.equal(empty[1].state.result,null);
assert.deepEqual(empty[1].counters,{comparisons:0,swaps:0});
const one=heapEngine.createTrace({items:[{id:'H7',value:99}],nextId:8},{type:'extract'});
assert.deepEqual(one.map(s=>s.event.type),['initial','replace','complete']);
assert.deepEqual(one[2].state.items,[]);
assert.deepEqual(one[2].state.result,{id:'H7',value:99});
const equalInput={items:[1,4,4,8,6,7,9].map((value,i)=>({id:`H${i+1}`,value})),nextId:8};
const equal=heapEngine.createTrace(equalInput,{type:'extract'});
assert.equal(equal[2].variables.chosenChildId,'H2');
assert.deepEqual(equal.at(-1)!.state.items.map(i=>i.value),[4,6,4,8,9,7]);
assert.deepEqual(equal.at(-1)!.counters,{comparisons:4,swaps:2});
const lone=heapEngine.createTrace({items:[1,5,7].map((value,i)=>({id:`H${i+1}`,value})),nextId:4},{type:'extract'});
assert.deepEqual(lone.at(-1)!.counters,{comparisons:1,swaps:1});
```

Also check `[0,99,99]` stops without a swap, a valid 15-item heap extracts,
result never shares an active ID, and subsequent insert allocates the retained
next counter. With the real player, select H1 as result, Restart restores H1 at
index 0; a new extract after completion clears that selection/result. Preserve
the existing incomplete-trace regression and insertion expectations.

- [ ] Run `npm test`, `npm run typecheck`, `npm run build`; expected: all green, existing insertion usable. Commit `feat: add deterministic heap extraction and result inspection`.

### Task 2: shared cancellable playback controller

**Files:** Create src/components/playback.ts and tests/playback.test.ts; modify package.json test script to `node --test tests/heap-slice.test.ts tests/playback.test.ts`.
**Consumes:** A current run identity/cursor, an ordinal publisher, injected scheduling.
**Produces:** `PlaybackSpeed`, `PlaybackStatus`, `PlaybackCursor`, `Schedule`, and `createPlayback(options)` below. No React, DOM, engine, or clock imports in this file.

- [ ] Write real-player/fake-scheduling tests first. A controllable schedule records callback and requested delay; firing a cancelled callback deliberately reproduces late delivery. Assert cursor/run effects rather than mock-call counts.

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayback} from '../src/components/playback.ts';
import {createPlayer,startCommand,seek} from '../src/core/player.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';

function setup() {
  let player=startCommand(createPlayer(heapEngine,createPreset()),heapEngine,{type:'insert',value:1});
  const jobs:{delay:number;callback:()=>void;cancelled:boolean}[]=[];
  const playback=createPlayback({
    read:()=>({run:player.steps,ordinal:player.ordinal,lastOrdinal:player.steps!.length-1}),
    advance:ordinal=>{player=seek(player,ordinal);},
    schedule:(delay,callback)=>{const job={delay,callback,cancelled:false};jobs.push(job);return()=>{job.cancelled=true;};},
    changed:()=>{}
  });
  return {playback,jobs,read:()=>player,write:(next:typeof player)=>{player=next;}};
}
test('a cancelled tick cannot move a manual cursor or replacement run',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);const old=s.jobs[0];
  s.playback.pause();s.write(seek(s.read(),4));old.callback();
  assert.equal(s.read().ordinal,4);
  s.playback.play();const previousRun=s.jobs.at(-1)!;
  s.playback.pause();
  const replacement=startCommand(seek(s.read(),0),heapEngine,{type:'extract'});
  s.write(replacement);previousRun.callback();
  assert.equal(s.read().steps,replacement.steps);
  assert.equal(s.read().ordinal,1);
});
test('speed reschedules and only the new tick advances once',()=>{
  const s=setup();s.playback.play();assert.equal(s.playback.status().playing,true);assert.equal(s.jobs[0].delay,1000);
  s.playback.setSpeed(2);assert.equal(s.jobs.at(-1)!.delay,500);
  s.jobs[0].callback();assert.equal(s.read().ordinal,1);
  s.jobs.at(-1)!.callback();assert.equal(s.read().ordinal,2);
  s.playback.setSpeed(.5);assert.equal(s.jobs.at(-1)!.delay,2000);
});
```

Further tests: Play without a run and at completion does nothing; replay from 0
progresses one ordinal; final tick selects completion and stops; repeated Play
does not create two advancing callbacks; changed run or manual cursor without
Pause halts rather than overwrites; invalid speeds preserve status; disposal
invalidates old ticks; the same controller can be used by effect setup again.
Run `npm test`. If module loading fails first, add an importable shell with the
declared types and no-op methods returning `{playing:false,speed:1}` from status.
Run again; expected assertion RED on playing status. An import error does not
count as the behavioral RED gate.

- [ ] Implement the controller. The cancellation generation and captured run/cursor
protect even a callback that the browser has already queued:

```typescript
export type PlaybackSpeed=.5|1|2;
export type PlaybackStatus={playing:boolean;speed:PlaybackSpeed};
export type PlaybackCursor={run:object|null;ordinal:number;lastOrdinal:number};
export type Schedule=(delayMs:number,callback:()=>void)=>()=>void;
type Options={read():PlaybackCursor;advance(ordinal:number):void;
  schedule:Schedule;changed(status:PlaybackStatus):void};

export function createPlayback(options:Options) {
  let playing=false, speed:PlaybackSpeed=1, generation=0;
  let cancel:(()=>void)|null=null;
  const status=():PlaybackStatus=>({playing,speed});
  const notify=()=>options.changed(status());
  const invalidate=()=>{generation++;cancel?.();cancel=null;};
  const pause=()=>{playing=false;invalidate();notify();};
  const arm=()=>{
    if(!playing) return;
    const scheduled=options.read();
    if(!scheduled.run || scheduled.ordinal>=scheduled.lastOrdinal){pause();return;}
    const token=generation;
    cancel=options.schedule(1000/speed,()=>{
      if(!playing || token!==generation) return;
      cancel=null;
      const current=options.read();
      if(current.run!==scheduled.run || current.ordinal!==scheduled.ordinal){pause();return;}
      const next=current.ordinal+1;
      options.advance(next);
      if(!playing || token!==generation) return;
      if(next>=current.lastOrdinal) pause(); else arm();
    });
  };
  return {
    status,
    play(){
      const cursor=options.read();
      if(playing || !cursor.run || cursor.ordinal>=cursor.lastOrdinal) return;
      playing=true;invalidate();notify();arm();
    },
    pause,
    setSpeed(next:PlaybackSpeed){
      if(![.5,1,2].includes(next)) return;
      invalidate();speed=next;notify();if(playing) arm();
    },
    dispose(){playing=false;invalidate();}
  };
}
```

`dispose` cancels silently to avoid publishing into an unmounted React component.
It is cancellation, not a permanent poison flag: Strict Mode cleanup/setup can
reuse the controller. A later `play()` captures a new generation. Do not use an
elapsed-time catch-up loop or setInterval with accumulating callbacks.

- [ ] Run `npm test` and `npm run typecheck`; expected all tests green. Commit `feat: add shared cancellable lesson playback`.

### Task 3: generic browser binding and heap operation UI

**Files:** Create useLessonPlayer.ts and LessonControls.tsx; modify LessonPlayground.tsx, heap/content.ts, globals.css, and heap-slice tests for content.
**Consumes:** Task 1 engine/result, Task 2 controller, pure `createPlayer/currentSnapshot/seek/startCommand/selectEntity`.
**Produces:** `useLessonPlayer<I,C,S>(engine:LessonEngine<I,C,S>, initial:unknown)` returning `player`, `playback`, `go`, `start`, `select`, `play`, `pause`, `setSpeed`; shared `PlaybackControls` and `InspectionPanel` exports.

- [ ] Before wiring UI, add content assertions: extraction child-choice text names 7/5 and H3; swap explanation names 6 moving down because 5 is smaller; empty completion invents no result; compare code IDs select the two distinct extraction lines. Run `npm test`; expected RED until authored content exists.

```typescript
test('extraction content follows the chosen snapshot',()=>{
  const t=heapEngine.createTrace(createPreset(),{type:'extract'});
  assert.match(explainStep(t[2]),/7.*5.*H3/s);
  assert.match(explainStep(t[4]),/6.*5/s);
  assert.equal(getPseudocode(t[2]).some(line=>line.id===t[2].event.codeLineId),true);
  assert.equal(t[2].event.codeLineId,'choose-child');
  assert.equal(t[3].event.codeLineId,'compare-child');
  const empty=heapEngine.createTrace({items:[],nextId:8},{type:'extract'});
  assert.match(explainStep(empty[1]),/no minimum/i);
});
```
- [ ] Add `getPseudocode(snapshot)` alongside existing `pseudocode` and `explainStep`. Extraction code lines:

```typescript
const extractionCode=[
  {id:'replace',text:'Remove the root and move the last item to its position'},
  {id:'choose-child',text:'Choose the smaller child; prefer the left on equality'},
  {id:'compare-child',text:'Compare the replacement with the chosen child'},
  {id:'swap',text:'If the child is strictly smaller, swap and continue down'},
  {id:'return',text:'Return the removed minimum and the ordered heap'}
];
export function getPseudocode(snapshot:Snapshot<HeapState>) {
  return snapshot.event.explanationKey.startsWith('heap.extract.') ? extractionCode : pseudocode;
}
```

Use explanationKey to branch before the existing insert event switch. For
`heap.extract.initial`, invite extraction. `replace` names result ID/value and
replacement ID/value, or the empty remainder for a single item. `choose-child`
uses operands 0/1 and `variables.chosenChildId`, explaining equality. `compare-child`
uses parent/child values; `swap` uses operands [oldIndex,newIndex,parentValue,childValue]
in that order. `empty` says no minimum exists; `complete` names the result and
ordered remainder. All explanations consume only the selected snapshot.

- [ ] Implement this generic hook. All logical transitions publish one immutable
PlayerState object to the latest-state ref and React state. No setter escapes the
hook, so a pending render cannot make a tick read a stale command/cursor.

```typescript
'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {LessonEngine} from '../core/lesson.ts';
import {createPlayer,seek,startCommand,selectEntity} from '../core/player.ts';
import type {PlayerState} from '../core/player.ts';
import {createPlayback} from './playback.ts';
import type {PlaybackStatus} from './playback.ts';

export function useLessonPlayer<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown) {
  const [player,setPlayer]=useState(()=>createPlayer(engine,initial));
  const current=useRef(player);
  const [playback,setPlayback]=useState<PlaybackStatus>({playing:false,speed:1});
  const publish=useCallback((next:PlayerState<I,S>)=>{
    current.current=next;setPlayer(next);
  },[]);
  const controller=useMemo(()=>createPlayback({
    read:()=>({run:document.hidden ? null : current.current.steps,
      ordinal:current.current.ordinal,
      lastOrdinal:current.current.steps ? current.current.steps.length-1 : 0}),
    advance:ordinal=>publish(seek(current.current,ordinal)),
    schedule:(delay,callback)=>{const id=window.setTimeout(callback,delay);return()=>window.clearTimeout(id);},
    changed:setPlayback
  }),[publish]);
  useEffect(()=>{
    setPlayback(controller.status());
    const hidden=()=>{if(document.hidden) controller.pause();};
    hidden();document.addEventListener('visibilitychange',hidden);
    return()=>{document.removeEventListener('visibilitychange',hidden);controller.dispose();};
  },[controller]);
  return {
    player,playback,
    go:(ordinal:number)=>{controller.pause();publish(seek(current.current,ordinal));},
    start:(raw:unknown)=>{controller.pause();publish(startCommand(current.current,engine,raw));},
    select:(id:string|null)=>publish(selectEntity(current.current,engine,id)),
    play:controller.play,pause:controller.pause,setSpeed:controller.setSpeed
  };
}
```

The lesson engine is stable for a mounted lesson binding. The future graph mounts
its own binding; do not add a plugin registry or graph editor now. Controller
construction does not call document/window; only browser actions/effects do.
Visibility is checked at callback read as well as the event listener. Cleanup
does not emit setState; setup publishes the reusable controller's current status.

- [ ] Move existing InspectionPanel markup unchanged to LessonControls.tsx. Move
PlaybackControls there and extend its props with `playback:PlaybackStatus`,
`play():void`, `pause():void`, `setSpeed(speed:PlaybackSpeed):void`. Add:

```tsx
<button disabled={!hasRun || (!playback.playing && ordinal===lastOrdinal)}
  onClick={playback.playing ? pause : play}>{playback.playing ? 'Pause' : 'Play'}</button>
<label htmlFor="playback-speed">Speed</label>
<select id="playback-speed" value={playback.speed}
  onChange={event=>setSpeed(Number(event.target.value) as PlaybackSpeed)}>
  <option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
</select>
```

Previous/Next/Restart/range callbacks use hook.go, which pauses synchronously.
Neither shared control file nor hook imports heap modules. Keep native labels,
44 px targets, current aria-valuetext, and one semantic selection identity.

- [ ] Replace the playground's local player setter/actions with the hook, while
keeping presentation flags/camera independent:

```tsx
const lesson=useLessonPlayer(heapEngine,createPreset());
const {player,go,select}=lesson;
const snapshot=currentSnapshot(player);
const insert=()=>lesson.start({type:'insert',value:draft.trim()==='' ? NaN : Number(draft)});
const extract=()=>lesson.start({type:'extract'});
const focusable=Boolean(player.selectedId && snapshot.state.items.some(item=>item.id===player.selectedId));
```

Add native `Extract minimum` beside Insert, both guarded by existing canStart.
Empty extraction is enabled. Use operation-region label `Heap operations`; keep
Value to insert and error alert. Pass playback/actions into shared controls.
Use `getPseudocode(snapshot)` and extraction title `Sift down`; insert title stays
`Sift upward`. Add `data-playing` to main for verification.

- [ ] Render the selectable result card after the view controls and before the
execution panel, outside Canvas, retaining inspection in
semantic mode. If result is nonnull, its button calls select(result.id), exposes
aria-pressed, and labels `Select extracted H1, value 3`. The empty extraction
completion displays `No minimum: the heap is empty.`; ordinary initial/insertion
snapshots display no extracted-result claim. Focus requires focusable as well as
3D availability. A selected result has no matching tree mesh, so do not send a
focus request. The semantic heap still renders only active items.

- [ ] Add only result-card/native-select styles to globals.css; reuse existing
tokens, pressed styles, and focus outline. Run logic/type/build checks and browser
extraction/result/rewind plus actual Play/Pause/speed/Strict Mode remount checks.
Expected: exact counters and no dead Play button after effect cleanup. Commit
`feat: connect extraction and shared playback controls`.

### Task 4: complete verification, fresh review, feature PR

**Files:** Create docs/reviews/002-heap-extraction-playback.md; update actual README,
backlog/context pointers and only source files with observed defects.
**Consumes:** Completed extraction, controller, generic hook, UI.
**Produces:** Actual test/browser evidence and owner-review PR to development.

- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, context guard, and
`git diff --check`. Expected all green; report actual counts and command outputs.
- [ ] Browser: extract preset; select H1 result; inspect absent index; seek 4,
select H7/index2 and counts2/1; Previous selects 3/counts2/0; Restart restores
seven original items and H1/index0. Verify insertion's step3/index3/counts1/1.
- [ ] Play at 1×, Pause, resume at 2×, finish, and confirm disabled Play at complete.
At 0.5× measure the 2000 ms cadence; teaching delay is not algorithm runtime.
While playing, seek/restart/submit an invalid value and confirm immediate pause.
Start another operation at 0/completion and verify old callbacks cannot move it.
- [ ] Repeat by keyboard, reduced motion, and semantic mode. At 360/1280 verify
result card, controls, pseudocode, and projected labels with screenshots and
rectangle checks. No separate 3D result object is created.
- [ ] Hide the test document and verify pause with no auto resume; test listener
cleanup/remount. Keep schedules scoped to the controller and remove temporary
fault/visibility probes from public before committing.
- [ ] Exercise WebGL loss/creation failure; controls and result remain usable.
Extract until empty; then extract once more (no invented result), insert a new
value (retained ID counter), and test duplicate equality and max-size rejection.
- [ ] Record device/browser, actual feedback samples, untested physical-phone and
screen-reader coverage, and whether a target learner explained a fresh child
choice. Do not claim educational efficacy from the engine test alone.
- [ ] Add actual `src/components/playback.ts` to both existing contract mirrors
once it exists. Preserve diagram bytes and curated prose. Reconcile source
commands and guide pointers; no hooks/registry install.
- [ ] Request the one fresh whole-branch review required by Native execution;
fix Critical/Important findings once with failing regression checks, then rerun
the full suite. Record minor deferrals. Push `feature/heap-extraction-playback`,
open/attach PR targeting development, and retain the worktree for owner feedback.

## Self-review and handoff

The four tasks cover accepted state/identity/trace behavior, timing cancellation,
result selection, content, browser failure paths, and source/context maintenance.
The shared interfaces above are named once and consumed consistently; no new
dependency or mutation of the pure player is needed. Existing insertion checks
remain part of the same suite. Review Focus cases have an owning test task.

Self-review on 7 October 2026 matched the plan to spec version 1 and the real
engine/player/control signatures. The equal-parent fixture was corrected to
`[0,99,99]`: `[0,0,99]` would require a swap after removal. The plan placeholder
scan, accepted-spec checker, context guard, and whitespace check passed. Product
test/build commands above remain execution steps, not results claimed by this plan.

Please review this written plan before implementation. Native execution is
already selected and will be preserved; the next approval is for this plan.
