'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {LessonEngine} from '../core/lesson.ts';
import {createPlayer,seek,startCommand,selectEntity,replaceInput as replacePlayerInput} from '../core/player.ts';
import type {PlayerState} from '../core/player.ts';
import {createPlayback} from './playback.ts';
import type {PlaybackStatus} from './playback.ts';

export function useLessonPlayer<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown) {
  const [player,setPlayer]=useState(()=>createPlayer(engine,initial));
  const current=useRef(player);
  const [playback,setPlayback]=useState<PlaybackStatus>({playing:false,speed:1});
  const publish=useCallback((next:PlayerState<I,S>)=>{
    current.current=next;
    setPlayer(next);
  },[]);
  const controller=useMemo(()=>createPlayback({
    read:()=>({run:document.hidden ? null : current.current.steps,
      ordinal:current.current.ordinal,
      lastOrdinal:current.current.steps ? current.current.steps.length-1 : 0}),
    advance:ordinal=>publish(seek(current.current,ordinal)),
    schedule:(delay,callback)=>{const id=window.setTimeout(callback,delay);return()=>window.clearTimeout(id);},
    changed:setPlayback,
  }),[publish]);
  useEffect(()=>{
    setPlayback(controller.status());
    const hidden=()=>{if(document.hidden) controller.pause();};
    hidden();
    document.addEventListener('visibilitychange',hidden);
    return()=>{document.removeEventListener('visibilitychange',hidden);controller.dispose();};
  },[controller]);
  return {
    player,playback,
    go:(ordinal:number)=>{controller.pause();publish(seek(current.current,ordinal));},
    start:(raw:unknown)=>{
      controller.pause();const next=startCommand(current.current,engine,raw);publish(next);return next;
    },
    replaceInput:(rawInput:unknown,command:unknown|null)=>{
      controller.pause();const next=replacePlayerInput(current.current,engine,rawInput,command);publish(next);return next;
    },
    select:(id:string|null)=>publish(selectEntity(current.current,engine,id)),
    play:controller.play,pause:controller.pause,setSpeed:controller.setSpeed,
  };
}
