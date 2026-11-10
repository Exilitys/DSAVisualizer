import test from 'node:test';
import assert from 'node:assert/strict';
import {createTutorController} from '../src/components/tutor.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import {heapLearning} from '../src/lessons/heap/learning.ts';
import type {TutorScene,TutorRequest,TutorReply} from '../src/core/tutor.ts';

const scene=():TutorScene=>({runId:'run-1',lessonId:'heap',lessonVersion:heapEngine.version,input:createPreset(),command:{type:'insert',value:1},
  ordinal:1,snapshotId:'s1',selectedIds:[],learning:{mode:'explore',activity:null}});
const tick=()=>new Promise<void>(resolve=>setImmediate(resolve));
function setup(initial=scene()) {
  const current=initial,requests:TutorRequest[]=[],responses:((response:Response)=>void)[]=[],jobs:{ms:number;run:()=>void;cancelled:boolean}[]=[];
  let pauses=0,ids=0,changes=0;
  const controller=createTutorController({read:()=>current,pause:()=>{pauses++;},changed:()=>{changes++;},id:()=>`req-${++ids}`,
    fetcher:(async(_url:unknown,init:RequestInit)=>{requests.push(JSON.parse(String(init.body)));return new Promise<Response>(resolve=>responses.push(resolve));}) as typeof fetch,
    schedule:(ms,run)=>{const job={ms,run,cancelled:false};jobs.push(job);return()=>{job.cancelled=true;};}});
  const reply=(index=0,patch:Partial<TutorReply>={})=>responses[index](Response.json({requestId:requests[index].requestId,runId:requests[index].runId,
    snapshotId:requests[index].snapshotId,explanation:'The current item was appended.',referencedIds:['H1'],proposedCommands:[],...patch}));
  return {controller,scene:current,requests,responses,jobs,reply,pauses:()=>pauses,changes:()=>changes};
}

test('effective context changes and away-and-back cannot restore a late tutor reply',async()=>{
  const changes:((s:TutorScene)=>void)[]=[s=>{s.runId='run-2';},s=>{s.ordinal=2;s.snapshotId='s2';},s=>{s.selectedIds=['H1'];},
    s=>{s.learning={mode:'explain',activity:null};},s=>{s.learning={mode:'explain',activity:{kind:'guide',id:'heap-insert',version:1,checkpoint:3,status:'active'}};},
    s=>{s.learning={mode:'challenge',activity:{kind:'challenge',id:'heap-swap',version:1,attemptId:'a1',status:'graded'}};}];
  for(const change of changes) {
    const h=setup(),asking=h.controller.ask('Why?','explain');assert.equal(h.requests.length,1);
    change(h.scene);h.controller.sync();h.reply();await asking;await tick();
    assert.equal(h.controller.status().reply,null);assert.equal(h.controller.status().preview,null);assert.equal(h.controller.status().status,'cancelled');
  }
  const h=setup(),asking=h.controller.ask('Why?','hint');h.scene.ordinal=2;h.scene.snapshotId='s2';h.controller.sync();
  h.scene.ordinal=1;h.scene.snapshotId='s1';h.controller.sync();h.reply();await asking;
  assert.notEqual(h.controller.status().status,'ready');
});

test('same effective context keeps a ready reply and cancel/dispose fence discarded work',async()=>{
  const h=setup(),asking=h.controller.ask('Why?','explain');h.controller.sync();h.reply();await asking;
  assert.equal(h.controller.status().status,'ready');assert.equal(h.pauses(),1);
  const ready=h.controller.status().reply;h.scene.selectedIds=[];h.scene.learning={mode:'explore',activity:null};h.controller.sync();
  assert.equal(h.controller.status().reply,ready);
  const second=h.controller.ask('Again?','explain');h.controller.cancel();await second;h.reply(1);await tick();assert.equal(h.controller.status().reply,null);
  const third=h.controller.ask('Cleanup?','explain'),before=h.changes();h.controller.dispose();h.reply(2);await third;await tick();
  assert.equal(h.changes(),before);h.controller.sync();
  const fourth=h.controller.ask('New setup?','explain');h.reply(3);await fourth;assert.equal(h.controller.status().status,'ready');
});

test('client deadline clears waiting even when transport ignores abort and retry uses new identity',async()=>{
  const h=setup(),asking=h.controller.ask('Why?','explain');assert.equal(h.jobs[0].ms,15000);h.jobs[0].run();await asking;
  assert.equal(h.controller.status().status,'failed');assert.equal(h.controller.status().error?.code,'timeout');
  const retry=h.controller.retry();assert.equal(h.requests.length,2);assert.notEqual(h.requests[0].requestId,h.requests[1].requestId);
  h.reply(0);await tick();assert.equal(h.controller.status().status,'pending');h.reply(1);await retry;assert.equal(h.controller.status().status,'ready');
  const stale=setup(),wrong=stale.controller.ask('Why?','explain');stale.reply(0,{runId:'other'});await wrong;
  assert.equal(stale.controller.status().status,'failed');assert.equal(stale.controller.status().reply,null);
});

test('pending and rewound predictions use authored guidance without network; resolution needs explicit ask',async()=>{
  const q=heapLearning.challenges[0];
  const h=setup({...scene(),input:q.input,command:q.command,ordinal:0,snapshotId:'s0',
    learning:{mode:'challenge',activity:{kind:'challenge',id:q.id,version:1,attemptId:'a1',status:'pending'}}});
  await h.controller.ask('Hint?','hint');assert.equal(h.requests.length,0);assert.equal(h.controller.status().error?.code,'challenge_locked');
  assert.ok(h.scene.learning.activity?.kind==='challenge');h.scene.learning.activity.status='revealed';h.controller.sync();assert.equal(h.requests.length,0);
  const after=h.controller.ask('Explain?','explain');h.reply();await after;assert.equal(h.controller.status().status,'ready');
});

test('preview and Apply revalidate mode and correlation, commit once, and preserve failed scenes',async()=>{
  const h=setup({...scene(),command:null,ordinal:0,snapshotId:'s0'});
  const asking=h.controller.ask('Try an example','explain');h.reply(0,{proposedCommands:[{kind:'example',exampleId:'heap-tie'}]});await asking;
  assert.ok(h.controller.preview(0).ok);let commits=0;
  assert.equal(h.controller.apply(()=>{commits++;return false;}),false);assert.equal(commits,1);assert.equal(h.controller.status().reply?.proposedCommands.length,1);
  assert.ok(h.controller.preview(0).ok);h.scene.selectedIds=['H1'];h.controller.sync();
  assert.equal(h.controller.apply(()=>{commits++;return true;}),false);assert.equal(commits,1);
  const next=h.controller.ask('Try an example','explain');h.reply(1,{proposedCommands:[{kind:'example',exampleId:'heap-tie'}]});await next;
  assert.ok(h.controller.preview(0).ok);assert.equal(h.controller.apply(p=>{assert.equal(p.kind,'example');commits++;return true;}),true);
  assert.equal(commits,2);assert.equal(h.controller.status().preview,null);
});
