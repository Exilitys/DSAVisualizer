'use client';

import { Component, useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Bounds, Html, Line, OrbitControls, useBounds } from '@react-three/drei';
import type { Mesh } from 'three';
import type { SceneAdapterProps } from '../../core/lesson.ts';
import type { HeapItem, HeapState } from './engine.ts';
import { heapTreePosition } from './content.ts';

type ValueNodeProps = {
  item:Readonly<HeapItem>; position:[number,number,number]; selected:boolean; active:boolean;
  select(id:string):void; register?:(mesh:Mesh|null)=>void; index?:number; labelPortal:RefObject<HTMLDivElement>;
};
function ValueNode({item,position,selected,active,select,register,index,labelPortal}:ValueNodeProps) {
  return <mesh ref={register} position={position} onClick={event=>{event.stopPropagation();select(item.id);}}>
    {index===undefined ? <sphereGeometry args={[0.45,24,16]} /> : <boxGeometry args={[0.7,0.7,0.7]} />}
    <meshStandardMaterial color={selected ? '#a5b4fc' : active ? '#f5d49a' : '#dbe5f5'} roughness={0.38} metalness={0.08} />
    <Html center portal={labelPortal} style={{pointerEvents:'none'}}>
      <span aria-hidden="true" className={`node-label ${selected ? 'is-selected' : ''} ${index!==undefined ? 'array-label' : ''}`}>
        <span>{item.id}</span><strong>{item.value}</strong>{index!==undefined && <span>[{index}]</span>}
      </span>
    </Html>
  </mesh>;
}

function HeapStructures({snapshot,selectedIds,select,meshRefs,labelPortal}:SceneAdapterProps<HeapState> & {meshRefs:RefObject<Map<string,Mesh>>;labelPortal:RefObject<HTMLDivElement>}) {
  const items = snapshot.state.items;
  return <group>
    {items.slice(1).map((item,offset)=>{
      const index = offset+1;
      return <Line key={`edge:${item.id}`} points={[heapTreePosition(Math.floor((index-1)/2)),heapTreePosition(index)]} color="#8a97b1" lineWidth={1.5} />;
    })}
    {items.map((item,index)=><ValueNode key={`tree:${item.id}`} item={item} labelPortal={labelPortal} position={heapTreePosition(index)}
      selected={selectedIds.includes(item.id)} active={snapshot.event.affectedIds.includes(item.id)} select={select}
      register={mesh=>{if(mesh) meshRefs.current.set(item.id,mesh); else meshRefs.current.delete(item.id);}} />)}
    {items.map((item,index)=><ValueNode key={`array:${item.id}`} item={item} index={index} labelPortal={labelPortal}
      position={[(index-(items.length-1)/2)*0.85,-3,1]}
      selected={selectedIds.includes(item.id)} active={snapshot.event.affectedIds.includes(item.id)} select={select} />)}
  </group>;
}

function CameraActions({fitRequest,focusRequest,selectedId,meshRefs}:{
  fitRequest:number; focusRequest:number; selectedId:string|undefined; meshRefs:RefObject<Map<string,Mesh>>;
}) {
  const bounds = useBounds();
  const controls = useThree(state=>state.controls);
  const lastFit = useRef(0);
  const lastFocus = useRef(0);
  useEffect(()=>{
    if (fitRequest===lastFit.current) return;
    lastFit.current=fitRequest;
    if (controls && 'reset' in controls && typeof controls.reset==='function') controls.reset();
    bounds.refresh().clip().fit();
  },[fitRequest,bounds,controls]);
  useEffect(()=>{
    if (focusRequest===lastFocus.current) return;
    lastFocus.current=focusRequest;
    const mesh = selectedId ? meshRefs.current.get(selectedId) : undefined;
    if (mesh) bounds.refresh(mesh).clip().fit();
  },[focusRequest,selectedId,bounds,meshRefs]);
  return null;
}

function ContextLoss({unavailable}:{unavailable():void}) {
  const gl = useThree(state=>state.gl);
  useEffect(()=>{
    const canvas = gl.domElement;
    const lost = (event:Event) => {event.preventDefault();unavailable();};
    canvas.addEventListener('webglcontextlost',lost);
    return ()=>canvas.removeEventListener('webglcontextlost',lost);
  },[gl,unavailable]);
  return null;
}
const fallbackText = '3D is unavailable. Use the structure and step controls below.';
class SceneBoundary extends Component<{children:ReactNode;unavailable():void},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.unavailable(); }
  render() { return this.state.failed ? <p className="scene-notice">{fallbackText}</p> : this.props.children; }
}

export default function HeapScene(props:SceneAdapterProps<HeapState> & {fitRequest:number;focusRequest:number;unavailable():void}) {
  const meshRefs = useRef(new Map<string,Mesh>());
  // The DOM portal attaches before Canvas renders its asynchronous scene root.
  const labelPortal = useRef<HTMLDivElement>(null!);
  return <SceneBoundary unavailable={props.unavailable}><div className="renderer">
    <Canvas dpr={[1,1.5]} frameloop="demand" resize={{scroll:false}} camera={{position:[0,2,17],fov:42}}
      fallback={<p aria-hidden="true" className="scene-notice">{fallbackText}</p>}>
      <color attach="background" args={['#edf0f8']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4,8,9]} intensity={2.6} />
      <directionalLight position={[-5,1,4]} intensity={0.8} color="#bcc6fa" />
      <Bounds fit clip observe margin={1.3} maxDuration={props.reducedMotion ? 0 : 0.3}>
        <HeapStructures {...props} meshRefs={meshRefs} labelPortal={labelPortal} />
        <CameraActions fitRequest={props.fitRequest} focusRequest={props.focusRequest} selectedId={props.selectedIds[0]} meshRefs={meshRefs} />
      </Bounds>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-3.65,0]}>
        <planeGeometry args={[24,16]} /><meshStandardMaterial color="#e0e5f2" roughness={1} />
      </mesh>
      <OrbitControls makeDefault enableDamping={!props.reducedMotion} minDistance={3} maxDistance={35} />
      <ContextLoss unavailable={props.unavailable} />
    </Canvas><div className="label-portal" ref={labelPortal} aria-hidden="true" />
    </div>
  </SceneBoundary>;
}
