import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,startCommand,seek,replaceInput,selectEntity} from '../src/core/player.ts';
import {graphEngine,createGraphPreset,editGraph} from '../src/lessons/graph/engine.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import {createPlayback} from '../src/components/playback.ts';

const command={type:'dfs',startId:'A'};
const run=()=>selectEntity(seek(startCommand(createPlayer(graphEngine,createGraphPreset()),graphEngine,command),13),graphEngine,'C');
const changedInput=()=>{const edit=editGraph(createGraphPreset(),{type:'disconnect',edgeId:'E2'});assert.ok(edit.ok);return edit.value;};

test('valid edit reruns but deleting the start commits resting input',()=>{
  const before=run();
  const rerun=replaceInput(before,graphEngine,changedInput(),command);
  assert.notEqual(rerun.steps,before.steps);assert.equal(rerun.ordinal,1);
  assert.equal(rerun.selectedId,'C');assert.equal(rerun.input.nextEdgeId,6);
  const deleted=editGraph(rerun.input,{type:'remove-node',id:'A'});assert.ok(deleted.ok);
  const rest=replaceInput(rerun,graphEngine,deleted.value,command);
  assert.equal(rest.steps,null);assert.equal(rest.ordinal,0);
  assert.equal(rest.input.nodes.some(n=>n.id==='A'),false);
  assert.deepEqual(rest.resting.state.discoveryOrder,[]);
  assert.match(rest.error!,/start node/);
});

test('invalid input and broken edited traces preserve the entire prior scene',()=>{
  const before=run();
  const assertPreserved=(after:typeof before)=>{
    assert.equal(after.input,before.input);assert.equal(after.resting,before.resting);
    assert.equal(after.steps,before.steps);assert.equal(after.ordinal,13);
    assert.equal(after.selectedId,'C');assert.ok(after.error);
  };
  assertPreserved(replaceInput(before,graphEngine,{...before.input,edges:[{id:'E1',a:'A',b:'A'}]},null));
  const trace=graphEngine.createTrace(createGraphPreset(),{type:'dfs',startId:'A'});
  for(const bad of [[],trace.slice(0,-1),trace.map((s,i)=>i===2?{...s,ordinal:99}:s),Array.from({length:513},()=>trace[0])]) {
    assertPreserved(replaceInput(before,{...graphEngine,createTrace:()=>bad},changedInput(),command));
  }
  assertPreserved(replaceInput(before,{...graphEngine,createInitialSnapshot:()=>{throw new Error('broken');}},changedInput(),null));
  assertPreserved(replaceInput(before,{...graphEngine,createTrace:()=>{throw new Error('broken');}},changedInput(),command));
});

test('resting replacement prunes selection and supports deleting every node',()=>{
  const selected=selectEntity(run(),graphEngine,'E2');
  const kept=replaceInput(selected,graphEngine,selected.input,null);
  assert.equal(kept.steps,null);assert.equal(kept.selectedId,'E2');assert.equal(kept.ordinal,0);
  const removed=replaceInput(selected,graphEngine,changedInput(),null);
  assert.equal(removed.selectedId,null);assert.equal(removed.steps,null);assert.equal(removed.error,null);
  const empty=replaceInput(selected,graphEngine,{nodes:[],edges:[],nextNodeId:7,nextEdgeId:6},null);
  assert.deepEqual(empty.resting.state.nodes,[]);assert.equal(empty.selectedId,null);
  assert.equal(empty.steps,null);assert.equal(empty.error,null);
});

test('replacement cannot bypass the heap command boundary',()=>{
  const before=seek(startCommand(createPlayer(heapEngine,createPreset()),heapEngine,{type:'insert',value:1}),3);
  const rejected=replaceInput(before,heapEngine,createPreset(),null);
  assert.equal(rejected.steps,before.steps);assert.equal(rejected.ordinal,3);
  assert.equal(rejected.error,'Finish or restart first.');
  assert.equal(replaceInput(seek(before,0),heapEngine,createPreset(),null).steps,null);
});

test('old scheduled callbacks cannot advance edited, resting or disposed graph runs',()=>{
  for(const outcome of ['edit','rest','dispose']) {
    let player=run();const jobs:(()=>void)[]=[];
    const playback=createPlayback({
      read:()=>({run:player.steps,ordinal:player.ordinal,lastOrdinal:player.steps?player.steps.length-1:0}),
      advance:ordinal=>{player=seek(player,ordinal);},
      schedule:(_delay,callback)=>{jobs.push(callback);return()=>{};},changed:()=>{},
    });
    playback.play();const old=jobs[0];
    if(outcome==='dispose') playback.dispose();
    else {
      playback.pause();
      const input=outcome==='edit'?changedInput():{nodes:[],edges:[],nextNodeId:7,nextEdgeId:6};
      player=replaceInput(player,graphEngine,input,command);
      assert.equal(player.ordinal,outcome==='edit'?1:0);
      assert.equal(player.steps===null,outcome==='rest');
    }
    const expected=player;old();assert.equal(player,expected);assert.equal(playback.status().playing,false);
  }
});
