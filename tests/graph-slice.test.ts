import test from 'node:test';
import assert from 'node:assert/strict';
import {graphEngine,createGraphPreset,editGraph,orderedNeighbors} from '../src/lessons/graph/engine.ts';
import {getGraphPseudocode,explainGraphStep} from '../src/lessons/graph/content.ts';
import type {GraphInput,GraphCommand} from '../src/lessons/graph/engine.ts';

const empty={nodes:[],edges:[],nextNodeId:1,nextEdgeId:1};
function edit(input: ReturnType<typeof createGraphPreset>,raw:unknown) {
  const result=editGraph(input,raw);
  assert.ok(result.ok, result.ok ? '' : result.message);
  return result.value;
}

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
  assert.equal(steps[25].event.type,'discover');
  const last=steps[31];
  assert.deepEqual(last.state.discoveryOrder,['A','B','C','D','E']);
  assert.deepEqual(last.state.processed,['A','B','C','D','E']);
  assert.deepEqual(last.state.predecessors,{A:null,B:'A',C:'A',D:'B',E:'D'});
  assert.deepEqual(last.state.depthById,{A:0,B:1,C:1,D:2,E:3});
  assert.deepEqual(last.counters,{discoveries:5,edgeExaminations:10,frontierAdds:5,frontierRemovals:5});
  assert.equal(last.state.discovered.includes('F'),false);
  assert.deepEqual(steps,graphEngine.createTrace(input,{type:'bfs',startId:'A'}));
  assert.ok(Object.isFrozen(steps[6].state.queue));
  assert.ok(Object.isFrozen(last.state.predecessors));
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

test('validation normalizes copies and rejects malformed identities and edges',()=>{
  const input=createGraphPreset(), original=structuredClone(input);
  const normalized=graphEngine.validateInput({...input,nodes:[...input.nodes].reverse(),edges:[...input.edges].reverse()});
  assert.ok(normalized.ok);
  assert.deepEqual(normalized.value,input);
  assert.notEqual(normalized.value.nodes[0],input.nodes[0]);
  assert.ok(Object.isFrozen(normalized.value.nodes[0]));
  const bad=[null,[],{}, {...empty,nextNodeId:0},{...empty,nextNodeId:Number.MAX_SAFE_INTEGER+1},
    {...input,nextNodeId:6},{...input,nextEdgeId:5},
    {...input,nodes:[...input.nodes,input.nodes[0]]},
    {...input,nodes:[{id:'Z',creationOrder:1}]},
    {...input,edges:[...input.edges,input.edges[0]]},
    {...input,edges:[{id:'E01',a:'A',b:'B'}]},
    {...input,edges:[{id:'E9007199254740992',a:'A',b:'B'}]},
    {...input,edges:[{id:'E1',a:'A',b:'A'}]},
    {...input,edges:[{id:'E1',a:'A',b:'Z'}]},
    {...input,edges:[...input.edges,{id:'E6',a:'B',b:'A'}],nextEdgeId:7}];
  for(const raw of bad) {
    assert.equal(graphEngine.validateInput(raw).ok,false);
    assert.throws(()=>graphEngine.createInitialSnapshot(raw as GraphInput));
    assert.throws(()=>graphEngine.createTrace(raw as GraphInput,{type:'bfs',startId:'A'}));
  }
  for(const command of [null,{}, {type:'dijkstra',startId:'A'},{type:'dfs',startId:'Z'}]) {
    assert.equal(graphEngine.validateCommand(command,input).ok,false);
    assert.throws(()=>graphEngine.createTrace(input,command as GraphCommand));
  }
  assert.deepEqual(input,original);
});

