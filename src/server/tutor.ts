import {parseTutorRequest} from '../core/tutor.ts';
import type {TutorProvider,TutorRequest,TutorError} from '../core/tutor.ts';
import {reconstructTutorContext,validateTutorContent} from '../lessons/tutor.ts';

export async function readBoundedJson(body:ReadableStream<Uint8Array>|null,maxBytes:number,signal:AbortSignal):Promise<unknown> {
  signal.throwIfAborted();
  if(!body)throw Error('invalid_json');
  const reader=body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
  let bytes=0,text='',finished=false,cancellation:Promise<void>|null=null;
  const cancel=()=>{cancellation??=reader.cancel().catch(()=>{});};
  signal.addEventListener('abort',cancel,{once:true});
  if(signal.aborted)cancel();
  try {
    while(true) {
      const result=await reader.read();signal.throwIfAborted();
      if(result.done){finished=true;break;}
      bytes+=result.value.byteLength;if(bytes>maxBytes)throw Error('body_limit');
      text+=decoder.decode(result.value,{stream:true});
    }
    text+=decoder.decode();return JSON.parse(text);
  } finally {
    signal.removeEventListener('abort',cancel);
    if(!finished)cancel();
    if(cancellation)await cancellation;
    reader.releaseLock();
  }
}

const messages:Record<TutorError['code'],string>={invalid_request:'Choose a valid current state and bounded question.',
  challenge_locked:'AI opens after Submit or Reveal. Use the authored guidance for now.',
  rate_limited:'Please wait before asking again.',busy:'The local tutor is finishing another request. Try again shortly.',
  unavailable:'The local tutor is unavailable. Authored guidance and playback still work.',
  invalid_provider_response:'The tutor could not provide a valid answer. Try again or use the authored guidance.',
  timeout:'The tutor took too long. Use the authored guidance or retry.',cancelled:'The request was cancelled.'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createTutorHandler(options:{provider:TutorProvider;now?:()=>number;id?:()=>string;schedule?:(ms:number,callback:()=>void)=>()=>void}) {
  const now=options.now??Date.now,id=options.id??(()=>crypto.randomUUID());
  const schedule=options.schedule??((ms:number,callback:()=>void)=>{const timer=setTimeout(callback,ms);return()=>clearTimeout(timer);});
  // shortcut: limits are process-local guest convenience limits; replace before public multi-instance deployment.
  const guests=new Map<string,number[]>();let busy=false;
  return async(request:Request):Promise<Response>=>{
    const existing=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('dsa_tutor_guest='))?.slice('dsa_tutor_guest='.length);
    const guest=existing&&uuid.test(existing)?existing:id();
    const headers={'Cache-Control':'no-store','Set-Cookie':`dsa_tutor_guest=${guest}; HttpOnly; SameSite=Strict; Path=/${new URL(request.url).protocol==='https:'?'; Secure':''}`};
    let parsed:TutorRequest|null=null;
    const error=(status:number,code:TutorError['code'],retryAfter?:number)=>Response.json({error:{code,message:messages[code],...(retryAfter?{retryAfter}:{})},
      requestId:parsed?.requestId??null,runId:parsed?.runId??null,snapshotId:parsed?.snapshotId??null},
      {status,headers:{...headers,...(retryAfter?{'Retry-After':String(retryAfter)}:{})}});
    const aborter=new AbortController();
    const abort=()=>aborter.abort('cancelled');
    request.signal.addEventListener('abort',abort,{once:true});
    const deadline=schedule(15000,()=>aborter.abort('timeout'));
    const cancelled=new Promise<Response>(resolve=>aborter.signal.addEventListener('abort',()=>
      resolve(error(aborter.signal.reason==='timeout'?504:400,aborter.signal.reason==='timeout'?'timeout':'cancelled')),{once:true}));
    if(request.signal.aborted)abort();
    const work=(async()=>{
      try {
        aborter.signal.throwIfAborted();
        const origin=request.headers.get('origin');
        const internal=new URL(request.url),authority=new URL(`${internal.protocol}//${request.headers.get('host')??internal.host}`);
        if(authority.username||authority.password||authority.pathname!=='/'||authority.search||authority.hash||
          (origin&&origin!==authority.origin))return error(400,'invalid_request');
        const raw=await readBoundedJson(request.body,32768,aborter.signal);
        const checked=parseTutorRequest(raw);if(!checked.ok)return error(400,'invalid_request');
        parsed=checked.value;
        const context=reconstructTutorContext(parsed);if(!context.ok)return error(400,'invalid_request');
        if(parsed.learning.activity?.kind==='challenge'&&parsed.learning.activity.status==='pending')return error(400,'challenge_locked');
        const time=now();
        for(const [key,times] of guests) {
          const live=times.filter(t=>time-t<60000);if(live.length)guests.set(key,live);else guests.delete(key);
        }
        const times=guests.get(guest)??[];
        if(times.length>=6)return error(429,'rate_limited',Math.max(1,Math.ceil((60000-(time-times[0]))/1000)));
        if(!guests.has(guest)&&guests.size>=256)return error(429,'rate_limited',60);
        if(busy)return error(429,'busy',1);
        aborter.signal.throwIfAborted();
        guests.set(guest,[...times,time]);busy=true;
        try {
          const content=await options.provider(context.value,aborter.signal);
          aborter.signal.throwIfAborted();
          const safe=validateTutorContent(content,context.value);
          if(!safe.ok)return error(503,'invalid_provider_response');
          return Response.json({...safe.value,requestId:parsed.requestId,runId:parsed.runId,snapshotId:parsed.snapshotId},{headers});
        } catch(cause) {
          if(aborter.signal.aborted)return error(aborter.signal.reason==='timeout'?504:400,aborter.signal.reason==='timeout'?'timeout':'cancelled');
          return error(503,cause instanceof Error&&cause.message==='invalid_provider_response'?'invalid_provider_response':'unavailable');
        } finally {busy=false;}
      } catch {
        return error(aborter.signal.aborted&&aborter.signal.reason==='timeout'?504:400,aborter.signal.aborted?
          (aborter.signal.reason==='timeout'?'timeout':'cancelled'):'invalid_request');
      }
    })();
    try {return await Promise.race([work,cancelled]);}
    finally {deadline();request.signal.removeEventListener('abort',abort);}
  };
}
