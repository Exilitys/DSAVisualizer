# Heap extraction and autoplay verification

**Status:** Native implementation complete; runtime verification began 7 October
2026 and final production evidence was recorded 13 October 2026. The owner merged
PR #7 that day. The target-learner explanation check remains outstanding.

**Scope:** [Accepted slice 002](../specs/002-heap-extraction-playback.md) and its
[accepted plan](../superpowers/plans/2026-10-07-heap-extraction-playback.md).
Graph BFS/DFS, tutoring, challenges and persistence remain required release work.

## Runtime evidence

The test device was Windows 10 Home Single Language 10.0.19045, Ryzen 9 5900HX,
31 GiB physical memory, with Radeon graphics and an RTX 3070 Laptop GPU listed.
The browser was Codex's in app Chromium 155.0.0.0; Node was 24.15.0.
Final browser checks used the production build at localhost port 3001.
[Device record](heap-extraction/device.json).

| Check | Observed result |
| --- | --- |
| Extraction and insertion traces | The preset extraction has seven snapshots, result H1=3, final values [5,7,6,12,9,8], counts 3/1 and counter 8. Existing insertion, trace-envelope and immutable-replay checks pass. |
| Result inspection and Restart | H1 shows extracted minimum, absent index/relationships and disabled Focus. Restart restores seven items and H1 at index 0. [Result record](heap-extraction/result-restart.json). |
| Rewind fixture | Step 4 selects H7 at index 2, counts 2/1; Previous restores step 3, H7 at index 0, counts 2/0. Active Focus and Fit retain the logical state. [Fixture record](heap-extraction/fixture.json). |
| Insertion regression | Keyboard Insert 1, Next to 3 and H8 selection show index 3 and counts 1/1, with no result card. [Record](heap-extraction/insertion-regression.json). |
| Timed playback | Actual 1× Play advanced and Pause retained the snapshot. Changing to 2× retained ordinal 2 and playing state; completion reached 6 and disabled Play. Measured first ticks were 2008.3 ms at 0.5× and 505.1 ms at 2×. [Cadence](heap-extraction/cadence.json), [keyboard playback](heap-extraction/keyboard-playback.json). |
| Cancellation | Manual Next, Previous, Home/End seek, Restart, replacement operation and invalid input stopped playback. Invalid input retained the valid cursor and error. Unit tests deliberately fired cancelled callbacks and checked run/cursor identity and one live schedule. [Browser record](heap-extraction/cancellation.json). |
| Hidden document | A temporary probe simulated document.hidden and dispatched visibilitychange. It paused at 3 and remained paused when visible again. This was a document-visibility simulation. |
| Cleanup and Strict Mode | Controller disposal/reuse checks pass. Development playback worked under Next App Router's default Strict Mode on 7 October. Source review checked silent cleanup and listener ownership; a separate browser unmount/remount harness was not added. |
| Keyboard, reduced motion and semantic mode | Native button/item activation and range Home/End worked. Semantic mode kept ordinal 4, H1 and counts 2/1 while removing the canvas. [Semantic screenshot](heap-extraction/semantic-reduced-motion.jpg). |
| Layout and labels | At 1280×720 and 360×780, all 12 active-heap labels were present without intersecting rectangles or page overflow. Mobile native controls measured at least 44 px high. [Layout record](heap-extraction/layout.json), [desktop](heap-extraction/desktop-step-4.jpg), [mobile](heap-extraction/mobile-step-4.jpg). |
| Renderer failures | Actual WEBGL_lose_context during playback and disabled WebGL creation before boot both retained usable result/controls and completed at 6, H1 selected, counts 3/1, with zero canvases. [Record](heap-extraction/renderer-failure.json), [context loss](heap-extraction/context-loss.jpg), [creation failure](heap-extraction/creation-failure.jpg). |
| Input edges | Repeated extraction reached empty; another extraction invented no result. The next insertion used H8. Equality stopped at counts 1/0; insertion into 15 items was rejected. [Record](heap-extraction/edge-cases.json). |

## Feedback measurement

Forty trusted clicks covered 30 swap/rewind actions and ten identity selections.
Every sample confirmed the expected ordinal or selected ID in the DOM.
P95 was **7.2 ms**, maximum **7.8 ms** on this device/browser sample.
[Raw samples](heap-extraction/latency.json).

The [probe source](heap-extraction/browser-probe.html) measures event capture to
the second animation frame, after a paint opportunity. Cadence measures trusted
Play activation to the ordinal mutation. These are browser observations, not
physical display scanout, algorithm runtime or phone performance. Each cadence
is one observed tick; scheduler tests cover all three exact requested delays.
Temporary probe routes and the generated WebGL-disabled boot fixture were removed
from public before committing. The creation fixture was generated from the
current production HTML with WebGL getContext disabled before application boot.

## Fresh branch review

One fresh GPT-6 Astra reviewer inspected `1d9aef9..d1f1b57` read only and
independently ran all 19 tests. It reported **0 Critical, 0 Important, 0 Minor**
findings and considered the code ready once Task 4 evidence was completed.
There was no review repair pass and no second source reviewer. Final documentation
and evidence are outside that reviewed code range; source has not changed since.

The reviewer checked extraction atomicity, frozen result/identity, equality,
cancellation generations and run/cursor guards, effect cleanup/reuse, and active
versus result Focus behavior. It did not independently verify builds, browser
timing, viewport/keyboard behavior or physical devices; those runtime checks are
recorded above by the executor.

The executor retained the review's scope boundaries: both graph traversals,
tutor, challenges and persistence remain required; arbitrary starting arrays,
build-heap, a separate 3D result object and lesson authoring remain outside this
slice. Temporary QA routes were excluded from the source review and removed.
Deferred review minors: none.

## Repairs and coverage limits

During Task 3, the wrapping Speed label included every option in its accessible
name. Separating the label with htmlFor/id made the exact Speed label resolve.
No new production code defect was established during final runtime verification.
Normal production console inspection reported no application error; Three.js's
existing Clock deprecation warning and deliberately induced renderer failures
are not new application failures.

A physical phone, screen reader, actual browser-background transition and changing
the Windows motion preference were not exercised. The Reduce motion control was
tested. No target learner explained a fresh smaller-child choice, so the teaching
assumption remains unvalidated and full release acceptance is not claimed.
The browser timer can be delayed by the host; it advances one ordinal per callback
and never catches up by skipping semantic steps, as accepted by the spec.

## Final commands

On 13 October 2026, `npm test` passed all 19 tests with zero failures;
`npm run typecheck` passed; `npm run build` passed with `/` prerendered.
`python scripts/check-context.py` and `git diff --check` passed. No dependency
was added. The architecture HTML and its bound evidence were preserved.

## Feature review

[PR #7](https://github.com/Exilitys/DSAVisualizer/pull/7) targets `development`
from the completed `feature/heap-extraction-playback` branch. The owner merged it
on 13 October 2026 at `3b3fe653291302f47baf4c6345ef41a676f75188` and said
"Continue next, pr is merged". This records owner acceptance of the feature;
it does not establish the outstanding learner-understanding check.
Planning and context updates are bundled with it under the owner's request for
fewer PRs. Owner review and merging remain separate gates.