test('edits retain creation order and never recycle deleted IDs',()=>{
  const input=createGraphPreset(), original=structuredClone(input);
  const reconnected=edit(edit(input,{type:'disconnect',edgeId:'E2'}),{type:'connect',a:'A',b:'C'});
  assert.deepEqual(reconnected.edges.at(-1),{id:'E6',a:'A',b:'C'});
  assert.equal(reconnected.nextEdgeId,7);
  assert.deepEqual(orderedNeighbors(reconnected,'A').map(n=>n.nodeId),['B','C']);
  for(const type of ['bfs','dfs'] as const) {
    assert.deepEqual(graphEngine.createTrace(reconnected,{type,startId:'A'}).at(-1)!.state.discoveryOrder,
      type==='bfs'?['A','B','C','D','E']:['A','B','D','C','E']);
    assert.deepEqual(graphEngine.createTrace({...input,nodes:[...input.nodes].reverse(),edges:[...input.edges].reverse()},{type,startId:'A'}),graphEngine.createTrace(input,{type,startId:'A'}));
  }
  const added=edit(edit(input,{type:'remove-node',id:'B'}),{type:'add-node'});
  assert.deepEqual(added.nodes.at(-1),{id:'G',creationOrder:7});
  assert.equal(added.nextNodeId,8);
  assert.deepEqual(added.edges.map(e=>e.id),['E2','E4','E5']);
  for(const raw of [{type:'connect',a:'B',b:'A'},{type:'connect',a:'A',b:'A'},
    {type:'connect',a:'A',b:'Z'},{type:'remove-node',id:'Z'},{type:'disconnect',edgeId:'E99'},{type:'unknown'},null]) {
    assert.equal(editGraph(input,raw).ok,false);
  }
  assert.deepEqual(input,original);
  let beyond=edit(empty,{type:'add-node'});
  for(const id of 'BCDEFGHIJKLMNOPQRSTUVWXY') {
    beyond=edit(edit(beyond,{type:'add-node'}),{type:'remove-node',id});
  }
  beyond=edit(edit(beyond,{type:'add-node'}),{type:'add-node'});
  assert.deepEqual(beyond.nodes,[{id:'A',creationOrder:1},{id:'Z',creationOrder:26},{id:'AA',creationOrder:27}]);
  beyond=edit(edit(beyond,{type:'connect',a:'A',b:'AA'}),{type:'connect',a:'A',b:'Z'});
  assert.deepEqual(orderedNeighbors(beyond,'A').map(n=>n.nodeId),['Z','AA']);
  assert.deepEqual(graphEngine.createTrace(beyond,{type:'bfs',startId:'A'}).at(-1)!.state.discoveryOrder,['A','Z','AA']);
  assert.equal(beyond.nextNodeId,28);
});

