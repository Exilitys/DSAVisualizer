# Guided Lessons and Prediction Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the owner's selected Native execution. Implement task by task with TDD, then one fresh whole-branch review. Steps use checkbox (`- [ ]`) syntax.

**Status:** Accepted 2026-10-17 by @Exilitys through "Accept plan; start Native execution"; reviewed at `354259f18c8ce680bdd7ee84244c9b69ab55c270`. Implementation in progress.
**Goal:** Deliver both guided lessons, six deterministic predictions, and bounded browser-local continuity through the existing DSA framework.
**Architecture:** Pure learning transitions compose the existing player. The existing hook binds one learning session to the existing timer and a storage boundary. Both playgrounds use one learning panel while retaining scene, layout and graph-confirmation ownership.
**Tech Stack:** Existing Node 24.15 or newer within Node 24, Next.js 16.3.8, React 19.3.0, R3F 9.8.1, Drei 10.7.9, Three 0.186.1 and TypeScript 5.9.3. Node's test runner; no new dependency.
**Spec:** [Slice 004](../../specs/004-learning-challenges.md), version 1 reviewed at `0ff8f4ab951d86d50b34be9601222d9e1bbd90e0`, accepted with its diagram by @Exilitys on 2026-10-16 through "Accept specification and diagram".
**Execution:** Native is already chosen. Reuse `feature/learning-challenges` in the existing managed worktree. Keep planning and implementation together; open one completed feature PR to development. The owner merges.

## Global Constraints

- One guide with two segments and exactly three questions per module. Use the seeds, ordinals and literal answers in spec sections 7–8.
- "One guard controls manual Next, range seek, keyboard actions and autoplay."
- "Gate state never changes a snapshot." Engine and Snapshot interfaces remain unchanged.
- "Submission/reveal unlocks the trace, advances exactly one semantic step to checkpoint + 1, and stays paused."
- "The accepted heap boundary applies even if an intermediate snapshot is ordered." Finish or Restart to 0 before replacing an unfinished heap run.
- "Graph activity replacement during a run uses its existing Apply/Keep confirmation; cancelling retains that run and any learning gate, paused."
- Layer switches preserve input, snapshot, selection, positions and camera. A successful explicit seed replacement clears selection; a failed replacement preserves the old session.
- Settings are speed 0.5/1/2 and semantic-view preference. "Autoplay never restores as playing." Do not store an OS reduced-motion override.
- Latest 100 submitted attempts across modules; one latest guide receipt and saved input per module. Reveal, abandonment and viewing are ungraded. No mastery or all-time accuracy claim.
- Reject stored records above 65,536 characters before parsing. Unknown/unreadable keys keep updates in memory until explicit reset; valid other keys remain independent.
- Heap inputs stay within 15 items; graph inputs within 20 nodes/40 edges. Explicit saved-input load starts at rest and restores no trace, command or camera.
- Existing tokens, native controls, 44 px effective targets and keyboard/semantic journeys at 360/1280 px. No network is needed for this slice.
- Tutor/Ollama, Browse relationships and release-wide learner/device evaluation remain later required work. No second timer, renderer, provider, registry, context provider or test framework.

## Review Focus

1. A seed may validate before its command, trace or checkpoint fails. Task 1 tests reference-preserving rollback; Task 4 checks the paused scene and graph cancellation.
2. Rewind, retry, reveal, mode exit and double submission must not contaminate another attempt or create duplicate evidence. Tasks 1–2 test correlation/deduplication; Task 4 checks the real form.
3. A scheduled tick from before a checkpoint, seed/mode change, hidden tab or Strict Mode cleanup must not reveal future state. Tasks 3/5 test the scheduler and actual UI paths.
4. Storage getter/read/write/removal failures and early events during restoration must preserve memory without overwriting valid saved data. Tasks 2–3 test this; Task 5 checks reload recovery.
5. Graph Keep/Escape and an ordered-but-unfinished heap must retain the current run. Tasks 1/4 also check camera/layout retention and return to free exploration.

## File map and sequence

