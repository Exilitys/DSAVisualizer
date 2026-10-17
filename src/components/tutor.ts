import type {Validation} from '../core/lesson.ts';
import type {TutorScene,TutorRequest,TutorReply,TutorPreview,TutorError} from '../core/tutor.ts';
import {parseTutorRequest} from '../core/tutor.ts';
import {reconstructTutorContext,validateTutorReply,previewTutorProposal} from '../lessons/tutor.ts';
export type TutorExchange={status:'idle'|'pending'|'ready'|'failed'|'cancelled';request:TutorRequest|null;reply:TutorReply|null;error:TutorError|null;preview:TutorPreview|null};
export const emptyTutorExchange=():TutorExchange=>({status:'idle',request:null,reply:null,error:null,preview:null});
const key=(s:TutorScene)=>JSON.stringify([s.runId,s.lessonId,s.lessonVersion,s.ordinal,s.snapshotId,s.selectedIds,s.learning,s.objectiveId??null]);
export function createTutorController(options:{read:()=>TutorScene;pause:()=>void;changed:(value:TutorExchange)=>void;fetcher:typeof fetch;id:()=>string;schedule:(ms:number,callback:()=>void)=>()=>void}) {
  let state=emptyTutorExchange(),generation=0,activeKey='',previewIndex:number|null=null;
  let transport:AbortController|null=null,stopTimer:(()=>void)|null=null,finishWaiting:(()=>void)|null=null;
  const publish=(next:TutorExchange)=>{state=next;options.changed(next);};
  const invalidate=()=>{generation++;transport?.abort();transport=null;stopTimer?.();stopTimer=null;finishWaiting?.();finishWaiting=null;previewIndex=null;};
  const cancel=()=>{
    invalidate();if(state.request)publish({...state,status:'cancelled',reply:null,error:null,preview:null});
  };
  const sync=()=>{if(state.request&&activeKey!==key(options.read()))cancel();};
  const fail=(code:TutorError['code'],message:string,retryAfter?:number)=>publish({...state,status:'failed',reply:null,preview:null,error:{code,message,...(retryAfter?{retryAfter}:{})}});
  const ask=async(question:string,mode:'explain'|'hint')=>{
    invalidate();options.pause();
    const request=structuredClone({...options.read(),requestId:options.id(),question,mode});
    activeKey=key(request);
    publish({status:'pending',request,reply:null,error:null,preview:null});
    const parsed=parseTutorRequest(request),context=parsed.ok?reconstructTutorContext(parsed.value):parsed;
    if(!context.ok){fail('invalid_request',context.message);return;}
    if(request.learning.activity?.kind==='challenge'&&request.learning.activity.status==='pending') {
      fail('challenge_locked','AI opens after Submit or Reveal. Use the authored guidance for now.');return;
    }
    const token=generation,aborter=new AbortController();transport=aborter;
    const cancelled=new Promise<void>(resolve=>{finishWaiting=resolve;});
    stopTimer=options.schedule(15000,()=>{
      if(token!==generation)return;
      invalidate();fail('timeout','The tutor took too long. Use the authored guidance or retry.');
    });
    const work=(async()=>{
      try {
        const response=await options.fetcher('/api/tutor',{method:'POST',headers:{'Content-Type':'application/json'},
          credentials:'same-origin',body:JSON.stringify(request),signal:aborter.signal});
        const raw:unknown=await response.json();
        if(token!==generation)return;
        sync();if(token!==generation)return;
        if(!response.ok) {
          const e=raw as {error?:Partial<TutorError>};
          const code=e?.error?.code;
          if(code&&['invalid_request','challenge_locked','rate_limited','busy','unavailable','invalid_provider_response','timeout','cancelled'].includes(code))
            fail(code,typeof e.error?.message==='string'&&e.error.message.length<=500?e.error.message:'The tutor is unavailable. Use the authored guidance.',
              typeof e.error?.retryAfter==='number'&&e.error.retryAfter>0&&e.error.retryAfter<=60?e.error.retryAfter:undefined);
          else fail('unavailable','The tutor is unavailable. Use the authored guidance.');
          return;
        }
        const checked=validateTutorReply(raw,request);
        if(!checked.ok){fail('invalid_provider_response',checked.message);return;}
        publish({status:'ready',request,reply:checked.value,error:null,preview:null});
      } catch {
        if(token===generation)fail('unavailable','The tutor is unavailable. Use the authored guidance or retry.');
      } finally {
        if(token===generation){stopTimer?.();stopTimer=null;transport=null;finishWaiting=null;}
      }
    })();
    await Promise.race([work,cancelled]);
  };
  const preview=(index:number):Validation<TutorPreview>=>{
    sync();
    if(state.status!=='ready'||!state.request||!state.reply||!Number.isInteger(index)||!state.reply.proposedCommands[index])
      return {ok:false,message:'This proposal is no longer available.'};
    const result=previewTutorProposal(state.request,state.reply.proposedCommands[index]);
    if(result.ok){previewIndex=index;publish({...state,preview:result.value,error:null});}
    else {previewIndex=null;publish({...state,preview:null,error:{code:'invalid_request',message:result.message}});}
    return result;
  };
  return {
    status:()=>state,ask,sync,cancel,
    retry:async()=>{if(state.status==='failed'&&state.request)await ask(state.request.question,state.request.mode);},
    preview,clearPreview(){previewIndex=null;publish({...state,preview:null});},
    apply(commit:(candidate:TutorPreview)=>boolean):boolean {
      sync();
      if(state.status!=='ready'||!state.request||!state.reply||!state.preview||previewIndex===null)return false;
      const result=previewTutorProposal(state.request,state.reply.proposedCommands[previewIndex]);
      if(!result.ok){publish({...state,preview:null,error:{code:'invalid_request',message:result.message}});return false;}
      if(!commit(result.value)){publish({...state,preview:null,error:{code:'invalid_request',message:'The proposal could not apply. Your scene is preserved.'}});return false;}
      cancel();return true;
    },
    dispose(){invalidate();state={...state,status:state.request?'cancelled':'idle',reply:null,preview:null,error:null};},
  };
}
