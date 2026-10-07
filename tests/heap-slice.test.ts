import test from 'node:test';
import assert from 'node:assert/strict';
import { heapEngine, createPreset } from '../src/lessons/heap/engine.ts';
import { createPlayer, currentSnapshot, startCommand, seek, selectEntity } from '../src/core/player.ts';
import { heapTreePosition } from '../src/lessons/heap/content.ts';

test('inserting 1 preserves identity through the nine accepted snapshots', () => {
  const input = createPreset();
  const trace = heapEngine.createTrace(input, { type: 'insert', value: 1 });
  assert.equal(trace.length, 9);
  assert.deepEqual(trace.map(s => s.event.type),
    ['initial', 'append', 'compare', 'swap', 'compare', 'swap', 'compare', 'swap', 'complete']);
  assert.deepEqual(trace.map(s => s.state.items.findIndex(x => x.id === 'H8')), [-1,7,7,3,3,1,1,0,0]);
  assert.deepEqual(trace.map(s => [s.counters.comparisons, s.counters.swaps]),
    [[0,0],[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3],[3,3]]);
  assert.deepEqual(trace.at(-1)!.state.items.map(x => x.value), [1,3,5,7,9,8,6,12]);
  assert.deepEqual(trace.at(-1)!.state.items.map(x => x.id), ['H8','H1','H3','H2','H5','H6','H7','H4']);
  assert.deepEqual(trace.map(s => s.id), ['s0','s1','s2','s3','s4','s5','s6','s7','s8']);
  assert.equal(trace[1].invariants.find(x => x.id === 'heap-order')!.status, 'repairing');
  assert.equal(trace[8].invariants.find(x => x.id === 'heap-order')!.status, 'holds');
  assert.deepEqual(input.items.map(x => x.value), [3,7,5,12,9,8,6]);
  assert.deepEqual(trace, heapEngine.createTrace(createPreset(), { type: 'insert', value: 1 }));
  assert.ok(Object.isFrozen(trace));
  for (const s of trace) {
    assert.ok(Object.isFrozen(s.state.items[0]));
    assert.ok(Object.isFrozen(s.event.affectedIds));
    assert.ok(Object.isFrozen(s.variables));
    assert.ok(Object.isFrozen(s.invariants[0]));
  }
  assert.throws(() => { (trace[3].state.items[0] as {value:number}).value = 99; }, TypeError);
});

test('empty, single-root, equality and boundary values produce valid heaps', () => {
  for (const value of [0,99]) {
    const trace = heapEngine.createTrace({items:[],nextId:1}, {type:'insert',value});
    assert.deepEqual(trace.map(s => s.event.type), ['initial','append','complete']);
    assert.deepEqual(trace.at(-1)!.state.items, [{id:'H1',value}]);
  }
  const one = {items:[{id:'H1',value:1}],nextId:2};
  const equal = heapEngine.createTrace(one, {type:'insert',value:1});
  assert.deepEqual(equal.map(s => s.event.type), ['initial','append','compare','complete']);
  assert.deepEqual(equal.at(-1)!.counters, {comparisons:1,swaps:0});
  const smaller = heapEngine.createTrace(one, {type:'insert',value:0});
  assert.deepEqual(smaller.at(-1)!.state.items, [{id:'H2',value:0},{id:'H1',value:1}]);
});

test('input and command boundaries reject invalid data without mutating the input', () => {
  const input = createPreset();
  for (const value of [NaN,Infinity,-1,100,1.5,'1',null,undefined]) {
    assert.equal(heapEngine.validateCommand({type:'insert',value}, input).ok, false);
    assert.equal(heapEngine.validateInput({items:[{id:'H1',value}],nextId:2}).ok, false);
  }
  for (const raw of [null,[],{}, {items:[],nextId:0},
    {items:[{id:'H1',value:1},{id:'H1',value:2}],nextId:2},
    {items:[{id:'H1',value:5},{id:'H2',value:1}],nextId:3},
    {items:[{id:'H0',value:1}],nextId:1},
    {items:[{id:'H2',value:1}],nextId:2}]) {
    assert.equal(heapEngine.validateInput(raw).ok, false);
  }
  const full = {items:Array.from({length:15},(_,i)=>({id:`H${i+1}`,value:i})),nextId:16};
  assert.equal(heapEngine.validateInput(full).ok, true);
  assert.equal(heapEngine.validateCommand({type:'insert',value:1},full).ok, false);
  assert.equal(heapEngine.validateInput({...full,items:[...full.items,{id:'H16',value:20}]}).ok, false);
  assert.throws(() => heapEngine.createTrace(input, {type:'insert',value:100}));
  const valid = heapEngine.validateInput(input);
  assert.ok(valid.ok);
  if (valid.ok) assert.notEqual(valid.value.items[0], input.items[0]);
});

