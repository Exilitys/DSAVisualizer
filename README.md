# DSAVisualizer

DSA Atlas is a browser learning playground for data structures and algorithms,
with interactive 3D scenes, synchronized representations, reversible execution,
prediction challenges, and explanations tied to the selected state.

## Current status

The project is in Blueprint specification review. The confirmed release
requires a min heap and graph traversal with BFS and DFS, implemented as code
modules using a shared lesson framework. The first slice is heap insertion
with synchronized tree and array views.

The build is solo, with 2–3 hours available per day. The selected technical
direction is Next.js with React Three Fiber and an integrated tutor endpoint,
shared visual primitives with a scene adapter per lesson, and immutable
snapshots for replay. The complete technical specification remains under review.

## Project documents

- [Product requirements](prd.md)
- [Blueprint intake and confirmed choices](docs/prd/intake.md)

After the technical specification and review diagram are accepted, Groundwork
will establish the project context, development lanes, and contract checks.

## Branch workflow

| Branch | Purpose | Review path |
| --- | --- | --- |
| `main` | Production releases | Promote reviewed changes from `development` through a PR. |
| `development` | Integration | Receive feature PRs after user review and acceptance. |
| `feature/<topic>` | Focused changes based on `development` | Open a PR targeting `development`. |

The current planning work is on `feature/dsa-atlas-blueprint`. Its PR targets
`development`. User acceptance is required before merging a feature PR;
publication of a draft does not mark its specification accepted.
