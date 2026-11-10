# Application source

Read the [development guide](../docs/development.md), [accepted slice](../docs/specs/001-heap-insertion.md),
and [invariants](../docs/architecture/invariants.md) before changing this directory.
The heap extension is [extraction and autoplay](../docs/specs/002-heap-extraction-playback.md).
The graph slice is [graph traversal](../docs/specs/003-graph-traversal.md);
its [Native build plan](../docs/superpowers/plans/2026-10-15-graph-traversal.md) was accepted 2026-10-15 through “Continue”.
Keep core and lesson engines independent of React, renderer resources, time, and network calls.
The shared player owns the selected ordinal; scene adapters own camera and layout only.
Graph conventions live in [its module context](lessons/graph/AGENTS.md); actual checks live in [the verification report](../docs/reviews/003-graph-traversal.md).

The accepted [learning slice](../docs/specs/004-learning-challenges.md) owns activity and storage behavior.
[learning.ts](core/learning.ts) owns pure activity transitions; [learning-storage.ts](core/learning-storage.ts) owns browser persistence.
[useLessonPlayer.ts](components/useLessonPlayer.ts) binds the existing timer and storage; [LearningPanel.tsx](components/LearningPanel.tsx) is shared by both adapters.
Keep grading and persistence outside React updater functions. Current learning checks are in [the report](../docs/reviews/004-learning-challenges.md).
