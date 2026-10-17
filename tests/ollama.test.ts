import test from 'node:test';
import assert from 'node:assert/strict';
import {createOllamaProvider} from '../src/server/ollama.ts';
import {reconstructTutorContext} from '../src/lessons/tutor.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import type {TutorRequest} from '../src/core/tutor.ts';

const request:TutorRequest={requestId:'r1',runId:'run1',lessonId:'heap',lessonVersion:heapEngine.version,input:createPreset(),command:null,
 ordinal:0,snapshotId:'s0',selectedIds:['H1'],question:'sensitive-question-marker',mode:'explain',learning:{mode:'explore',activity:null}};
const rebuilt=reconstructTutorContext(request);assert.ok(rebuilt.ok);const context=rebuilt.value;
const answer={explanation:'H1 is the minimum.',referencedIds:['H1'],proposedCommands:[]};
const response=(content:unknown=answer,done=true)=>Response.json({done,message:{content:JSON.stringify(content)}});
const fake=(run:(url:RequestInfo|URL,init?:RequestInit)=>Promise<Response>)=>run as typeof fetch;

test('Ollama sends only verified current context with bounded nonstreaming JSON schema output',async()=>{
  let captured:Record<string,unknown>|null=null;
  const signal=new AbortController().signal;
  const provider=createOllamaProvider({baseUrl:'http://127.0.0.1:11434',model:'installed:local'},fake(async(url,init)=>{
    assert.equal(String(url),'http://127.0.0.1:11434/api/chat');assert.equal(init?.signal,signal);assert.equal(init?.redirect,'error');
    captured=JSON.parse(String(init?.body));return response();
  }));
  assert.deepEqual(await provider(context,signal),answer);
  const body=captured! as Record<string,unknown>;assert.equal(body.model,'installed:local');assert.equal(body.stream,false);
  assert.deepEqual(body.options,{temperature:0,num_predict:512});assert.equal(typeof body.format,'object');assert.equal('tools' in body,false);
  const sent=JSON.stringify(body);for(const hidden of ['answerId','feedback','checkpoints','input','attemptId'])assert.equal(sent.includes(`"${hidden}"`),false,hidden);
});

test('Ollama rejects cloud/unconfigured calls without network or sensitive error content',async()=>{
  let calls=0;
  const fetcher=fake(async()=>{calls++;return response();});
  for(const config of [{baseUrl:'https://ollama.com',model:'local'},{baseUrl:'http://localhost:11434',model:'test:cloud'},
    {baseUrl:'http://localhost:11434',model:'test-cloud'},{baseUrl:'http://localhost:11434',model:''},
    {baseUrl:'file:///tmp',model:'x'},{baseUrl:'http://user:secret@localhost:11434',model:'x'}])
    await assert.rejects(createOllamaProvider(config,fetcher)(context,new AbortController().signal),/unavailable/);
  assert.equal(calls,0);
});

test('Ollama validates complete bounded output and rejects the entire unsafe reply',async()=>{
  const encoded=JSON.stringify({done:true,message:{content:JSON.stringify({...answer,explanation:'H1 est le minimum é.'})}});
  const exact=encoded+' '.repeat(65536-new TextEncoder().encode(encoded).byteLength);
  const bytes=new TextEncoder().encode(exact);
  const complete=createOllamaProvider({baseUrl:'http://localhost:11434',model:'local'},fake(async()=>new Response(new ReadableStream({
    start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));c.close();}}))));
  assert.equal((await complete(context,new AbortController().signal)).explanation,'H1 est le minimum é.');
  const invalid=[()=>new Response('x'.repeat(65537)),()=>new Response('{'),()=>response(answer,false),
    ()=>response({...answer,explanation:''}),()=>response({...answer,extra:'bad'}),()=>response({...answer,referencedIds:['H999']}),
    ()=>response({...answer,proposedCommands:[{kind:'command',command:{type:'insert',value:100}}]}),
    ()=>new Response(JSON.stringify({done:true,message:{content:'{'}})),()=>new Response('offline',{status:503})];
  for(const make of invalid)await assert.rejects(createOllamaProvider({baseUrl:'http://localhost:11434',model:'local'},fake(async()=>make()))
    (context,new AbortController().signal),/invalid_provider_response|unavailable/);
  await assert.rejects(createOllamaProvider({baseUrl:'http://localhost:11434',model:'local'},fake(async()=>{throw Error('sensitive-question-marker');}))
    (context,new AbortController().signal),error=>error instanceof Error&&error.message==='unavailable');
});

test('Ollama body cancellation settles before its provider promise releases resources',async()=>{
  const controller=new AbortController();let cancelled=false;
  const provider=createOllamaProvider({baseUrl:'http://localhost:11434',model:'local'},fake(async()=>new Response(new ReadableStream({cancel(){cancelled=true;}}))));
  const pending=provider(context,controller.signal);await new Promise(resolve=>setImmediate(resolve));controller.abort();
  await assert.rejects(pending);assert.equal(cancelled,true);
});
