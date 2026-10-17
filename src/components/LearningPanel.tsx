'use client';

import {useEffect,useRef,useState} from 'react';
import type {ActivityRequest,Challenge,LessonLearning} from '../core/learning.ts';
import type {LessonPlayer} from './useLessonPlayer';

function Question<I,C,S>({lesson,question,retry}:{lesson:LessonPlayer<I,C,S>;question:Challenge<I,C>;retry():void}) {
  const a=lesson.session.activity;
  const [choice,setChoice]=useState('');
  const prompt=useRef<HTMLHeadingElement>(null),feedback=useRef<HTMLDivElement>(null);
  const status=a?.kind==='challenge'?a.status:null;
  useEffect(()=>{(status==='pending'?prompt.current:feedback.current)?.focus();},[status]);
  if(a?.kind!=='challenge')return null;
  const pending=a.status==='pending',atQuestion=lesson.player.ordinal===a.checkpoint;
  return <div className="learning-activity">
    <h3 ref={prompt} tabIndex={-1} id="question-prompt">{question.prompt}</h3>
    <form onSubmit={event=>{event.preventDefault();if(choice)lesson.submit(a.attemptId,choice);}}>
      <fieldset disabled={!pending} aria-labelledby="question-prompt"><legend>Choose one answer</legend>
        {question.options.map(option=><label className="answer-option" key={option.id}>
          <input type="radio" name="prediction" value={option.id} checked={(pending?choice:a.optionId)===option.id} onChange={()=>setChoice(option.id)}/>
          <span>{option.label}</span>
        </label>)}
      </fieldset>
      {pending&&<div className="learning-actions">
        <button className="primary" type="submit" disabled={!choice||!atQuestion}>Submit answer</button>
        <button type="button" onClick={()=>lesson.reveal(a.attemptId)}>Reveal without answering</button>
        {!atQuestion&&<button type="button" onClick={()=>lesson.go(a.checkpoint)}>Return to question</button>}
      </div>}
    </form>
    {pending?<p className="muted">Later steps are locked. Answer once or reveal without a grade. Rewind and inspect freely.</p>
      :<div ref={feedback} tabIndex={-1} className="learning-feedback" role="status" aria-live="polite">
        <strong>{a.status==='revealed'?'Revealed — no graded attempt.':a.outcome==='correct'?'Correct.':'Incorrect.'}</strong>
        <p>Answer: {question.options.find(o=>o.id===question.answerId)?.label}</p><p>{question.feedback}</p>
        <button onClick={retry}>Retry question</button><p className="muted">Retry creates a new attempt. Finish or Restart an unfinished heap first.</p>
      </div>}
  </div>;
}