test('empty, singleton, disconnected and maximum graphs remain bounded',()=>{
  const resting=graphEngine.createInitialSnapshot(empty);
  assert.equal(resting.state.algorithm,null);
  assert.deepEqual(resting.state.queue,[]);
  assert.deepEqual(resting.counters,{discoveries:0,edgeExaminations:0,frontierAdds:0,frontierRemovals:0});
  const one=edit(empty,{type:'add-node'});
  const nodes=Array.from('ABCDEFGHIJKLMNOPQRST',(id,index)=>({id,creationOrder:index+1}));
  const edges=[1,2].flatMap((offset,group)=>nodes.map((node,index)=>({id:`E${group*20+index+1}`,a:node.id,b:nodes[(index+offset)%20].id})));
  const max={nodes,edges,nextNodeId:21,nextEdgeId:41};
  assert.equal(graphEngine.validateInput(max).ok,true);
  assert.equal(editGraph(max,{type:'add-node'}).ok,false);
  assert.equal(editGraph(max,{type:'connect',a:'A',b:'D'}).ok,false);
  assert.equal(graphEngine.validateInput({...max,nodes:[...nodes,{id:'U',creationOrder:21}],nextNodeId:22}).ok,false);
  assert.equal(graphEngine.validateInput({...max,edges:[...edges,{id:'E41',a:'A',b:'D'}],nextEdgeId:42}).ok,false);
  for(const type of ['bfs','dfs'] as const) {
    assert.equal(graphEngine.validateCommand({type,startId:'A'},empty).ok,false);
    const isolated=graphEngine.createTrace(createGraphPreset(),{type,startId:'F'}).at(-1)!;
    assert.deepEqual(isolated.state.discoveryOrder,['F']);
    assert.deepEqual(isolated.state.depthById,{F:0});
    assert.deepEqual(isolated.counters,{discoveries:1,edgeExaminations:0,frontierAdds:1,frontierRemovals:1});
    const single=graphEngine.createTrace(one,{type,startId:'A'});
    assert.equal(single.length,type==='bfs'?6:5);
    assert.deepEqual(single.at(-1)!.state.predecessors,{A:null});
    const trace=graphEngine.createTrace(max,{type,startId:'A'});
    assert.ok(trace.length<=512);
    assert.equal(trace.at(-1)!.state.discovered.length,20);
    assert.equal(new Set(trace.at(-1)!.state.discovered).size,20);
    assert.equal(trace.at(-1)!.counters.edgeExaminations,80);
    for(const [index,step] of trace.entries()) {
      assert.equal(step.ordinal,index);
      assert.ok(step.invariants.every(i=>i.status==='holds'));
      assert.ok(step.event.affectedIds.every(id=>nodes.some(n=>n.id===id)||edges.some(e=>e.id===id)));
    }
  }
  const nodeExhausted={...empty,nextNodeId:Number.MAX_SAFE_INTEGER};
  assert.equal(graphEngine.validateInput(nodeExhausted).ok,true);
  assert.equal(editGraph(nodeExhausted,{type:'add-node'}).ok,false);
  const edgeExhausted={...createGraphPreset(),nextEdgeId:Number.MAX_SAFE_INTEGER};
  assert.equal(editGraph(edgeExhausted,{type:'connect',a:'A',b:'F'}).ok,false);
  assert.equal(edgeExhausted.nextEdgeId,Number.MAX_SAFE_INTEGER);
});

test('authored content and inspection follow only the selected snapshot',()=>{
  const input=createGraphPreset(), original=structuredClone(input);
  const bfs=graphEngine.createTrace(input,{type:'bfs',startId:'A'});
  const dfs=graphEngine.createTrace(input,{type:'dfs',startId:'A'});
  assert.equal(bfs[5].event.codeLineId,'bfs.discover');
  assert.match(explainGraphStep(bfs[5]),/B/);
  assert.match(explainGraphStep(dfs[16]),/C.*D/);
  assert.ok(getGraphPseudocode(dfs[16]).some(line=>line.id==='dfs.return'));
  assert.ok(getGraphPseudocode(dfs[0]).some(line=>line.id==='dfs.return'));
  assert.deepEqual(getGraphPseudocode(graphEngine.createInitialSnapshot(input)),[]);
  const field=(step:typeof bfs[number],id:string,label:string)=>graphEngine.inspect(step,id)!.fields.find(f=>f.label===label)!.value;
  assert.equal(field(bfs[31],'F','Predecessor'),'Absent');
  assert.equal(field(dfs[26],'C','DFS tree depth (edges)'),'3');
  assert.equal(field(bfs[31],'C','Shortest distance (edges)'),'1');
  assert.equal(field(bfs[5],'B','State'),'Discovered');
  assert.equal(field(bfs[6],'B','State'),'Frontier');
  assert.equal(field(dfs[13],'C','State'),'Current');
  assert.equal(field(dfs[16],'C','State'),'Processed');
  assert.equal(field(dfs[16],'C','Current node'),'D');
  assert.equal(field(dfs[16],'E4','Examined edge'),'Absent');
  assert.equal(graphEngine.inspect(bfs[0],'missing'),null);
  assert.throws(()=>{(dfs[13].state.predecessors as Record<string,string>).C='A';},TypeError);
  assert.deepEqual(input,original);
});