| Task | Create | Modify |
| --- | --- | --- |
| 1. Learning/content | `src/core/learning.ts`, `src/lessons/heap/learning.ts`, `src/lessons/graph/learning.ts`, `tests/learning.test.ts` | `src/core/player.ts` (boundary predicate only), `package.json`, root `AGENTS.md` and invariants contract mirror |
| 2. Storage | `src/core/learning-storage.ts`, `tests/learning-storage.test.ts` | package test list and both contract mirrors |
| 3. Hook/timer binding | `tests/learning-playback.test.ts` | `src/components/useLessonPlayer.ts`, both playground hook calls/imports, package test list |
| 4. Shared UI/adapters | `src/components/LearningPanel.tsx` | Both playgrounds, `src/components/LessonControls.tsx` only if range copy needs it, `src/app/globals.css` |
| 5. Verification/review | `docs/reviews/004-learning-challenges.md`, artifacts under `docs/reviews/learning-challenges/` | README, backlog, development/source/module pointers and this plan's progress/status |

Both playgrounds means `src/components/LessonPlayground.tsx` and
`src/components/GraphPlayground.tsx`. Contract mirrors are `AGENTS.md` and
`docs/architecture/invariants.md`. Context targets in Task 5 are `README.md`,
`docs/backlog.md`, `docs/development.md`, `src/AGENTS.md` and
`src/lessons/graph/AGENTS.md`; preserve curated prose and change only owned pointers.

Execute Tasks 1→2→3→4→5 under Native. Existing engine, playback and scene implementations stay unchanged unless a demonstrated defect requires a documented fix. A missing new import is setup feedback; record a failing behavioral assertion before implementing nontrivial logic.

### Task 1: pure learning lifecycle and authored content

**Consumes:** Existing `LessonEngine`, `Snapshot`, `Validation`, `deepFreeze` and player transitions. Read all callers before extracting the repeated boundary predicate.
**Produces:** `isRunBoundary<I,S>(player:PlayerState<I,S>):boolean` in player.ts, reused by its existing guards and learning setup. Preserve graph `replaceInput` behavior when a deleted start commits valid resting input.

Export the following learning interfaces from core/learning.ts; keep helpers private:

```typescript
type LearningMode = 'explore'|'explain'|'challenge';
type ActivityRequest = {kind:'guide'|'challenge';id:string};
type Checkpoint = {ordinal:number;type:string;explanationKey:string};
type GuideSegment<I,C> = {id:string;title:string;input:I;command:C;
  checkpoints:readonly (Checkpoint & {text:string})[]};
type Challenge<I,C> = {id:string;version:number;objectiveId:string;input:I;command:C;
  checkpoint:Checkpoint;prompt:string;options:readonly {id:string;label:string}[];
  answerId:string;feedback:string};
type LessonLearning<I,C> = {moduleId:string;engineVersion:string;
  objectives:readonly {id:string;title:string}[];
  guide:{id:string;version:number;title:string;segments:readonly GuideSegment<I,C>[]};
  challenges:readonly Challenge<I,C>[]};
type AttemptEvidence = {attemptId:string;moduleId:string;challengeId:string;version:number;
  objectiveId:string;optionId:string;outcome:'correct'|'incorrect';timestamp:number};
type GuideReceipt = {moduleId:string;guideId:string;version:number;completedAt:number};
type ActiveActivity =
  | {kind:'challenge';id:string;run:object;attemptId:string;checkpoint:number;
     status:'pending'|'graded'|'revealed';optionId:string|null;outcome:'correct'|'incorrect'|null}
  | {kind:'guide';id:string;run:object;checkpoint:number;status:'active'|'finished'};
type LearningSession<I,S> = {player:PlayerState<I,S>;mode:LearningMode;
  activity:ActiveActivity|null;
  guideProgress:{guideId:string;version:number;finishedSegments:readonly string[]}|null};
type LearningUpdate<I,S> = {session:LearningSession<I,S>;
  attempt:AttemptEvidence|null;guideReceipt:GuideReceipt|null};
type LearningAction =
  | {type:'mode';mode:LearningMode} | {type:'seek';ordinal:number}
  | {type:'select';id:string|null} | {type:'start';command:unknown}
  | {type:'replace';rawInput:unknown;command:unknown|null} | {type:'load';rawInput:unknown}
  | {type:'begin';request:ActivityRequest;attemptId:string}
  | {type:'submit';attemptId:string;optionId:string;now:number}
  | {type:'reveal';attemptId:string} | {type:'continue';now:number};
export function createLearningSession<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown):LearningSession<I,S>;
export function transitionLearning<I,C,S>(session:LearningSession<I,S>,engine:LessonEngine<I,C,S>,content:LessonLearning<I,C>,action:LearningAction):LearningUpdate<I,S>;
export function playbackLimit<I,S>(session:LearningSession<I,S>):number;
```

