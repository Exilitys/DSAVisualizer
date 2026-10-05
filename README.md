# DSAVisualizer

DSA Atlas is a browser learning playground for data structures and algorithms,
with interactive 3D scenes, synchronized representations, reversible execution,
prediction challenges, and explanations tied to the selected state.

## Current status

The technical review packet was accepted through the owner's "Continue" on
5 October 2026. Groundwork has inventoried the context gaps and is awaiting
confirmation of its minimal file list. The confirmed release
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
- [Architecture and state flow](docs/architecture/system.md)

Groundwork is the next phase: project context, development lanes, and contract
checks. The proposed setup reuses these specs and the diagram.

## Branch workflow

| Branch | Purpose | Review path |
| --- | --- | --- |
| `main` | Production releases | Promote reviewed changes from `development` through a PR. |
| `development` | Integration | Receive feature PRs after user review and acceptance. |
| `feature/<topic>` | Focused changes based on `development` | Open a PR targeting `development`. |

PR #1 established the brief and was merged into `development` on 5 October
2026. The next planning work is on `feature/dsa-atlas-technical-spec`, with its
PR targeting `development`. User acceptance is required before merging a
feature PR; publication of a draft does not mark its specification accepted.
