import { deepFreeze } from '../../core/lesson.ts';
import type { LessonEngine, Snapshot, Validation } from '../../core/lesson.ts';

export type HeapItem = { id: string; value: number };
export type HeapInput = { items: readonly HeapItem[]; nextId: number };
export type HeapState = HeapInput;
export type HeapCommand = { type: 'insert'; value: number };
export function createPreset(): HeapInput {
  return {items:[3,7,5,12,9,8,6].map((value,i)=>({id:`H${i+1}`,value})),nextId:8};
}

const validValue = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 99;
const object = (raw: unknown): raw is Record<string,unknown> =>
  raw !== null && typeof raw === 'object' && !Array.isArray(raw);
const ordered = (items: readonly HeapItem[]) => items.every((item,i) =>
  i === 0 || items[Math.floor((i-1)/2)].value <= item.value);

function validateInput(raw: unknown): Validation<HeapInput> {
  if (!object(raw) || !Array.isArray(raw.items) || raw.items.length > 15)
    return {ok:false,message:'Use a heap with at most 15 items.',field:'items'};
  const items: HeapItem[] = [];
  const ids = new Set<string>();
  let largestId = 0;
  for (const item of raw.items) {
    if (!object(item) || typeof item.id !== 'string' || !/^H[1-9]\d*$/.test(item.id) ||
        !Number.isSafeInteger(Number(item.id.slice(1))) || ids.has(item.id) || !validValue(item.value))
      return {ok:false,message:'Each item needs a unique ID and an integer value from 0 to 99.',field:'items'};
    ids.add(item.id);
    largestId = Math.max(largestId,Number(item.id.slice(1)));
    items.push({id:item.id,value:item.value});
  }
  if (typeof raw.nextId !== 'number' || !Number.isSafeInteger(raw.nextId) || raw.nextId <= largestId)
    return {ok:false,message:'The next item ID must follow all existing IDs.',field:'nextId'};
  if (!ordered(items)) return {ok:false,message:'The starting heap must have each parent at most its children.',field:'items'};
  return {ok:true,value:{items,nextId:raw.nextId}};
}

function validateCommand(raw: unknown, input: HeapInput): Validation<HeapCommand> {
  if (!object(raw) || raw.type !== 'insert' || !validValue(raw.value))
    return {ok:false,message:'Enter a whole number from 0 to 99.',field:'value'};
  if (input.items.length >= 15) return {ok:false,message:'This heap is full (15 items). Restart to try a different value.',field:'value'};
  if (input.nextId >= Number.MAX_SAFE_INTEGER) return {ok:false,message:'The item ID counter is exhausted.',field:'value'};
  return {ok:true,value:{type:'insert',value:raw.value}};
}

function createInitialSnapshot(raw: HeapInput): Snapshot<HeapState> {
  const input = validateInput(raw);
  if (!input.ok) throw new Error(input.message);
  return deepFreeze({
    id:'s0',ordinal:0,state:input.value,
    event:{type:'initial',affectedIds:[],operands:[],codeLineId:null,explanationKey:'heap.insert.initial'},
    variables:{index:null,parentIndex:null,insertedId:null},
    counters:{comparisons:0,swaps:0},
    invariants:[{id:'heap-shape',status:'holds'},{id:'heap-order',status:'holds'}],
  });
}

function createTrace(rawInput: HeapInput, rawCommand: HeapCommand): readonly Snapshot<HeapState>[] {
  const validInput = validateInput(rawInput);
  if (!validInput.ok) throw new Error(validInput.message);
  const input = validInput.value;
  const validCommand = validateCommand(rawCommand,input);
  if (!validCommand.ok) throw new Error(validCommand.message);
  const command = validCommand.value;
  const items = input.items.map(item => ({...item}));
  const nextId = input.nextId + 1;
  const insertedId = `H${input.nextId}`;
  let index = items.length;
  let comparisons = 0;
  let swaps = 0;
  const steps = [createInitialSnapshot(input)];
  const emit = (type: string, affectedIds: string[], operands: (string|number)[]) => {
    const ordinal = steps.length;
    steps.push(deepFreeze<Snapshot<HeapState>>({
      id:`s${ordinal}`,ordinal,
      state:{items:items.map(item=>({...item})),nextId},
      event:{type,affectedIds,operands,codeLineId:type === 'complete' ? 'return' : type,explanationKey:`heap.insert.${type}`},
      variables:{insertedId,index,parentIndex:index > 0 ? Math.floor((index-1)/2) : null},
      counters:{comparisons,swaps},
      invariants:[{id:'heap-shape',status:'holds'},{id:'heap-order',status:ordered(items) ? 'holds' : 'repairing'}],
    }));
  };
  items.push({id:insertedId,value:command.value});
  emit('append',[insertedId],[command.value]);
  while (index > 0) {
    const parentIndex = Math.floor((index-1)/2);
    const child = items[index];
    const parent = items[parentIndex];
    comparisons += 1;
    emit('compare',[child.id,parent.id],[child.value,parent.value]);
    if (child.value >= parent.value) break;
    const before = index;
    [items[index],items[parentIndex]] = [items[parentIndex],items[index]];
    swaps += 1;
    index = parentIndex;
    emit('swap',[child.id,parent.id],[before,index,child.value,parent.value]);
  }
  emit('complete',[insertedId],[]);
  return deepFreeze(steps);
}

export const heapEngine: LessonEngine<HeapInput,HeapCommand,HeapState> = {
  id:'heap',version:'1.0.0',commandStart:'run-boundary',
  validateInput,validateCommand,createInitialSnapshot,createTrace,
  inspect(snapshot,id) {
    const index = snapshot.state.items.findIndex(item => item.id === id);
    if (index < 0) return null;
    const item = snapshot.state.items[index];
    const relation = (i: number) => {
      const other = snapshot.state.items[i];
      return other ? `${other.id} · ${other.value}` : 'Absent';
    };
    return {id,label:`Item ${id}`,fields:[
      {label:'Value',value:String(item.value)},
      {label:'Index',value:String(index)},
      {label:'Parent',value:index > 0 ? relation(Math.floor((index-1)/2)) : 'Absent'},
      {label:'Left child',value:relation(2*index+1)},
      {label:'Right child',value:relation(2*index+2)},
      {label:'Heap order',value:snapshot.invariants.find(x=>x.id === 'heap-order')?.status ?? 'holds'},
    ]};
  },
};
