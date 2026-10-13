# Application source

Read the [development guide](../docs/development.md), [accepted slice](../docs/specs/001-heap-insertion.md),
and [invariants](../docs/architecture/invariants.md) before changing this directory.
The next accepted slice is [extraction and autoplay](../docs/specs/002-heap-extraction-playback.md).
Keep core and lesson engines independent of React, renderer resources, time, and network calls.
The shared player owns the selected ordinal; scene adapters own camera and layout only.
