'use client';

import {useEffect,useId,useRef,useState} from 'react';
import type {LessonPlayer} from './useLessonPlayer.ts';
import type {TutorPreview} from '../core/tutor.ts';

const object=(raw:unknown):raw is Record<string,unknown>=>raw!==null&&typeof raw==='object'&&!Array.isArray(raw);
export function describeTutorCommand(command:unknown):string {
  if(command===null)return 'Resting scene';
  if(!object(command))return 'Current operation';
  if(command.type==='insert')return `Insert ${String(command.value)}`;
  if(command.type==='extract')return 'Extract minimum';
  return `${String(command.type).toUpperCase()} from ${String(command.startId)}`;
}
export function TutorPreviewDetails({preview}:{preview:TutorPreview}) {
  const input=object(preview.input)?preview.input:{};
  const items=Array.isArray(input.items)?input.items.filter(object):null;
  const nodes=Array.isArray(input.nodes)?input.nodes.filter(object):null;
  const edges=Array.isArray(input.edges)?input.edges.filter(object):null;
  return <div className="tutor-preview">
    <p><strong>{preview.title}</strong></p>
    <p>{preview.kind==='example'?(items?'Replace the heap with a curated example. Selection clears and the heap is rebuilt.':'Replace the graph with a curated example. Selection clears and graph layout resets.'):'Use the current scene. Selection and graph layout stay when still applicable.'}</p>
    <p><strong>{describeTutorCommand(preview.command)}</strong> · {preview.stepCount} steps including the initial scene.</p>
    {items&&<p>Heap input: {items.length?items.map(item=>`${String(item.id)}: ${String(item.value)}`).join(', '):'empty'}.</p>}
    {nodes&&<><p>Nodes: {nodes.map(node=>String(node.id)).join(', ')||'none'}.</p><p>Edges: {edges?.map(edge=>`${String(edge.a)}–${String(edge.b)}`).join(', ')||'none'}.</p></>}
    <p>Starts paused at step {preview.first.ordinal}: {preview.first.event.type}. Your camera and saved practice stay.</p>
  </div>;
}

export function TutorPanel<I,C,S>({lesson,guidance,contextCaption,reviewProposal}:{lesson:LessonPlayer<I,C,S>;guidance:string;contextCaption:string;reviewProposal?:(index:number)=>void}) {
  const [question,setQuestion]=useState(''),[mode,setMode]=useState<'explain'|'hint'>('explain');
  const fieldId=useId(),dialog=useRef<HTMLDialogElement>(null);
  const exchange=lesson.tutor,pending=exchange.status==='pending';
  const activity=lesson.session.activity,locked=activity?.kind==='challenge'&&activity.status==='pending';
  const close=()=>{dialog.current?.close();lesson.clearTutorPreview();};
  useEffect(()=>{if(!exchange.preview&&dialog.current?.open)dialog.current.close();},[exchange.preview]);
  const review=(index:number)=>{
    if(reviewProposal){reviewProposal(index);return;}
    if(lesson.previewTutor(index).ok)dialog.current?.showModal();
  };
  return <section className="panel tutor" aria-label="Contextual tutor" data-tutor-status={exchange.status}>
    <div className="section-heading"><h2>Ask about this step</h2><span className="eyebrow">{locked?'Authored guidance':'Tutor'}</span></div>
    <p className="tutor-context">{contextCaption} · Step {lesson.player.ordinal}{lesson.player.selectedId?` · Selected ${lesson.player.selectedId}`:''}</p>
    {locked&&<p className="tutor-notice">AI opens after Submit or Reveal.</p>}
    <p className="muted tutor-guidance">{guidance}</p>
    <div className="learning-actions">
      <button type="button" disabled={locked||pending} onClick={()=>void lesson.askTutor('Explain this visible state.','explain')}>Explain this</button>
      <button type="button" disabled={locked||pending} onClick={()=>void lesson.askTutor('Why did this step happen?','explain')}>Why this step</button>
    </div>
    <form onSubmit={event=>{event.preventDefault();if(!locked&&!pending)void lesson.askTutor(question,mode);}}>
      <label htmlFor={fieldId}>Your question</label>
      <textarea id={fieldId} rows={3} maxLength={2000} value={question} disabled={locked||pending}
        placeholder="What would help you understand this state?" onChange={event=>setQuestion(event.target.value)}/>
      <div className="tutor-form-actions"><label htmlFor={`${fieldId}-intent`}>Help style<select id={`${fieldId}-intent`} value={mode} disabled={locked||pending}
        onChange={event=>setMode(event.target.value as 'explain'|'hint')}><option value="explain">Explain</option><option value="hint">Hint</option></select></label>
        <button className="primary" type="submit" disabled={locked||pending||!question.trim()}>Ask</button></div>
    </form>
    {lesson.session.mode==='explore'&&<button type="button" className="tutor-example" disabled={pending} onClick={()=>void lesson.askTutor('Choose one listed curated example ID and include it in proposedCommands as an example proposal for me to review. Explain what it teaches.','explain')}>Try an example</button>}
    <div role="status" aria-live="polite" className="tutor-status">
      {pending&&<p>Thinking about this step… You can cancel or keep exploring.</p>}
      {exchange.status==='cancelled'&&!locked&&<p className="muted">The tutor exchange was cleared. Ask again about the current step.</p>}
      {exchange.error&&<p className="error">{exchange.error.message}{exchange.error.retryAfter?` Wait ${exchange.error.retryAfter} seconds before retrying.`:''}</p>}
    </div>
    {pending&&<button type="button" onClick={lesson.cancelTutor}>Cancel request</button>}
    {exchange.status==='failed'&&!locked&&<button type="button" onClick={()=>void lesson.retryTutor()}>Retry</button>}
    {exchange.reply&&<div className="tutor-reply"><p>{exchange.reply.explanation}</p>
      {exchange.reply.referencedIds.length>0&&<div className="learning-actions" aria-label="Tutor references">{exchange.reply.referencedIds.map(id=>
        <button key={id} type="button" onClick={()=>lesson.select(id)}>Inspect {id}</button>)}</div>}
      {exchange.reply.followUp&&<p className="muted">{exchange.reply.followUp}</p>}
      {exchange.reply.proposedCommands.length>0&&<div className="learning-actions" aria-label="Tutor proposals">{exchange.reply.proposedCommands.map((proposal,index)=>
        <button key={index} type="button" onClick={()=>review(index)}>Review {proposal.kind==='example'?'example':'command'} {index+1}</button>)}</div>}
    </div>}
    {!reviewProposal&&<dialog ref={dialog} aria-labelledby={`${fieldId}-preview-title`} onCancel={event=>{event.preventDefault();close();}}>
      <h2 id={`${fieldId}-preview-title`}>Review tutor proposal</h2>
      {exchange.preview&&<TutorPreviewDetails preview={exchange.preview}/>}
      <div className="learning-actions"><button autoFocus type="button" onClick={close}>Cancel</button>
        <button type="button" className="primary" disabled={!exchange.preview} onClick={()=>{lesson.applyTutorPreview();dialog.current?.close();}}>Apply</button></div>
    </dialog>}
  </section>;
}
