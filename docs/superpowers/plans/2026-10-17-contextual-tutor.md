# Contextual Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the owner's preserved Native method. Implement task by task with TDD, then one fresh whole-branch review. Steps use checkbox (`- [ ]`) syntax.

**Status:** Draft for owner review, 2026-10-17. Specification acceptance authorizes this plan, not implementation. No task below has started.
**Goal:** Ground the shared tutor in the exact heap or graph state, using local Ollama and reviewed, validated proposals without bypassing learning or replacement guards.
**Architecture:** Retain the normalized command in the existing player, then reconstruct requests through the real pure engines. A bounded Node route calls one provider; an injected browser controller fences stale replies and binds to the existing hook. Both adapters share one panel and preserve their current presentation ownership.
**Tech Stack:** Existing Node >=24.15.0 <25, Next.js 16.3.8, React 19.3.0, TypeScript 5.9.3, R3F 9.8.1, Drei 10.7.9 and Three 0.186.1. Built-in fetch/Request/Response/AbortController, Node test runner; no dependency additions.
**Spec:** [Slice 005](../../specs/005-contextual-tutor.md), version 1 and its [request/Apply diagram](../../diagrams/contextual-tutor.html), accepted 2026-10-17 by @Exilitys through "Accept specification and diagram (Recommended)", reviewed at `f2604fd039b6a8314ba6670da3cb10eca69dae51`.
**Execution:** Native is already chosen. Reuse `feature/contextual-tutor` and the attached managed worktree. Root implements all tasks; read-only inventories are not implementation or per-task code reviews. One fresh reviewer checks the completed branch. Open one completed feature PR to development; the owner merges.

## Global Constraints

- D-501: "Use existing authored guidance while a challenge is pending, including while rewound." Live AI becomes available after Submit/Reveal or leaving the attempt; never request automatically on that transition.
- D-502: "A model may name an allowed example ID; it cannot author an arbitrary replacement input." Exactly two curated examples per module, using the existing four authored fixtures.
- "Only Explore may apply." Explain/Challenge responses contain no executable proposals. Submission, feedback and attempt storage never depend on model text.
- Preserve `LessonEngine` and `Snapshot` interfaces and deterministic IDs. Presentation never changes algorithm state. Retain normalized original input plus command; explicit null means rest, including ordinal 0.
- "Heap requires rest/0/final; graph retains Apply/Keep confirmation before meaningful replacement." An ordered intermediate heap is not a boundary. Preview publishes nothing; failed preview/Apply preserves the old scene and gate.
- Command Apply retains positions and still-inspectable selection. Example Apply clears selection and resets graph positions; both keep the mounted camera and saved learning data.
- One current exchange, in memory only. No question, response, prompt, provider body or credential logging/persistence; no model HTML or model-directed links.
- Limits: 32 KiB request bytes, 2,000 question characters, 3,000 explanation characters, 3 proposals, 20 unique referenced IDs, 500 follow-up characters, 64 KiB provider response bytes, 512 generated tokens initially, trace length at most 512.
- IDs are nonempty ASCII identity tokens at most 64 characters; engine/content versions must match exactly. UI selection cardinality is 0 or 1.
- "6 requests per minute per guest and one provider call at a time locally." At most 256 live process-local guest buckets, 60 second timestamps, no queue or automatic retry. Opaque UUID cookie: HttpOnly, SameSite=Strict, Path=/, Secure on HTTPS; reject unexpected browser Origin.
- 15 second independent client/server deadlines. Invalidate display immediately; retain the server slot until the underlying provider transport/body cleanup settles. No claim that a closed connection proves remote GPU inference stopped.
- Ollama uses server-only `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`) and configured installed `OLLAMA_MODEL`, `stream:false`, schema `format`, `temperature:0`, `num_predict:512`. No cloud calls, model download, SDK or second provider.
- Existing visual tokens, semantic/3D inspection and native controls; keyboard and 44 px effective targets at 360/1280 px. No new renderer, timer for playback, chat history, settings product or authoring interface.

## Review Focus