test('inspection follows a logical ID and counters do not recycle IDs', () => {
  const trace = heapEngine.createTrace(createPreset(), {type:'insert',value:1});
  const inspection = heapEngine.inspect(trace[3], 'H8');
  assert.ok(inspection);
  assert.equal(inspection.fields.find(f => f.label === 'Index')!.value, '3');
  assert.equal(inspection.fields.find(f => f.label === 'Parent')!.value, 'H2 · 7');
  assert.equal(inspection.fields.find(f => f.label === 'Left child')!.value, 'H4 · 12');
  assert.equal(heapEngine.inspect(trace[0], 'H8'), null);
  const again = heapEngine.createTrace(trace[8].state, {type:'insert',value:99});
  assert.equal(again[1].state.items.at(-1)!.id, 'H9');
  assert.equal(again.at(-1)!.state.nextId, 10);
});

test('seek restores exact state and commands start only at run boundaries', () => {
  const resting = createPlayer(heapEngine, createPreset());
  assert.equal(resting.steps, null);
  const begun = startCommand(resting,heapEngine,{type:'insert',value:1});
  assert.equal(begun.ordinal,1);
  const middle = seek(begun,3);
  const blocked = startCommand(middle,heapEngine,{type:'insert',value:2});
  assert.equal(blocked.steps,middle.steps);
  assert.equal(blocked.ordinal,3);
  assert.match(blocked.error!,/finish or restart/i);
  const orderedButUnfinished = seek(begun,7);
  assert.equal(currentSnapshot(orderedButUnfinished).invariants.find(x => x.id==='heap-order')!.status,'holds');
  assert.match(startCommand(orderedButUnfinished,heapEngine,{type:'insert',value:2}).error!,/finish or restart/i);
  assert.deepEqual(currentSnapshot(seek(begun,2)).counters,{comparisons:1,swaps:0});
  const restarted = seek(begun,0);
  assert.equal(currentSnapshot(restarted).state.items.length,7);
  const replaced = startCommand(restarted,heapEngine,{type:'insert',value:2});
  assert.equal(replaced.ordinal,1);
  assert.equal(currentSnapshot(replaced).state.items.at(-1)!.id,'H8');
  const continued = startCommand(seek(begun,8),heapEngine,{type:'insert',value:2});
  assert.equal(currentSnapshot(continued).state.items.at(-1)!.id,'H9');
});

test('invalid commands, cursors and engine failures preserve the valid run', () => {
  const begun = startCommand(createPlayer(heapEngine,createPreset()),heapEngine,{type:'insert',value:1});
  const completed = seek(begun,8);
  for (const value of [NaN,Infinity,-1,100,1.5,'',null]) {
    const invalid = startCommand(completed,heapEngine,{type:'insert',value});
    assert.equal(invalid.ordinal,8);
    assert.equal(invalid.steps,begun.steps);
    assert.ok(invalid.error);
  }
  for (const ordinal of [-1,9,1.5,NaN]) {
    const invalid = seek(completed,ordinal);
    assert.equal(invalid.ordinal,8);
    assert.equal(invalid.steps,begun.steps);
  }
  for (const engine of [
    {...heapEngine,createTrace:()=>[]},
    {...heapEngine,createTrace:()=>Array.from({length:513},()=>begun.steps![0])},
    {...heapEngine,createTrace:(...args:Parameters<typeof heapEngine.createTrace>)=>heapEngine.createTrace(...args).slice(0,2)},
    {...heapEngine,createTrace:(...args:Parameters<typeof heapEngine.createTrace>)=>heapEngine.createTrace(...args).map((s,i)=>i===0 ? {...s,event:{...s.event,type:'compare'}} : s)},
    {...heapEngine,createTrace:(...args:Parameters<typeof heapEngine.createTrace>)=>heapEngine.createTrace(...args).map((s,i)=>i===2 ? {...s,ordinal:20} : s)},
    {...heapEngine,createTrace:(...args:Parameters<typeof heapEngine.createTrace>)=>heapEngine.createTrace(...args).map(s=>s.event.type==='complete' ? {...s,invariants:s.invariants.map(i=>({...i,status:'repairing' as const}))} : s)},
    {...heapEngine,createTrace:()=>{throw new Error('Engine failure');}},
  ]) {
    const failed = startCommand(completed,engine,{type:'insert',value:2});
    assert.equal(failed.steps,begun.steps);
    assert.equal(failed.ordinal,8);
    assert.ok(failed.error);
  }
});

test('selection uses logical identity and follows inspection after rewind', () => {
  const begun = startCommand(createPlayer(heapEngine,createPreset()),heapEngine,{type:'insert',value:1});
  const selected = selectEntity(begun,heapEngine,'H8');
  assert.equal(selected.selectedId,'H8');
  const inspected = heapEngine.inspect(currentSnapshot(seek(selected,3)),selected.selectedId!);
  assert.equal(inspected!.fields.find(f=>f.label==='Index')!.value,'3');
  assert.equal(selectEntity(selected,heapEngine,'missing').selectedId,null);
});

test('tree positions keep all fifteen supported slots distinct and finite', () => {
  const positions = Array.from({length:15},(_,i)=>heapTreePosition(i));
  assert.equal(new Set(positions.map(p=>p.join(','))).size,15);
  assert.ok(positions.flat().every(Number.isFinite));
  assert.deepEqual(positions[0],[0,3,0]);
  assert.deepEqual(positions[1],[-3,1.6,0]);
  assert.deepEqual(positions[2],[3,1.6,0]);
});