`run` is the exact trace object reference. No new identifier/time enters Snapshot. Content exports `heapLearning:LessonLearning<HeapInput,HeapCommand>` and `graphLearning:LessonLearning<GraphInput,GraphCommand>`, pinned to engine versions `1.1.0`/`1.0.0`. Guide IDs: `heap-guide`, `graph-guide`; segments: `heap-insert`, `heap-extract`, `graph-bfs`, `graph-dfs`. Keep the spec's challenge/objective IDs.

- [x] Add learning.test.ts to the explicit package test list. Write `authored activities match independent oracles`: assert two segments/three challenges per module, three unique options and key membership; independently assert the following rather than computing expectations from the answer key.

  | Challenge | Literal assertion |
  | --- | --- |
  | heap-swap | Paused at 2; next 3 is swap, H6 at 2, H3 at 5, swaps 1. |
  | heap-tie | Paused at 1; next 2 is `heap.extract.choose-child`, chosen H2. |
  | heap-order | Paused at 5; 6 completes `[3,9,4,15,12,7]`; check parent inequalities and inequality with a separately sorted copy. |
  | graph-enqueue | Paused at 8 with `[B]`; next 9 queue `[B,C]`, C not processed. |
  | graph-return | Paused at 20; next 21 returns C→D, top frame D at neighbor index 2. |
  | graph-depth | Paused at 11; next 12 has C depth 3; independent BFS finishes with C distance 1. |

- [x] Write `activity preparation preserves the prior session on failure`: from a selected mid-run graph, bad input/command, thrown or malformed/513-step trace, wrong engine version, duplicate options/missing key and checkpoint/event mismatch retain input/resting/steps/ordinal/selection/activity references and show an error. Valid guide starts at 0; challenge at its checkpoint; both clear selection. Invalid content must not disable unrelated valid activities or Explore.
- [x] Write `one pending attempt produces one result`: correct/incorrect emit the right objective/version/choice/outcome at injected time 1000 and seek to checkpoint+1. Reveal emits none. Stale token/run, unknown option, rewound submission, duplicate submit and submit after reveal/exit emit nothing and cannot unlock another activity. New-token retry clears feedback; Restart retains token/status/ceiling.
- [x] Write `guide acknowledgements are not grades`: test heap checkpoints 0/1/3/8 and 0/1/4/6; graph 0/5/9/31 and 0/13/16/26. Continue only at the ceiling, opens the next range and advances one step. Finish records a segment once; both segments in either order emit one guide receipt. Viewing, one segment, repeated Finish and replay emit none. Exit retains finished segments; a changed guide version resets partial progress.
- [x] Write `learning preserves Explore and boundary rules`: active seek clamps at its ceiling; ordinary Explore invalid-seek errors remain. An ordered intermediate heap rejects start/load/retry, while 0/final allow it. Start/replace/load outside Explore reject; selection/rewind work. Mode exit preserves snapshot/selection and abandons the gate without evidence; clicking the already active layer is a no-op.
- [x] Run `node --test tests/learning.test.ts` and record behavioral RED. Implement the minimum transitions/content, preparing an unpublished candidate with `createPlayer` → `startCommand` → checkpoint validation → `seek`. Reuse existing trace checks and `isRunBoundary`; preserve the old session on failure. Validate the requested activity plus shared ID ambiguity, not unrelated definitions. Successful explicit saved-input load clears selection.
- [x] Add the now-real learning.ts contract path to both mirrors, with its accepted invariant/test pointer.
- [x] Verify: focused test, `npm test`, `npm run typecheck`, `python scripts/check-context.py`, `git diff --check`; expected all PASS/exit 0.
- [x] Commit the Task 1 files as `feat: add shared learning lifecycle and authored activities` after PASS.

### Task 2: bounded local storage

**Consumes:** Task 1's evidence/receipt types and each real engine's ID/version/input validator.
**Produces:** core/learning-storage.ts with no browser access on import/factory construction:

