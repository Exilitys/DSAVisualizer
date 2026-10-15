import type {Snapshot} from '../../core/lesson.ts';
import type {GraphState} from './engine.ts';

const bfs=[
  {id:'bfs.discover',text:'Mark the node discovered and record its predecessor and distance'},
  {id:'bfs.enqueue',text:'Add the discovered node to the back of the queue'},
  {id:'bfs.dequeue',text:'Remove the front node to process its neighbors'},
  {id:'bfs.examine',text:'Examine the next neighbor in creation order'},
  {id:'bfs.process',text:'Mark the current node processed after all neighbors'},
  {id:'bfs.complete',text:'Finish when the queue is empty; other components stay unvisited'},
];
const dfs=[
  {id:'dfs.discover',text:'Mark the node discovered and record its predecessor and tree depth'},
  {id:'dfs.push',text:'Push a frame beginning at the first neighbor'},
  {id:'dfs.examine',text:"Examine one neighbor and advance the frame's next-neighbor index"},
  {id:'dfs.return',text:'Pop the exhausted frame and return to its parent'},
  {id:'dfs.complete',text:'Finish when the stack is empty; other components stay unvisited'},
];
export function getGraphPseudocode(snapshot:Snapshot<GraphState>):readonly {id:string;text:string}[] {
  const algorithm=snapshot.state.algorithm??snapshot.variables.algorithm;
  return algorithm==='bfs'?bfs:algorithm==='dfs'?dfs:[];
}
export function explainGraphStep(snapshot:Snapshot<GraphState>):string {
  const [node,other,depth]=snapshot.event.operands;
  switch(snapshot.event.type) {
    case 'discover':return `Discover ${node} from ${other}; record ${snapshot.state.algorithm==='bfs'?'shortest distance':'DFS tree depth'} ${depth}.`;
    case 'enqueue':return `Add ${node} to the back of the queue.`;
    case 'dequeue':return `Remove ${node} from the front of the FIFO queue to examine its neighbors.`;
    case 'push':return `Push a new frame for ${node}, beginning with neighbor index 0.`;
    case 'examine':return `Examine ${node}–${other} (${depth}). ${other} is ${snapshot.variables.alreadyDiscovered?'already discovered; keep its predecessor':'undiscovered; discover it next'}.`;
    case 'process':return `All neighbors of ${node} are examined. Mark ${node} processed.`;
    case 'return':return `Finish ${node} and pop its frame. ${other==='none'?'The root has returned.':`Return to ${other} and resume its next neighbor.`}`;
    case 'complete':return `Traversal complete: ${node} reached, ${other} unvisited. Other components remain undiscovered.`;
    default:return snapshot.variables.startId?`Start ${snapshot.variables.algorithm==='bfs'?'BFS':'DFS'} at ${snapshot.variables.startId}. Examine neighbors in node creation order.`:'Choose BFS or DFS and an existing start node to begin.';
  }
}
