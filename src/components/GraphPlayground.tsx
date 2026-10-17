'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {currentSnapshot} from '../core/player.ts';
import {graphEngine,createGraphPreset,editGraph} from '../lessons/graph/engine.ts';
import type {GraphInput,GraphCommand} from '../lessons/graph/engine.ts';
import {explainGraphStep,getGraphPseudocode} from '../lessons/graph/content.ts';
import {parseGraphPosition,reconcileGraphPositions} from '../lessons/graph/layout.ts';
import {useLessonPlayer} from './useLessonPlayer';
import {graphLearning} from '../lessons/graph/learning.ts';
import {PlaybackControls,InspectionPanel} from './LessonControls';
import {LessonNavigation} from './LessonNavigation';
import {GraphSemanticViews} from './GraphViews';

const GraphScene=dynamic(()=>import('../lessons/graph/GraphScene'),{ssr:false,loading:()=> <p className="scene-notice">Loading the 3D view…</p>});
type PendingAction={kind:'start';command:GraphCommand}|{kind:'edit';input:GraphInput};
export default function GraphPlayground() {
  const lesson=useLessonPlayer(graphEngine,createGraphPreset(),graphLearning);
  const {player,go,select}=lesson,snapshot=currentSnapshot(player);
  const [positions,setPositions]=useState(()=>reconcileGraphPositions(createGraphPreset().nodes,{}));
  const [algorithmDraft,setAlgorithmDraft]=useState('bfs');
  const [startDraft,setStartDraft]=useState(''),[fromDraft,setFromDraft]=useState(''),[toDraft,setToDraft]=useState('');
  const [xDraft,setXDraft]=useState(''),[yDraft,setYDraft]=useState('');
  const [activeCommand,setActiveCommand]=useState<GraphCommand|null>(null);
  const [pending,setPending]=useState<PendingAction|null>(null),[localError,setLocalError]=useState<string|null>(null);
  const dialogRef=useRef<HTMLDialogElement>(null);
  const [semanticOnly,setSemanticOnly]=useState(false),[webglAvailable,setWebglAvailable]=useState(true);
  const [reducedMotion,setReducedMotion]=useState(false),[fitRequest,setFitRequest]=useState(0),[focusRequest,setFocusRequest]=useState(0);
  const unavailable=useCallback(()=>setWebglAvailable(false),[]);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(media.matches);update();media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const point=player.selectedId?positions[player.selectedId]:undefined;
    setXDraft(point?String(point[0]):'');setYDraft(point?String(point[1]):'');
  },[player.selectedId,positions]);
  const lastOrdinal=player.steps?player.steps.length-1:0;
  const selectedNode=snapshot.state.nodes.find(n=>n.id===player.selectedId);
  const selectedEdge=snapshot.state.edges.find(e=>e.id===player.selectedId);
  const inspection=player.selectedId?graphEngine.inspect(snapshot,player.selectedId):null;
  const algorithm=snapshot.state.algorithm??snapshot.variables.algorithm;

  const apply=(action:PendingAction)=>{
    const next=action.kind==='start'?lesson.start(action.command):lesson.replaceInput(action.input,activeCommand);
    if(action.kind==='start'&&next.steps!==player.steps&&!next.error) setActiveCommand(action.command);
    if(action.kind==='edit'&&next.input!==player.input) {
      setPositions(previous=>reconcileGraphPositions(next.input.nodes,previous));
      if(!next.steps) setActiveCommand(null);
      if(!next.input.nodes.some(node=>node.id===startDraft)) setStartDraft('');
      if(!next.input.nodes.some(node=>node.id===fromDraft)) setFromDraft('');
      if(!next.input.nodes.some(node=>node.id===toDraft)) setToDraft('');
    }
  };
  const request=(action:PendingAction)=>{
    lesson.pause();setLocalError(null);
    if(player.steps&&player.ordinal>0&&player.ordinal<lastOrdinal) {
      setPending(action);dialogRef.current!.showModal();
    } else apply(action);
  };
  const submitEdit=(raw:unknown)=>{
    lesson.pause();const result=editGraph(snapshot.state,raw);
    if(!result.ok){setLocalError(result.message);return;}
    request({kind:'edit',input:result.value});
  };
  const submitTraversal=()=>{
    lesson.pause();const result=graphEngine.validateCommand({type:algorithmDraft,startId:startDraft},snapshot.state);
    if(!result.ok){setLocalError(result.message);return;}
    request({kind:'start',command:result.value});
  };
  const keepTraversal=()=>{dialogRef.current!.close();setPending(null);};
  const applyPending=()=>{const action=pending;dialogRef.current!.close();setPending(null);if(action)apply(action);};
  const moveSelected=()=>{
    if(!selectedNode) return;
    const point=parseGraphPosition(xDraft,yDraft);
    if(!point.ok){setLocalError(point.message);return;}
    setLocalError(null);setPositions(previous=>({...previous,[selectedNode.id]:point.value}));
  };
  const nodeOptions=<><option value="">Choose a node</option>{snapshot.state.nodes.map(n=><option key={n.id} value={n.id}>{n.id}</option>)}</>;
  const currentRun=algorithm?`${String(algorithm).toUpperCase()} from ${snapshot.variables.startId}`:'No traversal started';
  return <main className="playground" data-selected-id={player.selectedId??''} data-ordinal={player.ordinal} data-playing={lesson.playback.playing}>
    <header className="masthead"><a className="brand" href="/" aria-label="DSA Atlas home"><span className="brand-mark">A</span>DSA Atlas</a><LessonNavigation active="graph"/><span className="lesson-tag">02 / Graph traversal</span></header>
    <div className="intro"><p className="eyebrow">Learn by following the change</p><h1>Follow the frontier.</h1><p>Edit a graph. Follow a queue or a stack, and see how the discovered path changes.</p></div>
    <section className="panel graph-editor" aria-label="Graph editor"><div className="section-heading"><h2>Build your graph</h2><span className="muted">Undirected · unweighted</span></div>
      <div className="graph-actions"><button type="button" onClick={()=>submitEdit({type:'add-node'})}>Add node</button>
        <button type="button" disabled={!selectedNode} onClick={()=>submitEdit({type:'remove-node',id:player.selectedId})}>Remove selected node</button>
        <button type="button" disabled={!selectedEdge} onClick={()=>submitEdit({type:'disconnect',edgeId:player.selectedId})}>Disconnect selected edge</button></div>
      <form noValidate onSubmit={event=>{event.preventDefault();submitEdit({type:'connect',a:fromDraft,b:toDraft});}}>
        <div className="graph-field"><label htmlFor="graph-from">From node</label><select id="graph-from" value={fromDraft} onChange={event=>setFromDraft(event.target.value)}>{nodeOptions}</select></div>
        <div className="graph-field"><label htmlFor="graph-to">To node</label><select id="graph-to" value={toDraft} onChange={event=>setToDraft(event.target.value)}>{nodeOptions}</select></div>
        <button type="submit">Connect nodes</button>
      </form>
      <form noValidate onSubmit={event=>{event.preventDefault();submitTraversal();}}>
        <div className="graph-field"><label htmlFor="graph-algorithm">Traversal</label><select id="graph-algorithm" value={algorithmDraft} onChange={event=>setAlgorithmDraft(event.target.value)}><option value="bfs">BFS</option><option value="dfs">DFS</option></select></div>
        <div className="graph-field"><label htmlFor="graph-start">Start node</label><select id="graph-start" value={startDraft} onChange={event=>setStartDraft(event.target.value)}>{nodeOptions}</select></div>
        <button type="submit" className="primary" disabled={!snapshot.state.nodes.length}>Start traversal</button>
      </form>
      <form noValidate onSubmit={event=>{event.preventDefault();moveSelected();}}>
        <label>Node X<input type="number" min={-10} max={10} step={.5} value={xDraft} disabled={!selectedNode} onChange={event=>setXDraft(event.target.value)}/></label>
        <label>Node Y<input type="number" min={-10} max={10} step={.5} value={yDraft} disabled={!selectedNode} onChange={event=>setYDraft(event.target.value)}/></label>
        <button type="submit" disabled={!selectedNode}>Move selected node</button>
        <button type="button" onClick={()=>{setLocalError(null);setPositions(reconcileGraphPositions(snapshot.state.nodes,{}));setFitRequest(n=>n+1);}}>Reset layout</button>
      </form>
      <p className="muted">Select a node to move it. X/Y: −10…10 in 0.5 steps. Positions do not change traversal order.</p>
      {(localError||player.error)&&<p className="error" role="alert">{localError||player.error}</p>}
    </section>
    <div className="workspace"><div className="main-column">
      <section className="scene" aria-label="Graph visualization" data-reduced-motion={reducedMotion}>
        <div className="scene-caption"><span>{currentRun}</span><span>{inspection?`Selected ${inspection.id}`:'Select a node or edge'}</span></div>
        {semanticOnly||!webglAvailable?<p className="scene-notice">{webglAvailable?'Semantic view is active. Explore the structure and step controls below.':'3D is unavailable. Use the structure and step controls below.'}</p>
          :<GraphScene snapshot={snapshot} selectedIds={inspection?[inspection.id]:[]} select={select} positions={positions} reducedMotion={reducedMotion} fitRequest={fitRequest} focusRequest={focusRequest} unavailable={unavailable}/>}
        <div className="scene-help"><span>Drag to orbit · scroll to zoom</span><span>Click a node or edge to inspect</span></div>
      </section>
      <div className="scene-controls" aria-label="View controls">
        <button disabled={!snapshot.state.nodes.length||semanticOnly||!webglAvailable} onClick={()=>setFitRequest(n=>n+1)}>Fit scene</button>
        <button disabled={!selectedNode||semanticOnly||!webglAvailable} onClick={()=>setFocusRequest(n=>n+1)}>Focus selection</button>
        <label><input type="checkbox" checked={reducedMotion} onChange={event=>setReducedMotion(event.target.checked)}/>Reduce motion</label>
        <label><input type="checkbox" checked={semanticOnly} onChange={event=>setSemanticOnly(event.target.checked)}/>Semantic view only</label>
      </div>
      <section className="panel execution" aria-label="Execution controls"><div className="section-heading"><h2>One step at a time</h2><span className="invariant">Graph invariants hold</span></div>
        <PlaybackControls ordinal={player.ordinal} lastOrdinal={lastOrdinal} hasRun={Boolean(player.steps)} go={go} playback={lesson.playback} play={lesson.play} pause={lesson.pause} setSpeed={lesson.setSpeed}/>
        <div className="explanation" role="status" aria-live="polite"><span className="event-name">{snapshot.event.type}</span><p>{explainGraphStep(snapshot)}</p></div>
        <div className="counters graph-counters">{Object.entries(snapshot.counters).map(([key,value])=><div key={key}><span className="muted">{({discoveries:'Discoveries',edgeExaminations:'Edge examinations',frontierAdds:'Frontier adds',frontierRemovals:'Frontier removals'})[key]}</span><strong data-testid={key}>{value}</strong></div>)}</div>
      </section>
      <GraphSemanticViews snapshot={snapshot} selectedId={player.selectedId} select={select}/>
    </div><aside className="details-column"><InspectionPanel inspection={inspection}/>
      <section className="panel code" aria-label="Graph pseudocode"><p className="eyebrow">Follow the current decision</p><h2>{algorithm?String(algorithm).toUpperCase():'Choose a traversal'}</h2>
        <ol>{getGraphPseudocode(snapshot).map(line=><li key={line.id} aria-current={snapshot.event.codeLineId===line.id?'step':undefined}>{line.text}</li>)}</ol>
        <p className="muted">BFS distances are shortest in an unweighted graph. DFS tree depth describes the discovered path, which can be longer.</p>
      </section><p className="learning-note">When is a node discovered? When is it finished? Follow the frontier to explain the difference.</p>
    </aside></div>
    <dialog ref={dialogRef} aria-labelledby="replace-title" onCancel={event=>{event.preventDefault();keepTraversal();}}>
      <h2 id="replace-title">Replace this traversal?</h2><p>This starts a new traversal. Keep traversal retains the paused steps.</p>
      <div className="graph-actions"><button autoFocus onClick={keepTraversal}>Keep traversal</button><button className="primary" onClick={applyPending}>Apply</button></div>
    </dialog>
    <footer>DSA Atlas <span>See the structure. Explain the change.</span></footer>
  </main>;
}