1. A resting heap and active insertion can share byte-identical s0, while a graph edit can successfully become resting with an error. Tasks 1/3 test command metadata and identity from actual run/rest reference changes, not snapshot ID or `!error`.
2. Guide checkpoint is an ordinal, and a rewind can precede the active ceiling. Task 1 tests that future checkpoint prose, answer keys and feedback never enter provider context; Tasks 2/3 test pending prediction lock independently of ordinal.
3. UTF-8 can cross stream chunks; missing Content-Length or a stalled/aborted reader cannot bypass byte caps or free an active provider slot prematurely. Task 2 pins bounded reads, 15 second response exit and later cleanup settlement.
4. A reply can arrive after changing away and back, a no-op selection, Play, Submit/Reveal, reset or Strict Mode cleanup. Task 3 tests effective context equality and generation fencing; Task 5 checks the mounted hook and route navigation.
5. A graph preview can outlive its exchange while camera/layout changes should remain harmless. Tasks 3/4 verify final revalidation, one dialog, Keep/Escape, command retention and example replacement without resetting saved data.

## File map and sequence

| Task | Create | Modify |
| --- | --- | --- |
| 1. Reconstruction and proposals | `src/core/tutor.ts`, `src/lessons/tutor.ts`, `tests/tutor-context.test.ts` | `src/core/player.ts`, relevant existing player/learning tests, `package.json`, contract mirrors |
| 2. Route and Ollama | `src/server/tutor.ts`, `src/server/ollama.ts`, `src/app/api/tutor/route.ts`, `tests/tutor-route.test.ts`, `tests/ollama.test.ts`, `.env.example` | Package test list, contract mirrors, development setup notes |
| 3. Exchange and hook | `src/components/tutor.ts`, `tests/tutor-controller.test.ts` | `src/components/useLessonPlayer.ts`, `tests/learning-playback.test.ts`, package test list |
| 4. Panel and adapter integration | `src/components/TutorPanel.tsx` | `src/components/LessonPlayground.tsx`, `src/components/GraphPlayground.tsx`, `src/app/globals.css` |
| 5. Proof and delivery | `docs/reviews/005-contextual-tutor.md`, measured evidence under `docs/reviews/contextual-tutor/` | README, backlog, development/source pointers, this plan's status/checks |

Contract mirrors mean root `AGENTS.md` and `docs/architecture/invariants.md`.
Add only actual new contract files once created: core/tutor.ts, lessons/tutor.ts,
server/tutor.ts, server/ollama.ts and app/api/tutor/route.ts. Retain both literal lists
in the same order. No new interface path is asserted before it exists.

Run Tasks 1→2→3→4→5. Each task owns its setup, tests and commit. A missing new
module is setup feedback: capture a failing behavioral assertion before claiming
RED for nontrivial logic. Keep the existing graph invalid-start resting fallback;
protect tutor Apply with an unpublished complete candidate instead of changing
ordinary graph edit behavior. No old learning-plan scratch or archive is part of
this slice.

### Task 1: retain command metadata and reconstruct verified context

**Files:** Task 1 row; extend `tests/heap-slice.test.ts`,
`tests/graph-player.test.ts` and `tests/learning.test.ts` where they already own
the affected player/learning behavior.

**Consumes:** Existing `createPlayer`, `startCommand`, `seek`, `replaceInput`,
`currentSnapshot`, `isRunBoundary`, engine validators/inspection and learning
definitions. Existing pure `explainStep`/`explainGraphStep` supply current guidance.

**Produces:** Add `command:unknown|null` to `PlayerState<I,S>` without propagating
a new generic through all learning APIs. Initialize null at rest, assign validated
`command.value` only with a successful new trace, clear on resting replacement,
and preserve through seek/Restart/rejection. Existing function signatures remain.

`src/core/tutor.ts` exports the exact `TutorActivity`, `TutorRequest`,
`TutorProposal`, `TutorContent`, `TutorReply` and `TutorProvider` from spec §7,
plus these shared types and structural parser:

