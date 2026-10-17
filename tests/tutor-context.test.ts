import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,startCommand,seek,currentSnapshot} from '../src/core/player.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import {graphEngine,createGraphPreset} from '../src/lessons/graph/engine.ts';
import {heapLearning} from '../src/lessons/heap/learning.ts';
import {graphLearning} from '../src/lessons/graph/learning.ts';
import {parseTutorRequest} from '../src/core/tutor.ts';
import type {TutorRequest} from '../src/core/tutor.ts';
import {reconstructTutorContext,validateTutorContent,validateTutorReply,previewTutorProposal} from '../src/lessons/tutor.ts';

function request(lessonId:'heap'|'graph'='heap',command:unknown=null,ordinal=0):TutorRequest {
  const engine=lessonId==='heap'?heapEngine:graphEngine;
  return {requestId:'request-1',runId:'run-1',lessonId,lessonVersion:engine.version,
    input:lessonId==='heap'?createPreset():createGraphPreset(),command,ordinal,snapshotId:`s${ordinal}`,
    selectedIds:[],question:'Why this step?',mode:'explain',learning:{mode:'explore',activity:null}};
}
function context(r:TutorRequest) {const c=reconstructTutorContext(r);assert.ok(c.ok,c.ok?'':c.message);return c.value;}
const answer={explanation:'Follow the current state.',referencedIds:[],proposedCommands:[]};

test('tutor request parsing rejects extras, malformed identity, sizes and activity shapes',()=>{
  const r=request();assert.ok(parseTutorRequest(r).ok);
  for(const patch of [{requestId:''},{runId:'x'.repeat(65)},{snapshotId:'bad id'},{ordinal:1.2},{ordinal:-1},
    {selectedIds:['H1','H2']},{selectedIds:['bad id']},{question:' '},{question:'x'.repeat(2001)},
    {mode:'execute'},{snapshot:{}},{model:'cloud'},{input:undefined},{command:undefined},
    {learning:{mode:'challenge',activity:{kind:'challenge',id:'heap-swap',version:1,attemptId:'x',status:'pending',answerId:'x'}}}])
    assert.equal(parseTutorRequest({...r,...patch}).ok,false,JSON.stringify(patch));
  assert.ok(parseTutorRequest({...r,question:'x'.repeat(2000)}).ok);
});

test('rest and active s0 retain different meaning with identical engine snapshots',()=>{
  const resting=context(request()),active=context(request('heap',{type:'insert',value:1}));
  assert.deepEqual(active.snapshot,resting.snapshot);
  assert.deepEqual(resting.run,{kind:'rest',command:null});
  assert.deepEqual(active.run,{kind:'active',command:{type:'insert',value:1}});
  assert.match(resting.guidance,/rest|operation/i);
  assert.ok(context(request('graph')).guidance.includes('Choose'));
  const r=request('heap',{type:'extract'},1);r.selectedIds=['H1'];assert.equal(context(r).inspection?.id,'H1');
  const edge=request('graph',{type:'dfs',startId:'A'},13);edge.selectedIds=['E2'];
  assert.equal(context(edge).inspection?.id,'E2');
  assert.deepEqual(context(request('graph',{type:'bfs',startId:'A'},9)).snapshot,
    graphEngine.createTrace(createGraphPreset(),{type:'bfs',startId:'A'})[9]);
  for(const patch of [{ordinal:1},{lessonVersion:'bad'},{snapshotId:'s99'},{selectedIds:['H999']},{objectiveId:'missing'},
    {input:{items:[],nextId:0}},{command:{type:'insert',value:100}},{ordinal:999}])
    assert.equal(reconstructTutorContext({...request(),...patch}).ok,false,JSON.stringify(patch));
});

test('activity projection validates actual ordinals and never includes future teaching or answers',()=>{
  const r=request('heap',{type:'insert',value:1},1);
  const guide={kind:'guide' as const,id:'heap-insert',version:1,checkpoint:8,status:'active' as const};
  r.learning={mode:'explain',activity:guide};
  const c=context(r),serialized=JSON.stringify(c);
  for(const hidden of ['answerId','feedback','attemptId','checkpoints','proposedCommands',heapLearning.guide.segments[0].checkpoints[3].text])
    assert.equal(serialized.includes(hidden),false,hidden);
  assert.equal(context({...r,ordinal:8,snapshotId:'s8'}).guidance,heapLearning.guide.segments[0].checkpoints[3].text);
  assert.equal(reconstructTutorContext({...r,learning:{mode:'explain',activity:{...guide,checkpoint:2}}}).ok,false);
  assert.equal(reconstructTutorContext({...r,command:{type:'insert',value:2}}).ok,false);
  assert.equal(reconstructTutorContext({...r,learning:{mode:'explore',activity:r.learning.activity}}).ok,false);
  const q=graphLearning.challenges[0],pending: TutorRequest={...request('graph',q.command,0),input:q.input,
    learning:{mode:'challenge',activity:{kind:'challenge',id:q.id,version:1,attemptId:'attempt-1',status:'pending'}}};
  assert.ok(reconstructTutorContext(pending).ok);
  assert.equal(JSON.stringify(context(pending)).includes(q.feedback),false);
  assert.equal(reconstructTutorContext({...pending,ordinal:9,snapshotId:'s9'}).ok,false);
  assert.equal(reconstructTutorContext({...pending,learning:{mode:'challenge',activity:{...pending.learning.activity!,version:2}}}).ok,false);
});

