# Editable graph, BFS and DFS verification

**Status:** Native implementation, runtime checks and fresh branch review complete, 15 October 2026. Owner PR delivery follows. Target learner understanding is untested.

**Scope:** [Accepted graph slice](../specs/003-graph-traversal.md) and [Native plan](../superpowers/plans/2026-10-15-graph-traversal.md). The owner accepted the specification at 177d52f and the build plan at 306f75f through “Continue”. Both traversals are implemented. Tutor, authored lessons/challenges, evidence persistence and release acceptance remain required work.

## Runtime evidence

Checks used the production build at localhost port 3001 in Codex's Chromium browser. The laptop runs Windows 10 Home Single Language 10.0.19045, Ryzen 9 5900HX and about 31 GiB memory, with Radeon graphics and an RTX 3070 Laptop GPU listed. Node is 24.15.0. The active GPU and physical display rate were not established. [Device record](graph-traversal/device.json).

| Behavior | Observed result |
| --- | --- |
| BFS fixture | At 5, B is discovered with an empty queue; 9 has B,C; 31 completes with discovery/processing A,B,C,D,E, counts 5/10/5/5, F unvisited and C distance 1. |
| DFS fixture | At 13, frames A1/B2/D2/C0 are visible; 16 processes C and returns to D before E is discovered; 18 discovers E; 26 completes with C tree depth 3 and returns C,E,D,B,A. |
| Rewind and content | Previous and native range Home/End/arrows restore frontier, counters, code and explanation. Draft BFS/F choices leave the active DFS/A caption and content intact. |
| Identity and picking | Nodes select through the graph mesh, adjacency, frontier and primary node list. A desktop E5 line pick selects the same edge as its semantic button; the inspector shows endpoints and disables node Focus. Initial narrow line clicks missed; no broad mobile line hit area is claimed. Semantic edge targets remain available. |
| Replacement dialog | Play then disconnect at 13 pauses before the dialog. Keep and Escape retain ordinal, frontier, selected edge and future; initial focus is Keep and close returns focus to Disconnect. Apply removes E2 and creates a paused run at 1. |
| Validation and deletion | Reversed duplicate, self loop, 21st node and 41st edge are rejected without replacing the run. Deleting A commits resting input with an explicit start error. Removing all nodes remains usable; the next node is G. Invalid endpoint drafts clear only after committed deletion. |
| Presentation ownership | Valid coordinate changes, Reset layout, Fit/Focus and unsent form choices retain logical fields. Moving while playing leaves playback active. Off step coordinates are rejected. Semantic mode and Reduce motion retain the selected ordinal and identity. |
| Maximum graph | The editor created 20 nodes and 40 edges. BFS completes at 161 and DFS at 141, both with counts 20/80/20/20. Engine tests independently cover a cycle/distance two fixture, permutations, reconnection and IDs beyond Z. |
| Playback | Actual first ticks were 2018.8 ms at 0.5×, 1016.5 ms at 1× and 504.2 ms at 2×. Manual Next/Previous pause. Scheduler tests deliberately fire stale callbacks after edits, resting replacement and disposal. |
| Lifecycle | Actual graph to heap navigation and Back/Forward return clean resting lessons. The owned probe also simulated persisted pageshow and observed a fresh preset. Simulated document.hidden pauses and visible does not resume. Development App Router playback reached 2 once and paused under default Strict Mode. |
| Renderer failures | Actual WEBGL_lose_context retained the maximum graph through completion and a subsequent disconnect. WebGL disabled before boot retained DFS completion, C inspection and a subsequent addition. Semantic controls remain usable with zero canvases. |
| Heap regression | Insert1 shows H8 at step3/index3/counts1/1. Extraction shows H7 at step4/index2/counts2/1, selectable result H1 and final counts3/1. Focus/Fit and autoplay still work. Actual heap context loss retains H1 and completion6. |
| Responsive layout | Direct routes were checked at 1280×720 and 360×780 for preset and maximum graph. Final rectangles show no page overflow or overlapping default labels. Buttons, native fields and linked checkbox labels provide at least 44 px targets. A narrower QA frame exposed eight small overlaps before the graph padding repair; that frame and the direct mobile route now have zero. |

Records: [fixture and edits](graph-traversal/fixture-and-edits.json), [selection/layout/history](graph-traversal/selection-layout-lifecycle.json), [maximum input](graph-traversal/maximum.json), [playback/fallback](graph-traversal/playback-and-fallback.json), [renderer/history](graph-traversal/renderer-and-history.json), [Strict Mode](graph-traversal/strict-mode.json), [heap journey](graph-traversal/heap-regression.json), [heap context loss](graph-traversal/heap-context-loss.json), [layout rectangles](graph-traversal/layout.json).

Screenshots: [desktop preset](graph-traversal/preset-desktop.jpg), [mobile preset](graph-traversal/preset-mobile.jpg), [maximum desktop](graph-traversal/maximum-desktop.jpg), [maximum mobile](graph-traversal/maximum-mobile.jpg), [mobile confirmation](graph-traversal/mobile-confirmation.jpg), [semantic mode](graph-traversal/semantic-mobile.jpg), [context loss](graph-traversal/context-loss.jpg), [creation failure](graph-traversal/creation-failure.jpg).

## Feedback and rendering observations

Forty trusted actions on the maximum graph covered 30 Next/Previous clicks and ten node selections. Every sample confirmed the expected DOM ordinal or identity. Event capture to the second animation frame measured **40.5 ms p95**, **56 ms maximum**, below the 100 ms feedback target on this sample. [Raw timing samples](graph-traversal/latency.json). These measurements precede the graph label padding repair; interaction logic did not change.

