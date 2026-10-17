import test from 'node:test';
import assert from 'node:assert/strict';
import {createLearningSession,transitionLearning,playbackLimit} from '../src/core/learning.ts';
import type {LearningAction,LearningSession} from '../src/core/learning.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import type {HeapInput,HeapState} from '../src/lessons/heap/engine.ts';
import {graphEngine} from '../src/lessons/graph/engine.ts';
import {heapLearning} from '../src/lessons/heap/learning.ts';
import {graphLearning} from '../src/lessons/graph/learning.ts';

const fresh=()=>createLearningSession(heapEngine,createPreset());
const h=(s:LearningSession<HeapInput,HeapState>,a:LearningAction)=>transitionLearning(s,heapEngine,heapLearning,a);
const begin=(id='heap-swap',attemptId='attempt-1')=>h(fresh(),{type:'begin',request:{kind:'challenge',id},attemptId}).session;
const submit=(s:ReturnType<typeof fresh>,optionId='index-2',attemptId='attempt-1')=>h(s,{type:'submit',attemptId,optionId,now:1000});

test('authored activities match independent guide and challenge oracles',()=>{
  const keys=['index-2','left','heap','enqueue','d','depth-3-distance-1'];
  let index=0;
  for(const content of [heapLearning,graphLearning]) {
    assert.equal(content.guide.segments.length,2);assert.equal(content.challenges.length,3);
    for(const q of content.challenges) {
      assert.equal(q.options.length,3);assert.equal(new Set(q.options.map(o=>o.id)).size,3);
      assert.equal(q.answerId,keys[index++]);assert.ok(q.options.some(o=>o.id===q.answerId));
    }
  }
  const [swap,tie,order]=heapLearning.challenges;
  const s=heapEngine.createTrace(swap.input,swap.command);
  assert.equal(swap.checkpoint.ordinal,2);assert.equal(s[3].event.type,'swap');
  assert.equal(s[3].state.items[2].id,'H6');assert.equal(s[3].state.items[5].id,'H3');assert.equal(s[3].counters.swaps,1);
  const t=heapEngine.createTrace(tie.input,tie.command);assert.equal(tie.checkpoint.ordinal,1);
  assert.equal(t[2].event.explanationKey,'heap.extract.choose-child');assert.equal(t[2].variables.chosenChildId,'H2');
  const o=heapEngine.createTrace(order.input,order.command),v=o[6].state.items.map(i=>i.value);
  assert.equal(order.checkpoint.ordinal,5);assert.equal(o[6].event.type,'complete');
  assert.deepEqual(v,[3,9,4,15,12,7]);assert.ok(v.every((n,i)=>!i||v[Math.floor((i-1)/2)]<=n));
  assert.notDeepEqual(v,[...v].sort((a,b)=>a-b));
  const [queue,ret,depth]=graphLearning.challenges;
  const b=graphEngine.createTrace(queue.input,queue.command),d=graphEngine.createTrace(ret.input,ret.command);
  assert.equal(queue.checkpoint.ordinal,8);assert.deepEqual(b[8].state.queue,['B']);
  assert.deepEqual(b[9].state.queue,['B','C']);assert.ok(!b[9].state.processed.includes('C'));
  assert.equal(ret.checkpoint.ordinal,20);assert.equal(d[21].event.type,'return');
  assert.equal(d[21].state.currentId,'D');assert.deepEqual(d[21].state.frames.at(-1),{nodeId:'D',nextNeighborIndex:2});
  assert.equal(depth.checkpoint.ordinal,11);assert.equal(d[12].state.depthById.C,3);
  assert.equal(graphEngine.createTrace(depth.input,{type:'bfs',startId:'A'}).at(-1)!.state.depthById.C,1);
});

