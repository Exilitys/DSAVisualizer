import type {Snapshot,Inspection,Validation} from './lesson.ts';
import type {LearningMode} from './learning.ts';

export type TutorActivity=null
  |{kind:'guide';id:string;version:number;checkpoint:number;status:'active'|'finished'}
  |{kind:'challenge';id:string;version:number;attemptId:string;status:'pending'|'graded'|'revealed'};
export type TutorRequest={requestId:string;runId:string;lessonId:'heap'|'graph';lessonVersion:string;
  input:unknown;command:unknown|null;ordinal:number;snapshotId:string;selectedIds:readonly string[];
  question:string;mode:'explain'|'hint';learning:{mode:LearningMode;activity:TutorActivity};objectiveId?:string};
export type TutorScene=Omit<TutorRequest,'requestId'|'question'|'mode'>;
export type TutorProposal={kind:'command';command:unknown}|{kind:'example';exampleId:string};
export type TutorContent={explanation:string;referencedIds:readonly string[];proposedCommands:readonly TutorProposal[];followUp?:string};
export type TutorReply=TutorContent&{requestId:string;runId:string;snapshotId:string};
export type TutorSnapshot=Omit<Snapshot<unknown>,'state'>&{readonly state:unknown};
export type VerifiedTutorContext={lessonId:'heap'|'graph';lessonVersion:string;
  run:{kind:'rest';command:null}|{kind:'active';command:unknown};snapshot:TutorSnapshot;inspection:Inspection|null;
  question:string;mode:'explain'|'hint';learningMode:LearningMode;guidance:string;
  objective:{id:string;title:string}|null;examples:readonly {id:string;title:string;objectiveId:string}[]};
export type TutorProvider=(context:VerifiedTutorContext,signal:AbortSignal)=>Promise<TutorContent>;
export type TutorPreview={kind:'command'|'example';title:string;input:unknown;command:unknown;first:TutorSnapshot;stepCount:number};
export type TutorError={code:'invalid_request'|'challenge_locked'|'rate_limited'|'busy'|'unavailable'|'invalid_provider_response'|'timeout'|'cancelled';message:string;retryAfter?:number};
export type TutorErrorReply={error:TutorError;requestId:string|null;runId:string|null;snapshotId:string|null};

const object=(raw:unknown):raw is Record<string,unknown>=>raw!==null&&typeof raw==='object'&&!Array.isArray(raw);
const id=(raw:unknown):raw is string=>typeof raw==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(raw);
const only=(raw:Record<string,unknown>,keys:readonly string[])=>Object.keys(raw).every(key=>keys.includes(key));
const integer=(raw:unknown)=>Number.isSafeInteger(raw)&&Number(raw)>=0;
export function parseTutorRequest(raw:unknown):Validation<TutorRequest> {
  const fail:Validation<never>={ok:false,message:'Choose a valid current lesson context and a question of at most 2,000 characters.'};
  if(!object(raw)||!only(raw,['requestId','runId','lessonId','lessonVersion','input','command','ordinal','snapshotId','selectedIds','question','mode','learning','objectiveId'])||
    !id(raw.requestId)||!id(raw.runId)||!id(raw.snapshotId)||!id(raw.lessonVersion)||
    (raw.lessonId!=='heap'&&raw.lessonId!=='graph')||raw.input===undefined||
    (raw.command!==null&&!object(raw.command))||!integer(raw.ordinal)||
    !Array.isArray(raw.selectedIds)||raw.selectedIds.length>1||!raw.selectedIds.every(id)||
    typeof raw.question!=='string'||!raw.question.trim()||raw.question.length>2000||
    (raw.mode!=='explain'&&raw.mode!=='hint')||('objectiveId' in raw&&!id(raw.objectiveId))||
    !object(raw.learning)||!only(raw.learning,['mode','activity'])||
    (raw.learning.mode!=='explore'&&raw.learning.mode!=='explain'&&raw.learning.mode!=='challenge'))return fail;
  const a=raw.learning.activity;
  if(a!==null) {
    if(!object(a)||!id(a.id)||!integer(a.version)||Number(a.version)<1)return fail;
    if(a.kind==='guide') {
      if(raw.learning.mode!=='explain'||!only(a,['kind','id','version','checkpoint','status'])||
        !integer(a.checkpoint)||(a.status!=='active'&&a.status!=='finished'))return fail;
    } else if(a.kind==='challenge') {
      if(raw.learning.mode!=='challenge'||!only(a,['kind','id','version','attemptId','status'])||
        !id(a.attemptId)||(a.status!=='pending'&&a.status!=='graded'&&a.status!=='revealed'))return fail;
    } else return fail;
  }
  return {ok:true,value:raw as TutorRequest};
}
