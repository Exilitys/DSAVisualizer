import type { LessonEngine, Snapshot } from './lesson.ts';

export type PlayerState<I,S> = {
  input: I;
  resting: Snapshot<S>;
  steps: readonly Snapshot<S>[] | null;
  ordinal: number;
  selectedId: string | null;
  error: string | null;
};
export function createPlayer<I,C,S>(engine: LessonEngine<I,C,S>, raw: unknown): PlayerState<I,S> {
  const input = engine.validateInput(raw);
  if (!input.ok) throw new Error(input.message);
  return {input:input.value,resting:engine.createInitialSnapshot(input.value),steps:null,ordinal:0,selectedId:null,error:null};
}
export function currentSnapshot<I,S>(state: PlayerState<I,S>): Snapshot<S> {
  return state.steps ? state.steps[state.ordinal] : state.resting;
}
export function seek<I,S>(state: PlayerState<I,S>, ordinal: number): PlayerState<I,S> {
  if (!state.steps || !Number.isInteger(ordinal) || ordinal < 0 || ordinal >= state.steps.length)
    return {...state,error:'Choose an existing step.'};
  return {...state,ordinal,error:null};
}
export function startCommand<I,C,S>(state: PlayerState<I,S>, engine: LessonEngine<I,C,S>, raw: unknown): PlayerState<I,S> {
  const boundary = !state.steps || state.ordinal === 0 || state.ordinal === state.steps.length-1;
  if (engine.commandStart === 'run-boundary' && !boundary)
    return {...state,error:'Finish or restart first.'};
  const input = engine.validateInput(currentSnapshot(state).state);
  if (!input.ok) return {...state,error:input.message};
  const command = engine.validateCommand(raw,input.value);
  if (!command.ok) return {...state,error:command.message};
  try {
    const steps = engine.createTrace(input.value,command.value);
    if (!steps.length || steps.length > 512) throw new Error('Invalid trace length.');
    const finalStep = steps[steps.length-1];
    if (steps[0].event.type!=='initial' || steps.some((step,index)=>step.ordinal!==index) ||
        finalStep.event.type!=='complete' || finalStep.invariants.some(invariant=>invariant.status!=='holds'))
      throw new Error('Invalid trace boundaries.');
    const ordinal = Math.min(1,steps.length-1);
    const selectedId = state.selectedId && engine.inspect(steps[ordinal],state.selectedId) ? state.selectedId : null;
    return {...state,input:input.value,resting:steps[0],steps,ordinal,selectedId,error:null};
  } catch {
    return {...state,error:'The operation could not start. Your scene is preserved.'};
  }
}
export function selectEntity<I,C,S>(state: PlayerState<I,S>, engine: LessonEngine<I,C,S>, id: string|null): PlayerState<I,S> {
  return {...state,selectedId:id && engine.inspect(currentSnapshot(state),id) ? id : null};
}
