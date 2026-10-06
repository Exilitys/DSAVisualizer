import type { Snapshot } from '../../core/lesson.ts';
import type { HeapState } from './engine.ts';

export const pseudocode = [
  {id:'append',text:'Append the new item at the next open position'},
  {id:'compare',text:'Compare the inserted value with its parent'},
  {id:'swap',text:'If strictly smaller, swap and continue upward'},
  {id:'return',text:'Return the ordered heap'},
];
export function explainStep(snapshot: Snapshot<HeapState>): string {
  const operands = snapshot.event.operands;
  switch (snapshot.event.type) {
    case 'append': return `Append ${operands[0]} at index ${snapshot.variables.index}. The tree stays complete; now check the parent.`;
    case 'compare': return `Compare ${operands[0]} with parent value ${operands[1]}. Only a strictly smaller value moves upward.`;
    case 'swap': return `Move from index ${operands[0]} to ${operands[1]} because ${operands[2]} is smaller than ${operands[3]}. The item keeps its ID.`;
    case 'complete': return 'Insertion is complete; every parent is no greater than its children.';
    default: return 'Insert a value, then follow it from the next open position toward the root.';
  }
}
