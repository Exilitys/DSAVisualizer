'use client';
import {useEffect} from 'react';
export function LessonNavigation({active}:{active:'heap'|'graph'}) {
  useEffect(()=>{
    const restored=(event:PageTransitionEvent)=>{if(event.persisted)window.location.reload();};
    window.addEventListener('pageshow',restored);
    return()=>window.removeEventListener('pageshow',restored);
  },[]);
  return <nav aria-label="Lessons">
    <a href="/" aria-current={active==='heap'?'page':undefined}>Heap</a>
    <a href="/graph" aria-current={active==='graph'?'page':undefined}>Graph</a>
  </nav>;
}
