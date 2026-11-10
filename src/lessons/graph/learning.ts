import type {LessonLearning} from '../../core/learning.ts';
import {createGraphPreset} from './engine.ts';
import type {GraphInput,GraphCommand} from './engine.ts';

const input:GraphInput={nodes:Array.from('ABCDE',(id,i)=>({id,creationOrder:i+1})),
  edges:[['A','B'],['A','C'],['B','D'],['D','C'],['C','E']].map(([a,b],i)=>({id:`E${i+1}`,a,b})),nextNodeId:6,nextEdgeId:6};
export const graphLearning:LessonLearning<GraphInput,GraphCommand>={
  moduleId:'graph',engineVersion:'1.0.0',objectives:[
    {id:'graph.discovery-frontier',title:'Separate discovery, enqueue and processing'},
    {id:'graph.frame-return',title:'Resume an explicit DFS frame'},
    {id:'graph.distance-vs-depth',title:'Compare shortest distance and DFS tree depth'}],
  guide:{id:'graph-guide',version:1,title:'Compare a queue with a frame stack',segments:[
    {id:'graph-bfs',title:'BFS: follow the queue',input:createGraphPreset(),command:{type:'bfs',startId:'A'},checkpoints:[
      {ordinal:0,type:'initial',explanationKey:'graph.bfs.initial',text:'Start from A. Neighbors follow node creation order; moving positions will not change that order.'},
      {ordinal:5,type:'discover',explanationKey:'graph.bfs.discover',text:'B is discovered but not yet enqueued. The queue is empty and A is still being processed.'},
      {ordinal:9,type:'enqueue',explanationKey:'graph.bfs.enqueue',text:'The queue is B, C, front first. B will be removed first. Discovery is different from finishing a node.'},
      {ordinal:31,type:'complete',explanationKey:'graph.bfs.complete',text:'BFS records shortest edge-count distances from A. Isolated F remains undiscovered; the reachable component is complete.'}]},
    {id:'graph-dfs',title:'DFS: follow the frames and returns',input:createGraphPreset(),command:{type:'dfs',startId:'A'},checkpoints:[
      {ordinal:0,type:'initial',explanationKey:'graph.dfs.initial',text:'Use the same preset with DFS. Each stack frame remembers where its next neighbor is.'},
      {ordinal:13,type:'push',explanationKey:'graph.dfs.push',text:'Frames A, B, D, C show the discovered path. Inspect a frame’s next-neighbor index; DFS resumes that progress after returning.'},
      {ordinal:16,type:'return',explanationKey:'graph.dfs.return',text:'C has finished and returns to D. D continues its next neighbor before exploring E.'},
      {ordinal:26,type:'complete',explanationKey:'graph.dfs.complete',text:'C has DFS tree depth 3, though A connects directly to C. DFS finds reachable nodes but does not guarantee shortest paths.'}]}]},
  challenges:[
    {id:'graph-enqueue',version:1,objectiveId:'graph.discovery-frontier',input,command:{type:'bfs',startId:'A'},
      checkpoint:{ordinal:8,type:'discover',explanationKey:'graph.bfs.discover'},prompt:'C has just been discovered. What happens next?',
      options:[{id:'enqueue',label:'Enqueue C behind B; C is discovered and not processed'},{id:'process',label:'Finish processing C immediately'},{id:'dequeue',label:'Dequeue B immediately'}],answerId:'enqueue',feedback:'Discovery and enqueue are separate steps. C joins the back of the FIFO queue, behind B, and is not processed yet.'},
    {id:'graph-return',version:1,objectiveId:'graph.frame-return',input,command:{type:'dfs',startId:'A'},
      checkpoint:{ordinal:20,type:'return',explanationKey:'graph.dfs.return'},prompt:'After exhausted C returns, which frame resumes?',
      options:[{id:'d',label:'D at next-neighbor index 2'},{id:'a',label:'A at next-neighbor index 1'},{id:'b',label:'B at next-neighbor index 2'}],answerId:'d',feedback:'E has returned to C. C has exhausted its neighbors, so C now returns to its parent D, whose frame resumes at index 2.'},
    {id:'graph-depth',version:1,objectiveId:'graph.distance-vs-depth',input,command:{type:'dfs',startId:'A'},
      checkpoint:{ordinal:11,type:'examine',explanationKey:'graph.dfs.examine'},prompt:'At C’s next discovery, what do its distances mean?',
      options:[{id:'depth-3-distance-1',label:'DFS tree depth 3; shortest A–C distance 1'},{id:'both-3',label:'Both are 3'},{id:'both-1',label:'Both are 1'}],answerId:'depth-3-distance-1',feedback:'DFS reaches C by A–B–D–C, giving tree depth 3. The direct edge A–C has shortest distance 1, which BFS records.'}]};
