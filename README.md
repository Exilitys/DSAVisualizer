# DSAVisualizer

DSA Atlas is a browser learning playground for data structures and algorithms,
with interactive 3D scenes, synchronized representations, reversible execution,
prediction challenges, and explanations tied to the selected state.

## Current status

The technical review packet was accepted through the owner's "Continue" on
5 October 2026. The owner merged and accepted Groundwork in PR #2. The
owner accepted the first-slice implementation plan and Native execution on
6 October 2026. Heap insertion was merged into `development` in PR #4 on
7 October 2026. The confirmed release
requires a min heap and graph traversal with BFS and DFS, implemented as code
modules using a shared lesson framework. The first slice is heap insertion
with synchronized tree and array views. Extraction and shared autoplay were
merged into `development` in PR #7 on 13 October 2026. The next
[graph specification](docs/specs/003-graph-traversal.md) was accepted on
15 October 2026; its [Native build plan](docs/superpowers/plans/2026-10-15-graph-traversal.md)
was accepted through “Continue” that day. Editable graph traversal is implemented
on `feature/graph-traversal`; [verification evidence](docs/reviews/003-graph-traversal.md)
records the actual checks and remaining learner/device limits. [PR #8](https://github.com/Exilitys/DSAVisualizer/pull/8) targets `development` for owner review.

The build is solo, with 2–3 hours available per day. The selected technical
direction is Next.js with React Three Fiber and an integrated tutor endpoint,
shared visual primitives with a scene adapter per lesson, and immutable
snapshots for replay. The accepted technical specification owns the contracts.

## Project documents

- [Product requirements](prd.md)
- [Blueprint intake and confirmed choices](docs/prd/intake.md)
- [Technical specification](docs/prd/prd.md)
- [First slice: heap insertion](docs/specs/001-heap-insertion.md)
- [Heap insertion implementation plan](docs/superpowers/plans/2026-10-05-heap-insertion.md)
- [Heap extraction and autoplay](docs/specs/002-heap-extraction-playback.md)
- [Extraction and playback verification](docs/reviews/002-heap-extraction-playback.md)
- [Editable graph, BFS and DFS](docs/specs/003-graph-traversal.md)
- [Graph verification](docs/reviews/003-graph-traversal.md)
- [Architecture and state flow](docs/architecture/system.md)

Groundwork establishes the accepted project context, development lanes, and
contract checks. [Verification evidence](docs/reviews/001-heap-insertion.md)
records the first slice's actual engine, browser, and build checks.

## Run locally

Use Node 24.15 or newer within Node 24, plus Python 3.10 or newer for the
documentation guard. From the application checkout:

```text
npm ci
npm run dev
```

Open [the local playground](http://127.0.0.1:3000). Insert 1, select H8,
then seek to step 3 to inspect index 3 and one comparison and swap.
Restart, then extract the minimum. Select H1 in the result card to inspect the
removed value; at step 4, H7 is at index 2 with two comparisons and one swap.
Play/Pause and 0.5×/1×/2× speed controls replay either operation. Next, Previous,
Restart, and the timeline share one immutable snapshot and pause autoplay.
Fit scene recovers the camera. Reduce motion and Semantic view only are
available beside the scene.

Open [Graph](http://127.0.0.1:3000/graph), choose BFS and start A. Step 5 discovers
B before enqueueing it; step 9 has queue B,C. Complete, then run DFS from A:
step 13 shows four resumable frames and step 16 returns C to D before discovering E.
Inspect C to compare BFS distance 1 with DFS tree depth 3. Add/remove nodes,
connect/disconnect edges, or move a selected node with X/Y controls. Valid input
edits rerun the last command; an intermediate run asks Apply or Keep traversal.
Deleting the start clears the run. Reset layout and Fit recover presentation.

```text
npm test
npm run typecheck
npm run build
python scripts/check-context.py
git diff --check
```

The engine/player and playback tests use Node's built in runner. Type checking
generates Next's route types before checking TypeScript. No AI service is needed
for this slice.

## Project context

- [Agent router](AGENTS.md)
- [Development standards and library authority](docs/development.md)
- [Invariants and contract paths](docs/architecture/invariants.md)
- [Next work](docs/backlog.md)

With Python 3.10 or newer, run from the repository root:

```text
python scripts/check-context.py
```

The standard-library guard checks context pointers, contract-list consistency,
human acceptance records, and diagram evidence binding. Application checks
are separate commands in the package manifest.

## Branch workflow

| Branch | Purpose | Review path |
| --- | --- | --- |
| `main` | Production releases | Promote reviewed changes from `development` through a PR. |
| `development` | Integration | Receive feature PRs after user review and acceptance. |
| `feature/<topic>` | Focused changes based on `development` | Open a PR targeting `development`. |

PR #1 established the brief and was merged into `development` on 5 October
2026. PR #2 accepted the technical specification and context. Heap insertion
was merged in PR #4; extraction/autoplay was merged in PR #7. Graph traversal uses `feature/graph-traversal`.
The owner requested fewer PRs: bundle planning and context updates with each
feature, record their acceptance in chat, then open one completed PR to `development`.
User acceptance is required before merging a
feature PR; publication of a draft does not mark its specification accepted.
