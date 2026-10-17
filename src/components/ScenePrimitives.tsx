'use client';

import {Component,useEffect,useRef} from 'react';
import type {ReactNode,RefObject} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {Bounds,Html,OrbitControls,useBounds} from '@react-three/drei';
import type {Mesh} from 'three';

export type SceneNodeProps={
  id:string;position:[number,number,number];label:ReactNode;shape:'sphere'|'box';
  selected:boolean;active:boolean;color?:string;labelClassName?:string;
  select(id:string):void;register?:(mesh:Mesh|null)=>void;labelPortal:RefObject<HTMLDivElement>;
};
export function SceneNode(props:SceneNodeProps) {
  return <mesh ref={props.register} position={props.position}
    onClick={event=>{event.stopPropagation();props.select(props.id);}}>
    {props.shape==='sphere'?<sphereGeometry args={[0.45,24,16]}/>:<boxGeometry args={[0.7,0.7,0.7]}/>}
    <meshStandardMaterial color={props.selected?'#a5b4fc':props.active?'#f5d49a':props.color??'#dbe5f5'} roughness={0.38} metalness={0.08}/>
    <Html center portal={props.labelPortal} style={{pointerEvents:'none'}}>
      <span aria-hidden="true" className={`node-label ${props.selected?'is-selected':''} ${props.labelClassName??''}`}>{props.label}</span>
    </Html>
  </mesh>;
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

export type SceneFrameProps={
  children:ReactNode;meshRefs:RefObject<Map<string,Mesh>>;labelPortal:RefObject<HTMLDivElement>;
  selectedId:string|undefined;fitRequest:number;focusRequest:number;
  reducedMotion:boolean;floorY:number;unavailable():void;
};
export function SceneFrame(props:SceneFrameProps) {
  return <SceneBoundary unavailable={props.unavailable}><div className="renderer">
    <Canvas dpr={[1,1.5]} frameloop="demand" resize={{scroll:false}} camera={{position:[0,2,17],fov:42}}
      fallback={<p aria-hidden="true" className="scene-notice">{fallbackText}</p>}>
      <color attach="background" args={['#edf0f8']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4,8,9]} intensity={2.6} />
      <directionalLight position={[-5,1,4]} intensity={0.8} color="#bcc6fa" />
      <Bounds fit clip observe margin={1.3} maxDuration={props.reducedMotion ? 0 : 0.3}>
        {props.children}
        <CameraActions fitRequest={props.fitRequest} focusRequest={props.focusRequest} selectedId={props.selectedId} meshRefs={props.meshRefs} />
      </Bounds>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,props.floorY,0]}>
        <planeGeometry args={[24,16]} /><meshStandardMaterial color="#e0e5f2" roughness={1} />
      </mesh>
      <OrbitControls makeDefault enableDamping={!props.reducedMotion} minDistance={3} maxDistance={35} />
      <ContextLoss unavailable={props.unavailable} />
    </Canvas><div className="label-portal" ref={props.labelPortal} aria-hidden="true" />
    </div>
  </SceneBoundary>;
}
