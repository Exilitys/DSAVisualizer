'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Snapshot } from '../core/lesson.ts';
import { currentSnapshot } from '../core/player.ts';
import { heapEngine, createPreset } from '../lessons/heap/engine.ts';
import type { HeapState } from '../lessons/heap/engine.ts';
import { getPseudocode, explainStep } from '../lessons/heap/content.ts';
import {useLessonPlayer} from './useLessonPlayer';
import {PlaybackControls,InspectionPanel} from './LessonControls';
import {LessonNavigation} from './LessonNavigation';

const HeapScene = dynamic(()=>import('../lessons/heap/HeapScene'),{
  ssr:false,loading:()=> <p className="scene-notice">Loading the 3D view…</p>,
});

function SemanticHeap({snapshot,selectedId,select}: {
  snapshot:Snapshot<HeapState>; selectedId:string|null; select(id:string):void;
}) {
  const items = snapshot.state.items;
  const itemButton = (index:number,view:string) => {
    const item = items[index];
    return <button key={`${view}:${item.id}`} className={`item ${snapshot.event.affectedIds.includes(item.id) ? 'affected' : ''}`}
      aria-pressed={selectedId===item.id} aria-label={`Select ${item.id}, value ${item.value}, index ${index}`}
      onClick={()=>select(item.id)} data-entity-id={item.id} data-view={view}>
      <span className="item-id">{item.id}</span><strong>{item.value}</strong><span className="item-index">[{index}]</span>
    </button>;
  };
  return <section className="panel semantic" aria-label="Semantic heap views">
    <div className="section-heading"><h2>One heap. Two views.</h2><span className="muted">{items.length} / 15 items</span></div>
    <p className="muted">The ID travels with the value. Its index changes when it swaps.</p>
    <div className="semantic-tree" role="group" aria-label="Tree items by level">
      <h3>Tree <span className="muted">parent ≤ child</span></h3>
      {items.length ? Array.from({length:Math.floor(Math.log2(items.length))+1},(_,level)=>
        <div className="tree-level" key={level}>
          <span className="level-label">L{level}</span><div className="tree-items">
            {items.slice(2**level-1,2**(level+1)-1).map((_,slot)=>itemButton(2**level-1+slot,'tree'))}
          </div>
        </div>) : <p>This heap is empty.</p>}
    </div>
    <div role="group" aria-label="Array items by index">
      <h3>Array <span className="muted">zero-based indices</span></h3>
      <div className="array">{items.map((_,index)=>itemButton(index,'array'))}</div>
    </div>
  </section>;
}

