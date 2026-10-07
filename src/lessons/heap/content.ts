import type { Snapshot } from '../../core/lesson.ts';
import type { HeapState } from './engine.ts';

export const pseudocode = [
  {id:'append',text:'Append the new item at the next open position'},
  {id:'compare',text:'Compare the inserted value with its parent'},
  {id:'swap',text:'If strictly smaller, swap and continue upward'},
  {id:'return',text:'Return the ordered heap'},
];
const extractionCode=[
  {id:'replace',text:'Remove the root and move the last item to its position'},
  {id:'choose-child',text:'Choose the smaller child; prefer the left on equality'},
  {id:'compare-child',text:'Compare the replacement with the chosen child'},
  {id:'swap',text:'If the child is strictly smaller, swap and continue down'},
  {id:'return',text:'Return the removed minimum and the ordered heap'},
];
export function getPseudocode(snapshot: Snapshot<HeapState>) {
  return snapshot.event.explanationKey.startsWith('heap.extract.') ? extractionCode : pseudocode;
}
export function explainStep(snapshot: Snapshot<HeapState>): string {
  const operands = snapshot.event.operands;
  if(snapshot.event.explanationKey.startsWith('heap.extract.')) {
    switch(snapshot.event.explanationKey) {
      case 'heap.extract.initial': return 'Extract the root minimum, then follow the replacement as it moves downward.';
      case 'heap.extract.replace': {
        const result=snapshot.state.result!;
        const root=snapshot.state.items[0];
        return root
          ? `Remove ${result.id} (${result.value}). Move ${root.id} (${root.value}) from the last slot to the root in one step.`
          : `Remove ${result.id} (${result.value}). The remaining heap is empty.`;
      }
      case 'heap.extract.choose-child': return `Compare child values ${operands[0]} and ${operands[1]}. Choose ${snapshot.variables.chosenChildId}, the smaller child; prefer the left when equal.`;
      case 'heap.extract.compare-child': return `Compare replacement ${operands[0]} with chosen child ${operands[1]}. Move down only when the child is strictly smaller.`;
      case 'heap.extract.swap': return `Move ${operands[2]} down from index ${operands[0]} to ${operands[1]} because child ${operands[3]} is smaller. Both items keep their IDs.`;
      case 'heap.extract.empty': return 'No minimum: the heap is empty. No item is removed.';
      case 'heap.extract.complete': return `Extraction is complete. ${snapshot.state.result!.id} (${snapshot.state.result!.value}) is the removed minimum; the remaining heap is ordered.`;
    }
  }
  switch (snapshot.event.type) {
    case 'append': return `Append ${operands[0]} at index ${snapshot.variables.index}. The tree stays complete; now check the parent.`;
    case 'compare': return `Compare ${operands[0]} with parent value ${operands[1]}. Only a strictly smaller value moves upward.`;
    case 'swap': return `Move from index ${operands[0]} to ${operands[1]} because ${operands[2]} is smaller than ${operands[3]}. The item keeps its ID.`;
    case 'complete': return 'Insertion is complete; every parent is no greater than its children.';
    default: return 'Insert a value, then follow it from the next open position toward the root.';
  }
}

export function heapTreePosition(index: number): [number,number,number] {
  const depth = Math.floor(Math.log2(index+1));
  const width = 2**depth;
  const slot = index-(width-1);
  return [((slot+0.5)/width-0.5)*12,3-depth*1.4,0];
}
