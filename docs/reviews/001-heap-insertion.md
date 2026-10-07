# Heap insertion verification

**Status:** Runtime verification recorded 6 October 2026; final checks and fresh review continued 7 October 2026. Owner feature review pending.

**Scope:** [Slice 001](../specs/001-heap-insertion.md) and its
[accepted Native plan](../superpowers/plans/2026-10-05-heap-insertion.md).
Extraction, graphs, live tutoring, autoplay, and persistence remain required later release work.

## Runtime evidence

The named test device was a Windows 10 laptop (10.0.19045), Ryzen 9 5900HX,
31 GiB physical memory reported by Windows, with Radeon graphics and an RTX 3070
Laptop GPU listed. The browser was Codex's in app Chromium 154.0.0.0.
Node was 24.15.0. Development used localhost port 3000; production verification
used `npm run start` on ports 3002 and 3003.

| Check | Observed result |
| --- | --- |
| Exact insertion, identity, counters, immutable replay, input edges | Eight Node tests passed. |
| Insert 1, select H8, seek 3, rewind 2, restart | At 3, H8 index 3 and counts 1/1; at 2, counts 1/0; restart restores seven items. [Seek record](heap-insertion/seek.json). |
| Command boundaries | Insertion blocked during repair and at ordered but unfinished step 7. Next/Previous disabled at their boundaries. |
| Invalid entry after completion | Blank, 100, -1, and 1.5 preserved step 8 and eight items. [Input record](heap-insertion/invalid-inputs.json). |
| Duplicate and subsequent operations | H9 appended at index 8 with counters reset; equality stopped without an additional swap. The browser rejected insertion into 15 items. |
| Paired selection | A mesh click selected H8 in both spatial views and both semantic groups. [Desktop](heap-insertion/desktop-step-3.jpg). |
| Camera recovery | Orbit and zoom retained ordinal 3, H8, and counts 1/1. Focus centered H8; Fit restored the complete scene and original orientation. |
| Keyboard, reduced motion, semantic mode | Native buttons, item selection, and timeline Home/Arrow/End keys worked. Semantic mode retained the run. [Mobile](heap-insertion/mobile-step-3.jpg), [semantic mode](heap-insertion/semantic-reduced-motion.jpg). |
| WebGL context loss | Actual `WEBGL_lose_context` retained step 3, H8, and counts 1/1; Previous still reached 2 and 1/0. [Evidence](heap-insertion/context-loss.jpg). |
| WebGL creation failure | A temporary fixture disabled WebGL before boot; fallback supported insertion through step 3 and counts 1/1. [Evidence](heap-insertion/creation-failure.jpg). |
| Labels and page overflow | At actual viewports 1280×720 and 360×780, all 16 labels were present without intersecting rectangles or page overflow. [Layout values](heap-insertion/layout.json). |
| Text contrast and focus | Five checked text pairs exceeded 4.5:1; keyboard focus showed the 3 px indigo outline. [Contrast values](heap-insertion/contrast.json). |

## Feedback measurement

Forty trusted clicks covered 30 swap/rewind actions and 10 identity selections.
Every sample confirmed its expected ordinal or selected ID in the DOM.
P95 was **8.5 ms**, maximum **9.8 ms** on this desktop/browser sample.
[Raw samples](heap-insertion/latency.json).

The [probe source](heap-insertion/browser-probe.html) measures event capture to
the second animation frame, after a paint opportunity. This is a browser feedback
measure, not physical display scanout or phone performance. The probe ran before
the final desktop label padding adjustment; engine, player, and scene behavior
were identical. Probe routes are removed from `public` before committing.

## Repairs and coverage limits

Observed failures were corrected before review: a fallback effect wrongly removed
every canvas; Drei's changing HTML target lost the root label; scroll measurements
undid first camera focus; and rectangle checks caught desktop/mobile label overlap.
The canvas count changed from 0 to 1, preset labels from 13 to 14, and final paired
label overlap counts to zero at both widths.

A physical phone and a screen reader were not tested. The Reduce motion control
was tested; changing the Windows accessibility preference was not exercised.
The normal production scene emits Three.js's `Clock` deprecation warning through
R3F. Induced renderer errors were expected; no normal production application error
was observed. Development Html cleanup can report React root unmount warnings;
production semantic toggle and remount were checked separately.

There is no `docs/scope` row to tick. The accepted slice remains the decision
authority. Final command results and fresh code review are recorded below.

## Final commands (7 October 2026)

`npm test`: 8 passed, 0 failed. `npm run typecheck`: passed.
`npm run build`: passed; `/` prerendered. `python scripts/check-context.py`
and `git diff --check`: passed. Fresh code review pending.