```typescript
type Settings = {speed:.5|1|2;semanticOnly:boolean};
type LocalData<I> = {settings:Settings;attempts:readonly AttemptEvidence[];
  guides:readonly GuideReceipt[];savedInput:I|null;notice:string|null};
type StoragePort = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
type InputOwner<I> = {id:string;version:string;validateInput(raw:unknown):Validation<I>};
type LearningStore<I> = {
  read():LocalData<I>;
  setSettings(patch:Partial<Settings>):LocalData<I>;
  recordAttempt(attempt:AttemptEvidence):LocalData<I>;
  recordGuide(receipt:GuideReceipt):LocalData<I>;
  saveInput(raw:unknown):LocalData<I>;
  reset():LocalData<I>;
};
export function createLearningStore<I>(resolveStorage:()=>StoragePort,owner:InputOwner<I>):LearningStore<I>;
```

Export the named types and four owned keys: `dsa-atlas.settings`, `dsa-atlas.evidence`, `dsa-atlas.input.heap`, `dsa-atlas.input.graph`. Settings envelope: `{schemaVersion:1,settings}`; evidence: `{schemaVersion:1,attempts,guides}`; input: `{schemaVersion:1,engineVersion,input}`. The factory reads lazily once before any mutation; no write on read/mount. Each route validates its own input without importing the other engine. Protect unreadable keys from writes until explicit reset while memory remains usable.

- [ ] Add learning-storage.test.ts to the package list. Write `restore is bounded, independent and idempotent`: missing records produce defaults and zero writes; repeated reads do not write; a mutation before explicit read restores the baseline first. Reject bad JSON/schema, duplicate attempts, malformed IDs/types/outcomes, nonfinite/negative timestamps, invalid speed, unbounded arrays/strings and records over 65,536 characters. Valid other keys remain intact; an unreadable key stays protected. Different content versions remain history.
- [ ] Write `retention and reset respect their limits`: repeated attemptId adds one row; 101 unique submissions across both modules retain the latest 100 in submission order. Keep one latest guide receipt per supported module. Persist no scene, trace, camera, raw learner question/chat or analytics. Reset removes exactly the four owned keys, never unrelated browser data.
- [ ] Write `storage failures preserve session evidence`: throwing resolver/getItem/setItem, quota failure and partial remove failure return usable memory and a notice. A grade survives a write failure. Failed removal clears memory but warns reload may restore old data. Validate saved input with the real engine: normalize valid heap/graph input and reject wrong engine version, bad IDs and oversized scenes.
- [ ] Run `node --test tests/learning-storage.test.ts` and observe RED. Implement with JSON, native storage and private validation helpers. Bound identity strings to 64 characters and guide receipts to the two supported modules; check record/module shape without requiring historical versions to match current content. Do not read other browser keys or add a migration/dependency.
- [ ] Add the actual storage boundary to both contract mirrors.
- [ ] Verify: focused/full Node tests, typecheck, context guard and whitespace check; expected all PASS/exit 0.
- [ ] Commit the Task 2 files as `feat: persist bounded learning evidence and preferences` after PASS.

### Task 3: hook and existing timer integration

**Consumes:** Tasks 1–2 and unchanged `createPlayback`.
**Produces:** `useLessonPlayer<I,C,S>(engine:LessonEngine<I,C,S>,initial:unknown,content:LessonLearning<I,C>)`. Update both existing hook calls/imports in this task. Preserve current `player`, `playback`, `go`, `start`, `replaceInput`, `select`, `play`, `pause`, `setSpeed` APIs and return behavior. Export its return type as `LessonPlayer<I,C,S>`, adding:

```typescript
session:LearningSession<I,S>;
limit:number;
local:LocalData<I>;
setMode(mode:LearningMode):void;
begin(request:ActivityRequest):PlayerState<I,S>;
submit(attemptId:string,optionId:string):void;
reveal(attemptId:string):void;
continueGuide():void;
setSemanticOnly(value:boolean):void;
saveInput():void;
loadSavedInput():PlayerState<I,S>;
resetSavedData():void;
```

One session state/ref replaces the old player state/ref; `player` is session.player, not another state copy. Publish the session to its ref synchronously. Consume LearningUpdate's attempt/receipt outside React updater functions, then publish the returned LocalData. Inject `crypto.randomUUID()` on begin and `Date.now()` on submit/guide finish; neither belongs in an engine, reducer or state initializer.

