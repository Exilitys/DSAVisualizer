'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Inspection, Snapshot } from '../core/lesson.ts';
import { createPlayer, currentSnapshot, startCommand, seek, selectEntity } from '../core/player.ts';
import { heapEngine, createPreset } from '../lessons/heap/engine.ts';
import type { HeapState } from '../lessons/heap/engine.ts';
import { pseudocode, explainStep } from '../lessons/heap/content.ts';

const HeapScene = dynamic(()=>import('../lessons/heap/HeapScene'),{
  ssr:false,loading:()=> <p className="scene-notice">Loading the 3D view…</p>,
});

export function PlaybackControls({ordinal,lastOrdinal,hasRun,go}: {
  ordinal:number; lastOrdinal:number; hasRun:boolean; go(ordinal:number):void;
}) {
  return <div className="playback">
    <div className="playback-buttons">
      <button disabled={!hasRun || ordinal===0} onClick={()=>go(ordinal-1)}>← Previous</button>
      <button className="primary" disabled={!hasRun || ordinal===lastOrdinal} onClick={()=>go(ordinal+1)}>Next →</button>
      <button disabled={!hasRun} onClick={()=>go(0)}>Restart</button>
    </div>
    <div className="timeline">
      <label htmlFor="step-range">Step <strong>{ordinal} / {lastOrdinal}</strong></label>
      <input id="step-range" type="range" min={0} max={lastOrdinal} disabled={!hasRun} value={ordinal}
        aria-valuetext={`Step ${ordinal} of ${lastOrdinal}`} onChange={event=>go(Number(event.target.value))} />
    </div>
  </div>;
}

export function InspectionPanel({inspection}: {inspection:Inspection|null}) {
  return <section className="panel inspection" aria-label="Item inspection">
    <p className="eyebrow">Follow an identity</p>
    <h2>{inspection?.label ?? 'Inspect an item'}</h2>
    {inspection ? <dl>{inspection.fields.map(field=><div key={field.label}>
      <dt>{field.label}</dt><dd>{field.value}</dd>
    </div>)}</dl> : <p className="muted">Select an item in either view to see its value, index, and relationships at this step.</p>}
  </section>;
}

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
  const [player,setPlayer] = useState(()=>createPlayer(heapEngine,createPreset()));
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
  const go = (ordinal:number) => setPlayer(state=>seek(state,ordinal));
  const select = useCallback((id:string)=>setPlayer(state=>selectEntity(state,heapEngine,id)),[]);
  const insert = () => setPlayer(state=>draft.trim()===''
    ? {...state,error:'Enter a whole number from 0 to 99.'}
    : startCommand(state,heapEngine,{type:'insert',value:Number(draft)}));
  const inspection = player.selectedId ? heapEngine.inspect(snapshot,player.selectedId) : null;
  const repairing = snapshot.invariants.some(x=>x.status==='repairing');

  return <main className="playground" data-selected-id={player.selectedId ?? ''} data-ordinal={player.ordinal}>
    <header className="masthead"><a className="brand" href="/" aria-label="DSA Atlas home"><span className="brand-mark">A</span>DSA Atlas</a><span className="lesson-tag">01 / Min heap</span></header>
    <div className="intro"><p className="eyebrow">Learn by following the change</p><h1>Follow the smallest value.</h1>
      <p>Insert an item. Compare it with its parent. See why it moves.</p></div>
    <section className="panel operation" aria-label="Heap insertion">
      <div><h2>Try an insertion</h2><p className="muted">Start with 1 to follow H8 all the way to the root.</p></div>
      <div className="operation-controls"><label htmlFor="insert-value">Value to insert</label>
        <input id="insert-value" type="number" min={0} max={99} step={1} value={draft}
          aria-describedby="operation-help" aria-invalid={Boolean(player.error)} onChange={event=>setDraft(event.target.value)} />
        <button className="primary" disabled={!canStart} onClick={insert}>Insert</button></div>
      <p id="operation-help" className="operation-help muted">{canStart ? 'Whole numbers 0–99. Equal values are welcome.' : 'Finish or restart first to insert another item.'}</p>
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
          <button disabled={!inspection || semanticOnly || !webglAvailable} onClick={()=>setFocusRequest(n=>n+1)}>Focus selection</button>
          <label><input type="checkbox" checked={reducedMotion} onChange={event=>setReducedMotion(event.target.checked)} />Reduce motion</label>
          <label><input type="checkbox" checked={semanticOnly} onChange={event=>setSemanticOnly(event.target.checked)} />Semantic view only</label>
        </div>
        <section className="panel execution" aria-label="Execution controls">
          <div className="section-heading"><h2>One step at a time</h2><span className={`invariant ${repairing ? 'repairing' : ''}`}>{repairing ? 'Repairing heap order' : 'Heap order holds'}</span></div>
          <PlaybackControls ordinal={player.ordinal} lastOrdinal={lastOrdinal} hasRun={Boolean(player.steps)} go={go} />
          <div className="explanation" role="status" aria-live="polite"><span className="event-name">{snapshot.event.type}</span><p>{explainStep(snapshot)}</p></div>
          <div className="counters"><div><span className="muted">Comparisons</span><strong data-testid="comparisons">{snapshot.counters.comparisons}</strong></div><div><span className="muted">Swaps</span><strong data-testid="swaps">{snapshot.counters.swaps}</strong></div></div>
        </section>
        <SemanticHeap snapshot={snapshot} selectedId={player.selectedId} select={select} />
      </div>
      <aside className="details-column"><InspectionPanel inspection={inspection} />
        <section className="panel code" aria-label="Insertion pseudocode"><p className="eyebrow">The idea in four lines</p><h2>Sift upward</h2>
          <ol>{pseudocode.map(line=><li key={line.id} aria-current={snapshot.event.codeLineId===line.id ? 'step' : undefined}>{line.text}</li>)}</ol>
          <p className="muted">Parent index = ⌊(index − 1) / 2⌋. Only a smaller value swaps.</p>
        </section>
        <p className="learning-note">Try a larger value next. Where does it stop, and why?</p>
      </aside>
    </div>
    <footer>DSA Atlas <span>See the structure. Explain the change.</span></footer>
  </main>;
}
