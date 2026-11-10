import test from 'node:test';
import assert from 'node:assert/strict';
import {createLearningStore,OWNED_KEYS} from '../src/core/learning-storage.ts';
import type {StoragePort} from '../src/core/learning-storage.ts';
import {heapEngine,createPreset} from '../src/lessons/heap/engine.ts';
import {graphEngine,createGraphPreset} from '../src/lessons/graph/engine.ts';
import type {AttemptEvidence} from '../src/core/learning.ts';

const attempt=(n=1):AttemptEvidence=>({attemptId:`a${n}`,moduleId:n%2?'heap':'graph',challengeId:'question',version:1,objectiveId:'objective',optionId:'choice',outcome:n%2?'correct':'incorrect',timestamp:n});
function setup(seed:Record<string,string>={}) {
  const data=new Map(Object.entries(seed)),writes:string[]=[],removed:string[]=[];
  const port:StoragePort={getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push(key);data.set(key,value);},removeItem:key=>{removed.push(key);data.delete(key);}};
  return {data,writes,removed,port,store:createLearningStore(()=>port,heapEngine)};
}
const settings=(speed=.5)=>JSON.stringify({schemaVersion:1,settings:{speed,semanticOnly:true}});

test('storage construction is inert and restore cannot be overwritten by defaults',()=>{
  let reads=0;const broken=createLearningStore(()=>{reads++;throw Error('denied');},heapEngine);
  assert.equal(reads,0);assert.ok(broken.read().notice);assert.ok(reads>0);
  const s=setup({'dsa-atlas.settings':settings()});
  const next=s.store.recordAttempt(attempt());assert.equal(next.settings.speed,.5);assert.equal(next.settings.semanticOnly,true);
  assert.equal(s.writes.includes('dsa-atlas.settings'),false);s.store.read();s.store.read();assert.equal(s.writes.length,1);
  const defaults=setup();assert.equal(defaults.store.read().settings.speed,1);assert.equal(defaults.writes.length,0);
});

test('invalid and future records are protected independently until reset',()=>{
  for(const raw of ['{','null',JSON.stringify({schemaVersion:2,settings:{speed:2,semanticOnly:true}}),settings(3),' '.repeat(65537)]) {
    const s=setup({'dsa-atlas.settings':raw,'dsa-atlas.evidence':JSON.stringify({schemaVersion:1,attempts:[attempt()],guides:[]})});
    assert.ok(s.store.read().notice);assert.equal(s.store.read().attempts.length,1);
    assert.equal(s.store.setSettings({speed:2}).settings.speed,2);assert.equal(s.data.get('dsa-atlas.settings'),raw);
    s.store.reset();s.store.setSettings({speed:.5});assert.equal(JSON.parse(s.data.get('dsa-atlas.settings')!).settings.speed,.5);
  }
});

test('attempts have bounded validated shapes and duplicate IDs are not regraded',()=>{
  const s=setup();for(let n=1;n<=101;n++)s.store.recordAttempt(attempt(n));
  const final=s.store.recordAttempt(attempt(101));assert.equal(final.attempts.length,100);assert.equal(final.attempts[0].attemptId,'a2');
  assert.equal(final.attempts.at(-1)!.attemptId,'a101');assert.ok(final.attempts.some(a=>a.moduleId==='heap'));assert.ok(final.attempts.some(a=>a.moduleId==='graph'));
  s.store.recordGuide({moduleId:'heap',guideId:'heap-guide',version:1,completedAt:1});
  const g=s.store.recordGuide({moduleId:'heap',guideId:'heap-guide',version:2,completedAt:2});assert.equal(g.guides.length,1);assert.equal(g.guides[0].version,2);
  const saved=JSON.parse(s.data.get('dsa-atlas.evidence')!);assert.equal(saved.attempts.length,100);
  const old=setup({'dsa-atlas.evidence':JSON.stringify({schemaVersion:1,attempts:[{...attempt(),version:9,chat:'private'}],guides:[]})});
  assert.equal(old.store.read().attempts[0].version,9);old.store.recordAttempt(attempt(2));assert.equal(old.data.get('dsa-atlas.evidence')!.includes('private'),false);
});

test('malformed evidence falls back without destroying other valid keys',()=>{
  const bad=[{...attempt(),timestamp:-1},{...attempt(),outcome:'mastered'},{...attempt(),moduleId:'other'},
    {...attempt(),attemptId:'x'.repeat(65)},{...attempt(),optionId:''},{...attempt(),version:0}];
  for(const a of bad) {
    const s=setup({'dsa-atlas.evidence':JSON.stringify({schemaVersion:1,attempts:[a],guides:[]}),'dsa-atlas.settings':settings()});
    assert.equal(s.store.read().attempts.length,0);assert.equal(s.store.read().settings.speed,.5);assert.ok(s.store.read().notice);
  }
  for(const rows of [[attempt(),attempt()],Array.from({length:101},(_,i)=>attempt(i+1))]) {
    const s=setup({'dsa-atlas.evidence':JSON.stringify({schemaVersion:1,attempts:rows,guides:[]})});assert.ok(s.store.read().notice);
  }
  const s=setup();assert.equal(s.store.recordAttempt({...attempt(),timestamp:NaN}).attempts.length,0);
});

test('saved inputs normalize with the actual engine and exclude transient state',()=>{
  const s=setup();const raw={...createPreset(),camera:'private',steps:['future']};s.store.saveInput(raw);
  const envelope=JSON.parse(s.data.get('dsa-atlas.input.heap')!);assert.equal(envelope.engineVersion,'1.1.0');assert.deepEqual(envelope.input,createPreset());
  const graph=createLearningStore(()=>s.port,graphEngine);graph.saveInput(createGraphPreset());
  assert.deepEqual(graph.read().savedInput,createGraphPreset());assert.deepEqual(s.store.read().savedInput,createPreset());
  for(const envelope of [{schemaVersion:1,engineVersion:'old',input:createPreset()},{schemaVersion:1,engineVersion:'1.1.0',input:{items:[],nextId:0}}]) {
    const b=setup({'dsa-atlas.input.heap':JSON.stringify(envelope)});assert.equal(b.store.read().savedInput,null);assert.ok(b.store.read().notice);
  }
});

test('quota and removal failures preserve memory and never clear unrelated keys',()=>{
  const s=setup({'unrelated':'keep'}),quota={...s.port,setItem:()=>{throw Error('quota');}};
  const store=createLearningStore(()=>quota,heapEngine);assert.equal(store.recordAttempt(attempt()).attempts.length,1);assert.ok(store.read().notice);
  const failed=createLearningStore(()=>({...s.port,removeItem:key=>{if(key==='dsa-atlas.evidence')throw Error('denied');s.port.removeItem(key);}}),heapEngine);
  failed.recordAttempt(attempt());const reset=failed.reset();assert.equal(reset.attempts.length,0);assert.match(reset.notice!,/reload/i);assert.equal(s.data.get('unrelated'),'keep');
  const good=setup({'unrelated':'keep'});good.store.reset();assert.deepEqual(good.removed,[...OWNED_KEYS]);assert.equal(good.data.get('unrelated'),'keep');
  const reads=setup({'dsa-atlas.settings':settings()});
  const readFailure=createLearningStore(()=>({...reads.port,getItem:key=>{if(key==='dsa-atlas.evidence')throw Error('read denied');return reads.port.getItem(key);}}),heapEngine);
  assert.equal(readFailure.read().settings.speed,.5);assert.equal(readFailure.recordAttempt(attempt()).attempts.length,1);assert.ok(readFailure.read().notice);
});