test('content validation and previews use complete candidates without touching original scenes',()=>{
  const r=request(),c=context(r),before=JSON.stringify(r);
  const reply={...answer,referencedIds:['H1'],proposedCommands:[{kind:'command',command:{type:'extract'}},{kind:'example',exampleId:'heap-tie'}]};
  assert.ok(validateTutorContent(reply,c).ok);
  const p=previewTutorProposal(r,{kind:'example',exampleId:'heap-tie'});assert.ok(p.ok);
  assert.equal(p.value.command&&typeof p.value.command,'object');assert.ok(p.value.stepCount>1);
  assert.equal(JSON.stringify(r),before);
  for(const patch of [{explanation:''},{explanation:'x'.repeat(3001)},{referencedIds:['H1','H1']},{referencedIds:['H999']},
    {referencedIds:Array.from({length:21},(_,i)=>`H${i+1}`)},{followUp:'x'.repeat(501)},{html:'<script>'},
    {proposedCommands:Array(4).fill({kind:'command',command:{type:'extract'}})},
    {proposedCommands:[{kind:'example',exampleId:'missing'}]},{proposedCommands:[{kind:'example',exampleId:'heap-tie',input:{}}]},
    {proposedCommands:[{kind:'command',command:{type:'insert',value:100}}]},
    {proposedCommands:[{kind:'command',command:{type:'extract',url:'bad'}}]}])
    assert.equal(validateTutorContent({...answer,...patch},c).ok,false,JSON.stringify(patch));
  assert.ok(validateTutorContent({...answer,explanation:'x'.repeat(3000),followUp:'x'.repeat(500)},c).ok);
  const guide={...r,learning:{mode:'explain' as const,activity:null}};
  assert.equal(validateTutorContent(reply,context(guide)).ok,false);
  assert.equal(previewTutorProposal(guide,{kind:'command',command:{type:'extract'}}).ok,false);
  const middle=request('heap',{type:'insert',value:8},1);
  assert.equal(previewTutorProposal(middle,{kind:'command',command:{type:'extract'}}).ok,false);
  assert.equal(previewTutorProposal(middle,{kind:'example',exampleId:'heap-order'}).ok,false);
  assert.ok(previewTutorProposal(request('graph',{type:'dfs',startId:'A'},13),{kind:'command',command:{type:'bfs',startId:'A'}}).ok);
  assert.equal(previewTutorProposal(request('graph'),{kind:'example',exampleId:'heap-tie'}).ok,false);
});

test('reply correlation and empty/full scenes remain bounded and inspectable',()=>{
  const r=request(),reply={...answer,requestId:r.requestId,runId:r.runId,snapshotId:r.snapshotId};
  assert.ok(validateTutorReply(reply,r).ok);
  for(const key of ['requestId','runId','snapshotId'])assert.equal(validateTutorReply({...reply,[key]:'stale'},r).ok,false);
  assert.equal(validateTutorReply({...reply,extra:true},r).ok,false);
  const empty={...r,input:{items:[],nextId:1}};assert.ok(previewTutorProposal(empty,{kind:'command',command:{type:'extract'}}).ok);
  const full={...r,input:{items:Array.from({length:15},(_,i)=>({id:`H${i+1}`,value:i})),nextId:16}};
  assert.equal(previewTutorProposal(full,{kind:'command',command:{type:'insert',value:0}}).ok,false);
  const graphEmpty={...request('graph'),input:{nodes:[],edges:[],nextNodeId:1,nextEdgeId:1}};
  assert.ok(reconstructTutorContext(graphEmpty).ok);
  assert.equal(previewTutorProposal(graphEmpty,{kind:'command',command:{type:'bfs',startId:'A'}}).ok,false);
});

test('player retains normalized command across seek and failure without changing snapshots',()=>{
  const rest=createPlayer(heapEngine,createPreset()),active=startCommand(rest,heapEngine,{type:'insert',value:1});
  assert.equal(rest.command,null);assert.deepEqual(active.command,{type:'insert',value:1});
  assert.deepEqual(currentSnapshot(seek(active,0)),currentSnapshot(rest));
  const rejected=startCommand(active,heapEngine,{type:'extract'});
  assert.equal(rejected.command,active.command);assert.equal(rejected.steps,active.steps);
  assert.equal(seek(active,0).command,active.command);
  const next=startCommand(seek(active,8),heapEngine,{type:'extract'});
  assert.deepEqual(next.command,{type:'extract'});assert.equal(next.input.items[0].id,'H8');
});