test('activity preparation is atomic even after a valid input precedes failure',()=>{
  let before=createLearningSession(graphEngine,graphLearning.challenges[0].input);
  before=transitionLearning(before,graphEngine,graphLearning,{type:'begin',request:{kind:'challenge',id:'graph-return'},attemptId:'old'}).session;
  before=transitionLearning(before,graphEngine,graphLearning,{type:'select',id:'C'}).session;
  const changes:((c:typeof graphLearning)=>void)[]=[
    c=>{c.challenges[0].input={...c.challenges[0].input,nodes:[]};},
    c=>{c.challenges[0].command={type:'bfs',startId:'Z'};},
    c=>{c.engineVersion='old';},
    c=>{c.challenges[0].answerId='missing';},
    c=>{c.challenges[0].options=[c.challenges[0].options[0],c.challenges[0].options[0],c.challenges[0].options[2]];},
    c=>{c.challenges[0].checkpoint.ordinal=999;},
    c=>{c.challenges[0].checkpoint.type='swap';},
  ];
  const check=(after:typeof before)=>{
    for(const key of ['input','resting','steps','ordinal','selectedId'] as const) assert.equal(after.player[key],before.player[key]);
    assert.equal(after.activity,before.activity);assert.equal(after.guideProgress,before.guideProgress);assert.ok(after.player.error);
  };
  for(const change of changes) {const c=structuredClone(graphLearning);change(c);check(transitionLearning(before,graphEngine,c,{type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'new'}).session);}
  const trace=graphEngine.createTrace(before.player.input,{type:'bfs',startId:'A'});
  for(const bad of [[],trace.slice(0,-1),Array.from({length:513},(_,ordinal)=>({...trace[0],ordinal}))])
    check(transitionLearning(before,{...graphEngine,createTrace:()=>bad},graphLearning,{type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'new'}).session);
  check(transitionLearning(before,{...graphEngine,createTrace:()=>{throw Error('broken');}},graphLearning,{type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'new'}).session);
  const unrelated=structuredClone(graphLearning);unrelated.challenges[1].checkpoint.ordinal=999;
  const good=transitionLearning(before,graphEngine,unrelated,{type:'begin',request:{kind:'challenge',id:'graph-enqueue'},attemptId:'new'}).session;
  assert.equal(good.player.ordinal,8);assert.equal(good.player.selectedId,null);assert.equal(good.player.error,null);
});

test('one pending attempt emits one graded response and advances one step',()=>{
  for(const [choice,outcome] of [['index-2','correct'],['index-0','incorrect']] as const) {
    const s=begin(),graded=submit(s,choice);
    assert.equal(s.player.ordinal,2);assert.equal(playbackLimit(s),2);
    assert.equal(graded.session.player.ordinal,3);assert.equal(playbackLimit(graded.session),6);
    assert.deepEqual(graded.attempt,{attemptId:'attempt-1',moduleId:'heap',challengeId:'heap-swap',version:1,objectiveId:'heap.index-mapping',optionId:choice,outcome,timestamp:1000});
    assert.equal(submit(graded.session,choice).attempt,null);
    assert.equal(h(graded.session,{type:'seek',ordinal:0}).session.activity,graded.session.activity);
  }
});

test('content versions stay correlated and unrelated broken activities stay isolated',()=>{
  const s=begin(),changed=structuredClone(heapLearning);changed.challenges[0].version=2;
  assert.equal(transitionLearning(s,heapEngine,changed,{type:'submit',attemptId:'attempt-1',optionId:'index-2',now:1}).attempt,null);
  for(const change of [(c:typeof heapLearning)=>{c.guide.id='';},(c:typeof heapLearning)=>{c.challenges[1].id='';}]) {
    const c=structuredClone(heapLearning);change(c);
    const good=transitionLearning(fresh(),heapEngine,c,{type:'begin',request:{kind:'challenge',id:'heap-swap'},attemptId:'good'});
    assert.equal(good.session.player.error,null);assert.equal(good.session.player.ordinal,2);
  }
});

test('both graph guide segments finish in either order across layer exits',()=>{
  let s=createLearningSession(graphEngine,graphLearning.challenges[0].input),receipts=0;
  for(const segment of [...graphLearning.guide.segments].reverse()) {
    s=transitionLearning(s,graphEngine,graphLearning,{type:'begin',request:{kind:'guide',id:segment.id},attemptId:'guide'}).session;
    for(const p of segment.checkpoints) {
      s=transitionLearning(s,graphEngine,graphLearning,{type:'seek',ordinal:p.ordinal}).session;
      const update=transitionLearning(s,graphEngine,graphLearning,{type:'continue',now:3});
      assert.equal(update.session.player.error,null);receipts+=Number(Boolean(update.guideReceipt));s=update.session;
    }
    const progress=s.guideProgress;s=transitionLearning(s,graphEngine,graphLearning,{type:'mode',mode:'explore'}).session;
    assert.equal(s.guideProgress,progress);
  }
  assert.equal(receipts,1);
});

