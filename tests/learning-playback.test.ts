import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {useLessonPlayer} from '../src/components/useLessonPlayer.ts';
import {createPlayback} from '../src/components/playback.ts';
import {createLearningSession,transitionLearning,playbackLimit} from '../src/core/learning.ts';
import type {LearningAction,AttemptEvidence} from '../src/core/learning.ts';
import {graphEngine,createGraphPreset} from '../src/lessons/graph/engine.ts';
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
