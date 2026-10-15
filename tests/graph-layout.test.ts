import test from 'node:test';
import assert from 'node:assert/strict';
import {createGraphPreset,editGraph} from '../src/lessons/graph/engine.ts';
import {reconcileGraphPositions,parseGraphPosition} from '../src/lessons/graph/layout.ts';

test('layout retains positions by ID and prunes deleted nodes without editing input',()=>{
  const input=createGraphPreset(),before=structuredClone(input);
  const positions=reconcileGraphPositions(input.nodes,{});
  assert.deepEqual(positions.A,[-5,1,0]);
  const removed=editGraph(input,{type:'remove-node',id:'B'});assert.ok(removed.ok);
  const previous={...positions,A:[1,2,0] as [number,number,0]};
  const next=reconcileGraphPositions(removed.value.nodes,previous);
  assert.deepEqual(next.A,[1,2,0]);assert.equal(next.B,undefined);
  assert.notEqual(next.A,previous.A);assert.deepEqual(previous.A,[1,2,0]);
  assert.deepEqual(input,before);
  assert.deepEqual(reconcileGraphPositions([...input.nodes].reverse(),{}),positions);
});
test('coordinates reject blank, nonfinite, out of range and off-step values',()=>{
  for(const raw of ['', ' ', 'Infinity','NaN','10.5','-10.5','0.25']) {
    assert.equal(parseGraphPosition(raw,'0').ok,false);
    assert.equal(parseGraphPosition('0',raw).ok,false);
  }
  assert.deepEqual(parseGraphPosition('-10','10'),{ok:true,value:[-10,10,0]});
  assert.deepEqual(parseGraphPosition('2.5','-0.5'),{ok:true,value:[2.5,-0.5,0]});
});
test('twenty default positions are distinct finite slots and occupied authored slots are skipped',()=>{
  const nodes=[...'ABCDEFGHIJKLMNOPQRST'].map((id,index)=>({id,creationOrder:index+1}));
  const positions=reconcileGraphPositions(nodes,{});
  assert.equal(new Set(Object.values(positions).map(p=>p.join(','))).size,20);
  assert.ok(Object.values(positions).every(p=>p.every(Number.isFinite)));
  const occupied=reconcileGraphPositions(nodes,{A:[-2.5,3,0]});
  assert.notDeepEqual(occupied.A,occupied.B);
  assert.deepEqual(reconcileGraphPositions(nodes,{A:[Infinity,0,0]}).A,[-5,1,0]);
});
