# DSAVisualizer

DSA Atlas is a browser learning playground for data structures and algorithms,
with interactive 3D scenes, synchronized representations, reversible execution,
prediction challenges, and explanations tied to the selected state.

## Current status

The technical review packet was accepted through the owner's "Continue" on
5 October 2026. The owner merged and accepted Groundwork in PR #2. The
owner accepted the first-slice implementation plan and Native execution on
6 October 2026. Heap insertion is implemented and pending feature review. The confirmed release
requires a min heap and graph traversal with BFS and DFS, implemented as code
modules using a shared lesson framework. The first slice is heap insertion
with synchronized tree and array views.

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
Next, Previous, Restart, and the timeline share one immutable snapshot.
Fit scene recovers the camera. Reduce motion and Semantic view only are
available beside the scene.

```text
npm test
npm run typecheck
npm run build
python scripts/check-context.py
git diff --check
```

The tests use Node's built in runner. Type checking generates Next's route
types before checking TypeScript. No AI service is needed for this slice.

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
is on `feature/heap-insertion`, with its PR targeting `development`.
User acceptance is required before merging a
feature PR; publication of a draft does not mark its specification accepted.
