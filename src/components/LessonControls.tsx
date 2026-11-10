'use client';

import type {Inspection} from '../core/lesson.ts';
import type {PlaybackSpeed,PlaybackStatus} from './playback.ts';

export function PlaybackControls({ordinal,lastOrdinal,hasRun,go,playback,play,pause,setSpeed}: {
  ordinal:number;lastOrdinal:number;hasRun:boolean;go(ordinal:number):void;
  playback:PlaybackStatus;play():void;pause():void;setSpeed(speed:PlaybackSpeed):void;
}) {
  return <div className="playback">
    <div className="playback-buttons">
      <button disabled={!hasRun || ordinal===0} onClick={()=>go(ordinal-1)}>← Previous</button>
      <button className="primary" disabled={!hasRun || ordinal===lastOrdinal} onClick={()=>go(ordinal+1)}>Next →</button>
      <button disabled={!hasRun || (!playback.playing && ordinal===lastOrdinal)}
        onClick={playback.playing ? pause : play}>{playback.playing ? 'Pause' : 'Play'}</button>
      <button disabled={!hasRun} onClick={()=>go(0)}>Restart</button>
      <div className="speed-control"><label htmlFor="playback-speed">Speed</label>
        <select id="playback-speed" value={playback.speed}
          onChange={event=>setSpeed(Number(event.target.value) as PlaybackSpeed)}>
          <option value={.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option>
        </select>
      </div>
    </div>
    <div className="timeline">
      <label htmlFor="step-range">Step <strong>{ordinal} / {lastOrdinal}</strong></label>
      <input id="step-range" type="range" min={0} max={lastOrdinal} disabled={!hasRun} value={ordinal}
        aria-valuetext={`Step ${ordinal} of ${lastOrdinal}`} onChange={event=>go(Number(event.target.value))} />
    </div>
  </div>;
}

export function InspectionPanel({inspection}: {inspection:Inspection|null}) {
  return <section className="panel inspection" aria-label="Item inspection">
    <p className="eyebrow">Follow an identity</p>
    <h2>{inspection?.label ?? 'Inspect an item'}</h2>
    {inspection ? <dl>{inspection.fields.map(field=><div key={field.label}>
      <dt>{field.label}</dt><dd>{field.value}</dd>
    </div>)}</dl> : <p className="muted">Select an item to inspect its state and relationships at this step.</p>}
  </section>;
}