The [owned browser probe](graph-traversal/browser-probe.html) also recorded three trusted camera drags. The valid single observer recorded 243 rAF intervals, median 3.4 ms, p95 6.8 ms, maximum 10.1 ms. This is a browser scheduling proxy, including brief setup/summary time, not GPU completion, physical display scanout or proof of sustained 60 fps. An earlier duplicate arm sample produced duplicate callbacks and was discarded. [Orbit record](graph-traversal/orbit-cadence.json). [Playback cadence](graph-traversal/cadence.json) measures semantic delay separately from feedback.

The maximum graph was built through normal editor controls. Some probe screenshots include its surrounding frame controls; final maximum screenshots use the actual route at the requested viewport sizes. Narrower iframe measurements and the original failing overlap record remain in layout.json for the repair's RED to GREEN evidence. Checkbox inputs are narrow inside linked labels; the complete clickable label is the measured target, as recorded in [target sizes](graph-traversal/target-sizes.json).

## Decisions and repairs

1. Use sort on the newly filtered neighbor array instead of the plan's toSorted. The project's ES2022 types do not expose toSorted, and filter already allocates. Cost if wrong: traversal ordering, covered by permutation, reconnection and beyond Z tests.
2. Reduce only graph mobile label horizontal padding from 2 px to 1 px after the maximum graph exposed eight small overlaps. Fonts, heap styling, positions and shared camera remain unchanged. Cost if wrong: less space around graph status text, checked by rectangles and screenshots.
3. Preserve task scratch and QA files in the ignored Native workspace after automatic approval review rejected deleting the temporary QA files with “blocked by policy”. The files were moved out of public using a reversible move, and the public directory is empty. Cost: local disk space; these files are excluded from the feature commit.

Explicit htmlFor/id association replaced wrapped select labels after exact label lookup included option text. The browser lookup then passed for Traversal, Start, From and To. This follows the existing Speed control pattern. No dependency was added.

## Review and delivery

One fresh GPT-6 Astra reviewer inspected `3b3fe653291302f47baf4c6345ef41a676f75188..ca6492e6cc290d7c999cc337071b613d3df5c12d`, covering all changed application source/tests, the accepted contract and plan, ledger, report and selected evidence. It independently passed all 33 Node tests and `git diff --check` for that range. Verdict: ready for owner review, with **0 Critical, 0 Important and 0 Minor findings**. No repair pass or second source review was needed. Source/tests/package files still match that reviewed head; later edits concern delivery metadata only.

The reviewer confirmed input/counter validation, deterministic order, frozen separate discovery/frontier snapshots, frame returns, failed replacement rollback, deleted-start resting input, cancellation guards and preserved heap scene behavior. It used the executor's recorded build/browser evidence; it did not independently repeat those journeys.

The executor resolved every behavior the reviewer declined to judge, continuing the ordered decision record above:

4. Keep guided lessons/challenges, tutor, persistence and Browse as required later work. Dijkstra keeps its accepted deferral; full release acceptance is unclaimed. Cost: unfinished release capabilities.
5. Make no educational effectiveness claim because no target learner participated. Cost: the teaching assumption remains unvalidated.
6. Keep physical phone, screen reader, actual background transition and OS motion preference checks explicitly untested. Cost: device and accessibility coverage remains uncertain.
7. Keep mobile edge line picking unestablished and use the verified semantic edge controls. Desktop line picking passed; narrow mobile attempts missed. Cost: broad mobile line hit usability remains unverified.
8. Treat rAF as a scheduling proxy only, since it does not measure completed GPU/display frames. Cost: sustained physical rendering performance remains unverified.
9. Keep Reset layout and Fit as the accepted recovery for user created overlaps. Cost: manual reset discards custom positions.
10. Finish review/PR metadata and the evidence rename as delivery bookkeeping. Cost if missed: stale review pointers, covered by final context checks.
11. Retain the existing Clock deprecation warning and induced WebGL errors as documented observations. No new branch specific malfunction was established and fallback checks passed. Cost: later dependency maintenance remains.

Deferred review minors: none. The owner decides whether to merge the feature PR to development.

## Coverage limits

No physical phone, screen reader, real browser background transition or operating system motion preference change was exercised. Reduced motion and semantic controls were exercised; visibility and persisted restore include explicitly identified simulations. Direct desktop edge picking passed; narrow mobile line picking was not established. The accessible edge list was checked on mobile.

No target learner participated, so no understanding check was performed for discovery versus processing or a new BFS/DFS path. That teaching assumption remains unvalidated. The technical slice does not establish complete product release acceptance.

The [console record](graph-traversal/console-with-induced-failures.json) includes deliberately induced WebGL creation errors and the existing Three.js Clock deprecation warning. Those injected failures are separate from the normal desktop picking check, which reported no application errors.

## Commands and context

The latest source checks pass all 33 Node tests, typecheck and the production build with `/` and `/graph` prerendered. Context and whitespace checks pass. The actual graph engine is added to both contract mirrors. The architecture HTML and its evidence bytes remain unchanged, with [hash records](graph-traversal/architecture-preserved.json).

The temporary public probe and generated WebGL disabled boot fixture are task owned QA files. Their retained probe source belongs in this evidence folder; local public copies were moved into the ignored QA archive. The feature worktree remains available for owner feedback.
