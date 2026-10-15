import {deepFreeze} from '../../core/lesson.ts';
import type {LessonEngine,Snapshot,Validation} from '../../core/lesson.ts';

export type GraphNode={id:string;creationOrder:number};
export type GraphEdge={id:string;a:string;b:string};
export type GraphInput={nodes:readonly GraphNode[];edges:readonly GraphEdge[];nextNodeId:number;nextEdgeId:number};
export type GraphCommand={type:'bfs'|'dfs';startId:string};
export type GraphEdit={type:'add-node'}|{type:'remove-node';id:string}|{type:'connect';a:string;b:string}|{type:'disconnect';edgeId:string};
export type GraphState=GraphInput & {
  algorithm:'bfs'|'dfs'|null;startId:string|null;currentId:string|null;examinedEdgeId:string|null;
  queue:readonly string[];frames:readonly {nodeId:string;nextNeighborIndex:number}[];
  discovered:readonly string[];processed:readonly string[];
  predecessors:Readonly<Record<string,string|null>>;depthById:Readonly<Record<string,number>>;
  discoveryOrder:readonly string[];backtracking:readonly string[];
};
const object=(raw:unknown):raw is Record<string,unknown>=>raw!==null && typeof raw==='object' && !Array.isArray(raw);
const positive=(raw:unknown):raw is number=>typeof raw==='number' && Number.isSafeInteger(raw) && raw>0;
function nodeId(order:number):string {
  let result='';
  for(let n=order;n>0;n=Math.floor((n-1)/26)) result=String.fromCharCode(65+(n-1)%26)+result;
  return result;
}
const failure=(message:string):Validation<never>=>({ok:false,message});
const pair=(a:string,b:string)=>[a,b].sort().join(':');

