import type {LessonLearning} from '../../core/learning.ts';
import {createPreset} from './engine.ts';
import type {HeapInput,HeapCommand} from './engine.ts';

const heap=(values:number[]):HeapInput=>({items:values.map((value,i)=>({id:`H${i+1}`,value})),nextId:values.length+1});
export const heapLearning:LessonLearning<HeapInput,HeapCommand>={
  moduleId:'heap',engineVersion:'1.1.0',
  objectives:[{id:'heap.index-mapping',title:'Track a swap between tree and array'},
    {id:'heap.sift-down',title:'Choose the smaller child'},
    {id:'heap.order-vs-sorted',title:'Distinguish heap order from sorting'}],
  guide:{id:'heap-guide',version:1,title:'Follow a value through a min heap',segments:[
    {id:'heap-insert',title:'Insert and follow an identity',input:createPreset(),command:{type:'insert',value:1},checkpoints:[
      {ordinal:0,type:'initial',explanationKey:'heap.insert.initial',text:'Insert 1. The next open tree position is also the next array index.'},
      {ordinal:1,type:'append',explanationKey:'heap.insert.append',text:'H8 is appended at index 7. Its parent is floor((7 − 1) / 2) = 3. The tree stays complete.'},
      {ordinal:3,type:'swap',explanationKey:'heap.insert.swap',text:'H8 moves to index 3 with its value. Select its tree node or array cell: the identity stays the same.'},
      {ordinal:8,type:'complete',explanationKey:'heap.insert.complete',text:'Every parent is no greater than its children. This is a valid heap, although the array is not fully sorted. Equal values never swap.'}]},
    {id:'heap-extract',title:'Remove the minimum and repair downward',input:createPreset(),command:{type:'extract'},checkpoints:[
      {ordinal:0,type:'initial',explanationKey:'heap.extract.initial',text:'This segment starts from the original preset again. Extract the root minimum, 3.'},
      {ordinal:1,type:'replace',explanationKey:'heap.extract.replace',text:'H1 is the removed result. H7 moves from the last array position to the root; neither item changes its ID.'},
      {ordinal:4,type:'swap',explanationKey:'heap.extract.swap',text:'The smaller child H3 moves upward. Sift down chooses the left child when child values tie.'},
      {ordinal:6,type:'complete',explanationKey:'heap.extract.complete',text:'The remaining heap is ordered. Select H1 in the result card, then rewind to find it in the original heap.'}]}]},
  challenges:[
    {id:'heap-swap',version:1,objectiveId:'heap.index-mapping',input:heap([4,9,7,15,12]),command:{type:'insert',value:3},
      checkpoint:{ordinal:2,type:'compare',explanationKey:'heap.insert.compare'},prompt:'Where does H6 move in the next swap?',
      options:[{id:'index-2',label:'Index 2, exchanging with H3'},{id:'index-1',label:'Index 1, exchanging with H2'},{id:'index-0',label:'Index 0, exchanging with H1'}],answerId:'index-2',feedback:'Index 5 has parent floor((5 − 1) / 2) = 2. H6 (3) swaps with H3 (7); both IDs travel with their values.'},
    {id:'heap-tie',version:1,objectiveId:'heap.sift-down',input:heap([2,6,6,10,9,8,11]),command:{type:'extract'},
      checkpoint:{ordinal:1,type:'replace',explanationKey:'heap.extract.replace'},prompt:'Which child is chosen next for the downward repair?',
      options:[{id:'left',label:'H2, the left child with value 6'},{id:'right',label:'H3, the right child with value 6'},{id:'replacement',label:'H7, the replacement with value 11'}],answerId:'left',feedback:'Both children have value 6. The documented tie rule chooses the left child H2. H7 is the replacement being repaired.'},
    {id:'heap-order',version:1,objectiveId:'heap.order-vs-sorted',input:heap([4,9,7,15,12]),command:{type:'insert',value:3},
      checkpoint:{ordinal:5,type:'swap',explanationKey:'heap.insert.swap'},prompt:'What does the next completion guarantee?',
      options:[{id:'heap',label:'Valid min heap [3, 9, 4, 15, 12, 7], without fully sorting it'},{id:'sorted',label:'Fully sorted array [3, 4, 7, 9, 12, 15]'},{id:'invalid',label:'An invalid heap because 9 precedes 4'}],answerId:'heap',feedback:'A heap orders parents against their children, not all array neighbors or siblings. Here every parent is no greater than its children even though 9 precedes 4.'}]};