export function LearningPanel<I,C,S>({lesson,content,begin,loadInput,resetData}:{
  lesson:LessonPlayer<I,C,S>;content:LessonLearning<I,C>;begin(request:ActivityRequest):void;loadInput():void;resetData():void;
}) {
  const {session,player,local}=lesson,activity=session.activity;
  const guide=activity?.kind==='guide'?content.guide.segments.find(s=>s.id===activity.id):null;
  const question=activity?.kind==='challenge'?content.challenges.find(q=>q.id===activity.id):null;
  const point=guide?.checkpoints.find(p=>p.ordinal===activity?.checkpoint);
  const prompt=useRef<HTMLHeadingElement>(null),reset=useRef<HTMLDialogElement>(null);
  const guideId=activity?.kind==='guide'?activity.id:null;
  useEffect(()=>{if(guideId)prompt.current?.focus();},[guideId,activity?.run]);
  const completed=local.guides.some(g=>g.moduleId===content.moduleId&&g.guideId===content.guide.id&&g.version===content.guide.version);
  const closeReset=()=>reset.current!.close();
  return <section className="panel learning" aria-label="Learning activities">
    <div className="section-heading"><h2>Choose how to learn</h2><div className="learning-actions" aria-label="Learning layers">
      {(['explore','explain','challenge'] as const).map(mode=><button key={mode} aria-pressed={session.mode===mode} onClick={()=>lesson.setMode(mode)}>{mode[0].toUpperCase()+mode.slice(1)}</button>)}
    </div></div>
    {session.mode==='explore'&&<p className="muted">Explore your own input, follow a guided lesson, or predict the next change.</p>}
    {session.mode==='explain'&&<>
      <p>{content.guide.title} <span className="muted">{completed?'Completed (current version)':'Two guided segments'}</span></p>
      <div className="learning-actions">{content.guide.segments.map(segment=><button key={segment.id} aria-pressed={guideId===segment.id}
        onClick={()=>begin({kind:'guide',id:segment.id})}>Start {segment.title}{session.guideProgress?.version===content.guide.version&&session.guideProgress.finishedSegments.includes(segment.id)?' · finished':''}</button>)}</div>
      {guide&&activity?.kind==='guide'&&<div className="learning-activity">
        <h3 ref={prompt} tabIndex={-1}>{guide.title}</h3>
        {activity.status==='finished'?<p role="status">{completed?'Guide completed. Both segments are recorded.':'Segment finished. Complete both segments to record this guide.'}</p>:<>
          <p>{player.ordinal===activity.checkpoint?point?.text:`Follow the steps to checkpoint ${activity.checkpoint}. Later steps unlock when you acknowledge it.`}</p>
          {player.ordinal===activity.checkpoint?<button className="primary" onClick={lesson.continueGuide}>{point===guide.checkpoints.at(-1)?'Finish segment':'Continue guide'}</button>
            :<button onClick={()=>lesson.go(activity.checkpoint)}>Return to checkpoint</button>}
        </>}
      </div>}
    </>}
    {session.mode==='challenge'&&<>
      <p className="muted">Predict one change, then inspect the unlocked trace.</p>
      <div className="challenge-cards">{content.challenges.map((q,i)=><button key={q.id} aria-pressed={question?.id===q.id} onClick={()=>begin({kind:'challenge',id:q.id})}>
        <span className="eyebrow">Prediction {i+1}</span>{content.objectives.find(o=>o.id===q.objectiveId)?.title}
      </button>)}</div>
      {question&&activity?.kind==='challenge'&&<Question key={activity.attemptId} lesson={lesson} question={question} retry={()=>begin({kind:'challenge',id:question.id})}/>}
    </>}
    <details className="recent-practice"><summary>Recent practice (latest 100 attempts)</summary>
      <p className="muted">Current content only. Stored on this browser; this is practice history, not mastery. Concurrent tabs may overwrite local history.</p>
      <ul>{content.challenges.map(q=>{
        const attempts=local.attempts.filter(a=>a.moduleId===content.moduleId&&a.challengeId===q.id&&a.version===q.version);
        return <li key={q.id}><strong>{content.objectives.find(o=>o.id===q.objectiveId)?.title}</strong><span>{attempts.filter(a=>a.outcome==='correct').length} correct · {attempts.filter(a=>a.outcome==='incorrect').length} incorrect · Latest: {attempts.at(-1)?.outcome??'no graded attempt'}</span></li>;
      })}</ul><p>Guide: {completed?'Completed (current version)':'Not completed (current version)'}</p>
    </details>
    <div className="learning-actions saved-data"><button disabled={!lesson.canSaveInput} onClick={lesson.saveInput}>Save current input</button>
      <button disabled={session.mode!=='explore'||!local.savedInput} onClick={loadInput}>Load saved input</button>
      <button onClick={()=>reset.current!.showModal()}>Reset saved data</button></div>
    <p className="muted">Save and load in Explore. One input per module; loading starts at rest. An unfinished heap must Finish or Restart first.</p>
    <p className="storage-notice muted" role="status" aria-live="polite">{local.notice}</p>
    <dialog ref={reset} aria-labelledby="reset-title" onCancel={event=>{event.preventDefault();closeReset();}}>
      <h2 id="reset-title">Reset saved data?</h2><p>Clear settings, practice history, guide completions and saved inputs for both modules. Return this lesson to its starting preset.</p>
      <div className="learning-actions"><button autoFocus onClick={closeReset}>Cancel</button><button className="primary" onClick={()=>{closeReset();resetData();}}>Confirm reset</button></div>
    </dialog>
  </section>;
}
