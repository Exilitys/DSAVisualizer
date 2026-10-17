import type {Validation} from './lesson.ts';
import type {AttemptEvidence,GuideReceipt} from './learning.ts';
export type Settings={speed:.5|1|2;semanticOnly:boolean};
export type LocalData<I>={settings:Settings;attempts:readonly AttemptEvidence[];guides:readonly GuideReceipt[];savedInput:I|null;notice:string|null};
export type StoragePort=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type InputOwner<I>={id:string;version:string;validateInput(raw:unknown):Validation<I>};
export type LearningStore<I>={read():LocalData<I>;setSettings(patch:Partial<Settings>):LocalData<I>;recordAttempt(attempt:AttemptEvidence):LocalData<I>;recordGuide(receipt:GuideReceipt):LocalData<I>;saveInput(raw:unknown):LocalData<I>;reset():LocalData<I>};
export const OWNED_KEYS=['dsa-atlas.settings','dsa-atlas.evidence','dsa-atlas.input.heap','dsa-atlas.input.graph'] as const;
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const identity=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(v);
const moduleId=(v:unknown):v is string=>v==='heap'||v==='graph';
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const timestamp=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function settings(raw:unknown):Settings {
  if(!object(raw)||typeof raw.speed!=='number'||![.5,1,2].includes(raw.speed)||typeof raw.semanticOnly!=='boolean')throw Error('Invalid settings.');
  return Object.freeze({speed:raw.speed as Settings['speed'],semanticOnly:raw.semanticOnly});
}
function attempt(raw:unknown):AttemptEvidence {
  if(!object(raw)||!identity(raw.attemptId)||!moduleId(raw.moduleId)||!identity(raw.challengeId)||!positive(raw.version)||
    !identity(raw.objectiveId)||!identity(raw.optionId)||(raw.outcome!=='correct'&&raw.outcome!=='incorrect')||!timestamp(raw.timestamp))throw Error('Invalid attempt.');
  return Object.freeze({attemptId:raw.attemptId,moduleId:raw.moduleId,challengeId:raw.challengeId,version:raw.version,objectiveId:raw.objectiveId,optionId:raw.optionId,outcome:raw.outcome,timestamp:raw.timestamp});
}
function guide(raw:unknown):GuideReceipt {
  if(!object(raw)||!moduleId(raw.moduleId)||!identity(raw.guideId)||!positive(raw.version)||!timestamp(raw.completedAt))throw Error('Invalid guide receipt.');
  return Object.freeze({moduleId:raw.moduleId,guideId:raw.guideId,version:raw.version,completedAt:raw.completedAt});
}
export function createLearningStore<I>(resolveStorage:()=>StoragePort,owner:InputOwner<I>):LearningStore<I> {
  const defaults=():LocalData<I>=>({settings:Object.freeze({speed:1,semanticOnly:false}),attempts:[],guides:[],savedInput:null,notice:null});
  let data=defaults(),loaded=false;
  const blocked=new Set<string>(),inputKey=`dsa-atlas.input.${owner.id}`;
  const notice=(message:string)=>{data={...data,notice:message};};
  const restore=(key:string,apply:(raw:Record<string,unknown>)=>void)=>{
    try {
      const raw=resolveStorage().getItem(key);if(raw===null)return;
      if(raw.length>65536)throw Error('Oversized record.');
      const parsed:unknown=JSON.parse(raw);
      if(!object(parsed)||parsed.schemaVersion!==1)throw Error('Unknown saved-data version.');
      apply(parsed);
    } catch {
      blocked.add(key);notice('Some saved data could not be restored. Changes to that record stay in this session until you reset saved data.');
    }
  };
  const read=()=>{
    if(loaded)return data;loaded=true;
    restore(OWNED_KEYS[0],raw=>{data={...data,settings:settings(raw.settings)};});
    restore(OWNED_KEYS[1],raw=>{
      if(!Array.isArray(raw.attempts)||raw.attempts.length>100||!Array.isArray(raw.guides)||raw.guides.length>2)throw Error('Invalid evidence.');
      const attempts=raw.attempts.map(attempt),guides=raw.guides.map(guide);
      if(new Set(attempts.map(a=>a.attemptId)).size!==attempts.length||new Set(guides.map(g=>g.moduleId)).size!==guides.length)throw Error('Duplicate evidence.');
      data={...data,attempts:Object.freeze(attempts),guides:Object.freeze(guides)};
    });
    if(moduleId(owner.id))restore(inputKey,raw=>{
      if(raw.engineVersion!==owner.version)throw Error('Unsupported input version.');
      const input=owner.validateInput(raw.input);if(!input.ok)throw Error(input.message);
      data={...data,savedInput:input.value};
    });
    return data;
  };
  const write=(key:string,value:unknown)=>{
    if(blocked.has(key))return data;
    try {resolveStorage().setItem(key,JSON.stringify(value));}
    catch {blocked.add(key);notice('Saving is unavailable. Your settings and practice remain available in this session.');}
    return data;
  };
  const writeEvidence=()=>write(OWNED_KEYS[1],{schemaVersion:1,attempts:data.attempts,guides:data.guides});
  return {
    read,
    setSettings(patch) {
      read();
      try {data={...data,settings:settings({...data.settings,...patch})};}
      catch {notice('Choose an available speed or view setting.');return data;}
      return write(OWNED_KEYS[0],{schemaVersion:1,settings:data.settings});
    },
    recordAttempt(raw) {
      read();
      try {
        const next=attempt(raw);if(data.attempts.some(a=>a.attemptId===next.attemptId))return data;
        data={...data,attempts:Object.freeze([...data.attempts,next].slice(-100))};
      } catch {notice('This practice result could not be recorded.');return data;}
      return writeEvidence();
    },
    recordGuide(raw) {
      read();
      try {const next=guide(raw);data={...data,guides:Object.freeze([...data.guides.filter(g=>g.moduleId!==next.moduleId),next])};}
      catch {notice('This guide result could not be recorded.');return data;}
      return writeEvidence();
    },
    saveInput(raw) {
      read();
      try {
        if(!moduleId(owner.id))throw Error('Unsupported module.');
        const input=owner.validateInput(raw);if(!input.ok)throw Error(input.message);
        data={...data,savedInput:input.value};
      } catch {notice('This input could not be saved. Keep a valid input in Explore.');return data;}
      return write(inputKey,{schemaVersion:1,engineVersion:owner.version,input:data.savedInput});
    },
    reset() {
      read();data=defaults();blocked.clear();
      for(const key of OWNED_KEYS) {
        try {resolveStorage().removeItem(key);}
        catch {blocked.add(key);notice('Your session was cleared, but some saved data could not be removed. Reloading may restore old data.');}
      }
      return data;
    },
  };
}
