import test from 'node:test';
import assert from 'node:assert/strict';
import { heapEngine, createPreset } from '../src/lessons/heap/engine.ts';

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
