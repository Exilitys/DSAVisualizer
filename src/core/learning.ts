import type {LessonEngine} from './lesson.ts';
import {createPlayer,isRunBoundary,seek,selectEntity,startCommand,replaceInput} from './player.ts';
import type {PlayerState} from './player.ts';

export type LearningMode='explore'|'explain'|'challenge';
export type ActivityRequest={kind:'guide'|'challenge';id:string};
export type Checkpoint={ordinal:number;type:string;explanationKey:string};
export type GuideSegment<I,C>={id:string;title:string;input:I;command:C;checkpoints:readonly (Checkpoint&{text:string})[]};
export type Challenge<I,C>={id:string;version:number;objectiveId:string;input:I;command:C;checkpoint:Checkpoint;prompt:string;options:readonly {id:string;label:string}[];answerId:string;feedback:string};
export type LessonLearning<I,C>={moduleId:string;engineVersion:string;objectives:readonly {id:string;title:string}[];guide:{id:string;version:number;title:string;segments:readonly GuideSegment<I,C>[]};challenges:readonly Challenge<I,C>[]};
export type AttemptEvidence={attemptId:string;moduleId:string;challengeId:string;version:number;objectiveId:string;optionId:string;outcome:'correct'|'incorrect';timestamp:number};
export type GuideReceipt={moduleId:string;guideId:string;version:number;completedAt:number};
export type ActiveActivity=
  |{kind:'challenge';id:string;version:number;run:object;attemptId:string;checkpoint:number;status:'pending'|'graded'|'revealed';optionId:string|null;outcome:'correct'|'incorrect'|null}
  |{kind:'guide';id:string;version:number;run:object;checkpoint:number;status:'active'|'finished'};
export type LearningSession<I,S>={player:PlayerState<I,S>;mode:LearningMode;activity:ActiveActivity|null;guideProgress:{guideId:string;version:number;finishedSegments:readonly string[]}|null};
export type LearningUpdate<I,S>={session:LearningSession<I,S>;attempt:AttemptEvidence|null;guideReceipt:GuideReceipt|null};
export type LearningAction=
  |{type:'mode';mode:LearningMode}|{type:'seek';ordinal:number}|{type:'select';id:string|null}|{type:'start';command:unknown}
  |{type:'replace';rawInput:unknown;command:unknown|null}|{type:'load';rawInput:unknown}
  |{type:'begin';request:ActivityRequest;attemptId:string}|{type:'submit';attemptId:string;optionId:string;now:number}
  |{type:'reveal';attemptId:string}|{type:'continue';now:number};

