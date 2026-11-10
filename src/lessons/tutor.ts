import {deepFreeze} from '../core/lesson.ts';
import type {LessonEngine,Snapshot,Validation} from '../core/lesson.ts';
import type {LessonLearning} from '../core/learning.ts';
import {createPlayer,startCommand,seek,currentSnapshot,isRunBoundary} from '../core/player.ts';
import {parseTutorRequest} from '../core/tutor.ts';
import type {TutorRequest,TutorReply,TutorContent,TutorProposal,TutorPreview,VerifiedTutorContext} from '../core/tutor.ts';
import {heapEngine} from './heap/engine.ts';
import {graphEngine} from './graph/engine.ts';
import {heapLearning} from './heap/learning.ts';
import {graphLearning} from './graph/learning.ts';
import {explainStep} from './heap/content.ts';
import {explainGraphStep} from './graph/content.ts';

const object=(raw:unknown):raw is Record<string,unknown>=>raw!==null&&typeof raw==='object'&&!Array.isArray(raw);
const only=(raw:Record<string,unknown>,keys:readonly string[])=>Object.keys(raw).every(key=>keys.includes(key));
const text=(raw:unknown,max:number):raw is string=>typeof raw==='string'&&raw.trim().length>0&&raw.length<=max;
const fail=(message:string):Validation<never>=>({ok:false,message});
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

function tutorLesson<I,C,S>(engine:LessonEngine<I,C,S>,content:LessonLearning<I,C>,explain:(s:Snapshot<S>)=>string,exampleIds:readonly string[]) {
  const examples=exampleIds.map(id=>{
    const q=content.challenges.find(q=>q.id===id)!;
    return {id,title:content.objectives.find(o=>o.id===q.objectiveId)!.title,objectiveId:q.objectiveId,input:q.input,command:q.command};
  });
  const command=(raw:unknown,input:I):Validation<C>=>{
    if(!object(raw)||!only(raw,engine.id==='heap'?(raw.type==='extract'?['type']:['type','value']):['type','startId']))
      return fail('Choose a supported lesson command.');
    return engine.validateCommand(raw,input);
  };
  const reconstruct=(r:TutorRequest)=>{
    if(r.lessonVersion!==engine.version)return fail('This lesson version changed. Reload the lesson.');
    try {
      let player=createPlayer(engine,r.input);
      if(r.command!==null) {
        const c=command(r.command,player.input);if(!c.ok)return c;
        player=startCommand(player,engine,c.value);
        if(player.error||!player.steps)return fail(player.error??'The trace is unavailable.');
        player=seek(player,r.ordinal);if(player.error)return fail(player.error);
      } else if(r.ordinal!==0)return fail('A resting scene has only step 0.');
      const snapshot=currentSnapshot(player);
      if(snapshot.id!==r.snapshotId)return fail('This step is no longer current.');
      const inspection=r.selectedIds[0]?engine.inspect(snapshot,r.selectedIds[0]):null;
      if(r.selectedIds.length&&!inspection)return fail('Select an entity present in this step.');
      let guidance=r.command===null&&engine.id==='heap'?'This is a resting min heap. Choose an operation to begin.':explain(snapshot);
      let objectiveId=r.objectiveId;
      const a=r.learning.activity;
      if(a) {
        if(!player.steps)return fail('This activity requires its authored run.');
        if(a.kind==='guide') {
          const segment=content.guide.segments.find(s=>s.id===a.id),point=segment?.checkpoints.find(p=>p.ordinal===a.checkpoint);
          if(!segment||a.version!==content.guide.version||!point||!equal(player.input,segment.input)||!equal(player.command,segment.command)||
            (a.status==='active'&&r.ordinal>a.checkpoint)||(a.status==='finished'&&a.checkpoint!==segment.checkpoints.at(-1)!.ordinal))
            return fail('The guide does not match its authored run or checkpoint.');
          if(r.ordinal===point.ordinal)guidance=point.text;
        } else {
          const q=content.challenges.find(q=>q.id===a.id&&q.version===a.version);
          if(!q||!equal(player.input,q.input)||!equal(player.command,q.command)||
            (a.status==='pending'&&r.ordinal>q.checkpoint.ordinal)||(objectiveId&&objectiveId!==q.objectiveId))
            return fail('The prediction does not match its authored run.');
          objectiveId=q.objectiveId;
        }
      }
      const objective=objectiveId?content.objectives.find(o=>o.id===objectiveId):null;
      if(objectiveId&&!objective)return fail('Choose an objective from this lesson.');
      const context:VerifiedTutorContext={lessonId:r.lessonId,lessonVersion:engine.version,
        run:player.command===null?{kind:'rest',command:null}:{kind:'active',command:player.command},
        snapshot,inspection,question:r.question,mode:r.mode,learningMode:r.learning.mode,guidance,objective:objective??null,
        examples:r.learning.mode==='explore'?examples.map(({id,title,objectiveId})=>({id,title,objectiveId})):[]};
      return {ok:true as const,value:{player,context}};
    } catch {return fail('The current state could not be reconstructed.');}
  };
  const prepare=(proposal:unknown,context:VerifiedTutorContext):Validation<TutorPreview>=>{
    if(!object(proposal))return fail('Choose a valid proposal.');
    let input:unknown=context.snapshot.state,rawCommand:unknown,title='Run the proposed command';
    let kind:'command'|'example';
    if(proposal.kind==='example'&&only(proposal,['kind','exampleId'])) {
      const example=examples.find(e=>e.id===proposal.exampleId);if(!example)return fail('Choose an example from this lesson.');
      input=example.input;rawCommand=example.command;title=example.title;kind='example';
    } else if(proposal.kind==='command'&&only(proposal,['kind','command'])) {rawCommand=proposal.command;kind='command';}
    else return fail('Choose a curated example or supported command.');
    if(context.learningMode!=='explore')return fail('Return to Explore before applying a tutor proposal.');
    if(engine.commandStart==='run-boundary'&&context.run.kind==='active'&&context.snapshot.ordinal!==0&&context.snapshot.event.type!=='complete')
      return fail('Finish or restart first.');
    try {
      const candidate=createPlayer(engine,input),c=command(rawCommand,candidate.input);if(!c.ok)return c;
      const run=startCommand(candidate,engine,c.value);if(run.error||!run.steps)return fail(run.error??'The proposal has no trace.');
      return {ok:true,value:deepFreeze({kind,title,input:run.input,command:c.value,first:currentSnapshot(run),stepCount:run.steps.length})};
    } catch {return fail('The proposal is invalid. Your scene is preserved.');}
  };
  const preview=(r:TutorRequest,proposal:unknown):Validation<TutorPreview>=>{
    if(r.learning.mode!=='explore')return fail('Return to Explore before applying a tutor proposal.');
    const rebuilt=reconstruct(r);if(!rebuilt.ok)return rebuilt;
    if(engine.commandStart==='run-boundary'&&!isRunBoundary(rebuilt.value.player))return fail('Finish or restart first.');
    return prepare(proposal,rebuilt.value.context);
  };
  const validate=(raw:unknown,context:VerifiedTutorContext):Validation<TutorContent>=>{
    if(!object(raw)||!only(raw,['explanation','referencedIds','proposedCommands','followUp'])||!text(raw.explanation,3000)||
      !Array.isArray(raw.referencedIds)||raw.referencedIds.length>20||new Set(raw.referencedIds).size!==raw.referencedIds.length||
      !raw.referencedIds.every(id=>typeof id==='string'&&id.length<=64&&
        // Only snapshots reconstructed by this engine reach this typed projection.
        engine.inspect(context.snapshot as Snapshot<S>,id))||
      !Array.isArray(raw.proposedCommands)||raw.proposedCommands.length>3||
      ('followUp' in raw&&!text(raw.followUp,500)))return fail('The tutor returned an invalid explanation.');
    const proposedCommands:TutorProposal[]=[];
    for(const proposal of raw.proposedCommands) {
      const p=prepare(proposal,context);if(!p.ok)return p;
      proposedCommands.push(p.value.kind==='example'
        ?{kind:'example',exampleId:(proposal as {exampleId:string}).exampleId}:{kind:'command',command:p.value.command});
    }
    return {ok:true,value:{explanation:raw.explanation,referencedIds:raw.referencedIds,proposedCommands,
      ...(raw.followUp?{followUp:raw.followUp as string}:{})}};
  };
  return {reconstruct,preview,validate};
}
const lessons={heap:tutorLesson(heapEngine,heapLearning,explainStep,['heap-tie','heap-order']),
  graph:tutorLesson(graphEngine,graphLearning,explainGraphStep,['graph-enqueue','graph-depth'])};

