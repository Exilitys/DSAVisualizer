import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {useLessonPlayer} from '../src/components/useLessonPlayer.ts';
import type {LessonPlayer} from '../src/components/useLessonPlayer.ts';
import {createPlayback} from '../src/components/playback.ts';
import {createLearningSession,transitionLearning,playbackLimit} from '../src/core/learning.ts';
import type {LearningAction,AttemptEvidence} from '../src/core/learning.ts';
import {graphEngine,createGraphPreset} from '../src/lessons/graph/engine.ts';
import type {GraphInput,GraphCommand,GraphState} from '../src/lessons/graph/engine.ts';
import {graphLearning} from '../src/lessons/graph/learning.ts';

function setup() {
  let session=createLearningSession(graphEngine,createGraphPreset()),visible=true;
  const jobs:{callback:()=>void;delay:number}[]=[],attempts:AttemptEvidence[]=[];
  const apply=(action:LearningAction)=>{const u=transitionLearning(session,graphEngine,graphLearning,action);session=u.session;if(u.attempt)attempts.push(u.attempt);};
  const controller=createPlayback({read:()=>({run:visible?session.player.steps:null,ordinal:session.player.ordinal,lastOrdinal:playbackLimit(session)}),
    advance:ordinal=>apply({type:'seek',ordinal}),changed:()=>{},schedule:(delay,callback)=>{jobs.push({callback,delay});return()=>{};}});
  return {controller,jobs,attempts,read:()=>session,
    act:(action:LearningAction)=>{controller.pause();apply(action);},
    reset:()=>{controller.pause();session=createLearningSession(graphEngine,createGraphPreset());},
    hide:()=>{visible=false;controller.pause();},
    run:()=>{let n=0;while(controller.status().playing){assert.ok(n++<100);jobs.at(-1)!.callback();}}};
}

test('server entry exposes learning controls without touching browser storage',()=>{
  assert.equal(typeof window,'undefined');
  let captured!:ReturnType<typeof useLessonPlayer>;
  function Probe(){const value=useLessonPlayer(graphEngine,createGraphPreset(),graphLearning);captured=value;return createElement('span',null,value.player.ordinal);}
  assert.equal(renderToString(createElement(Probe)),'<span>0</span>');
  assert.equal(captured.session.mode,'explore');assert.equal(captured.limit,0);
  assert.equal(captured.local.settings.speed,1);assert.equal(typeof captured.begin,'function');assert.equal(typeof captured.resetSavedData,'function');
  assert.equal(captured.tutor.status,'idle');assert.equal(typeof captured.askTutor,'function');
  assert.equal(typeof captured.applyTutorPreview,'function');
});

test('hook tutor descriptors retain identity across seek and change only on actual replacement',async()=>{
  const fetched:Record<string,unknown>[]=[],original=globalThis.fetch;
  globalThis.fetch=(async(_url:unknown,init?:RequestInit)=>{
    const raw=JSON.parse(String(init?.body));fetched.push(raw);
    return Response.json({requestId:raw.requestId,runId:raw.runId,snapshotId:raw.snapshotId,
      explanation:'This is the verified current graph.',referencedIds:[],proposedCommands:[]});
  }) as typeof fetch;
  try {
    let captured!:LessonPlayer<GraphInput,GraphCommand,GraphState>;
    function Probe(){captured=useLessonPlayer(graphEngine,createGraphPreset(),graphLearning);return createElement('span');}
    renderToString(createElement(Probe));assert.equal(fetched.length,0);
    await captured.askTutor('Rest?','explain');captured.start({type:'dfs',startId:'A'});await captured.askTutor('Run?','explain');
    captured.go(0);await captured.askTutor('Restart?','explain');captured.go(13);await captured.askTutor('Middle?','explain');
    captured.start({type:'bfs',startId:'missing'});await captured.askTutor('Rejected?','explain');
    captured.start({type:'bfs',startId:'A'});await captured.askTutor('Replacement?','explain');
    assert.equal(fetched.length,6);assert.notEqual(fetched[0].runId,fetched[1].runId);
    for(const n of [2,3,4])assert.equal(fetched[n].runId,fetched[1].runId);
    assert.notEqual(fetched[5].runId,fetched[1].runId);assert.deepEqual(fetched[4].command,{type:'dfs',startId:'A'});
    assert.equal(fetched[0].command,null);assert.equal(fetched[2].ordinal,0);
    const graph=createGraphPreset(),input={...graph,nodes:graph.nodes.filter(n=>n.id!=='A'),edges:graph.edges.filter(e=>e.a!=='A'&&e.b!=='A')};
    captured.replaceInput(input,{type:'bfs',startId:'A'});await captured.askTutor('Deleted start?','explain');
    assert.equal(fetched[6].command,null);assert.notEqual(fetched[6].runId,fetched[5].runId);
    captured.resetSavedData();await captured.askTutor('Reset?','explain');assert.notEqual(fetched[7].runId,fetched[6].runId);
  } finally {globalThis.fetch=original;}
});

