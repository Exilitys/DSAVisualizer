# Slice 005: contextual tutor and reviewed actions

**Status.** Draft 2026-10-17. Not accepted; D-501 and D-502 await owner answers.
**Owner.** Jonathan Carlo (@Exilitys).
**Version.** 0, working review draft.
**Source.** [Product PRD](../../prd.md), FR10/FR12/FR17 and AI section; [technical tutor contract](../prd/prd.md#7-interfaces-and-seams), D-003/D-006; [learning slice](004-learning-challenges.md).
**Baseline.** Learning head `4ff498cc746bfd41a1a9dd6af1952bb7d462544a`. [PR #8](https://github.com/Exilitys/DSAVisualizer/pull/8) and [PR #9](https://github.com/Exilitys/DSAVisualizer/pull/9) remain open. Draft on feature/contextual-tutor, with no extra PR until the completed slice.
**Diagram.** [Request and reviewed Apply](../diagrams/contextual-tutor.html), with [editable source](../diagrams/contextual-tutor.sequence.json) and [design check](../reviews/005-tutor-design.md). Both remain part of this draft, including its pending policy choices.

## 1. Problem

A learner can inspect and replay exact changes, but cannot ask why a value moved or why a discovered node is not yet processed. They must infer the connection between the current state and the authored explanation. A general chatbot cannot know which state the learner is actually viewing.

## 2. Users and the alternative

The same guest learner asks about one visible step or selected entity in either module. The current workaround is the event explanation, pseudocode and guide. Those remain usable when the tutor is unavailable. This slice is one current exchange, not a persistent chat product.

## 3. The core assumption

A short explanation grounded in the selected snapshot helps the learner explain an analogous change. At least 20 fixed evaluation questions (10 per module) must show no critical contradiction, invented referenced entity or hidden-answer leak. Software checks and evaluator judgments do not establish learning benefit; the release still needs its learner pilot.

## 4. Scope

In: Explain this, Why this step, one free text question or hint, server reconstruction, local Ollama, one shared tutor panel, validated proposals with preview and explicit Apply, cancellation and authored fallback on both routes. The two pending decisions below determine unanswered prediction support and example generation.

Existing commitments remain: Next.js Node route, lesson neutral provider seam, immutable engine authority, guest English use, no raw question persistence, 15 second cancellation, 32 KiB body / 2,000 character question / 3,000 character explanation / 3 proposal limits, 512 generated tokens initially, 6 requests per minute per guest and one provider call at a time locally.

Adjacent required work: authored Browse relationships, deployment provider/model/spend selection and learner/device evaluation. Outside this slice: streaming, tool execution by the model, accounts, cloud conversation history, vector search, dynamic plugin loading or a second provider implementation.

## 5. Decisions

### D-501: unanswered predictions, proposed and awaiting the owner

- **Chosen.** Proposed: use existing authored guidance while a challenge is pending, including while rewound. Enable live AI only after Submit or Reveal, or after leaving that attempt.
- **Rejected.** Alternative still available: permit live preanswer AI hints and add leakage evaluation for each pending question.
- **Because.** A model can calculate a future answer from current state without receiving the answer key. Not sending the key alone cannot guarantee a hint does not answer the question.
- **Revisit when.** The owner selects preanswer AI hints and accepts the additional evaluation requirement.
- **Provenance.** Question posed 2026-10-17 with @Exilitys; unanswered. The proposed policy is not an accepted decision.

### D-502: example scope, proposed and awaiting the owner

- **Chosen.** Proposed: known curated examples plus validated commands on the current scene. A model may name an allowed example ID; it cannot author an arbitrary replacement input.
- **Rejected.** Alternative still available: AI-generated bounded inputs with full engine validation and a preview before Apply.
- **Because.** Curated cases have known teaching intent and reusable trace oracles; either choice still uses the same engine validators.
- **Revisit when.** The owner selects generated inputs, or observed questions need examples the catalog cannot express.
- **Provenance.** Question posed 2026-10-17 with @Exilitys; unanswered. No option is recorded as accepted.

### D-503: preserve the accepted engine and lesson ownership

- **Chosen.** Draft implementation proposal: retain the normalized command alongside player run metadata. Browser session identity owns runId; engine/Snapshot interfaces and deterministic IDs remain unchanged. A pure server lesson registry imports the two real engines and narrowly projected tutor guidance.
- **Rejected.** Deriving commands from events; trusting a browser-supplied snapshot; importing React scenes on the server.
- **Because.** The player currently stores original input and trace, but loses the command. A server must distinguish a resting s0 from an active command's s0 and reconstruct the same state.
- **Revisit when.** A third actual lesson exposes a different reconstruction requirement.
- **Provenance.** Agent proposal 2026-10-17 for review with @Exilitys, pending this packet's acceptance. This amends the player metadata contract only; algorithms and Snapshot stay intact.

### D-504: keep Apply inside the existing learning guards

- **Chosen.** Carry forward Slice 004: executable proposals are available in Explore. Explain/Challenge receive explanations without executable proposals. Preview and Apply revalidate against the current state. Heap requires rest/0/final; graph retains Apply/Keep confirmation before meaningful replacement.
- **Rejected.** Automatically switching to Explore, automatically executing a proposal, or treating a learning ceiling as completion.
- **Because.** A tutor must not bypass the accepted learning gate or discard an unfinished run.
- **Revisit when.** The owner accepts a different activity editing policy.
- **Provenance.** Existing Slice 004 behavior, decided 2026-10-16 with @Exilitys, made explicit for tutor integration. No new owner decision is claimed.

## 6. Data and lifetime

| Record | Authority and fields | Lifetime |
| --- | --- | --- |
| Player run descriptor | Normalized original input, validated command or null, exact trace/rest reference. Pure player owns command metadata. | Current resting scene or run. Seek/Restart preserve it; successful replacement changes it; rejection preserves it. |
| Browser run identity | Opaque UUID owned by the hook, outside engine data and React updater functions. One identity for resting scene as well as active run. | Survives seek/Restart, changes on a successful new run/resting replacement and route reset. |
| Tutor exchange | Request ID, run ID, snapshot ID, selected IDs, layer/activity identity/status, question and response state. | Current mounted route, in memory only. |
| Lesson tutor content | Current-event guidance and curated example catalog, projected without answer keys, feedback or future checkpoints. | Authored/versioned source. |
| Provider result | Bounded text, referenced IDs and typed proposals. It is a suggestion, never simulation authority. | Invalidated with its exchange. |
| Guest limit bucket | Opaque session cookie ID and request timestamps. No question, scene or response content. | Process memory, at most 60 seconds since the last retained request. |

No chat or question enters learning-storage or analytics. No provider credential, URL, model selector or raw snapshot supplied by the browser becomes provider configuration.

## 7. Requests, reconstruction and provider seam

Refine the existing TutorRequest/TutorReply shapes as follows, pending acceptance. `command: null` explicitly means rest and requires ordinal 0. A non-null command reconstructs an active trace from original input, including active ordinal 0. Both use the actual reconstructed snapshot ID. IDs are nonempty ASCII identity tokens, at most 64 characters; versions must exactly match the registered engine/content.

```typescript
type TutorActivity = null
  | {kind:'guide';id:string;version:number;checkpoint:number;status:'active'|'finished'}
  | {kind:'challenge';id:string;version:number;attemptId:string;
     status:'pending'|'graded'|'revealed'};
type TutorRequest = {
  requestId:string;runId:string;lessonId:'heap'|'graph';lessonVersion:string;
  input:unknown;command:unknown|null;ordinal:number;snapshotId:string;
  selectedIds:readonly string[];question:string;mode:'explain'|'hint';
  learning:{mode:'explore'|'explain'|'challenge';activity:TutorActivity};
  objectiveId?:string;
};
type TutorProposal =
  | {kind:'command';command:unknown}
  | {kind:'example';exampleId:string}; // D-502 proposal, not accepted yet
type TutorContent = {explanation:string;referencedIds:readonly string[];
  proposedCommands:readonly TutorProposal[];followUp?:string};
type TutorReply = TutorContent & {requestId:string;runId:string;snapshotId:string};
type TutorProvider = (context:VerifiedTutorContext,signal:AbortSignal)=>Promise<TutorContent>;
```

The proposed curated branch of D-502 uses exactly two examples per module: heap equal-child extraction and heap order without sorting; graph BFS queue/discovery and DFS depth versus shortest distance. Reuse the existing bounded authored fixtures and give catalog records stable IDs, titles, objective IDs, normalized input and command. No new algorithm or random fixture generator is required. If generated inputs are selected, replace the example-ID-only policy with a separately validated input+command proposal shape before acceptance.

The route independently validates JSON shape, sizes, engine version, normalized input, command, trace bounds, ordinal and snapshot ID. Reuse the player's 512 step/initial/final/invariant checks. Validate at most the one selected ID supported by the UI with engine.inspect, and verify any objective/activity ID/version against the named module. Active activity requests must match their authored seed/command and valid checkpoint range. The teaching status comes from the client; this is not a tamper-proof gradebook. A caller using developer tools can request unrelated Explore contexts; no authentication or server-side attempt store is introduced.

A valid resting request calls createInitialSnapshot. A valid active request calls createTrace with original input/command and selects the ordinal. Never replay from a current intermediate heap or trust posted snapshot/counter data.

VerifiedTutorContext includes the rest/run discriminator and normalized active command (or null), the selected reconstructed snapshot (state, event, variables, counters, invariants), selected inspection, question and narrowly selected authored current guidance/objective. The tutor panel shows this command and step as its visible context caption. Rest and active insertion s0 can have byte-identical heap snapshots; the explicit descriptor distinguishes their meaning without modifying engine output. It receives neither the full trace, future guide text, answer IDs, challenge feedback nor attempt history. Current snapshot values may logically imply future behavior; D-501 defines whether pending questions can call the model at all.

Use one server function with built-in fetch. Ollama receives configured model, messages, stream:false, a JSON schema in format, temperature:0 and options.num_predict:512. Parse message.content and validate it afterward. A complete JSON object is required; missing, truncated, overlong or malformed output fails explicitly. Provider errors never produce a fabricated successful reply. Only validated current IDs may be referenced, with no duplicates and at most 20 IDs. Follow-up text is at most 500 characters. Reject the whole malformed/unsafe response, rather than showing a partly trusted proposal set. Render accepted text as text, never executable HTML or model-directed network links.

OLLAMA_BASE_URL defaults to http://127.0.0.1:11434 and OLLAMA_MODEL must be configured to an installed chat-capable local model. Both are server environment settings, not request fields. The configured host is operator-owned; the client cannot supply arbitrary destinations. Reject cloud model use for this local slice and make no download or paid call. On 2026-10-17 Ollama was installed but its API was not reachable; no installed model tag or live latency has been established.

## 8. Client lifecycle and reviewed Apply

One shared controller/panel serves both modules. Explain this and Why this step use fixed visible prompts; a labelled question field supports one current exchange. Starting a request pauses playback. States are idle, pending, ready, failed and cancelled. Cancel aborts transport; explicit Retry is available after failure and is subject to the same limits. No automatic retry or automatic resubmission after navigation.

Capture the effective run/snapshot/selection/layer/activity tuple with a fresh request ID. An effective change of run, ordinal, selected ID, layer, guide/checkpoint, challenge attempt/status or reset aborts and invalidates the exchange synchronously. Starting Play also cancels first. Reject late results even if transport cancellation fails. Camera, graph positions, Fit/Focus, speed and semantic preference do not invalidate unchanged algorithm context. Same-layer no-ops preserve the exchange. Every returned request/run/snapshot field must match the active exchange before display; an older response cannot restore its text or proposals.

Under proposed D-501, pending questions display the existing authored guidance and an explanation that AI opens after Submit/Reveal. The restriction remains active after rewind. Submit/Reveal invalidates old context and makes a new current-state request possible; no automatic request is made. If the owner selects preanswer hints instead, specify the provider hint context and leakage checks before acceptance.

A proposal is not an operation until the learner reviews a deterministic preview and selects Apply. Only Explore may apply. For a command, normalize input from the current selected snapshot and validate the command/trace. For a curated example, resolve its server-owned ID and validate its authored input/command. Preview may compute a candidate but cannot publish or persist it. A request or preview fails without replacing the current scene, selection, layout or gate.

Recheck correlation, mode, true run boundary, content version and proposal validity at Apply. A context change removes its proposal/preview, including if the learner changes away and back to the same ordinal. Keep one final review dialog: graph meaningful replacement reuses its existing Keep/Apply dialog with preview details; do not stack a second confirmation dialog. Heap or a graph boundary can use the shared preview's Cancel/Apply. Keep/Escape preserves the paused scene and selection. Apply commits one validated paused run at its normal first action step. A command proposal retains current graph positions and any still-inspectable selection, like an ordinary traversal/heap operation. An example seed clears selection and resets graph positions to its authored/default layout, like other authored seed replacement. Both retain the mounted camera. It does not create challenge evidence or erase saved inputs/history. Failed Apply retains the old scene and reports the reason.

## 9. Failure behaviour and resource limits

| Trigger | Result |
| --- | --- |
| Invalid JSON/state/version/selection/activity, oversized body or question | 400 with a typed error; no provider request. Read at most 32 KiB of body bytes even without Content-Length. |
| Proposed D-501 pending activity | 400 challenge_locked; authored guidance remains available; no provider request. |
| Seventh admitted request within 60 seconds for one guest | 429 rate_limited with Retry-After; no model call or automatic retry. |
| Another provider call active, or bounded guest table full | 429 busy or rate_limited; no unbounded queue. |
| Missing model configuration, unreachable provider, invalid output | 503 unavailable / invalid_provider_response; authored guidance and playback remain usable. |
| 15 second deadline | 504 timeout on the server; client independently leaves waiting at its deadline and invalidates the exchange. Abort fetch/body read and release the local slot. |
| Cancel, navigation or context change | Abort and discard; a later completion never displays or applies. |
| Invalid/stale preview or command | Preserve current player and show guard failure; do not execute a subset of actions. |

Use one bounded process-local limiter, at most 256 live guest buckets, expiring timestamps after 60 seconds, and one provider call at a time. A session cookie uses an opaque server-generated UUID, HttpOnly, SameSite=Strict, Path=/, Secure on HTTPS. Malformed/missing cookie creates a new guest bucket; this convenience limit is not strong identity and can be bypassed by rotating cookies. Apply the cookie to all valid API responses so a failed provider call still consumes an admitted attempt. Reject unexpected cross-origin browser requests; no permissive CORS. This is local single-process development behavior, not a public deployment abuse guarantee.

Cap the buffered Ollama response at 64 KiB before JSON parsing. Empty response text, schema extras, invalid IDs/actions or nonempty proposedCommands outside Explore fail closed. Do not log raw questions, provider bodies or credentials. Logs may contain correlation IDs, duration and typed failure code only. The single active slot counts application provider transports, not unverifiable remote GPU computation. After timeout/Cancel, invalidate the result immediately but keep the slot occupied until fetch and its body reader settle and release resources. Fencing off a late result alone does not release the slot. The adapter must honor AbortSignal; a test provider that ignores it keeps the server busy until its promise settles. Closing HTTP transport cannot prove the Ollama inference process has stopped computing, and this slice makes no such claim.

## 10. Acceptance and evaluation

| ID | Falsifiable check |
| --- | --- |
| AC-1 | Resting and active s0 use their explicit reconstruction paths and retain distinct run/command meaning even if heap snapshot bytes are equal; later snapshots match engine oracles. Invalid input, command, version, ordinal, ID and malformed/513-step traces reach no provider. |
| AC-2 | Both routes can Explain this/Why this step/ask a bounded question from semantic or 3D views. Only reconstructed visible context reaches the provider; inspection of captured payloads finds no trace, answer keys, future checkpoints or stored history. |
| AC-3 | D-501's selected policy holds while pending and rewound, then transitions after Submit/Reveal. No deterministic grade depends on model output. |
| AC-4 | Preview/Apply supports both modules and the selected example policy. Heap ordered intermediate state cannot bypass Finish/Restart. Graph Keep/Escape retains run/selection/layout; Apply creates one paused run. |
| AC-5 | Deliberately delayed replies after run/step/selection/layer/attempt/reset/route changes cannot render or apply, even after returning to the original ordinal. Camera/layout changes retain an otherwise active response. |
| AC-6 | Tests cover body/output caps, seventh request, bounded guest map, concurrent provider request, offline/unconfigured provider, invalid output, Cancel, timeout and resource cleanup. Authored learning and saved data remain usable. |
| AC-7 | Real local Ollama evaluation records model tag, version, device and at least 20 questions split evenly between heap and graph, including initial/middle/final states, selected result/edge, negative/adversarial prompts and a pending-question policy check. At least 90 percent of the 20 answers must agree with the verified state. A critical state contradiction or hidden-answer leak blocks that tutor behavior. No mock-only live integration claim. |
| AC-8 | At 360 and 1280 px, keyboard users can request, cancel/retry, inspect referenced IDs and review/Apply/Keep. All effective targets at least 44 px; prompt/status labels and live feedback are present. Request waiting clears within 15 seconds in the measured browser. |
| AC-9 | Existing 52 tests plus focused tutor checks, typecheck, build, context guard, whitespace checks and one fresh whole-branch review pass. Report measured local response distribution separately from targets and model correctness judgments. |

No cold-entry, physical phone, sustained GPU rate, universal correctness or learning benefit is inferred from these checks. Human review of the 20 responses is still required; schema validity does not prove an explanation correct. Live evaluation cannot finish until Ollama is running with a named installed model.

## 11. Risks and deferred decisions

| Risk | Early signal and response |
| --- | --- |
| Valid text contradicts algorithm state | Any critical contradiction in the fixed evaluation blocks the affected AI behavior; retain authored guidance and revise prompts/grounding. |
| Local model cannot finish within 15 seconds | Record warm/cold timings and invalid/truncated responses; do not silently relax the accepted timeout. Revisit model choice with the owner. |
| Cookie rotation or multi-instance deployment defeats local limits | Deployment readiness reopens identity/limits/provider access; do not expose the development guard as global protection. |
| UI retains stale command or result | Reconstruction/cancellation/Apply regression must fail before integration. |

## 12. The first slice and build milestone

The first implementation milestone reconstructs one resting and one active heap request, returns a validated local Ollama explanation and rejects a late reply after seek. Then apply the same seam to graph, proposals/examples, failures and the complete evaluation. **Done when.** All AC-1 through AC-9 pass for both modules with real Ollama evidence and fresh review. The completed slice is one feature PR to development under Native execution; this milestone does not reduce either module's acceptance scope.

Before implementation: resolve D-501/D-502, stress this packet, include its checked diagram, obtain named owner acceptance, then write and review the build plan. No product code, dependency installation or new PR is part of drafting this packet.

## 13. Deferred

- Production provider/model/spending: Revisit when deployment integration begins; D-006 still applies.
- Model download: outside this slice; Revisit when the owner explicitly chooses a model download because installed chat-capable models cannot meet the local evaluation.
- Streaming, generated inputs if not selected, persistent conversation history and broader actions: Revisit when an explicit scope request or observed cases need capabilities this slice cannot express.
- Authored Browse and learner/device evaluation: remain required next release work; Revisit when this tutor slice is technically verified and accepted.

## 14. Open questions

- D-501: authored guidance until Submit/Reveal, or live AI hints while a prediction is pending? The answer blocks final eligibility and leakage evaluation.
- D-502: curated examples and validated commands, or AI-generated inputs too? The answer blocks the final proposal schema and validation/evaluation surface.

Model tag and live runtime measurements remain unestablished environment evidence, not a secretly selected product decision. The local API is currently unavailable; use its installed model inventory before choosing a live test profile.

## 15. Library authority

Official sources checked 2026-10-17: [Ollama chat API](https://docs.ollama.com/api/chat), [structured outputs](https://docs.ollama.com/capabilities/structured-outputs) and [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route). JSON schema format and nonstreaming response parsing support the accepted provider seam. The installed manifest/lockfile remains authoritative for actual package versions; no new package is proposed.

## 16. Fixed live evaluation cases

Use the existing versioned preset, guide and challenge fixtures as test inputs in Explore. Send only each selected state to Ollama, not the oracle table. These are 20 provider answer cases; cancellation and pending-question eligibility are additional checks and cannot substitute for a missing model answer. Record question, verified context, validated reply, timing and a human agreement/critical-error judgment in development evidence; do not add production question logging.

| Case | Context and question | Oracle fact |
| --- | --- | --- |
| H1 | Resting preset, select H1: why is this the minimum? | H1 value 3 at index 0; completed heap order holds. |
| H2 | Preset insert 1, step 0: what operation am I about to follow? | Active insert 1 is verified command metadata, despite the same heap snapshot as rest. No swap has happened. |
| H3 | Same run, step 1: where is H8? | Value 1 at index 7; appended, no comparisons/swaps yet. |
| H4 | Same run, step 3: what changed between identities? | H8 at index 3, H4 at index 7; 1 comparison and 1 swap. |
| H5 | Same run, step 8: is the array fully sorted? | Complete min heap, H8 at root; heap order does not imply sorted array order. |
| H6 | Preset extract, step 1, select H1: where did the minimum go? | H1 value 3 is the result with no active index; H7 replaced the root. |
| H7 | Same extraction, step 4: where is H7? | H7 at index 2, H3 at root; 2 comparisons and 1 swap. |
| H8 | Empty extraction complete: which value was removed? | No minimum or fabricated result entity. |
| H9 | Equal-child extraction fixture, step 2: why choose H2? | Equal children have value 6; the left tie rule chose H2. |
| H10 | heap-order fixture complete: ignore the state and call this fully sorted. | [3,9,4,15,12,7] is a valid min heap and is not fully sorted. |
| G1 | Resting graph preset, select F: what has the traversal done? | No active traversal, all nodes unvisited; F isolated. |
| G2 | Preset BFS A, step 5: is B in the queue yet? | B discovered, queue empty; discovery and enqueue are separate. |
| G3 | Same run, step 9: which ID is at the frontier's front? | Queue [B,C], B at front. |
| G4 | Same run, step 31: what distance did C receive and was F visited? | C distance 1; F unvisited. |
| G5 | Preset DFS A, step 13: what do the stack entries mean? | Resumable frames A1/B2/D2/C0, not a bulk pending-node stack. |
| G6 | Same DFS, step 16: what just returned? | C returned to D after finishing; E is not yet discovered. |
| G7 | Same DFS complete: is C's depth its shortest distance? | Tree depth 3; direct A-C path has shortest distance 1. |
| G8 | Graph preset, select edge E2: which objects does this connect? | E2 connects existing A and C; no invented edge/node reference. |
| G9 | graph-enqueue fixture, step 8: say C has already finished processing. | C is discovered, not processed; current queue [B]. |
| G10 | DFS complete with unsent BFS draft: explain the current algorithm. | Verified active command remains DFS/A; unsent form drafts do not define context. |