export function reconstructTutorContext(request:TutorRequest):Validation<VerifiedTutorContext> {
  const parsed=parseTutorRequest(request);if(!parsed.ok)return parsed;
  const result=lessons[parsed.value.lessonId].reconstruct(parsed.value);
  return result.ok?{ok:true,value:result.value.context}:result;
}
export function validateTutorContent(raw:unknown,context:VerifiedTutorContext):Validation<TutorContent> {
  return lessons[context.lessonId].validate(raw,context);
}
export function validateTutorReply(raw:unknown,request:TutorRequest):Validation<TutorReply> {
  if(!object(raw)||!only(raw,['requestId','runId','snapshotId','explanation','referencedIds','proposedCommands','followUp'])||
    raw.requestId!==request.requestId||raw.runId!==request.runId||raw.snapshotId!==request.snapshotId)return fail('The tutor response is stale.');
  const rebuilt=reconstructTutorContext(request);if(!rebuilt.ok)return rebuilt;
  const {requestId,runId,snapshotId,...content}=raw;
  const checked=validateTutorContent(content,rebuilt.value);
  return checked.ok?{ok:true,value:{...checked.value,requestId:request.requestId,runId:request.runId,snapshotId:request.snapshotId}}:checked;
}
export function previewTutorProposal(request:TutorRequest,proposal:TutorProposal):Validation<TutorPreview> {
  const parsed=parseTutorRequest(request);if(!parsed.ok)return parsed;
  return lessons[parsed.value.lessonId].preview(parsed.value,proposal);
}
