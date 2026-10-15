'use client';

import {useRef} from 'react';
import {Line} from '@react-three/drei';
import type {Mesh} from 'three';
import type {SceneAdapterProps} from '../../core/lesson.ts';
import type {GraphState} from './engine.ts';
import {nodeStatus} from './engine.ts';
import type {GraphPositions} from './layout.ts';
import {SceneFrame,SceneNode} from '../../components/ScenePrimitives';

const statusColors:Record<string,string>={Undiscovered:'#dbe5f5',Discovered:'#d1d5f9',Frontier:'#b9c8fa',Processed:'#c7e2cf',Current:'#f5d49a'};
export default function GraphScene({snapshot,selectedIds,select,positions,...view}:SceneAdapterProps<GraphState>&{
  positions:GraphPositions;fitRequest:number;focusRequest:number;unavailable():void;
}) {
  const meshRefs=useRef(new Map<string,Mesh>());
  const labelPortal=useRef<HTMLDivElement>(null!);
  return <SceneFrame {...view} selectedId={selectedIds[0]} meshRefs={meshRefs} labelPortal={labelPortal} floorY={-10.65}>
    <group>
      {snapshot.state.edges.map(edge=><Line key={edge.id} points={[positions[edge.a],positions[edge.b]]}
        color={selectedIds.includes(edge.id)?'#4338ca':snapshot.state.examinedEdgeId===edge.id?'#a15b00':'#8a97b1'}
        lineWidth={selectedIds.includes(edge.id)||snapshot.state.examinedEdgeId===edge.id?3:1.5}
        onClick={event=>{event.stopPropagation();select(edge.id);}} />)}
      {snapshot.state.nodes.map(node=><SceneNode key={node.id} id={node.id} shape="sphere" position={positions[node.id]}
        selected={selectedIds.includes(node.id)} active={snapshot.state.currentId===node.id||snapshot.event.affectedIds.includes(node.id)}
        labelClassName="graph-label" label={<><strong>{node.id}</strong><span>{nodeStatus(snapshot.state,node.id)}</span></>}
        color={statusColors[nodeStatus(snapshot.state,node.id)]} select={select} labelPortal={labelPortal}
        register={mesh=>{if(mesh)meshRefs.current.set(node.id,mesh);else meshRefs.current.delete(node.id);}}/>)}
    </group>
  </SceneFrame>;
}
