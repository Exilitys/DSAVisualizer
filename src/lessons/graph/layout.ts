import type {GraphNode} from './engine.ts';
import type {Validation} from '../../core/lesson.ts';
export type GraphPosition=[number,number,0];
export type GraphPositions=Readonly<Record<string,GraphPosition>>;
const grid:GraphPosition[]=Array.from({length:20},(_,index)=>[(index%5-2)*2.5,3-Math.floor(index/5)*2,0]);
const preset:GraphPositions={A:[-5,1,0],B:[-2.5,3,0],C:[-2.5,-1,0],D:[0,1,0],E:[2.5,1,0],F:[5,-3,0]};
export function reconcileGraphPositions(nodes:readonly GraphNode[],previous:GraphPositions):GraphPositions {
  const next:Record<string,GraphPosition>={};
  const ordered=[...nodes].sort((a,b)=>a.creationOrder-b.creationOrder);
  for(const node of ordered) {
    const p=previous[node.id];
    if(p&&p[2]===0&&p.every(Number.isFinite)&&Math.abs(p[0])<=10&&Math.abs(p[1])<=10) next[node.id]=[p[0],p[1],0];
  }
  const free=(p:GraphPosition)=>Object.values(next).every(q=>q[0]!==p[0]||q[1]!==p[1]);
  for(const node of ordered) {
    if(next[node.id]) continue;
    const authored=preset[node.id];
    const p=authored&&free(authored)?authored:grid.find(free);
    if(!p) throw new Error('No graph layout slot is available.');
    next[node.id]=[p[0],p[1],0];
  }
  return next;
}
export function parseGraphPosition(x:string,y:string):Validation<GraphPosition> {
  const a=Number(x),b=Number(y);
  if(!x.trim()||!y.trim()||!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>10||Math.abs(b)>10||!Number.isInteger(a*2)||!Number.isInteger(b*2))
    return {ok:false,message:'Use X and Y from −10 to 10 in 0.5 steps.',field:'position'};
  return {ok:true,value:[a,b,0]};
}
