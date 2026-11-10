'use client';

import {useRef} from 'react';
import type {RefObject} from 'react';
import {Line} from '@react-three/drei';
import type {Mesh} from 'three';
import type {SceneAdapterProps} from '../../core/lesson.ts';
import type {HeapState} from './engine.ts';
import {heapTreePosition} from './content.ts';
import {SceneFrame,SceneNode} from '../../components/ScenePrimitives';

function HeapStructures({snapshot,selectedIds,select,meshRefs,labelPortal}:SceneAdapterProps<HeapState> & {meshRefs:RefObject<Map<string,Mesh>>;labelPortal:RefObject<HTMLDivElement>}) {
  const items = snapshot.state.items;
  return <group>
    {items.slice(1).map((item,offset)=>{
      const index = offset+1;
      return <Line key={`edge:${item.id}`} points={[heapTreePosition(Math.floor((index-1)/2)),heapTreePosition(index)]} color="#8a97b1" lineWidth={1.5} />;
    })}
    {items.map((item,index)=><SceneNode key={`tree:${item.id}`} id={item.id} shape="sphere" label={<><span>{item.id}</span><strong>{item.value}</strong></>} labelPortal={labelPortal} position={heapTreePosition(index)}
      selected={selectedIds.includes(item.id)} active={snapshot.event.affectedIds.includes(item.id)} select={select}
      register={mesh=>{if(mesh) meshRefs.current.set(item.id,mesh); else meshRefs.current.delete(item.id);}} />)}
    {items.map((item,index)=><SceneNode key={`array:${item.id}`} id={item.id} shape="box" labelClassName="array-label" label={<><span>{item.id}</span><strong>{item.value}</strong><span>[{index}]</span></>} labelPortal={labelPortal}
      position={[(index-(items.length-1)/2)*0.85,-3,1]}
      selected={selectedIds.includes(item.id)} active={snapshot.event.affectedIds.includes(item.id)} select={select} />)}
  </group>;
}

export default function HeapScene(props:SceneAdapterProps<HeapState>&{fitRequest:number;focusRequest:number;unavailable():void}) {
  const meshRefs=useRef(new Map<string,Mesh>());
  // The DOM portal attaches before Canvas renders its asynchronous scene root.
  const labelPortal=useRef<HTMLDivElement>(null!);
  return <SceneFrame {...props} selectedId={props.selectedIds[0]} meshRefs={meshRefs} labelPortal={labelPortal} floorY={-3.65}>
    <HeapStructures {...props} meshRefs={meshRefs} labelPortal={labelPortal}/>
  </SceneFrame>;
}
