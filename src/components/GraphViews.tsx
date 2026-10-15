'use client';
import type {Snapshot} from '../core/lesson.ts';
import type {GraphState} from '../lessons/graph/engine.ts';
import {orderedNeighbors,nodeStatus} from '../lessons/graph/engine.ts';

export function GraphSemanticViews({snapshot,selectedId,select}:{snapshot:Snapshot<GraphState>;selectedId:string|null;select(id:string):void}) {
  const state=snapshot.state,algorithm=state.algorithm??snapshot.variables.algorithm;
  const nodeButton=(id:string,view:string)=><button key={id} className={`graph-node ${snapshot.event.affectedIds.includes(id)?'affected':''}`}
    aria-pressed={selectedId===id} aria-label={`Select node ${id}, ${nodeStatus(state,id)}`}
    data-entity-id={id} data-view={view} onClick={()=>select(id)}>
    <strong>{id}</strong><span>{nodeStatus(state,id)}</span>
  </button>;
  return <>
    <section className="panel semantic" aria-label="Graph nodes and adjacency">
      <div className="section-heading"><h2>Nodes & adjacency</h2><span className="muted">{state.nodes.length} / 20 nodes</span></div>
      <p className="muted">Neighbors follow node creation order. Select any ID to follow it across views.</p>
      {!state.nodes.length?<p>This graph is empty. Add a node to begin.</p>:<ul className="graph-adjacency">
        {state.nodes.map(node=><li key={node.id}>{nodeButton(node.id,'nodes')}
          <div><span className="muted">Neighbors →</span><div className="graph-neighbors">
            {orderedNeighbors(state,node.id).map(n=>nodeButton(n.nodeId,`adjacency-${node.id}`))}
            {!orderedNeighbors(state,node.id).length&&<span className="muted">None · isolated</span>}
          </div></div>
        </li>)}
      </ul>}
    </section>
    <section className="panel" aria-label="Graph edges"><div className="section-heading"><h2>Edges</h2><span className="muted">{state.edges.length} / 40 edges</span></div>
      <div className="graph-edges">{state.edges.map(edge=><button key={edge.id} data-entity-id={edge.id} data-view="edges"
        className={state.examinedEdgeId===edge.id?'affected':''} aria-pressed={selectedId===edge.id}
        aria-label={`Select edge ${edge.id}, ${edge.a} to ${edge.b}`} onClick={()=>select(edge.id)}>
        {edge.id} · {edge.a} ↔ {edge.b}{state.examinedEdgeId===edge.id?' · Examined now':''}
      </button>)}</div>{!state.edges.length&&<p className="muted">No edges yet.</p>}
    </section>
    {algorithm==='bfs'?<section className="panel" aria-label="BFS queue"><h2>BFS queue</h2><p className="muted">Front → Back</p>
      <ol className="graph-frontier">{state.queue.map((id,index)=><li key={id}>{nodeButton(id,'frontier')}<span className="muted">[{index}]{index===0?' · Front':''}</span></li>)}</ol>
      {!state.queue.length&&<p className="muted">The queue is empty.</p>}
    </section>:algorithm==='dfs'?<section className="panel" aria-label="DFS stack"><h2>DFS stack</h2><p className="muted">Bottom → Top · each frame resumes its own next neighbor</p>
      <ol className="graph-frontier">{state.frames.map((frame,index)=>{
        const neighbors=orderedNeighbors(state,frame.nodeId);
        return <li key={frame.nodeId}>{nodeButton(frame.nodeId,'frontier')}
          <span className="muted">[{index}] · {index===state.frames.length-1?'Top / current':'Frame'}</span>
          <span className="muted">Neighbors examined {frame.nextNeighborIndex}/{neighbors.length}; next {neighbors[frame.nextNeighborIndex]?.nodeId??'Absent'}</span>
        </li>;
      })}</ol>{!state.frames.length&&<p className="muted">The stack is empty.</p>}
    </section>:<p className="panel muted">Choose BFS or DFS and a start node.</p>}
    <section className="panel" aria-label="Discovery order"><h2>Discovery order</h2>
      <ol className="graph-frontier">{state.discoveryOrder.map(id=><li key={id}>{nodeButton(id,'discovery')}</li>)}</ol>
      {!state.discoveryOrder.length&&<p className="muted">No nodes discovered yet.</p>}
    </section>
    {algorithm==='dfs'&&<section className="panel" aria-label="Backtracking"><h2>Backtracking</h2>
      <ol className="graph-frontier">{state.backtracking.map(id=><li key={id}>{nodeButton(id,'backtracking')}</li>)}</ol>
      {!state.backtracking.length&&<p className="muted">No frames returned yet.</p>}
    </section>}
  </>;
}