```typescript
type TutorScene = Omit<TutorRequest,'requestId'|'question'|'mode'>;
type VerifiedTutorContext = {
  lessonId:'heap'|'graph';lessonVersion:string;
  run:{kind:'rest';command:null}|{kind:'active';command:unknown};
  snapshot:Snapshot<unknown>;inspection:Inspection|null;
  question:string;mode:'explain'|'hint';learningMode:LearningMode;
  guidance:string;objective:{id:string;title:string}|null;
  examples:readonly {id:string;title:string;objectiveId:string}[];
};
type TutorPreview = {kind:'command'|'example';title:string;
  input:unknown;command:unknown;first:Snapshot<unknown>;stepCount:number};
type TutorError = {code:'invalid_request'|'challenge_locked'|'rate_limited'|
  'busy'|'unavailable'|'invalid_provider_response'|'timeout'|'cancelled';
  message:string;retryAfter?:number};
type TutorErrorReply = {error:TutorError;requestId:string|null;
  runId:string|null;snapshotId:string|null};
function parseTutorRequest(raw:unknown):Validation<TutorRequest>;
```

Do not put network, environment, cookie or browser state in core. Retain the
existing `Validation<T>` convention. The pure `src/lessons/tutor.ts` exports:

```typescript
function reconstructTutorContext(request:TutorRequest):Validation<VerifiedTutorContext>;
function validateTutorContent(raw:unknown,context:VerifiedTutorContext):Validation<TutorContent>;
function validateTutorReply(raw:unknown,request:TutorRequest):Validation<TutorReply>;
function previewTutorProposal(request:TutorRequest,proposal:TutorProposal):Validation<TutorPreview>;
```

Use typed heap/graph branches and private helpers for real duplication. No React
scene/server import or browser-snapshot cast. Keep catalog data private to this
module; provider examples expose IDs/titles/objectives only. Stable IDs reuse
`heap-tie`, `heap-order`, `graph-enqueue`, `graph-depth`; project their existing
seed/command/objective instead of copying answer-bearing records.

- [ ] Write `retained command describes the actual run`: assert rest command null; insert/extract/BFS/DFS retain normalized command; seek 0/final and Restart retain it; rejected starts preserve input/resting/steps/command references. The next operation's original input is the selected prior final state. Graph removal of its start commits a new resting reference with command null even though it reports the former command error.

  ```typescript
  const resting=createPlayer(heapEngine,createPreset());
  const active=seek(startCommand(resting,heapEngine,{type:'insert',value:1}),0);
  assert.deepEqual(currentSnapshot(active),currentSnapshot(resting));
  assert.equal(resting.command,null);
  assert.deepEqual(active.command,{type:'insert',value:1});
  ```

- [ ] Write `reconstruction uses original input and explicit rest`: compare rest and active insertion s0 snapshots for equality but assert distinct run descriptors; assert H4/H7 and graph queue/frame/edge/result cases against spec §16 oracles. Null command with nonzero ordinal, wrong version/snapshot/selection, noninteger/out-of-range ordinal, malformed/513-step traces must fail. Exercise shared player trace checks with injected malformed engines in existing player tests; never make production engines injectable through HTTP.
- [ ] Write `context is a narrow current projection`: assert no `answerId`, `feedback`, options, future guide text, trace or attempt evidence in serialized verified context. For guide ceiling 8 rewound to ordinal 1, include current-event guidance only; include checkpoint text only when its ordinal is the selected ordinal. Activity versions/seeds/commands and objective IDs must match registered content; checkpoint is a real authored ordinal, not its array index. Pending challenge eligibility is determined from status even after rewind.
- [ ] Write `proposal validation is complete and nonmutating`: accept bounded insert/extract/BFS/DFS or one catalog ID; reject arbitrary replacement inputs, unknown IDs, extra fields, unsafe/overlong content, duplicate/unknown references, >3 proposals, >20 references, >500 follow-up, or any proposal outside Explore. Both command and example dry-runs validate the full candidate without changing original player/learning objects. Reject ordered intermediate heap preview; graph intermediate preview is allowed but uncommitted. Include max-size/empty scenes and selected extracted result/edge.
- [ ] Run focused tests with `node --test tests/tutor-context.test.ts tests/heap-slice.test.ts tests/graph-player.test.ts tests/learning.test.ts`; record behavioral RED.
- [ ] Implement metadata and parsers/reconstruction/preview. Reconstruct active input with fresh `createPlayer` → `startCommand` → requested `seek`, checking explicit ordinal/ID; rest uses initial snapshot only. Reuse the ≤512 trace checks. For preview normalize from current snapshot; resolve example IDs internally. Reject whole invalid provider content, rather than keeping a safe subset. `validateTutorReply` verifies all correlation fields, then uses the same content/preview checks.
- [ ] Add tutor-context.test.ts to the explicit package script and the two now-real pure tutor contract paths to both mirrors. Verify focused checks, `npm test`, `npm run typecheck`, `python scripts/check-context.py`, `git diff --check`; all exit 0. Commit as `feat: reconstruct tutor context and validate proposals`.

