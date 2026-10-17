'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {LessonEngine} from '../core/lesson.ts';
import {currentSnapshot,isRunBoundary} from '../core/player.ts';
import {createLearningSession,transitionLearning,playbackLimit} from '../core/learning.ts';
import type {ActivityRequest,LearningAction,LearningMode,LearningUpdate,LessonLearning} from '../core/learning.ts';
import {createLearningStore,emptyLocalData} from '../core/learning-storage.ts';
import {createPlayback} from './playback.ts';
import type {PlaybackSpeed,PlaybackStatus} from './playback.ts';

export type LessonPlayer<I,C,S>=ReturnType<typeof useLessonPlayer<I,C,S>>;
export function useLessonPlayer<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown,content:LessonLearning<I,C>) {
  const [session,setSession]=useState(()=>createLearningSession(engine,initial));
  const current=useRef(session);
  const store=useMemo(()=>createLearningStore(()=>window.localStorage,engine),[engine]);
  const [local,setLocal]=useState(emptyLocalData<I>);
  const [playback,setPlayback]=useState<PlaybackStatus>({playing:false,speed:1});
  const publish=useCallback((update:LearningUpdate<I,S>)=>{
    current.current=update.session;setSession(update.session);
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
  useEffect(()=>{
    const saved=store.read();setLocal(saved);controller.setSpeed(saved.settings.speed);
    setPlayback(controller.status());
    const hidden=()=>{if(document.hidden) controller.pause();};
    hidden();
    document.addEventListener('visibilitychange',hidden);
    return()=>{document.removeEventListener('visibilitychange',hidden);controller.dispose();};
  },[controller,store]);
  const act=(action:LearningAction)=>{
    controller.pause();const update=transitionLearning(current.current,engine,content,action);publish(update);return update.session.player;
  };
  return {
    player:session.player,session,local,limit:playbackLimit(session),playback,
    go:(ordinal:number)=>{act({type:'seek',ordinal});},
    start:(command:unknown)=>act({type:'start',command}),
    replaceInput:(rawInput:unknown,command:unknown|null)=>act({type:'replace',rawInput,command}),
    select:(id:string|null)=>publish(transitionLearning(current.current,engine,content,{type:'select',id})),
    setMode:(mode:LearningMode)=>{act({type:'mode',mode});},
    begin:(request:ActivityRequest)=>act({type:'begin',request,attemptId:crypto.randomUUID()}),
    submit:(attemptId:string,optionId:string)=>{act({type:'submit',attemptId,optionId,now:Date.now()});},
    reveal:(attemptId:string)=>{act({type:'reveal',attemptId});},
    continueGuide:()=>{act({type:'continue',now:Date.now()});},
    play:controller.play,pause:controller.pause,
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
      controller.pause();const saved=store.reset();setLocal(saved);controller.setSpeed(saved.settings.speed);
      publish({session:createLearningSession(engine,initial),attempt:null,guideReceipt:null});
    },
  };
}