export const graphEngine:LessonEngine<GraphInput,GraphCommand,GraphState>={
  id:'graph',version:'1.0.0',commandStart:'any-step',
  validateInput(raw) {
    if(!object(raw)||!Array.isArray(raw.nodes)||!Array.isArray(raw.edges)||!positive(raw.nextNodeId)||!positive(raw.nextEdgeId))
      return failure('Choose a valid graph.');
    if(raw.nodes.length>20||raw.edges.length>40) return failure('Use at most 20 nodes and 40 edges.');
    const nodes:GraphNode[]=[],edges:GraphEdge[]=[],ids=new Set<string>(),edgeIds=new Set<string>(),pairs=new Set<string>();
    for(const node of raw.nodes) {
      if(!object(node)||!positive(node.creationOrder)||node.id!==nodeId(node.creationOrder)||ids.has(node.id as string))
        return failure('Graph node identities are invalid.');
      if(raw.nextNodeId<=node.creationOrder) return failure('The next node ID must be unused.');
      ids.add(node.id as string);nodes.push({id:node.id as string,creationOrder:node.creationOrder});
    }
    for(const edge of raw.edges) {
      if(!object(edge)||typeof edge.id!=='string'||!/^E([1-9]\d*)$/.test(edge.id)||!positive(Number(edge.id.slice(1)))||edgeIds.has(edge.id))
        return failure('Graph edge identities are invalid.');
      if(typeof edge.a!=='string'||typeof edge.b!=='string'||!ids.has(edge.a)||!ids.has(edge.b)||edge.a===edge.b)
        return failure('Connect two different existing nodes.');
      const key=pair(edge.a,edge.b);
      if(pairs.has(key)) return failure('These nodes are already connected.');
      if(raw.nextEdgeId<=Number(edge.id.slice(1))) return failure('The next edge ID must be unused.');
      pairs.add(key);edgeIds.add(edge.id);edges.push({id:edge.id,a:edge.a,b:edge.b});
    }
    nodes.sort((a,b)=>a.creationOrder-b.creationOrder);
    edges.sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1)));
    return {ok:true,value:deepFreeze({nodes,edges,nextNodeId:raw.nextNodeId,nextEdgeId:raw.nextEdgeId})};
  },
  validateCommand(raw,input) {
    if(!object(raw)||(raw.type!=='bfs'&&raw.type!=='dfs')) return failure('Choose BFS or DFS.');
    if(typeof raw.startId!=='string'||!input.nodes.some(node=>node.id===raw.startId))
      return {ok:false,message:'Choose an existing start node.',field:'startId'};
    return {ok:true,value:{type:raw.type,startId:raw.startId}};
  },
  createInitialSnapshot(raw) {
    const input=graphEngine.validateInput(raw);
    if(!input.ok) throw new Error(input.message);
    return deepFreeze({id:'s0',ordinal:0,
      state:{...input.value,algorithm:null,startId:null,currentId:null,examinedEdgeId:null,queue:[],frames:[],
        discovered:[],processed:[],predecessors:{},depthById:{},discoveryOrder:[],backtracking:[]},
      event:{type:'initial',affectedIds:[],operands:[],codeLineId:null,explanationKey:'graph.resting'},
      variables:{algorithm:null,startId:null,currentId:null,neighborId:null,edgeId:null,frameIndex:null,alreadyDiscovered:null},
      counters:{discoveries:0,edgeExaminations:0,frontierAdds:0,frontierRemovals:0},invariants:invariants()});
  },
  createTrace(rawInput,rawCommand) {
    const input=graphEngine.validateInput(rawInput);
    if(!input.ok) throw new Error(input.message);
    const command=graphEngine.validateCommand(rawCommand,input.value);
    if(!command.ok) throw new Error(command.message);
    return createGraphTrace(input.value,command.value);
  },
  inspect(snapshot,id) {
    const state=snapshot.state;
    const common=[{label:'Current node',value:state.currentId??'Absent'},{label:'Examined edge',value:state.examinedEdgeId??'Absent'}];
    if(state.nodes.some(node=>node.id===id)) {
      const frontier=state.algorithm==='bfs'?state.queue:state.frames.map(frame=>frame.nodeId);
      const position=frontier.indexOf(id),discovery=state.discoveryOrder.indexOf(id),frame=state.frames.find(f=>f.nodeId===id);
      return {id,label:`Node ${id}`,fields:[
        {label:'State',value:nodeStatus(state,id)},
        {label:'Neighbors (creation order)',value:orderedNeighbors(state,id).map(n=>n.nodeId).join(', ')||'None'},
        {label:'Predecessor',value:state.predecessors[id]??'Absent'},
        {label:state.algorithm==='dfs'?'DFS tree depth (edges)':'Shortest distance (edges)',value:state.depthById[id]?.toString()??'Absent'},
        {label:'Frontier position',value:position<0?'Absent':`${position+1} (${state.algorithm==='bfs'?'front first':'bottom first'})`},
        {label:'Discovery position',value:discovery<0?'Absent':String(discovery+1)},
        {label:'DFS next neighbor',value:frame?`${frame.nextNeighborIndex} / ${orderedNeighbors(state,id).length}`:'Absent'},...common]};
    }
    const edge=state.edges.find(edge=>edge.id===id);
    return edge?{id,label:`Edge ${id}`,fields:[
      {label:'Endpoints',value:`${edge.a} ↔ ${edge.b}`},
      {label:'State',value:state.examinedEdgeId===id?'Examined now':'Present'},
      {label:`Node ${edge.a}`,value:nodeStatus(state,edge.a)},
      {label:`Node ${edge.b}`,value:nodeStatus(state,edge.b)},...common]}:null;
  },
};
function invariants() {
  return ['graph.input-valid','graph.unique-discovery','graph.frontier-discovered'].map(id=>({id,status:'holds' as const}));
}
export function createGraphPreset():GraphInput {
  return deepFreeze({nodes:Array.from('ABCDEF',(id,index)=>({id,creationOrder:index+1})),
    edges:[{id:'E1',a:'A',b:'B'},{id:'E2',a:'A',b:'C'},{id:'E3',a:'B',b:'D'},{id:'E4',a:'C',b:'D'},{id:'E5',a:'D',b:'E'}],
    nextNodeId:7,nextEdgeId:6});
}
export function orderedNeighbors(input:GraphInput,id:string):readonly {nodeId:string;edgeId:string}[] {
  return input.nodes.filter(node=>input.edges.some(edge=>(edge.a===id&&edge.b===node.id)||(edge.b===id&&edge.a===node.id)))
    .sort((a,b)=>a.creationOrder-b.creationOrder)
    .map(node=>({nodeId:node.id,edgeId:input.edges.find(edge=>(edge.a===id&&edge.b===node.id)||(edge.b===id&&edge.a===node.id))!.id}));
}
export function nodeStatus(state:GraphState,id:string):string {
  if(state.currentId===id) return 'Current';
  if(state.processed.includes(id)) return 'Processed';
  if(state.queue.includes(id)||state.frames.some(frame=>frame.nodeId===id)) return 'Frontier';
  return state.discovered.includes(id)?'Discovered':'Undiscovered';
}
export function editGraph(rawInput:GraphInput,raw:unknown):Validation<GraphInput> {
  const checked=graphEngine.validateInput(rawInput);
  if(!checked.ok) return checked;
  if(!object(raw)) return failure('Choose a valid graph edit.');
  const input=checked.value;
  let candidate:GraphInput;
  switch(raw.type) {
    case 'add-node':
      if(input.nodes.length>=20) return failure('Use at most 20 nodes and 40 edges.');
      if(input.nextNodeId>=Number.MAX_SAFE_INTEGER) return failure('The node ID counter is exhausted.');
      candidate={...input,nodes:[...input.nodes,{id:nodeId(input.nextNodeId),creationOrder:input.nextNodeId}],nextNodeId:input.nextNodeId+1};break;
    case 'remove-node':
      if(!input.nodes.some(node=>node.id===raw.id)) return failure('Choose an existing node.');
      candidate={...input,nodes:input.nodes.filter(node=>node.id!==raw.id),edges:input.edges.filter(edge=>edge.a!==raw.id&&edge.b!==raw.id)};break;
    case 'connect':
      if(typeof raw.a!=='string'||typeof raw.b!=='string'||raw.a===raw.b||!input.nodes.some(node=>node.id===raw.a)||!input.nodes.some(node=>node.id===raw.b))
        return failure('Connect two different existing nodes.');
      if(input.edges.some(edge=>pair(edge.a,edge.b)===pair(raw.a as string,raw.b as string))) return failure('These nodes are already connected.');
      if(input.edges.length>=40) return failure('Use at most 20 nodes and 40 edges.');
      if(input.nextEdgeId>=Number.MAX_SAFE_INTEGER) return failure('The edge ID counter is exhausted.');
      candidate={...input,edges:[...input.edges,{id:`E${input.nextEdgeId}`,a:raw.a,b:raw.b}],nextEdgeId:input.nextEdgeId+1};break;
    case 'disconnect':
      if(!input.edges.some(edge=>edge.id===raw.edgeId)) return failure('Choose an existing edge.');
      candidate={...input,edges:input.edges.filter(edge=>edge.id!==raw.edgeId)};break;
    default:return failure('Choose a valid graph edit.');
  }
  return graphEngine.validateInput(candidate);
}
function createGraphTrace(input:GraphInput,command:GraphCommand):readonly Snapshot<GraphState>[] {
  const queue:string[]=[],discovered:string[]=[],processed:string[]=[],discoveryOrder:string[]=[],backtracking:string[]=[];
  const frames:{nodeId:string;nextNeighborIndex:number}[]=[];
  const predecessors:Record<string,string|null>={},depthById:Record<string,number>={};
  let algorithm:GraphState['algorithm']=null;
  let startId:string|null=null,currentId:string|null=null,examinedEdgeId:string|null=null;
  const counters={discoveries:0,edgeExaminations:0,frontierAdds:0,frontierRemovals:0};
  const steps:Snapshot<GraphState>[]=[];
  const emit=(type:string,affectedIds:string[],operands:(string|number)[],details:Record<string,string|number|boolean|null>={})=>{
    const ordinal=steps.length;
    if(ordinal>=512) throw new Error('Graph trace exceeds 512 snapshots.');
    const candidate:Snapshot<GraphState>={id:`s${ordinal}`,ordinal,
      state:{...input,algorithm,startId,currentId,examinedEdgeId,queue,frames,discovered,processed,predecessors,depthById,discoveryOrder,backtracking},
      event:{type,affectedIds,operands,codeLineId:type==='initial'?null:`${command.type}.${type}`,explanationKey:`graph.${command.type}.${type}`},
      variables:{algorithm:command.type,startId:command.startId,currentId,edgeId:examinedEdgeId,neighborId:null,frameIndex:null,alreadyDiscovered:null,...details},
      counters,invariants:invariants()};
    steps.push(deepFreeze(structuredClone(candidate)));
  };
  function discover(id:string,parent:string|null) {
    discovered.push(id);discoveryOrder.push(id);predecessors[id]=parent;
    depthById[id]=parent===null?0:depthById[parent]+1;
    counters.discoveries++;
    emit('discover',parent===null?[id]:[parent,id],[id,parent??'start',depthById[id]]);
  }
  emit('initial',[],[]);
  algorithm=command.type;startId=command.startId;discover(startId,null);
  if(command.type==='bfs') {
    queue.push(startId);counters.frontierAdds++;emit('enqueue',[startId],[startId]);
    while(queue.length) {
      currentId=queue.shift()!;examinedEdgeId=null;
      counters.frontierRemovals++;emit('dequeue',[currentId],[currentId]);
      const source=currentId;
      for(const neighbor of orderedNeighbors(input,source)) {
        examinedEdgeId=neighbor.edgeId;counters.edgeExaminations++;
        const seen=discovered.includes(neighbor.nodeId);
        emit('examine',[source,neighbor.nodeId,neighbor.edgeId],[source,neighbor.nodeId,neighbor.edgeId,seen?1:0],{neighborId:neighbor.nodeId,alreadyDiscovered:seen});
        if(seen) continue;
        discover(neighbor.nodeId,source);
        queue.push(neighbor.nodeId);counters.frontierAdds++;emit('enqueue',[neighbor.nodeId],[neighbor.nodeId]);
      }
      processed.push(source);currentId=null;examinedEdgeId=null;emit('process',[source],[source]);
    }
  } else {
    frames.push({nodeId:startId,nextNeighborIndex:0});currentId=startId;
    counters.frontierAdds++;emit('push',[startId],[startId]);
    while(frames.length) {
      const frame=frames.at(-1)!,neighbors=orderedNeighbors(input,frame.nodeId);
      if(frame.nextNeighborIndex>=neighbors.length) {
        frames.pop();processed.push(frame.nodeId);backtracking.push(frame.nodeId);
        currentId=frames.at(-1)?.nodeId??null;examinedEdgeId=null;counters.frontierRemovals++;
        emit('return',currentId?[frame.nodeId,currentId]:[frame.nodeId],[frame.nodeId,currentId??'none']);continue;
      }
      const index=frame.nextNeighborIndex++,neighbor=neighbors[index];examinedEdgeId=neighbor.edgeId;counters.edgeExaminations++;
      const seen=discovered.includes(neighbor.nodeId);
      emit('examine',[frame.nodeId,neighbor.nodeId,neighbor.edgeId],[frame.nodeId,neighbor.nodeId,neighbor.edgeId,seen?1:0],{neighborId:neighbor.nodeId,frameIndex:index,alreadyDiscovered:seen});
      if(seen) continue;
      discover(neighbor.nodeId,frame.nodeId);
      frames.push({nodeId:neighbor.nodeId,nextNeighborIndex:0});currentId=neighbor.nodeId;counters.frontierAdds++;
      emit('push',[neighbor.nodeId],[neighbor.nodeId]);
    }
  }
  currentId=null;examinedEdgeId=null;emit('complete',discoveryOrder.slice(),[discoveryOrder.length,input.nodes.length-discoveryOrder.length]);
  return deepFreeze(steps);
}