export default function LessonPlayground() {
  const lesson=useLessonPlayer(heapEngine,createPreset());
  const {player,go,select}=lesson;
  const [draft,setDraft] = useState('1');
  const [semanticOnly,setSemanticOnly] = useState(false);
  const [webglAvailable,setWebglAvailable] = useState(true);
  const [reducedMotion,setReducedMotion] = useState(false);
  const [fitRequest,setFitRequest] = useState(0);
  const [focusRequest,setFocusRequest] = useState(0);
  const unavailable = useCallback(()=>setWebglAvailable(false),[]);
  useEffect(()=>{
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  const snapshot = currentSnapshot(player);
  const lastOrdinal = player.steps ? player.steps.length-1 : 0;
  const canStart = !player.steps || player.ordinal===0 || player.ordinal===lastOrdinal;
  const insert=()=>lesson.start({type:'insert',value:draft.trim()==='' ? NaN : Number(draft)});
  const extract=()=>lesson.start({type:'extract'});
  const inspection = player.selectedId ? heapEngine.inspect(snapshot,player.selectedId) : null;
  const focusable=Boolean(player.selectedId && snapshot.state.items.some(item=>item.id===player.selectedId));
  const extraction=snapshot.event.explanationKey.startsWith('heap.extract.');
  const repairing = snapshot.invariants.some(x=>x.status==='repairing');

  return <main className="playground" data-selected-id={player.selectedId ?? ''} data-ordinal={player.ordinal} data-playing={lesson.playback.playing}>
    <header className="masthead"><a className="brand" href="/" aria-label="DSA Atlas home"><span className="brand-mark">A</span>DSA Atlas</a><LessonNavigation active="heap"/><span className="lesson-tag">01 / Min heap</span></header>
    <div className="intro"><p className="eyebrow">Learn by following the change</p><h1>Follow the smallest value.</h1>
      <p>Insert an item or remove the minimum. See why the heap changes.</p></div>
    <section className="panel operation" aria-label="Heap operations">
      <div><h2>Try a heap operation</h2><p className="muted">Insert 1 to follow H8 upward, or extract the minimum to watch the repair.</p></div>
      <div className="operation-controls"><label htmlFor="insert-value">Value to insert</label>
        <input id="insert-value" type="number" min={0} max={99} step={1} value={draft}
          aria-describedby="operation-help" aria-invalid={Boolean(player.error)} onChange={event=>setDraft(event.target.value)} />
        <button className="primary" disabled={!canStart} onClick={insert}>Insert</button>
        <button disabled={!canStart} onClick={extract}>Extract minimum</button></div>
      <p id="operation-help" className="operation-help muted">{canStart ? 'Whole numbers 0–99. Equal values are welcome.' : 'Finish or restart first to start another operation.'}</p>
      {player.error && <p className="error" role="alert">{player.error}</p>}
    </section>
    <div className="workspace">
      <div className="main-column">
        <section className="scene" aria-label="Heap visualization" data-reduced-motion={reducedMotion}>
          <div className="scene-caption"><span>Linked 3D view</span><span>{inspection ? `Selected ${inspection.id}` : 'Select an item'}</span></div>
          {semanticOnly || !webglAvailable
            ? <p className="scene-notice">{webglAvailable ? 'Semantic view is active. Explore the structure and step controls below.' : '3D is unavailable. Use the structure and step controls below.'}</p>
            : <HeapScene snapshot={snapshot} selectedIds={inspection ? [inspection.id] : []} select={select} reducedMotion={reducedMotion}
                fitRequest={fitRequest} focusRequest={focusRequest} unavailable={unavailable} />}
          <div className="scene-help"><span>Drag to orbit · scroll to zoom</span><span>Tree above · array below</span></div>
        </section>
        <div className="scene-controls" aria-label="View controls">
          <button disabled={semanticOnly || !webglAvailable} onClick={()=>setFitRequest(n=>n+1)}>Fit scene</button>
          <button disabled={!focusable || semanticOnly || !webglAvailable} onClick={()=>setFocusRequest(n=>n+1)}>Focus selection</button>
          <label><input type="checkbox" checked={reducedMotion} onChange={event=>setReducedMotion(event.target.checked)} />Reduce motion</label>
          <label><input type="checkbox" checked={semanticOnly} onChange={event=>setSemanticOnly(event.target.checked)} />Semantic view only</label>
        </div>
        {snapshot.state.result && <section className="panel result-card" aria-label="Extraction result">
          <div><p className="eyebrow">Minimum removed</p><h2>Outside the active heap</h2></div>
          <button className="result-item" data-entity-id={snapshot.state.result.id}
            aria-pressed={player.selectedId===snapshot.state.result.id}
            aria-label={`Select extracted ${snapshot.state.result.id}, value ${snapshot.state.result.value}`}
            onClick={()=>select(snapshot.state.result!.id)}>
            <span className="item-id">{snapshot.state.result.id}</span><strong>{snapshot.state.result.value}</strong>
          </button>
        </section>}
        {snapshot.event.explanationKey==='heap.extract.empty' && <p className="panel muted">No minimum: the heap is empty.</p>}
        <section className="panel execution" aria-label="Execution controls">
          <div className="section-heading"><h2>One step at a time</h2><span className={`invariant ${repairing ? 'repairing' : ''}`}>{repairing ? 'Repairing heap order' : 'Heap order holds'}</span></div>
          <PlaybackControls ordinal={player.ordinal} lastOrdinal={lastOrdinal} hasRun={Boolean(player.steps)} go={go}
            playback={lesson.playback} play={lesson.play} pause={lesson.pause} setSpeed={lesson.setSpeed} />
          <div className="explanation" role="status" aria-live="polite"><span className="event-name">{snapshot.event.type}</span><p>{explainStep(snapshot)}</p></div>
          <div className="counters"><div><span className="muted">Comparisons</span><strong data-testid="comparisons">{snapshot.counters.comparisons}</strong></div><div><span className="muted">Swaps</span><strong data-testid="swaps">{snapshot.counters.swaps}</strong></div></div>
        </section>
        <SemanticHeap snapshot={snapshot} selectedId={player.selectedId} select={select} />
      </div>
      <aside className="details-column"><InspectionPanel inspection={inspection} />
        <section className="panel code" aria-label="Heap pseudocode"><p className="eyebrow">Follow the current decision</p><h2>{extraction ? 'Sift down' : 'Sift upward'}</h2>
          <ol>{getPseudocode(snapshot).map(line=><li key={line.id} aria-current={snapshot.event.codeLineId===line.id ? 'step' : undefined}>{line.text}</li>)}</ol>
          <p className="muted">{extraction ? 'Children: 2 × index + 1 and 2 × index + 2. Choose the smaller; prefer the left on equality.' : 'Parent index = ⌊(index − 1) / 2⌋. Only a smaller value swaps.'}</p>
        </section>
        <p className="learning-note">{extraction ? 'Which child should the replacement follow, and why?' : 'Try a larger value next. Where does it stop, and why?'}</p>
      </aside>
    </div>
    <footer>DSA Atlas <span>See the structure. Explain the change.</span></footer>
  </main>;
}
