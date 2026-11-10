'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {LessonEngine} from '../core/lesson.ts';
import {currentSnapshot,isRunBoundary} from '../core/player.ts';
import {createLearningSession,transitionLearning,playbackLimit} from '../core/learning.ts';
import type {ActivityRequest,LearningAction,LearningMode,LearningUpdate,LessonLearning} from '../core/learning.ts';
import {createLearningStore,emptyLocalData} from '../core/learning-storage.ts';
import {createPlayback} from './playback.ts';
import type {PlaybackSpeed,PlaybackStatus} from './playback.ts';
import {createTutorController,emptyTutorExchange} from './tutor.ts';
import type {TutorActivity,TutorScene} from '../core/tutor.ts';

export type LessonPlayer<I,C,S>=ReturnType<typeof useLessonPlayer<I,C,S>>;
export function useLessonPlayer<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown,content:LessonLearning<I,C>) {
  const [session,setSession]=useState(()=>createLearningSession(engine,initial));
  const current=useRef(session);
  const store=useMemo(()=>createLearningStore(()=>window.localStorage,engine),[engine]);
  const [local,setLocal]=useState(emptyLocalData<I>);
  const [playback,setPlayback]=useState<PlaybackStatus>({playing:false,speed:1});
  const [tutor,setTutor]=useState(emptyTutorExchange);
  const tutorRef=useRef<ReturnType<typeof createTutorController>|null>(null);
  const runIdentity=useRef<{run:object|null;id:string}>({run:null,id:''});
  const publish=useCallback((update:LearningUpdate<I,S>)=>{
    current.current=update.session;tutorRef.current?.sync();setSession(update.session);
    if(update.attempt)setLocal(store.recordAttempt(update.attempt));
    if(update.guideReceipt)setLocal(store.recordGuide(update.guideReceipt));
  },[store]);
  const controller=useMemo(()=>createPlayback({
    read:()=>({run:document.hidden?null:current.current.player.steps,
      ordinal:current.current.player.ordinal,lastOrdinal:playbackLimit(current.current)}),
    advance:ordinal=>publish(transitionLearning(current.current,engine,content,{type:'seek',ordinal})),
    schedule:(delay,callback)=>{const id=window.setTimeout(callback,delay);return()=>window.clearTimeout(id);},
    changed:setPlayback,
  }),[publish,engine,content]);
  const tutorController=useMemo(()=>createTutorController({
    read:()=>{
      const s=current.current,p=s.player,run=p.steps??p.resting;
      if(runIdentity.current.run!==run)runIdentity.current={run,id:crypto.randomUUID()};
      const a=s.activity;
      const activity:TutorActivity=a?.kind==='guide'?{kind:a.kind,id:a.id,version:a.version,checkpoint:a.checkpoint,status:a.status}
        :a?.kind==='challenge'?{kind:a.kind,id:a.id,version:a.version,attemptId:a.attemptId,status:a.status}:null;
      return {runId:runIdentity.current.id,lessonId:engine.id as TutorScene['lessonId'],lessonVersion:engine.version,
        input:p.input,command:p.command,ordinal:p.ordinal,snapshotId:currentSnapshot(p).id,
        selectedIds:p.selectedId&&engine.inspect(currentSnapshot(p),p.selectedId)?[p.selectedId]:[],learning:{mode:s.mode,activity}};
    },
    pause:controller.pause,changed:setTutor,fetcher:(...args)=>fetch(...args),id:()=>crypto.randomUUID(),
    schedule:(ms,callback)=>{const timer=setTimeout(callback,ms);return()=>clearTimeout(timer);},
  }),[engine,controller]);
  tutorRef.current=tutorController;
  useEffect(()=>{
    tutorController.sync();setTutor(tutorController.status());
    const saved=store.read();setLocal(saved);controller.setSpeed(saved.settings.speed);
    setPlayback(controller.status());
    const hidden=()=>{if(document.hidden) controller.pause();};
    hidden();
    document.addEventListener('visibilitychange',hidden);
    return()=>{document.removeEventListener('visibilitychange',hidden);controller.dispose();tutorController.dispose();};
  },[controller,store,tutorController]);
  const act=(action:LearningAction)=>{
    controller.pause();const update=transitionLearning(current.current,engine,content,action);publish(update);return update.session.player;
  };
  return {
    canSaveInput:session.mode==='explore'&&(engine.commandStart!=='run-boundary'||isRunBoundary(session.player)),
    player:session.player,session,local,limit:playbackLimit(session),playback,tutor,
    askTutor:tutorController.ask,cancelTutor:tutorController.cancel,retryTutor:tutorController.retry,
    previewTutor:tutorController.preview,clearTutorPreview:tutorController.clearPreview,
    applyTutorPreview:():{kind:'command'|'example';player:typeof session.player}|null=>{
      let applied:{kind:'command'|'example';player:typeof session.player}|null=null;
      tutorController.apply(candidate=>{
        const before=current.current;
        const update=transitionLearning(before,engine,content,candidate.kind==='command'
          ?{type:'start',command:candidate.command}:{type:'replace',rawInput:candidate.input,command:candidate.command});
        if(update.session.player.error) {
          publish({session:{...before,player:{...before.player,error:update.session.player.error}},attempt:null,guideReceipt:null});return false;
        }
        if(candidate.kind==='example')update.session={...update.session,player:{...update.session.player,selectedId:null}};
        controller.pause();publish(update);applied={kind:candidate.kind,player:update.session.player};return true;
      });
      return applied;
    },
    go:(ordinal:number)=>{act({type:'seek',ordinal});},
    start:(command:unknown)=>act({type:'start',command}),
    replaceInput:(rawInput:unknown,command:unknown|null)=>act({type:'replace',rawInput,command}),
    select:(id:string|null)=>publish(transitionLearning(current.current,engine,content,{type:'select',id})),
    setMode:(mode:LearningMode)=>{if(current.current.mode!==mode)act({type:'mode',mode});},
    begin:(request:ActivityRequest)=>act({type:'begin',request,attemptId:crypto.randomUUID()}),
    submit:(attemptId:string,optionId:string)=>{act({type:'submit',attemptId,optionId,now:Date.now()});},
    reveal:(attemptId:string)=>{act({type:'reveal',attemptId});},
    continueGuide:()=>{act({type:'continue',now:Date.now()});},
    play:()=>{tutorController.cancel();controller.play();},pause:controller.pause,
    setSpeed:(speed:PlaybackSpeed)=>{const saved=store.setSettings({speed});setLocal(saved);controller.setSpeed(saved.settings.speed);},
    setSemanticOnly:(semanticOnly:boolean)=>setLocal(store.setSettings({semanticOnly})),
    saveInput:()=>{
      controller.pause();const s=current.current;
      if(s.mode!=='explore'||(engine.commandStart==='run-boundary'&&!isRunBoundary(s.player))) {
        publish({session:{...s,player:{...s.player,error:s.mode!=='explore'?'Return to Explore before saving.':'Finish or restart first.'}},attempt:null,guideReceipt:null});return;
      }
      setLocal(store.saveInput(currentSnapshot(s.player).state));
    },
    loadSavedInput:()=>{const saved=store.read();setLocal(saved);return act({type:'load',rawInput:saved.savedInput});},
    resetSavedData:()=>{
      tutorController.cancel();
      controller.pause();const saved=store.reset();setLocal(saved);controller.setSpeed(saved.settings.speed);
      publish({session:createLearningSession(engine,initial),attempt:null,guideReceipt:null});
    },
  };
}