export function createLearningSession<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown):LearningSession<I,S> {
  return {player:createPlayer(engine,initial),mode:'explore',activity:null,guideProgress:null};
}
export function playbackLimit<I,S>(s:LearningSession<I,S>):number {
  const a=s.activity;
  if(a&&a.run!==s.player.steps)return s.player.ordinal;
  if(a&&(a.status==='pending'||a.status==='active'))return a.checkpoint;
  return s.player.steps?s.player.steps.length-1:0;
}
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const id=(v:unknown):v is string=>text(v)&&v.length<=64;
const version=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
const time=(v:number)=>Number.isFinite(v)&&v>=0;
const unique=(ids:readonly string[])=>ids.every(id)&&new Set(ids).size===ids.length;
export function transitionLearning<I,C,S>(s:LearningSession<I,S>,engine:LessonEngine<I,C,S>,content:LessonLearning<I,C>,action:LearningAction):LearningUpdate<I,S> {
  const result=(session:LearningSession<I,S>,attempt:AttemptEvidence|null=null,guideReceipt:GuideReceipt|null=null):LearningUpdate<I,S>=>({session,attempt,guideReceipt});
  const fail=(message:string)=>result({...s,player:{...s.player,error:message}});
  if(action.type==='mode') {
    if(!['explore','explain','challenge'].includes(action.mode))return fail('Choose an available learning layer.');
    return result(action.mode===s.mode?s:{...s,mode:action.mode,activity:null});
  }
  if(action.type==='select')return result({...s,player:selectEntity(s.player,engine,action.id)});
  if(action.type==='seek') {
    const ordinal=s.activity&&Number.isInteger(action.ordinal)&&action.ordinal>=0?Math.min(action.ordinal,playbackLimit(s)):action.ordinal;
    return result({...s,player:seek(s.player,ordinal)});
  }
  if(action.type==='start'||action.type==='replace'||action.type==='load') {
    if(s.mode!=='explore')return fail('Return to Explore before changing the input or operation.');
    let player=action.type==='start'?startCommand(s.player,engine,action.command)
      :replaceInput(s.player,engine,action.rawInput,action.type==='replace'?action.command:null);
    if(action.type==='load'&&!player.error)player={...player,selectedId:null};
    return result({...s,player,activity:null});
  }
  if(action.type==='begin') {
    if(engine.commandStart==='run-boundary'&&!isRunBoundary(s.player))return fail('Finish or restart first.');
    try {
      if(content.moduleId!==engine.id||content.engineVersion!==engine.version)throw Error('Invalid learning content.');
      const guide=action.request.kind==='guide';
      const definitions=guide?content.guide.segments:content.challenges;
      if(!id(action.request.id)||definitions.filter(d=>d.id===action.request.id).length!==1)throw Error('This activity is unavailable or ambiguous.');
      const definition=guide?content.guide.segments.find(g=>g.id===action.request.id):content.challenges.find(q=>q.id===action.request.id);
      if(!definition||!text(guide?content.guide.title:(definition as Challenge<I,C>).prompt))throw Error('This activity is unavailable.');
      const activityVersion=guide?content.guide.version:(definition as Challenge<I,C>).version;
      if(!version(activityVersion)||(guide&&(!id(content.guide.id)||!unique(content.guide.segments.map(g=>g.id)))))throw Error('Invalid content version.');
      if(!guide) {
        const q=definition as Challenge<I,C>;
        if(!id(action.attemptId)||!id(q.objectiveId)||content.objectives.filter(o=>o.id===q.objectiveId).length!==1||q.options.length!==3||
          !unique(q.options.map(o=>o.id))||q.options.some(o=>!text(o.label))||!q.options.some(o=>o.id===q.answerId)||!text(q.feedback))throw Error('Invalid question or answer key.');
      }
      const candidate=startCommand(createPlayer(engine,definition.input),engine,definition.command);
      if(candidate.error||!candidate.steps)throw Error(candidate.error??'This activity has no trace.');
      const points=guide?(definition as GuideSegment<I,C>).checkpoints:[(definition as Challenge<I,C>).checkpoint];
      if(!points.length||points.some((p,i)=>!Number.isInteger(p.ordinal)||p.ordinal<0||p.ordinal>=candidate.steps!.length||
        (i>0&&p.ordinal<=points[i-1].ordinal)||candidate.steps![p.ordinal].event.type!==p.type||candidate.steps![p.ordinal].event.explanationKey!==p.explanationKey))throw Error('The activity checkpoint does not match its trace.');
      if(guide?(points[0].ordinal!==0||points.at(-1)!.ordinal!==candidate.steps.length-1||points.some(p=>!text((p as Checkpoint&{text:string}).text)))
        :points[0].ordinal>=candidate.steps.length-1)throw Error('Invalid activity boundaries.');
      const checkpoint=points[0].ordinal;
      const activity:ActiveActivity=guide?{kind:'guide',id:definition.id,version:activityVersion,run:candidate.steps,checkpoint,status:'active'}
        :{kind:'challenge',id:definition.id,version:activityVersion,run:candidate.steps,checkpoint,attemptId:action.attemptId,status:'pending',optionId:null,outcome:null};
      const guideProgress=guide&&(s.guideProgress?.guideId!==content.guide.id||s.guideProgress.version!==content.guide.version)
        ?{guideId:content.guide.id,version:content.guide.version,finishedSegments:[]}:s.guideProgress;
      return result({...s,player:seek(candidate,checkpoint),mode:guide?'explain':'challenge',activity,guideProgress});
    } catch(error) {return fail(error instanceof Error?error.message:'The activity could not start. Your scene is preserved.');}
  }
  const a=s.activity;
  if(!a||a.run!==s.player.steps)return fail('This activity is no longer active.');
  if(action.type==='submit'||action.type==='reveal') {
    if(a.kind!=='challenge'||a.status!=='pending'||a.attemptId!==action.attemptId)return fail('This attempt is no longer awaiting an answer.');
    const q=content.challenges.find(q=>q.id===a.id&&q.version===a.version);
    if(!q)return fail('The question version changed. Start a fresh attempt.');
    if(action.type==='submit'&&(s.player.ordinal!==a.checkpoint||!q.options.some(o=>o.id===action.optionId)||!time(action.now)))return fail('Return to the question and choose an available answer.');
    const outcome=action.type==='submit'?(action.optionId===q.answerId?'correct':'incorrect'):null;
    const activity:ActiveActivity={...a,status:action.type==='submit'?'graded':'revealed',optionId:action.type==='submit'?action.optionId:null,outcome};
    const attempt:AttemptEvidence|null=action.type==='submit'?{attemptId:a.attemptId,moduleId:content.moduleId,challengeId:a.id,version:a.version,objectiveId:q.objectiveId,optionId:action.optionId,outcome:outcome!,timestamp:action.now}:null;
    return result({...s,activity,player:seek(s.player,a.checkpoint+1)},attempt);
  }
  if(a.kind!=='guide'||a.status!=='active'||a.version!==content.guide.version||s.player.ordinal!==a.checkpoint||!time(action.now))return fail('Return to the guide checkpoint to continue.');
  const segment=content.guide.segments.find(g=>g.id===a.id),progress=s.guideProgress;
  if(!segment||!progress)return fail('Start the guide again.');
  const index=segment.checkpoints.findIndex(p=>p.ordinal===a.checkpoint),next=segment.checkpoints[index+1];
  if(next)return result({...s,activity:{...a,checkpoint:next.ordinal},player:seek(s.player,a.checkpoint+1)});
  const finishedSegments=[...new Set([...progress.finishedSegments,a.id])];
  const wasComplete=content.guide.segments.every(g=>progress.finishedSegments.includes(g.id));
  const complete=content.guide.segments.every(g=>finishedSegments.includes(g.id));
  return result({...s,activity:{...a,status:'finished'},guideProgress:{...progress,finishedSegments}},null,
    complete&&!wasComplete?{moduleId:content.moduleId,guideId:content.guide.id,version:content.guide.version,completedAt:action.now}:null);
}
