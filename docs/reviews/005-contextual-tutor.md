# Contextual tutor verification

**Status:** Native implementation and local-model evaluation complete, 10 November 2026, on `feature/contextual-tutor`. Draft [feature PR #10](https://github.com/Exilitys/DSAVisualizer/pull/10) records the remaining gates: mounted-browser journeys at 360/1280 px, the owner's review of the 20 answers, and target-learner evidence. The owner accepted [Slice 005 v1](../specs/005-contextual-tutor.md) with its diagram on 17 October 2026, reviewed at `f2604fd`, and the [Native plan](../superpowers/plans/2026-10-17-contextual-tutor.md) the same day, reviewed at `24a7d8d`.

**Scope:** Slice 005 and its accepted plan. The slice reconstructs the learner's exact state, answers through a bounded local provider, and offers reviewed proposals on both lessons. Graph BFS/DFS, authored lessons and local practice were delivered by slices 003/004 and remain in [PR #8](https://github.com/Exilitys/DSAVisualizer/pull/8) and [PR #9](https://github.com/Exilitys/DSAVisualizer/pull/9), both open to `development`. This branch is stacked on learning head `4ff498c`, exactly as the specification records.

## What this branch adds

| Seam | Implementation |
| --- | --- |
| Retained run meaning | `src/core/player.ts` keeps the normalized command beside its input, so a resting state and an active step 0 stay distinguishable when snapshot bytes match. |
| Verified context | `src/lessons/tutor.ts` projects only the current state, inspection, guidance, curated example IDs and the bounded question; traces, answer keys and future checkpoints never leave the process. |
| Bounded route | `src/app/api/tutor/route.ts` and `src/server/tutor.ts` enforce 32 KiB bodies, guest limits, one transport, origin checks, deadlines and typed failures. |
| Local provider | `src/server/ollama.ts` calls a local Ollama daemon only, validates the whole reply and fails closed on invalid content. |
| Exchange lifecycle | `src/core/tutor.ts`, `src/components/tutor.ts` and `src/components/useLessonPlayer.ts` fence stale generations, cancel on context change, and validate again before Apply. |
| Shared panel | `src/components/TutorPanel.tsx`, `LessonPlayground.tsx` and `GraphPlayground.tsx` render one exchange with authored fallback, preview dialog and graph Keep/Apply reuse. |

## Changes made while verifying

Three defects were measured against the fixed cases and fixed in this branch. All are recorded because they change what the provider receives or what the client sends, not what the accepted contract requires.

1. **Reference cap.** The local model pads `referencedIds` to the schema's `maxItems` and repeats IDs, so the validator rejected otherwise correct answers. The first fixed run produced 15/20 schema-valid replies. The schema now caps references at three, still accepts up to twenty unique IDs in validation, and carries a deferral comment. Run C reached 20/20 schema-valid replies.
2. **Grounding rules.** The system instruction now states that a value is never smaller than an equal value, that a completed heap is not a sorted array, that an extracted minimum is the result item rather than the root, what a DFS frame holds, and that only the verified processed list establishes processing. Runs A-C show the earlier wording; run D uses the current wording.
3. **Stale selection and lesson-aware copy.** After `Restart` rewinds to a state where the previously selected item cannot be inspected, the hook omits that selection instead of sending a request the reconstruction rejects with `400 invalid_request`; a regression test covers the selection filter. The panel's preview copy names the heap structure rather than claiming a graph layout.

| Run | Code under test | Schema-valid replies |
| --- | --- | --- |
| A | before the uniqueness instruction | 15/20 |
| B | uniqueness instruction only | 12/20 |
| C | three-reference cap | 20/20 |
| D | cap plus grounding rules (current branch) | 20/20 |
| E | D plus two further rules (reverted) | 20/20 |

Runs A-C are kept as [A](contextual-tutor/live-nov09-run-a-prefix-prompt.jsonl), [B](contextual-tutor/live-nov09-run-b-uniqueness.jsonl) and [C](contextual-tutor/live-nov09-run-c-reference-cap.jsonl); [D](contextual-tutor/live-nov09-evaluation.jsonl) is the graded run. They are the evidence for why the current schema and prompt differ from the first implementation, not alternative scores. [Run E](contextual-tutor/live-nov09-run-e-extra-rules.jsonl) tested rules for completion events and empty processed lists. It fixed G9 and G10 but introduced four factual regressions (16/20, [grading](contextual-tutor/evaluation-grading-run-e.json)), so it was reverted before this branch was committed; it is kept so the decision is auditable rather than re-attempted blindly.

## Live evaluation

The 20 fixed cases from specification §16 were replayed verbatim from the recorded request set, so inputs, commands, ordinals, selections, modes and questions match the accepted cases. Each request went to `POST /api/tutor` on the production build at `127.0.0.1:3013` with one guest cookie and 10.5-second spacing, which respects six admissions per minute and the single transport slot. No injected time disguised live throttling. Replay ran in-process with Node `fetch` because the session's shell executor could not start under the sandbox; headers, cookie handling and spacing are the same, but the requests did not pass through a browser.

Environment: Ollama 0.40.3 at `http://127.0.0.1:11434`, `llama3.1:8b` digest `46e0c10c039e` (Q4_K_M, 8.0B, 4920753328 bytes), RTX 3070 Laptop GPU with 8192 MiB, 31 GiB, Windows 10.0.19045, Node 24.15.0, Next.js 16.3.8. The daemon ran with process-scoped `OLLAMA_NO_CLOUD=true` and `OLLAMA_HOST=http://127.0.0.1:11434`; its own log reports `Ollama cloud disabled: true` and `Listening on 127.0.0.1:11434`. No global Ollama setting changed, no model was downloaded, and the user's service was not restarted. [Model and device profile](contextual-tutor/model-profile-nov09.json).

Observed: **20/20 HTTP 200 with schema-valid replies**. Latency was **971 ms minimum, 1,402.5 ms median, 2,198 ms p90 and 2,529 ms maximum**; no request approached the 15-second deadline. The model was warm after the preceding runs; this is not a cold-start measurement.

Grading used the specification's oracle facts. An answer agrees when every material claim about the verified state is true; imprecise but true wording does not fail a case. **18/20 agree, 2 contain secondary errors, no invented reference and no hidden-answer leak.** The answers do **not** establish a contradiction-free run: G10's closing sentence contradicts the verified completion event, so AC-7's no-contradiction clause is explicitly unclaimed and left to owner adjudication. [Per-case judgments](contextual-tutor/evaluation-grading-nov09.json), [raw run](contextual-tutor/live-nov09-evaluation.jsonl).

| Case | Verdict | Judgment |
| --- | --- | --- |
| H1 | correct | H1 holds the minimum 3 at the root. |
| H2 | correct | Active insertion identified from command metadata; no swap claimed. Value 1 is not named. |
| H3 | correct | H8 at index 7. |
| H4 | correct | H8 at 3, H4 at 7, swap named; "inserted at index 3" is loose wording for a swap. |
| H5 | correct | Completed heap order is not array sorting. |
| H6 | correct | Extracted minimum is the result item with no active index. |
| H7 | correct | H7 at index 2. |
| H8 | correct | Empty heap, no fabricated result. |
| H9 | correct | Equal children resolved by the left-child rule to H2. |
| H10 | correct | Rejects the false "fully sorted" premise. |
| G1 | correct | No traversal and null start. |
| G2 | correct | B discovered but not queued; queue empty. |
| G3 | correct | B at the frontier front. |
| G4 | correct | C distance 1; F unvisited. |
| G5 | correct | Frames hold a node and its next neighbor index. |
| G6 | correct | Returning from C at D; E not claimed. |
| G7 | correct | DFS depth is not BFS shortest distance. |
| G8 | correct | E2 connects existing A and C. |
| G9 | incorrect | Says the processed list contains A; it is empty. The central claim that C is not processed is correct. |
| G10 | incorrect | Identifies DFS from A, then says the traversal has not reached the end while the verified event is complete. |

These are the implementer's judgments, presented for owner review. They are not a learner pilot and do not establish learning benefit.

## Acceptance criteria

| Criterion | Evidence | State |
| --- | --- | --- |
| AC-1 reconstruction and malformed input | Pure reconstruction and player tests; resting and active step 0 compared; malformed traces rejected. | Met |
| AC-2 narrow context on both routes | Projection tests assert no trace, answer, checkpoint or stored history in the serialized context; captured live requests confirm the same payload. | Met in tests and payloads; mounted-route journeys pending |
| AC-3 pending and rewound predictions | Tests perform zero provider calls while pending; the 360 px capture shows authored guidance and "AI opens after Submit or Reveal." | Met |
| AC-4 preview, Apply and guards | Preview/Apply correlation and the heap boundary are covered by controller and hook tests; captures show command and example previews. The graph Keep/Escape reuse has no test of its own, and its mounted dialog journey was not re-run. | **Partial** |
| AC-5 stale replies | Deferred-fetch and fake-scheduler harness covers seeks, selections, layers, attempts, resets, away-and-back and Strict Mode remount. | Met in tests; not re-measured in a browser this session |
| AC-6 caps, limits and cleanup | Route and adapter tests cover body cap, seventh request, bounded guests, one transport, timeout, cancel and body stalls. | Met |
| AC-7 twenty live answers | Run D: 20/20 valid, 18/20 agree, 0 invented references, 0 leaks. G10 contradicts the verified event, so the no-contradiction clause is not met as written. | **Met on count, not on the contradiction clause**; owner adjudication outstanding |
| AC-8 360/1280 journeys, keyboard and 44 px targets | Captures from 19 October show the panel at 360 px in graph reply, graph preview, heap pending and 1280 px preview states. | **Pending**: this session had no interactive browser, so request/cancel/retry, keyboard focus order and target measurements were not re-measured |
| AC-9 checks, build and fresh review | Recorded below; an independent reviewer ran the checks and the live-claim audit. | Checks pass; review recorded below and on the PR |

## Checks

```text
npm test                    76 tests, 76 pass, 0 fail
npm run typecheck           exit 0 (next typegen + tsc --noEmit)
npm run build               exit 0 (production build, /api/tutor dynamic)
python scripts/check-context.py   Passed: context pointers, contract mirrors, acceptance records, and diagram binding
git diff --check            exit 0
```

No engine, renderer or learning-storage regression is inferred beyond these checks. The route tests use an injected provider; the live evaluation above is the separate real-model evidence.

## Review response

An independent reviewer, on a fresh model, returned **pass with findings** against `599ff59` and verified through the GitHub API that the branch had no PR. Each finding and its resolution:

1. **The report and backlog claimed a PR that did not exist.** Fixed: #10 now exists, and every document links to it.
2. **AC-7 claimed "no critical contradiction" while G10's note admitted one.** Fixed: the clause is unclaimed and flagged for owner adjudication, here and on the PR.
3. **AC-4 claimed graph Keep/Escape test coverage that does not exist.** Fixed: AC-4 is partial and says so.
4. **AC-2 and AC-5 were marked met although mounted-route and Strict Mode work is pending.** Fixed: both now state what is and is not covered.
5. **A stale selection made `Ask` return `400 invalid_request` after `Restart`.** Fixed with the selection filter and a regression test.
6. **`TutorPanel` hardcoded "graph layout resets" for heap previews.** Fixed with lesson-aware copy.
7. **The reference cap needs owner acceptance, and nothing tested that twenty unique references still validate.** The cap is a contract-path change recorded above and on the PR for acceptance. A positive validation test now covers the largest reachable projection (fifteen IDs, the engine's item ceiling) and rejection at sixteen; a twenty-item scene cannot be reconstructed, so the validator's twenty-item cap is unreachable from a real lesson.
8. **Report numbers were wrong or untraceable.** Fixed: model size 4,920,753,328 bytes, median 1,402.5 ms, p90 2,198 ms, environment values `true` and `http://127.0.0.1:11434`. The claim that earlier runs show earlier prompt wording is removed: JSONL evidence stores replies, not prompts, so runs A-C are now described only as earlier code.
9. **Test gaps.** Added the `trace` absence assertion to the provider payload test and a positive reference-validation test covering the largest reachable projection. Two gaps remain open and are not claimed as covered: no provider-level challenge-reply test exists (the challenge case asserts only that `q.feedback` is absent from the context), and the route test uses a fixed origin rather than an injected one.

## Limits and unchecked claims

- No physical phone, screen-reader pass or browser keyboard journey was run in this session; AC-8 remains pending.
- One laptop, one GPU and a warm model: no sustained-load, thermal, cold-start or multi-model comparison is claimed. Runs D and E were each a single replay; agreement was not sampled repeatedly.
- Guest limits are process-local development behaviour; cookie rotation and multi-instance deployment defeat them. They are not a public abuse guarantee.
- The 20 answers are graded by one reviewer. Owner or independent evaluation may judge the two secondary errors differently, including whether G10's closing sentence is a contradiction worth blocking.
- The reference cap is a deliberate ceiling for this local model and is marked in `src/server/ollama.ts` for revisit when a model or grammar enforces uniqueness.