### Task 2: bounded tutor route and local Ollama adapter

**Files:** Task 2 row.
**Consumes:** Task 1's parser/context/content validator and provider signature.
**Produces:** `src/server/tutor.ts` exports the testable route factory and a shared
bounded stream reader, with no Next or UI dependency:

```typescript
function readBoundedJson(body:ReadableStream<Uint8Array>|null,
  maxBytes:number,signal:AbortSignal):Promise<unknown>;
function createTutorHandler(options:{provider:TutorProvider;
  now?:()=>number;id?:()=>string;
  schedule?:(ms:number,callback:()=>void)=>()=>void}):
  (request:Request)=>Promise<Response>;
```

`src/server/ollama.ts` exports
`createOllamaProvider(config:{baseUrl:string;model:string},fetcher?:typeof fetch):TutorProvider`.
This adapter imports the bounded reader; tutor.ts imports only the provider type,
so there is no module cycle. Configuration failure returns typed unavailable
behavior, never a successful fake answer. The route file exports
`runtime='nodejs'` and `POST` from one module-level handler instance; never recreate
the limiter for each request. Resolve environment settings on the server only.

- [ ] Write route tests for 32,768 versus 32,769 actual body bytes, missing/forged Content-Length, split UTF-8 chunks, invalid JSON/shape/IDs/versions/selections/activity, unexpected Origin and client-injected URL/model/snapshot fields. No invalid or pending request reaches the provider. At pending checkpoint and at rewind 0, assert status 400/code challenge_locked; graded/revealed valid contexts may call explicitly.

  ```typescript
  let calls=0;
  const post=createTutorHandler({provider:async()=>{calls++;return {
    explanation:'Unused',referencedIds:[],proposedCommands:[]};}});
  const response=await post(new Request('http://localhost:3000/api/tutor',{
    method:'POST',body:'x'.repeat(32_769)}));
  assert.equal(response.status,400);
  assert.equal((await response.json()).error.code,'invalid_request');
  assert.equal(calls,0);
  ```

