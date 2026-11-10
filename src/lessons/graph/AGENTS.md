# Graph module

The accepted [graph specification](../../../docs/specs/003-graph-traversal.md) owns behavior.
[engine.ts](engine.ts) validates input and edits, emits frozen BFS/DFS snapshots, and inspects stable IDs.
[content.ts](content.ts) explains only the selected snapshot.
[learning.ts](learning.ts) supplies authored guide and question data for the accepted [learning slice](../../../docs/specs/004-learning-challenges.md).
[layout.ts](layout.ts) and [GraphScene.tsx](GraphScene.tsx) own presentation; positions never enter engine input.
Reuse shared scene primitives and player transitions. Keep node creation order independent of edge order and position.
Run the root package's `npm test`, `npm run typecheck` and `npm run build` for changes here.

_Drafted by /sync from the introducing change, worth a quick human pass._
