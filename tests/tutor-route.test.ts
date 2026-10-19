import test from 'node:test';
import assert from 'node:assert/strict';
import {createTutorHandler,readBoundedJson} from '../src/server/tutor.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import {heapLearning} from '../src/lessons/heap/learning.ts';
import type {TutorRequest,TutorContent} from '../src/core/tutor.ts';

const uuid=(n=1)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const cookie=(n=1)=>`dsa_tutor_guest=${uuid(n)}`;
const answer:TutorContent={explanation:'The visible heap is ordered.',referencedIds:['H1'],proposedCommands:[]};
const scene=():TutorRequest=>({requestId:'r1',runId:'run1',lessonId:'heap',lessonVersion:heapEngine.version,input:createPreset(),command:null,
  ordinal:0,snapshotId:'s0',selectedIds:[],question:'Why?',mode:'explain',learning:{mode:'explore',activity:null}});
const request=(raw:unknown=scene(),headers:HeadersInit={cookie:cookie()},signal?:AbortSignal)=>new Request('http://localhost:3000/api/tutor',
  {method:'POST',headers,body:typeof raw==='string'?raw:JSON.stringify(raw),signal});
const tick=()=>new Promise<void>(resolve=>setImmediate(resolve));

test('origin validation uses the incoming host when Next canonicalizes the internal URL',async()=>{
  const post=createTutorHandler({provider:async()=>answer});
  const incoming=new Request('http://localhost:3000/api/tutor',{method:'POST',body:JSON.stringify(scene()),
    headers:{host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000'}});
  assert.equal((await post(incoming)).status,200);
  const foreign=new Request('http://localhost:3000/api/tutor',{method:'POST',body:JSON.stringify(scene()),
    headers:{host:'127.0.0.1:3000',origin:'http://localhost:3000'}});
  assert.equal((await post(foreign)).status,400);
});

test('bounded JSON counts actual bytes including split UTF-8 and cancels overflow',async()=>{
  const bytes=new TextEncoder().encode(JSON.stringify('é'));
  const body=new ReadableStream<Uint8Array>({start(c){for(const byte of bytes)c.enqueue(new Uint8Array([byte]));c.close();}});
  assert.equal(await readBoundedJson(body,4,new AbortController().signal),'é');
  await assert.rejects(readBoundedJson(new Response(JSON.stringify('é')).body,3,new AbortController().signal));
  await assert.rejects(readBoundedJson(new Response('{').body,32,new AbortController().signal));
});

test('route validates bytes, input, origin, pending status and correlation before provider use',async()=>{
  let calls=0;const post=createTutorHandler({provider:async()=>{calls++;return answer;},id:()=>uuid()});
  const ok=await post(request());assert.equal(ok.status,200);assert.equal((await ok.json()).requestId,'r1');
  const bytes=JSON.stringify(scene());
  const exact=bytes+' '.repeat(32768-new TextEncoder().encode(bytes).length);
  assert.equal((await post(request(exact,{'content-length':'1',cookie:cookie()}))).status,200);
  const invalid=[{...scene(),snapshot:{}},{...scene(),model:'cloud'},{...scene(),lessonVersion:'9'},
    {...scene(),selectedIds:['H999']},{...scene(),ordinal:999},{...scene(),question:'x'.repeat(2001)},
    {...scene(),command:{type:'insert',value:100}},'{',exact+' '];
  for(const raw of invalid)assert.equal((await post(request(raw))).status,400);
  assert.equal((await post(request(scene(),{origin:'https://evil.example',cookie:cookie()}))).status,400);
  const q=heapLearning.challenges[0];
  for(const ordinal of [q.checkpoint.ordinal,0]) {
    const pending={...scene(),input:q.input,command:q.command,ordinal,snapshotId:`s${ordinal}`,
      learning:{mode:'challenge',activity:{kind:'challenge',id:q.id,version:1,attemptId:'a1',status:'pending'}}};
    const response=await post(request(pending));assert.equal(response.status,400);assert.equal((await response.json()).error.code,'challenge_locked');
  }
  assert.equal(calls,2);
  assert.match(ok.headers.get('set-cookie')!,/HttpOnly/);assert.match(ok.headers.get('set-cookie')!,/SameSite=Strict/);
  assert.match(ok.headers.get('set-cookie')!,/Path=\//);assert.equal(ok.headers.get('cache-control'),'no-store');
});

test('guest windows count failures, expire, rotate malformed cookies and bound 256 buckets',async()=>{
  let now=0,calls=0;
  const post=createTutorHandler({provider:async()=>{calls++;throw Error('sensitive raw provider body');},now:()=>now,id:()=>uuid(999)});
  for(let i=0;i<6;i++){const r=await post(request());assert.equal(r.status,503);assert.match(r.headers.get('set-cookie')!,/HttpOnly/);}
  const limited=await post(request());assert.equal(limited.status,429);assert.equal((await limited.json()).error.code,'rate_limited');
  assert.equal(limited.headers.get('retry-after'),'60');assert.equal(calls,6);
  now=60000;assert.equal((await post(request())).status,503);assert.equal(calls,7);
  const rotated=await post(request(scene(),{cookie:'dsa_tutor_guest=garbage'}));assert.ok(rotated.headers.get('set-cookie')!.includes(uuid(999)));
  const secure=await post(new Request('https://localhost/api/tutor',{method:'POST',body:JSON.stringify(scene())}));
  assert.match(secure.headers.get('set-cookie')!,/Secure/);
  let nextId=1;const bounded=createTutorHandler({provider:async()=>answer,now:()=>now,id:()=>uuid(nextId++)});
  for(let i=1;i<=256;i++)assert.equal((await bounded(request(scene(),{}))).status,200);
  const full=await bounded(request(scene(),{}));assert.equal(full.status,429);
  now+=60000;assert.equal((await bounded(request(scene(),{}))).status,200);
});

test('deadline returns within 15000ms while an ignoring provider retains the transport slot',async()=>{
  const jobs:{ms:number;callback:()=>void}[]=[];
  let resolve!:(value:TutorContent)=>void,calls=0;
  const post=createTutorHandler({provider:()=>{calls++;return new Promise(r=>{resolve=r;});},
    schedule:(ms,callback)=>{jobs.push({ms,callback});return()=>{};}});
  const first=post(request());await tick();assert.equal(calls,1);assert.equal(jobs[0].ms,15000);
  jobs[0].callback();const timeout=await first;assert.equal(timeout.status,504);
  assert.equal((await timeout.json()).error.code,'timeout');
  const busy=await post(request());assert.equal(busy.status,429);assert.equal((await busy.json()).error.code,'busy');assert.equal(calls,1);
  resolve(answer);await tick();
  const next=post(request());await tick();assert.equal(calls,2);resolve(answer);assert.equal((await next).status,200);
});

test('disconnect and body stalls cancel without unhandled late results',async()=>{
  let resolve!:(value:TutorContent)=>void,aborted=false;
  const controller=new AbortController();
  const post=createTutorHandler({provider:(_c,signal)=>{signal.addEventListener('abort',()=>{aborted=true;});return new Promise(r=>{resolve=r;});}});
  const call=post(request(scene(),{cookie:cookie()},controller.signal));await tick();controller.abort();
  assert.equal((await call).status,400);assert.equal(aborted,true);resolve(answer);await tick();
  const jobs:(()=>void)[]=[];let cancelled=false,providerCalls=0;
  const stalled=createTutorHandler({provider:async()=>{providerCalls++;return answer;},schedule:(_ms,cb)=>{jobs.push(cb);return()=>{};}});
  const stream=new ReadableStream<Uint8Array>({cancel(){cancelled=true;}});
  const req=new Request('http://localhost/api/tutor',{method:'POST',body:stream,duplex:'half'} as RequestInit);
  const pending=stalled(req);await tick();jobs[0]();assert.equal((await pending).status,504);
  await tick();assert.equal(cancelled,true);assert.equal(providerCalls,0);
});