test('rewind, reveal, stale IDs and exit cannot contaminate attempts',()=>{
  const s=begin(),back=h(s,{type:'seek',ordinal:0}).session;
  for(const invalid of [submit(s,'unknown'),submit(s,'index-2','old'),submit(back)]) {
    assert.equal(invalid.attempt,null);assert.equal(playbackLimit(invalid.session),2);
  }
  assert.equal(submit({...s,player:{...s.player,steps:[...s.player.steps!]}}).attempt,null);
  const revealed=h(s,{type:'reveal',attemptId:'attempt-1'});
  assert.equal(revealed.attempt,null);assert.equal(revealed.session.player.ordinal,3);
  assert.equal(submit(revealed.session).attempt,null);
  const exited=h(s,{type:'mode',mode:'explore'}).session;
  assert.equal(exited.player,s.player);assert.equal(exited.activity,null);assert.equal(submit(exited).attempt,null);
  assert.equal(h(s,{type:'mode',mode:'challenge'}).session,s);
  const retry=h(h(s,{type:'seek',ordinal:0}).session,{type:'begin',request:{kind:'challenge',id:'heap-swap'},attemptId:'retry'}).session;
  assert.equal(retry.activity?.kind,'challenge');assert.equal(retry.activity?.status,'pending');
  assert.equal(submit(retry).attempt,null);assert.equal(submit(retry,'index-2','retry').attempt?.outcome,'correct');
});

test('guides acknowledge semantic checkpoints and emit completion only once',()=>{
  let s=fresh(),receipts=0;
  for(const [id,ordinals] of [['heap-insert',[0,1,3,8]],['heap-extract',[0,1,4,6]]] as const) {
    s=h(s,{type:'begin',request:{kind:'guide',id},attemptId:'unused'}).session;
    assert.equal(s.player.ordinal,0);
    for(let i=0;i<ordinals.length;i++) {
      assert.equal(playbackLimit(s),ordinals[i]);
      s=h(s,{type:'seek',ordinal:999}).session;assert.equal(s.player.ordinal,ordinals[i]);
      const next=h(s,{type:'continue',now:2000});receipts+=Number(Boolean(next.guideReceipt));
      assert.equal(next.attempt,null);s=next.session;
      if(i<ordinals.length-1)assert.equal(s.player.ordinal,ordinals[i]+1);
    }
    assert.equal(h(s,{type:'continue',now:2001}).guideReceipt,null);
  }
  assert.equal(receipts,1);assert.deepEqual(s.guideProgress?.finishedSegments,['heap-insert','heap-extract']);
  assert.deepEqual(graphLearning.guide.segments.map(x=>x.checkpoints.map(c=>c.ordinal)),[[0,5,9,31],[0,13,16,26]]);
});

test('partial guides survive layer exit but versions and bad checkpoints do not',()=>{
  let s=h(fresh(),{type:'begin',request:{kind:'guide',id:'heap-insert'},attemptId:'g'}).session;
  s=h(s,{type:'continue',now:1}).session;
  s=h(s,{type:'seek',ordinal:0}).session;
  assert.equal(h(s,{type:'continue',now:2}).session.player.ordinal,0);
  const bad=structuredClone(heapLearning);bad.guide.segments[0].checkpoints[1].ordinal=0;
  assert.ok(transitionLearning(fresh(),heapEngine,bad,{type:'begin',request:{kind:'guide',id:'heap-insert'},attemptId:'g'}).session.player.error);
  const old={...fresh(),guideProgress:{guideId:'heap-guide',version:0,finishedSegments:['heap-insert']}};
  const next=h(old,{type:'begin',request:{kind:'guide',id:'heap-extract'},attemptId:'g'}).session;
  assert.deepEqual(next.guideProgress?.finishedSegments,[]);
});

test('Explore, editing and ordered intermediate heap boundaries stay distinct',()=>{
  let s=h(fresh(),{type:'start',command:{type:'insert',value:1}}).session;
  s=h(s,{type:'seek',ordinal:7}).session;assert.ok(s.player.steps![7].invariants.every(i=>i.status==='holds'));
  for(const action of [{type:'begin',request:{kind:'challenge',id:'heap-swap'},attemptId:'blocked'},{type:'load',rawInput:createPreset()}] as const) {
    const blocked=h(s,action).session;assert.equal(blocked.player.steps,s.player.steps);assert.match(blocked.player.error!,/finish or restart/i);
  }
  const active=begin();assert.equal(h(active,{type:'seek',ordinal:999}).session.player.ordinal,2);
  for(const a of [{type:'start',command:{type:'extract'}},{type:'replace',rawInput:createPreset(),command:null},{type:'load',rawInput:createPreset()}] as const)
    assert.match(h(active,a).session.player.error!,/explore/i);
  assert.ok(h(fresh(),{type:'seek',ordinal:999}).session.player.error);
  const boundary=h(s,{type:'seek',ordinal:0}).session;
  const loaded=h(boundary,{type:'load',rawInput:createPreset()}).session;
  assert.equal(loaded.player.steps,null);assert.equal(loaded.player.selectedId,null);
});