test('hook tutor Apply is atomic on a late engine failure and clears only example selection',async()=>{
  const original=globalThis.fetch;let broken=false;
  const bodies:Record<string,unknown>[]=[];
  globalThis.fetch=(async(_url:unknown,init?:RequestInit)=>{
    const r=JSON.parse(String(init?.body));bodies.push(r);
    return Response.json({requestId:r.requestId,runId:r.runId,snapshotId:r.snapshotId,explanation:'Review the proposed action.',referencedIds:[],
      proposedCommands:[r.question==='command'?{kind:'command',command:{type:'dfs',startId:'A'}}:{kind:'example',exampleId:'graph-depth'}]});
  }) as typeof fetch;
  try {
    let captured!:LessonPlayer<GraphInput,GraphCommand,GraphState>;
    const engine={...graphEngine,createTrace:(input:GraphInput,command:GraphCommand)=>broken?[]:graphEngine.createTrace(input,command)};
    function Probe(){captured=useLessonPlayer(engine,createGraphPreset(),graphLearning);return createElement('span');}
    renderToString(createElement(Probe));captured.start({type:'bfs',startId:'A'});captured.select('E2');
    await captured.askTutor('example','explain');assert.ok(captured.previewTutor(0).ok);broken=true;
    assert.equal(captured.applyTutorPreview(),null);broken=false;
    await captured.askTutor('command','explain');assert.equal(bodies[1].runId,bodies[0].runId);
    assert.ok(captured.previewTutor(0).ok);const command=captured.applyTutorPreview();assert.ok(command);
    assert.equal(command.player.selectedId,'E2');
    await captured.askTutor('example','explain');assert.ok(captured.previewTutor(0).ok);
    const example=captured.applyTutorPreview();assert.ok(example);assert.equal(example.kind,'example');assert.equal(example.player.selectedId,null);
  } finally {globalThis.fetch=original;}
});

test('all speeds stop at every guide checkpoint and Continue opens only the next range',()=>{
  for(const speed of [.5,1,2] as const) {
    const s=setup();s.act({type:'begin',request:{kind:'guide',id:'graph-bfs'},attemptId:'g'});
    s.act({type:'continue',now:1});assert.equal(s.read().player.ordinal,1);
    s.controller.setSpeed(speed);s.controller.play();assert.equal(s.jobs.at(-1)!.delay,1000/speed);s.run();
    assert.equal(s.read().player.ordinal,5);assert.equal(s.controller.status().playing,false);
    s.act({type:'seek',ordinal:0});s.controller.play();s.run();assert.equal(s.read().player.ordinal,5);
    s.act({type:'continue',now:2});assert.equal(s.read().player.ordinal,6);assert.equal(playbackLimit(s.read()),9);
    s.controller.play();s.run();assert.equal(s.read().player.ordinal,9);assert.equal(s.attempts.length,0);
  }
});

test('challenge rewind and seek stay bounded until one paused submission or reveal',()=>{
  const s=setup();s.act({type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'a'});
  s.controller.play();assert.equal(s.controller.status().playing,false);
  s.act({type:'seek',ordinal:999});assert.equal(s.read().player.ordinal,8);
  s.act({type:'seek',ordinal:0});s.controller.play();s.run();assert.equal(s.read().player.ordinal,8);
  s.act({type:'submit',attemptId:'a',optionId:'enqueue',now:1});assert.equal(s.read().player.ordinal,9);
  assert.equal(s.controller.status().playing,false);assert.equal(playbackLimit(s.read()),31);
  s.act({type:'submit',attemptId:'a',optionId:'enqueue',now:2});assert.equal(s.attempts.length,1);
});

test('old ticks cannot advance a new layer, activity, cursor, reveal, reset or hidden tab',()=>{
  for(const action of [
    {type:'mode',mode:'explore'},
    {type:'begin',request:{kind:'challenge',id:'graph-return'},attemptId:'new'},
    {type:'seek',ordinal:3},
    {type:'reveal',attemptId:'a'},
  ] as const) {
    const s=setup();s.act({type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'a'});s.act({type:'seek',ordinal:0});
    s.controller.play();const old=s.jobs.at(-1)!;s.act(action);const before=s.read();old.callback();assert.equal(s.read(),before);
  }
  for(const reset of [true,false]) {
    const s=setup();s.act({type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'a'});s.act({type:'seek',ordinal:0});
    s.controller.play();const old=s.jobs.at(-1)!;if(reset)s.reset();else s.hide();const before=s.read();old.callback();assert.equal(s.read(),before);
    s.controller.dispose();s.controller.dispose();assert.equal(s.attempts.length,0);
  }
});