- [ ] Write `guest limits remain bounded`: six admitted sequential requests at injected time pass; seventh is 429/rate_limited with Retry-After; at 60 seconds expired timestamps leave the window. Failed provider calls count once admitted. Test 256 live guests and rejection of a 257th without growth, malformed/missing cookie rotation, HttpOnly/SameSite/Path/Secure flags, and Set-Cookie on error responses. Busy calls have no queue and do not start another provider transport.
- [ ] Write `deadline fences display but waits for transport settlement`: fake provider ignores AbortSignal and remains unresolved; at injected 15,000 ms return 504/timeout, while a second request remains 429/busy. Settle the first promise and assert the next can start. Repeat disconnect/Cancel, rejection and stalled body reader; capture no unhandled rejection. A request-body stall also returns at the same route deadline before any provider starts. Honest abort cleans up promptly. Never release the slot merely because Promise.race selected timeout.
- [ ] Write Ollama tests capturing exact `/api/chat` body: configured model, `stream:false`, JSON schema `format`, `temperature:0`, `options.num_predict:512`, only verified current context and no tools/full learning data. Test ≤65,536 provider bytes, split UTF-8, malformed/truncated/empty content, schema extras, invalid references/proposals, nonfinal response, non-2xx/unreachable service and AbortSignal propagation/body cancellation. Reject configured cloud hosts and `:cloud`/`-cloud` model tags before fetch. All bad responses become typed errors; a sentinel raw question/body never appears in captured logs.
- [ ] Run `node --test tests/tutor-route.test.ts tests/ollama.test.ts`; record behavioral RED.
- [ ] Implement the reader using streaming byte counts and platform UTF-8 decoding, cancelling/releasing the reader on cap/abort. Start the route deadline before reading the body; parse and reconstruct before provider admission; block pending status without calling AI. Atomically acquire the single slot before starting a provider promise. After admission, retain the timestamp on provider failure. Expire timestamps before bounded guest admission; return cookie-bearing typed errors and safe correlation fields (null when invalid/unavailable). Keep settled transport cleanup in finally, independent of returning a timeout response.
- [ ] Implement Ollama with built-in fetch, no redirects to alternate hosts, schema plus post-parse semantic validation. Accept only configured local use; reject cloud model tags/direct Ollama cloud hosts and verify a cloud-disabled local daemon before real evaluation. Do not infer local execution merely from a localhost URL. Limit the complete outer response before parsing `message.content`; require a finished complete content object. Rendered content remains plain text later.
- [ ] Add `.env.example` with server-only base URL and an empty model field plus a comment to use an installed local tag. Existing `.gitignore` excludes actual `.env*` and already allows `.env.example`; do not commit local configuration. Add setup notes linking official [chat](https://docs.ollama.com/api/chat), [model inventory](https://docs.ollama.com/api/tags) and [local-only daemon configuration](https://docs.ollama.com/faq#how-do-i-disable-ollamas-cloud-features). No global environment change, daemon restart or model download is part of this task's automated checks.
- [ ] Add both tests to the package script and actual server/route contract files to both mirrors. Verify focused checks, `npm test`, `npm run typecheck`, `npm run build`, context guard and whitespace; all exit 0. Commit as `feat: add bounded local Ollama tutor endpoint`.

### Task 3: exchange controller and synchronous hook cancellation

**Files:** Task 3 row.
**Consumes:** Task 1's shared types/reply validator/preview and Task 2's HTTP contract.
**Produces:** `src/components/tutor.ts`, following existing playback injection:

```typescript
type TutorExchange = {status:'idle'|'pending'|'ready'|'failed'|'cancelled';
  request:TutorRequest|null;reply:TutorReply|null;error:TutorError|null;
  preview:TutorPreview|null};
function createTutorController(options:{read:()=>TutorScene;pause:()=>void;
  changed:(value:TutorExchange)=>void;fetcher:typeof fetch;
  id:()=>string;schedule:(ms:number,callback:()=>void)=>()=>void}):{
  status():TutorExchange;
  ask(question:string,mode:'explain'|'hint'):Promise<void>;
  sync():void;cancel():void;retry():Promise<void>;
  preview(index:number):Validation<TutorPreview>;clearPreview():void;
  apply(commit:(candidate:TutorPreview)=>boolean):boolean;dispose():void;
};
```

The existing hook gains `tutor:TutorExchange`, `askTutor`, `cancelTutor`,
`retryTutor`, `previewTutor(index):Validation<TutorPreview>`, `clearTutorPreview`
and `applyTutorPreview():{kind:'command'|'example';player:PlayerState<I,S>}|null`.
It builds scene requests from its current ref, never form drafts. No new context
provider or browser hook is required.

- [ ] Write a deferred-fetch/fake-scheduler harness. For every effective run/ordinal/selection/layer/activity/checkpoint/attempt/status/reset change, call sync and complete the old fetch late; assert no reply or preview. Moving away then back cannot restore the old generation. Mismatched returned request/run/snapshot ID fails. Verify Cancel, Retry with a new request ID, 15,000 ms client timeout even if server/abort never settles, malformed reply and disposal with no later changed callback from discarded work. After effect setup resynchronizes the same controller, a new explicit ask works and the discarded generation remains fenced.

  The test-local harness starts with a valid active heap scene at ordinal 1;
  `scene` is its mutable request descriptor, `snapshotIdAt(n)` reads the real
  trace, and `completeOriginalReply()` resolves the captured request's valid
  correlated response. Its deliberately uncancellable fetch proves fencing:

  ```typescript
  const asking=h.controller.ask('Why this step?','explain');
  h.scene.ordinal=2;h.scene.snapshotId=h.snapshotIdAt(2);h.controller.sync();
  h.scene.ordinal=1;h.scene.snapshotId=h.snapshotIdAt(1);h.controller.sync();
  h.completeOriginalReply();await asking;
  assert.equal(h.controller.status().reply,null);
  assert.equal(h.controller.status().preview,null);
  assert.notEqual(h.controller.status().status,'ready');
  ```

- [ ] Write counterchecks: same ordinal/selection/layer and error-only transitions preserve an exchange; camera/layout/Fit/Focus/speed/semantic preference never enter its key. Starting Play cancels before a scheduled tick. A pending challenge, including rewind, pauses if asked but performs zero fetches; Submit/Reveal only enables a new explicit ask. Retry obeys eligibility and limits rather than resurrecting old state.
- [ ] Extend player/hook tests for one lazy client run UUID per exact `steps ?? resting` reference. Seek/Restart preserve it; successful start/activity/load/reset and graph invalid-start resting replacement change it. Failed proposals preserve it. Extend the SSR probe to prove no browser storage access, network or timer is invoked during entry; do not generate request IDs inside React updater functions.
- [ ] Write `Apply rechecks before one publication`: preview then mode/run/selection change rejects; a changed-away-and-back ordinal rejects; layout-only movement permits. A failed complete candidate retains the prior input/trace/selection/gate even if ordinary graph replaceInput would commit a resting seed. Command retains inspectable selection; example clears it atomically. Neither creates an attempt/receipt or writes saved inputs/history.
- [ ] Run `node --test tests/tutor-controller.test.ts tests/learning-playback.test.ts tests/tutor-context.test.ts`; record behavioral RED.
- [ ] Implement controller cancellation with a fresh request ID/generation plus AbortController and an injected 15 second schedule. Validate the reply before publishing. Compare only effective scene fields, not freshly allocated wrapper identity; reject stale replies independently of AbortSignal. Preview remains attached to its ready exchange. `apply` synchronously re-reads and revalidates before calling the single commit callback; false leaves the scene unchanged and reports the failure.
- [ ] Bind the controller in useLessonPlayer without browser IO during construction. On publication update current-session/run refs, synchronize tutor cancellation, then publish React state. Assign a new lazy UUID when exact run/rest reference changes, even if the player carries a legitimate error. Wrap public Play to cancel first; reset and cleanup cancel too. Make dispose cancel/fence its generation without permanently disabling the instance; Strict Mode effect setup calls sync to reuse it, and only a new explicit ask starts work. A discarded generation can never revive. Keep pause/speed/semantic changes independent.
- [ ] Implement hook Apply through existing pure transitions, validating an unpublished candidate and publishing once only on success; failed transition publishes the old session plus error. Clear selection in that same successful example publication. Return kind/player for graph presentation reconciliation. Add the focused test to package scripts, verify `npm test`, typecheck, context/whitespace; all exit 0. Commit as `feat: bind contextual tutor cancellation to lesson playback`.

### Task 4: shared panel, previews and both adapters

**Files:** Task 4 row. Inspect existing tokens and panel/control markup before adding styles.
**Consumes:** Task 3's hook actions/state, current authored guidance/inspection and preview type.
**Produces:** A shared `TutorPanel<I,C,S>` accepting
`{lesson:LessonPlayer<I,C,S>;guidance:string;contextCaption:string;reviewProposal?:(index:number)=>void}` and a named
`TutorPreviewDetails({preview}:{preview:TutorPreview})` for the existing graph dialog.
Parents supply current authored guidance and a caption derived from validated
player.command (including explicit rest), never unsent form values. The default
panel preview path calls previewTutor and opens its own Cancel/Apply dialog; the graph override uses its current dialog exclusively. Render the panel
beside inspection/pseudocode on both routes, preserving the existing narrow layout.

- [ ] Build the shared panel using existing native controls/tokens: Explain this and Why this step fixed prompts, labelled ≤2,000-character question field, Explain/Hint intent, status/live feedback, Cancel, explicit Retry, referenced-ID inspection buttons and proposal review buttons. Show rest/actual normalized command and step in the context caption. Pending predictions display authored current guidance and "AI opens after Submit or Reveal." No provider call, hidden answer or automatic mode switch.
- [ ] Render only validated React text. The panel shows one exchange, bounded error/retry information and authored fallback on unavailable/timeout/invalid output. Preview describes its seed/current-scene command, initial action and step count, with explicit Cancel/Apply. Keep all enabled targets at least 44 px, clear labels/focus and current semantic/3D selection behavior. Close the default preview dialog if its exchange is invalidated. Use the existing native dialog focus/Escape pattern; avoid a new component library or markdown renderer.
- [ ] Add the panel to LessonPlayground; default preview Apply calls only applyTutorPreview. Heap boundary rejection explains Finish/Restart. Cancellation or stale preview cannot start a run; valid Apply starts the ordinary first action step paused and retains camera.
- [ ] Add the panel to GraphPlayground with reviewProposal override. Extend PendingAction with `{kind:'tutor'}`; when its preview validates, open the existing dialog even at a boundary, rendering TutorPreviewDetails there. Keep/Escape clears only pending preview and keeps paused run/selection/layout. Before Apply, call applyTutorPreview for final correlation/guard checks. Close a stale tutor dialog without touching unrelated edit/activity dialogs; never show two dialogs.
- [ ] On successful graph command Apply keep positions and still-inspectable selection. On successful example Apply clear/reconcile drafts and reset positions with `reconcileGraphPositions(next.input.nodes,{})`, retaining camera. Replace duplicate adapter activeCommand state with validated player.command for ordinary edit reruns; unsent BFS/DFS form values remain drafts. Preserve the existing deletion-of-start resting outcome and normal graph confirmations.
- [ ] Run tests/typecheck/build, then browser journeys at 360/1280 px on both routes: request/cancel/retry, selected result/edge reference inspection, unanswered rewind lock and Submit/Reveal, failure fallback, heap ordered-intermediate rejection, graph moved-node+selected-edge Keep/Escape/Apply, command versus example retention, stale dialog and saved-data retention. Capture pending/reply/preview/error/fallback screenshots and keyboard target/focus results. Any discovered logic bug gets a failing regression before its fix.
- [ ] Commit verified panel/adapter/styles as `feat: add shared tutor panel and reviewed example actions`.

### Task 5: live evidence, fresh review and one feature PR

**Files:** Task 5 row; no placeholder success report.
**Consumes:** Completed Tasks 1–4 and all nine acceptance criteria.
**Produces:** Measured implementation report with per-criterion evidence, live model
profile/answers and one completed feature PR to development when verified.

- [ ] Read the installed local model inventory and Ollama version. Earlier draft API unavailability is historical, not a fresh result. Before invoking a model, verify the daemon is local-only using the documented cloud-disabled setting/log, and use an already installed chat-capable tag. If a separate local helper is needed, launch it hidden with process-scoped local-only environment; do not overwrite global Ollama settings, stop the user's service or download a model. If no usable installed model can run, finish independent checks and report that precise live-evaluation blocker; do not mark the slice verified or fabricate 20 answers.
- [ ] Run all 20 fixed provider-answer cases from spec §16 (H1–H10/G1–G10), using their exact inputs/commands/ordinals and independent oracle facts. Sequential requests respect six admissions/minute and the single slot; use legitimate injected test time only in unit tests, never to disguise live throttling. Record case ID/question/context/validated reply, model tag/digest/version, device/CPU-GPU profile, warm/cold status and latency. Persist this explicit development evaluation evidence only; production logging stays content-free. Pending eligibility/cancellation are extra checks and cannot replace any of the 20 answers.
- [ ] Evaluate each answer against its oracle, marking correct/incorrect, critical contradiction, invented reference and hidden-answer leak. At least 18/20 must agree with the verified state; any critical contradiction/leak blocks that behavior. Record evaluator judgments separately from observed schema/transport facts, and present all 20 answers for owner/human review; an agent's evaluation does not become a learner pilot or independent human correctness verdict.
- [ ] In the real mounted app, delay replies past seek/selection/layer/checkpoint/attempt/reset/route changes, including away-and-back and immediately followed Play. Check Strict Mode mount/cleanup/remount and hydration without duplicate requests or stale state. Move camera/layout/change speed while a reply remains valid. Measure client waiting clears within 15 seconds and preserve authored learning/storage on offline/unconfigured/invalid-output/rate/busy/timeout paths. Use injected fake transport to prove failures; label those separately from real Ollama evidence.
- [ ] Run `npm test` (existing 52 behavioral tests plus new focused checks), `npm run typecheck`, `npm run build`, `python scripts/check-context.py`, `git diff --check` and staged whitespace. Read output and record exact commands/results. No engine or renderer regression is assumed from a passing route test. Stop temporary processes and preserve needed evidence.
- [ ] Obtain one fresh whole-branch reviewer through requesting-code-review, with the accepted spec/plan, base `4ff498cc746bfd41a1a9dd6af1952bb7d462544a`, exact head and runtime evidence. Use the current most capable available review model according to the skill, rather than copying an obsolete name. Root handles findings under receiving-code-review, with focused regressions/rechecks; no per-task implementation reviewers. No unresolved material findings at delivery.
- [ ] Sync README, backlog, development/source context and plan/report status to actual results. Record unchecked physical-device/screen-reader/learner/persistent GPU claims and live/human blockers explicitly. Keep accepted-spec meaning unchanged; amendments still need owner acceptance. Commit as `docs: record contextual tutor verification and review`.
- [ ] Push feature/contextual-tutor, verify remote head, then create and attach one feature PR targeting development with final behavior, checks, limitations and inherited PR #8/#9 dependency state read freshly. Do not merge or retarget dependencies automatically. If required live or human review remains pending, report that gate and use an explicitly unverified draft PR only when it helps owner review; do not label the completed slice ready to merge.

## Coverage and self-review

| Accepted requirement | Owning proof |
| --- | --- |
| AC-1 reconstruction, s0 semantics, malformed trace | Task 1 metadata/context checks; Task 3 identity checks |
| AC-2 both routes and narrow payload | Task 1 projection tests; Task 2 captured request; Tasks 4/5 mounted routes |
| AC-3 pending/rewind/Submit/Reveal | Tasks 2/3 zero-provider checks; Task 4 UI |
| AC-4 curated/command preview and guards | Tasks 1/3 atomic candidate checks; Task 4 graph/heap journeys |
| AC-5 stale reply and harmless presentation | Task 3 deferred harness; Task 5 mounted lifecycle |
| AC-6 caps, limits, failures and resource cleanup | Task 2 HTTP/adapter tests; Tasks 4/5 fallback |
| AC-7 real 20-answer evaluation and human review | Task 5 recorded profile, answers, judgments and owner review |
| AC-8 responsive/keyboard/44 px/deadline | Task 4 browser journeys; Task 5 measured waiting |
| AC-9 regression/type/build/context/review | Each task's checks; Task 5 fresh review |

Self-review completed while drafting: every spec section maps above; later task
names/types match their producing interface; the five Review Focus cases each
have an owning test/journey. The plan chooses file boundaries and test seams,
without implementing the adapter/controller bodies. No open design question is
delegated to implementation. The installed model/runtime and human evaluation
remain evidence to collect, not acceptance already earned.

## Owner review gate

Native execution is preserved. Review reconstruction and metadata, timeout/slot
cleanup, and the shared preview versus graph confirmation most closely. The
owner must accept this written plan before any implementation task starts;
specification acceptance is recorded separately above. No extra planning PR.
