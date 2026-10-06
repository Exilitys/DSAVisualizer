# Heap Insertion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Draft for owner review, 5 October 2026.

**Updated:** 6 October 2026; self-review completed against the accepted slice.

**Goal:** A guest inserts 1 into the preset heap, follows H8 through real 3D and semantic tree/array views, inspects comparisons and swaps, and rewinds exact state.

**Architecture:** Pure TypeScript lesson contracts and a heap engine produce deeply immutable snapshots. A generic player selects one snapshot for all views; a client-side Next.js playground connects native controls to a heap scene adapter. Algorithm state has no renderer or network dependencies.

**Tech Stack:** Next.js 16.3.8, React/React DOM 19.3.0, R3F 9.8.1, Three.js 0.186.1, Drei 10.7.9, TypeScript 5.9.3. Node 24.15.0 is available for native TypeScript tests; no extra test framework is required.

**Spec:** [Accepted slice 001](../../specs/001-heap-insertion.md) and [technical contracts](../../prd/prd.md), accepted at d8b8f34. Context accepted in merged PR #2, revision 220124f.

**Execution:** Not selected yet. Recommend Native for these four dependent tasks, followed by a fresh whole-branch review.

## Global Constraints

- "Values are integers 0-99; size is at most 15. Duplicates are valid."
- "The first player supports next, previous, restart, and seek."
- "All operation and step controls must be keyboard accessible; camera gestures are not a prerequisite for the semantic journey."
- "Render the preset without label overlap at 360 px and 1280 px widths."
- "A local action should show feedback within 100 ms at p95, measured on a named device."
- Heap commands start only at ordinal 0 or the completed final snapshot.
- Both views consume the same selected snapshot and logical IDs. Stored data is deeply immutable.
- Extraction, graph BFS/DFS, live AI, autoplay/speed, persistence, and the complete challenge set remain required release work outside this slice.
- Preserve existing AGENTS.md, README and accepted prose. Manually add the application files rather than running a scaffold generator over this nonempty repository.
- Use system fonts, native operation controls, and geometric primitives. No remote models/fonts, animation library, store library, or provider SDK is needed for this slice.
- Registry configuration and Git hooks remain opt-in at scaffolding. This plan does not authorize global configuration changes.

## Review Focus

1. Empty/invalid numeric entry must preserve the valid run, including after a completed insertion. Task 1 pins engine rejection; Task 2 pins player preservation.
2. Duplicate values, boundary-size heaps and recycled IDs must retain identity without extra swaps. Task 1 pins these inputs.
3. A second command during repair must be blocked even when ordering happens to hold; restart enables a new command. Task 2 pins the cursor policy.
4. Keyboard selection, rapid seek/restart, and reduced motion must keep all representations on the same snapshot. Tasks 2 and 4 pin logic and the browser journey.
5. WebGL creation/context failure must preserve usable semantic controls, without duplicate focusable overlay labels. Tasks 3 and 4 verify fallback and keyboard behavior.

## File map

Every path below is planned application work, not a claim that it already exists.

| File | Responsibility |
| --- | --- |
| package.json, package-lock.json, tsconfig.json, next-env.d.ts | Pinned application dependencies, native tests, strict type/build commands. |
| src/core/lesson.ts | Accepted lesson/snapshot contracts and deepFreeze. |
| src/core/player.ts | Pure generic cursor/command/selection transitions. |
| src/lessons/heap/engine.ts | Heap input/command validation and deterministic insertion trace. |
| src/lessons/heap/content.ts | Preset, pseudocode and event explanations. |
| src/lessons/heap/HeapScene.tsx | Heap-specific spatial layout using shared snapshot/selection. |
| src/components/LessonPlayground.tsx | Generic player controls, semantic views, inspection, and client scene loading. |
| src/app/layout.tsx, page.tsx, globals.css | Next.js entry and actual theme tokens. |
| src/AGENTS.md | Directory-local pointer to accepted development rules. |
| tests/heap-slice.test.ts | Public engine/player acceptance and edge cases using node:test. |
| docs/reviews/001-heap-insertion.md | Actual browser, device and build verification results. |