- [ ] Add learning-playback.test.ts to the package list. Write `the existing scheduler obeys the learning ceiling` using the real learning transitions and current injected-scheduler pattern: 0.5/1/2 speeds stop at challenge and guide ceilings; backward seek/Restart retain locks; Continue opens only the next range; submission opens the rest paused. Fire cancelled callbacks after mode exit, seed replacement, manual seek, reveal and reset; no stale movement. Repeated setup/cleanup and visibility cancellation must not duplicate advances or records.
- [ ] Run the focused file and record RED. Bind the hook to LearningSession and supply `playbackLimit(session)` as timer lastOrdinal. Keep the true final ordinal for heap/graph replacement guards: a checkpoint is not completion. Timed advance uses the same pure seek transition as manual go; manual actions invalidate/pause first, timed advances do not pause every tick. Selection and camera/layout interactions do not replace runs or gratuitously stop playback. Keep the controller stable across normal renders, not dependent on freshly allocated preset objects.
- [ ] Initialize the storage factory without IO, then read in a client effect. Apply restored speed/semantic settings before accepting a write; mutation methods restore first if an early event precedes that effect. Dispose the same reusable timer on cleanup. Repeated effect setup may read but never grade or write defaults; add no persist-rendered-attempt effect.
- [ ] Wire new actions and existing operations through transitions. Save validates the current input/heap boundary in Explore. Load uses only the validated saved slot, respects mode/boundary, starts at rest and clears selection. Confirmed reset pauses/invalidate work, clears activity/partial guide progress, restores authored rest/default settings and reports any durable-removal failure. Keep read/write failures independent from player state.
- [ ] Update both playground hook calls with heapLearning/graphLearning so the task typechecks before the panel exists.
- [ ] Verify: focused/full Node tests, typecheck, context guard and whitespace check; expected all PASS/exit 0.
- [ ] Commit the Task 3 files as `feat: enforce learning checkpoints across playback actions` after PASS.

### Task 4: shared learning panel and module adapters

**Consumes:** `LessonPlayer`, `LessonLearning`, existing tokens/native controls and graph replacement dialog.
**Produces:** `LearningPanel<I,C,S>` with props `{lesson:LessonPlayer<I,C,S>;content:LessonLearning<I,C>;begin(request:ActivityRequest):void;loadInput():void}`. Heap passes hook methods; graph passes its confirmation dispatcher. The shared panel owns explicit reset confirmation, including copy naming settings, progress and saved inputs.

- [ ] Build visually with the real typed content below the intro, before operations/editor on both routes. Use labelled buttons with aria-pressed for layers, not incomplete custom tab semantics. Keep scenes mounted through layer changes; never key/remount the playground on attemptId.
- [ ] Render guide segment controls, current checkpoint annotation and Continue/Finish, retaining existing event explanation/pseudocode. Render question cards, a labelled radio group, Submit, Reveal without answering, Retry and Return to question. Key only the answer form by attemptId. Correct-answer marking/feedback appears only after grading/reveal; do not render hidden future snapshots or answer-key attributes. Focus the prompt on begin and live feedback after resolution.
- [ ] Render Recent practice (latest 100 attempts), current-content correct/incorrect counts and latest challenge outcome; old versions remain stored but do not count. Label guide completion separately, matching the current guide ID/version. Add Save current input, Load saved input and confirmed Reset saved data, with notices and Cancel behavior. Do not introduce mastery, all-time accuracy or prerequisite diagnosis.
- [ ] Pass lesson.limit to the existing PlaybackControls and explain locked later steps in the panel. Disable only logical operations/editing outside Explore, retaining the hook's own guard. Graph coordinates/Reset layout, selection, Fit/Focus and view controls remain available. Both callers use lesson.local.settings.semanticOnly / lesson.setSemanticOnly; WebGL availability stays separate from the saved preference.
- [ ] Extend graph PendingAction with activity/load variants. Pause before requesting replacement; Keep/Escape preserves session/input/layout/selection. On successful activity begin, use its validated authored command to update activeCommand/traversal drafts and reset positions to readable seed layout. Successful saved-input load/reset clears activeCommand and reconciles drafts/layout at rest. Failures/cancellation change neither drafts nor positions. Broaden dialog copy to cover resting saved-input replacement truthfully.
- [ ] Verify both complete guides and all six questions in the real app at 1280/360 px: correct, incorrect, missing choice, rewind/Return, reveal, repeated submit, retry, exit/re-entry, input save/load and reset Cancel/Confirm. Use keyboard/range keys, visible focus, approximately 44 px targets and semantic/WebGL fallback; inspect narrow controls for overflow. Reduced motion still follows OS plus the existing unsaved user control.
- [ ] Verify an ordered intermediate heap still rejects new activity/load until Finish/Restart. Cancel graph activity and saved-input replacements with Keep and Escape, then Apply; check command, layout and selection. Verify layer changes preserve camera/selection and a seeded scene can recover through Fit. If a journey reveals a logic bug, add a failing regression in the owning test file before its minimum fix.
- [ ] Verify: `npm test`, `npm run typecheck`, `npm run build`, context guard and whitespace checks; expected all PASS/exit 0 after the actual journeys pass. Add only focused CSS to current tokens; no redesign or registry setup.
- [ ] Commit the Task 4 files as `feat: add shared guides and prediction challenge experience` after PASS.