Package peer metadata was read from the public npm registry on 5 October 2026.
The proposed versions satisfy the published React/R3F/Drei peer ranges; install,
type checking and production build still verify actual compatibility.
[Next.js manual setup](https://nextjs.org/docs/app/getting-started/installation),
[R3F major compatibility](https://r3f.docs.pmnd.rs/getting-started/introduction),
[Node 24 TypeScript execution](https://nodejs.org/docs/latest-v24.x/api/typescript.html),
and [Drei Bounds](https://drei.docs.pmnd.rs/staging/bounds) are the primary references.

---

### Task 1: Runnable deterministic heap engine

**Files:** Create package.json, package-lock.json, tsconfig.json, next-env.d.ts,
src/core/lesson.ts, src/lessons/heap/engine.ts, tests/heap-slice.test.ts.
Modify .gitignore to exclude .next/, out/, coverage/, and tsconfig.tsbuildinfo.

**Consumes:** Accepted LessonEngine and Snapshot definitions; slice 001 fixture.
**Produces:** `heapEngine: LessonEngine<HeapInput, HeapCommand, HeapState>`,
`createPreset(): HeapInput`, `deepFreeze<T>(value: T): DeepReadonly<T>`.

- [ ] Create the package scripts below, then install exact dependencies. Do not alter the existing README or root AGENTS.md during setup.

```json
{
  "name": "dsa-atlas",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --hostname 127.0.0.1",
    "build": "next build",
    "start": "next start --hostname 127.0.0.1",
    "typecheck": "tsc --noEmit",
    "test": "node --test tests/heap-slice.test.ts",
    "check:context": "python scripts/check-context.py"
  }
}
```

```powershell
npm install --save-exact next@16.3.8 react@19.3.0 react-dom@19.3.0 three@0.186.1 @react-three/fiber@9.8.1 @react-three/drei@10.7.9
npm install --save-dev --save-exact typescript@5.9.3 @types/node@24.19.1 @types/react@19.3.0 @types/react-dom@19.3.0 @types/three@0.186.0
```

Use this tsconfig.json. The explicit .ts imports let Node execute pure tests;
Next.js handles the application through its normal bundler.

```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "strict": true, "noEmit": true, "skipLibCheck": true,
    "esModuleInterop": true, "module": "ESNext",
    "moduleResolution": "Bundler", "resolveJsonModule": true,
    "allowImportingTsExtensions": true, "isolatedModules": true,
    "jsx": "preserve", "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./src/*"]}
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```typescript
// next-env.d.ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] Write the engine fixture test first and run `npm test`. It must fail because the engine module is not yet present.

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { heapEngine, createPreset } from '../src/lessons/heap/engine.ts';

test('the accepted insertion has nine exact snapshots', () => {
  const input = createPreset();
  const trace = heapEngine.createTrace(input, { type: 'insert', value: 1 });
  assert.equal(trace.length, 9);
  assert.deepEqual(trace.map(s => s.event.type),
    ['initial','append','compare','swap','compare','swap','compare','swap','complete']);
  assert.deepEqual(trace.at(-1)!.state.items.map(x => x.value), [1,3,5,7,9,8,6,12]);
  assert.deepEqual(trace.at(-1)!.state.items.map(x => x.id), ['H8','H1','H3','H2','H5','H6','H7','H4']);
  assert.equal(trace[3].state.items.findIndex(x => x.id === 'H8'), 3);
  assert.deepEqual(trace[3].counters, { comparisons: 1, swaps: 1 });
  assert.deepEqual(input.items.map(x => x.value), [3,7,5,12,9,8,6]);
  assert.ok(Object.isFrozen(trace[3].state.items));
  assert.deepEqual(trace, heapEngine.createTrace(createPreset(), { type: 'insert', value: 1 }));
});
```

- [ ] Define the accepted contracts in src/core/lesson.ts and these concrete heap types in engine.ts.

```typescript
export type HeapItem = { id: string; value: number };
export type HeapInput = { items: readonly HeapItem[]; nextId: number };
export type HeapState = HeapInput;
export type HeapCommand = { type: 'insert'; value: number };
export function createPreset(): HeapInput {
  return { items: [3,7,5,12,9,8,6].map((value,i) => ({id:`H${i+1}`,value})), nextId: 8 };
}
```

Copy the complete accepted `Validation`, `DeepReadonly`, `Snapshot`, `Inspection`
and `LessonEngine` shapes into lesson.ts; use type-only imports from engine.ts.
Implement the recursive freeze function without cloning renderer objects:

```typescript
export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}
```

- [ ] Implement input validation. Return `{ok:false,message,field}` for any failure; return a cloned input for success. Check array length <=15, integer values 0-99, unique IDs matching `/^H[1-9]\d*$/`, integer nextId greater than every existing ID number, and parent value <= child value. Empty input is valid. Command validation accepts only `{type:'insert',value}` with an integer value in range and fewer than 15 existing items.

The following predicates are the numeric/ordering checks; combine them with
the object/ID checks above before reading unknown properties.

```typescript
const validValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 99;
const ordered = (items: readonly HeapItem[]) => items.every((item,i) =>
  i === 0 || items[Math.floor((i-1)/2)].value <= item.value);
```

- [ ] Implement `createInitialSnapshot(input)` and `createTrace(input, command)` with deterministic IDs `s0`, `s1`, etc. Each emission clones the items and freezes the complete snapshot. Initial variables have null index/parent/insertedId; counters start at zero. Event fields and invariant annotations use the accepted contract.

Use this algorithm inside createTrace after validating input/command. `emit`
is its private closure: it appends a snapshot with current items/nextId,
ordinal equal to current steps.length, current counters, inserted ID/index,
derived parent index, `heap-shape: holds`, and `heap-order: holds|repairing`.
It sets codeLineId to append/compare/swap/return respectively and explanationKey
to `heap.insert.` plus event type. Ordinal 0 comes from createInitialSnapshot.

```typescript
const items = input.items.map(item => ({...item}));
let nextId = input.nextId;
const insertedId = `H${nextId++}`;
let index = items.length;
let comparisons = 0;
let swaps = 0;
const steps = [heapEngine.createInitialSnapshot(input)];
const emit = (type: string, affectedIds: string[], operands: (string|number)[]) => {
  const ordinal = steps.length;
  const codeLineId = type === 'complete' ? 'return' : type;
  steps.push(deepFreeze<Snapshot<HeapState>>({
    id: `s${ordinal}`, ordinal,
    state: {items:items.map(item => ({...item})),nextId},
    event: {type,affectedIds,operands,codeLineId,explanationKey:`heap.insert.${type}`},
    variables: {insertedId,index,parentIndex:index > 0 ? Math.floor((index-1)/2) : null},
    counters: {comparisons,swaps},
    invariants: [
      {id:'heap-shape',status:'holds'},
      {id:'heap-order',status:ordered(items) ? 'holds' : 'repairing'}
    ]
  }));
};
items.push({ id: insertedId, value: command.value });
emit('append', [insertedId], [command.value]);
while (index > 0) {
  const parentIndex = Math.floor((index-1)/2);
  const child = items[index];
  const parent = items[parentIndex];
  comparisons += 1;
  emit('compare', [child.id,parent.id], [child.value,parent.value]);
  if (child.value >= parent.value) break;
  const before = index;
  [items[index],items[parentIndex]] = [items[parentIndex],items[index]];
  swaps += 1;
  index = parentIndex;
  emit('swap', [child.id,parent.id], [before,index,child.value,parent.value]);
}
emit('complete', [insertedId], []);
return deepFreeze(steps);
```

`inspect(snapshot,id)` returns the value, actual current index, parent/children
or absent labels, and ordering state, or null when the item is not present.
Set engine id `heap`, version `1.0.0`, and commandStart `run-boundary`.

- [ ] Add public edge checks and run `npm test`: empty insertion; single root; equality with zero swaps; 0/99 boundaries; a valid size-15 heap rejects insertion; NaN, Infinity, fractions, strings and out-of-range values reject; duplicate IDs and non-heaps reject; nextId is not recycled after a later insertion. Keep engine/core free of framework imports.

```typescript
test('guards and equal values preserve valid inputs', () => {
  const one = {items:[{id:'H1',value:1}],nextId:2};
  const equal = heapEngine.createTrace(one, {type:'insert',value:1});
  assert.equal(equal.at(-1)!.counters.swaps, 0);
  for (const value of [NaN,Infinity,-1,100,1.5,'1']) {
    assert.equal(heapEngine.validateCommand({type:'insert',value}, createPreset()).ok, false);
  }
  const full = {items:Array.from({length:15},(_,i)=>({id:`H${i+1}`,value:i})),nextId:16};
  assert.equal(heapEngine.validateCommand({type:'insert',value:1},full).ok, false);
  assert.equal(heapEngine.createTrace({items:[],nextId:1},{type:'insert',value:0}).at(-1)!.state.items[0].value, 0);
});
```

- [ ] Commit the passing engine/test/config deliverable: `feat: add deterministic heap insertion engine`.

### Task 2: Shared player and usable semantic playground

**Files:** Create src/core/player.ts, src/lessons/heap/content.ts,
src/components/LessonPlayground.tsx, src/app/layout.tsx, src/app/page.tsx,
src/app/globals.css, src/AGENTS.md. Extend tests/heap-slice.test.ts.

**Consumes:** `LessonEngine<I,C,S>`, `Snapshot<S>`, `heapEngine`, `createPreset`.
**Produces:** `createPlayer(engine,input)`, `currentSnapshot(player)`,
`startCommand(player,engine,raw)`, `seek(player,ordinal)`,
`selectEntity(player,engine,id)`; each returns a new PlayerState.

Use this state shape; command correlation is a session concern and first-slice
rendering does not need a provider exchange.

```typescript
export type PlayerState<I,S> = {
  input: I;
  resting: Snapshot<S>;
  steps: readonly Snapshot<S>[] | null;
  ordinal: number;
  selectedId: string | null;
  error: string | null;
};
```

- [ ] Add cursor/preservation tests first and run `npm test`; expect missing player exports to fail.

```typescript
import { createPlayer, currentSnapshot, startCommand, seek } from '../src/core/player.ts';
test('seek and command boundaries preserve one source of state', () => {
  const resting = createPlayer(heapEngine, createPreset());
  const begun = startCommand(resting,heapEngine,{type:'insert',value:1});
  const middle = seek(begun,3);
  const blocked = startCommand(middle,heapEngine,{type:'insert',value:2});
  assert.equal(blocked.steps, middle.steps);
  assert.equal(blocked.ordinal, 3);
  assert.match(blocked.error!, /finish or restart/i);
  const orderedButUnfinished = seek(begun,7);
  assert.equal(currentSnapshot(orderedButUnfinished).invariants.find(x => x.id==='heap-order')!.status,'holds');
  assert.equal(startCommand(orderedButUnfinished,heapEngine,{type:'insert',value:2}).steps,begun.steps);
  assert.match(startCommand(orderedButUnfinished,heapEngine,{type:'insert',value:2}).error!,/finish or restart/i);
  assert.deepEqual(currentSnapshot(seek(begun,2)).counters, {comparisons:1,swaps:0});
  const invalid = startCommand(seek(begun,8),heapEngine,{type:'insert',value:NaN});
  assert.equal(invalid.ordinal,8);
  assert.equal(invalid.steps,begun.steps);
  const restarted = seek(begun,0);
  assert.equal(currentSnapshot(restarted).state.items.length,7);
  assert.equal(startCommand(restarted,heapEngine,{type:'insert',value:2}).ordinal,1);
});
```

- [ ] Implement the pure player transitions. `createPlayer` validates input and stores the initial snapshot with no steps. `currentSnapshot` returns resting or steps[ordinal]. `seek` rejects non-integer/out-of-range ordinals and preserves the current snapshot. `startCommand` uses the current boundary snapshot as validated next input, validates the command, creates the trace, and selects its first action. Any validation/trace error preserves steps and ordinal.

```typescript
export function currentSnapshot<I,S>(state: PlayerState<I,S>): Snapshot<S> {
  return state.steps ? state.steps[state.ordinal] : state.resting;
}
export function seek<I,S>(state: PlayerState<I,S>, ordinal: number): PlayerState<I,S> {
  if (!state.steps || !Number.isInteger(ordinal) || ordinal < 0 || ordinal >= state.steps.length)
    return {...state,error:'Choose an existing step.'};
  return {...state,ordinal,error:null};
}
export function createPlayer<I,C,S>(engine: LessonEngine<I,C,S>, raw: unknown): PlayerState<I,S> {
  const input = engine.validateInput(raw);
  if (!input.ok) throw new Error(input.message);
  return {input:input.value,resting:engine.createInitialSnapshot(input.value),
    steps:null,ordinal:0,selectedId:null,error:null};
}
export function startCommand<I,C,S>(state: PlayerState<I,S>, engine: LessonEngine<I,C,S>, raw: unknown): PlayerState<I,S> {
  const boundary = !state.steps || state.ordinal===0 || state.ordinal===state.steps.length-1;
  if (engine.commandStart==='run-boundary' && !boundary)
    return {...state,error:'Finish or restart first.'};
  const input = engine.validateInput(currentSnapshot(state).state);
  if (!input.ok) return {...state,error:input.message};
  const command = engine.validateCommand(raw,input.value);
  if (!command.ok) return {...state,error:command.message};
  try {
    const steps = engine.createTrace(input.value,command.value);
    if (!steps.length || steps.length > 512) throw new Error('Invalid trace length.');
    const ordinal = Math.min(1,steps.length-1);
    const selectedId = state.selectedId && engine.inspect(steps[ordinal],state.selectedId)
      ? state.selectedId : null;
    return {...state,input:input.value,resting:steps[0],steps,ordinal,selectedId,error:null};
  } catch {
    return {...state,error:'The operation could not start. Your scene is preserved.'};
  }
}
export function selectEntity<I,C,S>(state: PlayerState<I,S>, engine: LessonEngine<I,C,S>, id: string|null): PlayerState<I,S> {
  return {...state,selectedId:id && engine.inspect(currentSnapshot(state),id) ? id : null};
}
```

In startCommand, the boundary condition is
`!state.steps || state.ordinal===0 || state.ordinal===state.steps.length-1`.
Apply it only when engine.commandStart is run-boundary. Feed the chosen
snapshot.state to engine.validateInput; createTrace uses that returned input.
Keep selectedId only if engine.inspect accepts it in the new selected snapshot.
`selectEntity` similarly validates via inspect, never value equality.

- [ ] Create authored content, including these code-line IDs and event explanations. `explainStep` consumes only its Snapshot; `pseudocode` is an exported array of `{id,text}`.

```typescript
export const pseudocode = [
  {id:'append',text:'Append the new item at the next open position'},
  {id:'compare',text:'Compare the inserted value with its parent'},
  {id:'swap',text:'If strictly smaller, swap and continue upward'},
  {id:'return',text:'Return the ordered heap'}
];
export function explainStep(snapshot: Snapshot<HeapState>): string {
  const operands = snapshot.event.operands;
  switch (snapshot.event.type) {
    case 'append': return `Append ${operands[0]} at index ${snapshot.variables.index}.`;
    case 'compare': return `Compare ${operands[0]} with parent value ${operands[1]}.`;
    case 'swap': return `Move from index ${operands[0]} to ${operands[1]} because ${operands[2]} is smaller than ${operands[3]}.`;
    case 'complete': return 'Insertion is complete; every parent is no greater than its children.';
    default: return 'Insert a value to inspect one operation.';
  }
}
```

- [ ] Create a client playground using React state and the pure transitions. Keep semantic tree/array and inspection visible before loading 3D. Native operation and timeline controls use these labels and guards.

The heap binding supplies these values and handlers. Export its timeline
controls as `PlaybackControls({ordinal,lastOrdinal,hasRun,go})` so the next
lesson reuses them rather than copying markup. `InspectionPanel({inspection})`
renders the shared Inspection fields. The operation editor and semantic
structure are heap-specific; the player and playback/inspection controls are not.

```tsx
const [player,setPlayer] = useState(() => createPlayer(heapEngine,createPreset()));
const [draft,setDraft] = useState('1');
const snapshot = currentSnapshot(player);
const lastOrdinal = player.steps ? player.steps.length-1 : 0;
const canStart = !player.steps || player.ordinal===0 || player.ordinal===lastOrdinal;
const go = (ordinal: number) => setPlayer(state => seek(state,ordinal));
const select = (id: string) => setPlayer(state => selectEntity(state,heapEngine,id));
const insert = () => setPlayer(state => draft.trim()===''
  ? {...state,error:'Enter a whole number from 0 to 99.'}
  : startCommand(state,heapEngine,{type:'insert',value:Number(draft)}));
```

```tsx
<label htmlFor="insert-value">Value to insert</label>
<input id="insert-value" type="number" min={0} max={99} step={1}
  value={draft} onChange={event => setDraft(event.target.value)} />
<button disabled={!canStart} onClick={insert}>Insert</button>
<button disabled={!player.steps || player.ordinal===0} onClick={() => go(player.ordinal-1)}>Previous</button>
<button disabled={!player.steps || player.ordinal===lastOrdinal} onClick={() => go(player.ordinal+1)}>Next</button>
<button disabled={!player.steps} onClick={() => go(0)}>Restart</button>
<label htmlFor="step-range">Step</label>
<input id="step-range" type="range" min={0} max={lastOrdinal}
  disabled={!player.steps} value={player.ordinal}
  onChange={event => go(Number(event.target.value))} />
<p role="status" aria-live="polite">{explainStep(snapshot)}</p>
{player.error && <p role="alert">{player.error}</p>}
```

`insert` rejects blank draft with an actionable error before numeric conversion;
otherwise dispatches `{type:'insert',value:Number(draft)}`. `go` uses seek.
`canStart` is true only without a run or at its first/final ordinal.
Semantic item buttons use `aria-pressed={player.selectedId===item.id}` and
label `Select H8, value 1, index 3`; their handlers call selectEntity.
Inspection shows ID/value/index/parent/children from engine.inspect; missing
relations use 'Absent'. Counters expose `data-testid="comparisons"` and
`data-testid="swaps"`; selection exposes `data-selected-id` on the playground.
Pseudocode marks the current line with `aria-current="step"`.

- [ ] Add the root layout/page and actual CSS tokens. The page renders LessonPlayground; the root layout imports globals.css and has html lang=en and body. Use the rules below for the initial layout; preserve controls at mobile widths.

```css
:root { --page:#f5f7fb; --surface:#fff; --ink:#172033; --muted:#526077;
  --selected:#4338ca; --active:#a15b00; --border:#d3dbe8; }
* { box-sizing:border-box; }
body { margin:0; background:var(--page); color:var(--ink); font-family:system-ui,sans-serif; }
button,input { font:inherit; min-height:44px; }
button { cursor:pointer; }
button:disabled { cursor:default; }
:focus-visible { outline:3px solid var(--selected); outline-offset:3px; }
.playground { max-width:1280px; margin:auto; padding:16px; }
.workspace { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:16px; }
.scene { height:480px; min-width:0; border:1px solid var(--border); border-radius:16px; }
.panel { background:var(--surface); padding:16px; border:1px solid var(--border); border-radius:16px; }
.array { display:flex; flex-wrap:wrap; gap:8px; }
.array button[aria-pressed="true"] { outline:3px solid var(--selected); }
@media(max-width:700px) { .workspace { grid-template-columns:1fr; } .scene { height:360px; } }
@media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto; } }
```

The shared controls receive a snapshot and callbacks; heap-specific geometry
stays in its adapter. src/AGENTS.md points to ../docs/development.md and the
accepted invariants, rather than introducing a second standards document.

```tsx
// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
export default function RootLayout({children}:{children:ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
// src/app/page.tsx
import LessonPlayground from '../components/LessonPlayground';
export default function Page() { return <LessonPlayground />; }
```

- [ ] Run `npm test`, `npm run typecheck`, `npm run build`. Run the app and verify insertion/ordinal 3/ordinal 2/restart through semantic controls. Commit `feat: add shared snapshot player and semantic heap playground`.

### Task 3: Actual paired 3D representations and camera recovery

**Files:** Create src/lessons/heap/HeapScene.tsx; modify LessonPlayground.tsx.

**Consumes:** Current `Snapshot<HeapState>`, selectedIds, select(id), reducedMotion.
**Produces:** HeapScene default React component with the accepted SceneAdapterProps
and camera action requests `fitRequest` and `focusRequest` supplied by the playground.

- [ ] Add a layout check to the existing Node test file before implementing its pure exported layout function. `heapTreePosition(index): [number,number,number]` uses depth floor(log2(index+1)) and slot position; every index through 14 must produce a finite, distinct position. Put this function in heap/content.ts so the test does not import React/Three.js.

```typescript
export function heapTreePosition(index: number): [number,number,number] {
  const depth = Math.floor(Math.log2(index+1));
  const width = 2 ** depth;
  const slot = index-(width-1);
  return [((slot+0.5)/width-0.5)*12, 3-depth*1.4, 0];
}
```

- [ ] Load the scene dynamically from the client playground with SSR disabled. Use R3F Canvas, ambient/directional lighting, node spheres or value blocks, links, and a separate 3D array row. Set dpr=[1,1.5] and frameloop=demand. Use Html labels with pointerEvents=none and aria-hidden=true; accessible selection remains in the semantic list.

```tsx
const HeapScene = dynamic(() => import('../lessons/heap/HeapScene'), {
  ssr:false, loading:() => <p>Loading the 3D view…</p>
});
```

Each item is rendered twice with keys `tree:${id}` and `array:${id}`, both
using select(id). Array x-position is `(index-(items.length-1)/2)*0.85`, y=-3,
z=1. Tree positions come from heapTreePosition. Edges use the current
parent/child positions. A selected item and active event are identified with
labels/status in addition to material color. Values use readable HTML labels;
no downloaded font or model is needed.

The private scene building blocks have these exact props. Keep them at module
scope so a new ordinal updates props without changing React component identity:

```typescript
type ValueNodeProps = {
  item: Readonly<HeapItem>;
  position: [number,number,number];
  selected: boolean;
  active: boolean;
  select: (id: string) => void;
  register?: (mesh: Mesh|null) => void;
  index?: number;
};
type HeapStructuresProps = SceneAdapterProps<HeapState> & {
  meshRefs: RefObject<Map<string,Mesh>>;
};
type CameraActionsProps = {
  fitRequest: number;
  focusRequest: number;
  selectedId: string|undefined;
  meshRefs: RefObject<Map<string,Mesh>>;
};
```

```tsx
function ValueNode({item,position,selected,active,select,register,index}:ValueNodeProps) {
return <mesh ref={register} position={position} onClick={event => { event.stopPropagation(); select(item.id); }}>
  {index===undefined ? <sphereGeometry args={[0.45,24,16]} /> : <boxGeometry args={[0.7,0.7,0.7]} />}
  <meshStandardMaterial color={selected ? '#a5b4fc' : active ? '#f5d49a' : '#dbe5f5'} />
  <Html center style={{pointerEvents:'none'}}>
    <span aria-hidden="true" className="node-label">{item.value}{index===undefined ? '' : ` [${index}]`}</span>
  </Html>
</mesh>;
}
```

HeapStructures maps the current snapshot only. Each tree mesh registers under
its logical ID for camera focus; the array remains a second representation.

```tsx
function HeapStructures({snapshot,selectedIds,select,meshRefs}:HeapStructuresProps) {
  const items = snapshot.state.items;
  const active = new Set(snapshot.event.affectedIds);
  return <group>
    {items.map((item,index) => <ValueNode key={`tree:${item.id}`} item={item}
      position={heapTreePosition(index)} selected={selectedIds.includes(item.id)}
      active={active.has(item.id)} select={select}
      register={mesh => { if(mesh) meshRefs.current.set(item.id,mesh); else meshRefs.current.delete(item.id); }} />)}
    {items.map((item,index) => <ValueNode key={`array:${item.id}`} item={item} index={index}
      position={[(index-(items.length-1)/2)*0.85,-3,1]}
      selected={selectedIds.includes(item.id)} active={active.has(item.id)} select={select} />)}
    {items.slice(1).map((item,offset) => {
      const index = offset+1;
      return <Line key={`edge:${item.id}`}
        points={[heapTreePosition(Math.floor((index-1)/2)),heapTreePosition(index)]}
        color="#64748b" lineWidth={1.5} />;
    })}
  </group>;
}
```

ValueNode uses sphereGeometry for the tree and boxGeometry for an indexed array
cell. Its labels remain nonfocusable; semantic buttons own keyboard selection.

`position`, `selected`, and `active` are derived from the passed snapshot and
IDs. Render the array with boxGeometry; its HTML label also shows the index.
Step changes snap logical scene positions in this initial slice; the authored
compare/swap event remains independently inspectable. Smooth object travel can
be added only without changing the selected-snapshot contract.

- [ ] Wrap only the structures in Bounds; keep the ground outside those bounds. OrbitControls handles navigation. A Canvas child uses useBounds for Fit scene and Focus selection; reducedMotion sets maxDuration=0, otherwise use 0.3 seconds for camera recovery.

```tsx
<Bounds fit clip observe margin={1.3} maxDuration={reducedMotion ? 0 : 0.3}>
  <HeapStructures />
  <CameraActions />
</Bounds>
<OrbitControls makeDefault enableDamping minDistance={3} maxDistance={35} />
```

CameraActions consumes the request counters and selected mesh reference.
Fit calls `bounds.refresh().clip().fit()`. Focus calls
`bounds.refresh(selectedMesh).clip().fit()` only when that mesh exists.
The mesh map contains only tree counterparts keyed by logical ID. Changing
the selected ordinal does not change the logical input or recompute a trace.

```tsx
function CameraActions({fitRequest,focusRequest,selectedId,meshRefs}:CameraActionsProps) {
  const bounds = useBounds();
  const lastFit = useRef(0);
  const lastFocus = useRef(0);
  useEffect(() => {
    if (fitRequest===lastFit.current) return;
    lastFit.current=fitRequest;
    bounds.refresh().clip().fit();
  }, [fitRequest,bounds]);
  useEffect(() => {
    if (focusRequest===lastFocus.current) return;
    lastFocus.current=focusRequest;
    const mesh = selectedId ? meshRefs.current.get(selectedId) : undefined;
    if (mesh) bounds.refresh(mesh).clip().fit();
  }, [focusRequest,selectedId,bounds,meshRefs]);
  return null;
}
```

The playground increments fitRequest/focusRequest from the named buttons;
HeapScene keeps the meshRefs map with useRef and passes it to both children.
Selected-ID changes alone must not move the camera: track the last consumed
focusRequest or depend on its change only, reading the current ID from a ref.

- [ ] Put a React error boundary around the canvas and use its fallback prop for renderer creation failure. A Canvas child registers webglcontextlost, prevents default, and tells the playground to show semantic mode; remove the listener on unmount.

The React boundary uses the required class API and keeps the failure within
the scene region. It does not own player state:

```tsx
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
```

```tsx
useEffect(() => {
  const canvas = gl.domElement;
  const lost = (event: Event) => { event.preventDefault(); unavailable(); };
  canvas.addEventListener('webglcontextlost', lost);
  return () => canvas.removeEventListener('webglcontextlost', lost);
}, [gl, unavailable]);
```

Place that effect in a `ContextLoss({unavailable})` Canvas child that obtains
`gl` with `useThree(state => state.gl)` and returns null. Define unavailable as
a stable playground callback that switches only the presentation flag. Import
Mesh from three, RefObject/ReactNode/Component from React, and the documented
Drei/R3F helpers; these names are dependency APIs rather than new project types.

`unavailable()` changes presentation availability only; player/run state stays
intact. The fallback says '3D is unavailable. Use the structure and step controls
below.' A semantic-only toggle provides the same path without needing a GPU.
Native Fit scene/Focus selection buttons are outside the canvas. The normal
keyboard journey does not rely on those camera buttons.

- [ ] Run logic/type/build checks, then verify actual orbit, zoom, focus, fit, mesh selection and paired semantic highlighting at 1280 px and 360 px. Commit `feat: add paired 3D heap scene and camera recovery`.

### Task 4: Verify the complete first-slice journey and record evidence

**Files:** Modify src/app/globals.css and relevant owning files only for observed
defects. Create docs/reviews/001-heap-insertion.md; update README and the owned
development/context pointers for actual commands/source paths.

**Consumes:** Built engine, player, semantic playground and scene adapter.
**Produces:** A verified first slice with actual build/browser evidence and its feature PR.

- [ ] Run `npm test`, `npm run typecheck`, `npm run build`, `python scripts/check-context.py`, and `git diff --check`. Keep outputs in the verification report with runtime/device identifiers. These commands are expectations in this plan, not current results.
- [ ] Start `npm run dev` and use the browser at http://127.0.0.1:3000. Insert 1, select H8, seek ordinal 3, verify index 3/counts 1 and 1, seek ordinal 2/counts 1 and 0, then restart to seven items. Repeat with keyboard alone and with reduced-motion preference. Previous/next are disabled at boundaries; insertion is blocked at intermediate ordinals.
- [ ] Test blank entry, 100, -1 and 1.5 at a valid boundary, then a valid duplicate. Errors preserve the run. Complete insertion and insert another value; IDs remain unique and counters restart for that new run.
- [ ] At both viewport widths, inspect labels, controls, panel opening, zoom and camera recovery. Rapid seek between 2/3/8/0 must change all views to the selected snapshot. Record both a normal 3D screenshot and semantic/reduced-motion screenshot; use actual app output.
- [ ] Exercise WebGL context loss and semantic-only mode, verifying that the same run is still inspectable and operable. The browser check can dispatch the actual canvas event to simulate this failure:

```javascript
document.querySelector('canvas')?.dispatchEvent(new Event('webglcontextlost', {cancelable:true}));
```

- [ ] Measure event-to-visible-action samples on the named desktop/browser before claiming the 100 ms p95 target. If a phone is unavailable, report that coverage gap rather than declaring phone verification passed. Check text contrast and focus visibility with the actual rendered palette.
- [ ] Add real source contract paths to both existing literal lists once created: src/core/lesson.ts, src/core/player.ts, src/lessons/heap/engine.ts, and src/app/globals.css. Run the context guard to ensure the mirror matches. Keep diagram bytes frozen; implementation progress does not require regenerating the accepted design artifact.
- [ ] Self-check coverage against slice 001, fix observed issues, then request a fresh whole-branch review. Native execution uses executing-plans; subagent execution uses subagent-driven-development. Record findings and resolutions. Open the implementation PR into development for the owner's acceptance.

## Coverage and self-review

| Accepted requirement | Owning task |
| --- | --- |
| Exact insertion trace, IDs, values, counts, edge cases | Task 1 |
| Initial resting view, command boundaries, next/previous/restart/seek | Task 2 |
| Synchronized inspection, authored explanation and pseudocode | Task 2 |
| Actual 3D objects, paired selection, camera navigation/recovery | Task 3 |
| Keyboard, reduced motion, fallback, supported widths | Tasks 2-4 |
| Actual latency/device evidence and final review | Task 4 |

The plan intentionally builds slice 001, not the entire P0 release. Every
Review Focus condition has an owning task and a specified check. Interfaces
are the accepted engine contract plus named pure player operations; no
provider or arbitrary renderer language is added. No implementation step is
marked complete before its check runs.

## Handoff

Review this plan before application files or dependencies are created. Choose
Native (recommended for this tightly connected four-task slice) or Subagent-driven.
Acceptance of the context did not approve an unwritten implementation plan.