### Task 5: measured verification, fresh review and one owner PR

**Consumes:** Completed implementation and spec sections 6–13.
**Produces:** Runtime evidence and a feature PR to development, not a merge or release.

- [ ] Run final `npm test`, `npm run typecheck`, `npm run build`, `python scripts/check-context.py`, `git diff --check`; read output/exit codes. Tests include the five original files plus learning, learning-storage and learning-playback. Repeat an unchanged build only when new source, failure or unresolved uncertainty justifies it.
- [ ] Drive the production app on both routes. Test armed autoplay through manual seek/Restart, answer/reveal/Continue, mode changes, visibility and navigation. Reload settings, submissions, guide completion and saved inputs: saved data restores, transient scene/activity resets and playback stays paused. Repeat mount/reload in development Strict Mode: no hydration warning, duplicate grade or default overwrite.
- [ ] Exercise malformed/unknown/oversized owned storage and browser storage failures through a temporary loopback QA fixture/test harness scoped to app-owned keys. Preserve unrelated browser data. Remove public QA entry points before commit; no test-only production API or new browser framework. A failed removal must visibly distinguish a memory reset from durable erasure.
- [ ] Measure 40 gate interactions, 20 per module, from event to first visible response across seek, Continue, submit and reveal. Report device/browser, distribution, p95 and maximum against the 100 ms target. Capture both route journeys and storage recovery; label desktop emulation truthfully. Inspect source for no provider/network grading dependency and no raw question/chat collection.
- [ ] Write docs/reviews/004-learning-challenges.md with observed results, failures/fixes, test counts, criterion coverage, artifacts and remaining learner/device limits. Preserve both accepted diagram artifacts and their evidence bytes. Update README/backlog/development/source/module pointers and reconcile actual contract paths in both mirrors. Context sync must not turn technical verification into owner or learner acceptance.
- [ ] Obtain one fresh whole-branch review using requesting-code-review, preserving Native execution and its final reviewer policy. No implementation subagents or per-task reviewer dispatch. Verify findings before fixing; rerun affected checks after changes and obtain appropriate follow-up review when the reviewed source changes. Record unresolved limitations honestly.
- [ ] Check PR #8 and development before the learning PR. Align with the actual merged base if the owner has integrated graph work; resolve and test any differences. If still open, disclose that dependency and inherited graph changes. Do not merge it. Prefer normal synchronization merges; rewriting a published branch needs explicit authorization.
- [ ] Commit/push finished work and open one completed feature PR to development with behavior, validation and limits. Attach it to this chat. Stop for owner review/merge; do not merge, deploy or claim full release acceptance. Preserve Native for fixes.

## Self-review and handoff

Spec coverage: content, oracles, lifecycle and rollback belong to Task 1; storage
to Task 2; all advance paths and restore binding to Task 3; both adapters and
accessible controls to Task 4; measured evidence and review to Task 5. Every
Review Focus failure has an owning test/journey above. Interfaces and action
names are shared consistently; no additional product decision is open.

Review Tasks 1/3's atomic session/hook boundary, Task 2's independent storage
protection/reset failures, and Task 4's graph confirmation/layout handling most
closely. Those mistakes could discard a run or contaminate practice evidence.
The [accepted flow diagram](../../diagrams/learning-challenges.html) still applies.

Library authority checked 2026-10-16: [React Strict Mode](https://react.dev/reference/react/StrictMode)
documents repeated development setup/cleanup; [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)
defines storage exceptions and the lack of cross-context locking. Keep replay
free of writes/grades, catch storage failures and retain the accepted single-tab limit.

**Execution receipt:** The owner accepted this written plan and Native execution
on 2026-10-17. Execute all tasks in the same branch/worktree, then present one
completed feature PR. No intermediate planning PR is needed.
