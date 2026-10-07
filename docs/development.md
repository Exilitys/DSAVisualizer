# Development guide

**Status:** Accepted 2026-10-05 by @Exilitys; reviewed at 220124f and merged in PR #2.

The accepted [technical spec](prd/prd.md) owns interfaces and behavior.
This guide owns implementation conventions and the authority for library use.
The [package manifest](../package.json) defines the Next.js application and its
checks. The [source context](../src/AGENTS.md) routes implementation work.

## Standards

- Keep simulation and input validation independent of React, Next.js, Three.js,
  network calls, time, and renderer resources, as the accepted contract requires.
- Wire browser scene adapters separately from the pure engine registry used by
  server reconstruction. Make mutable camera/layout state a presentation concern.
- Reuse the player and primitives before adding an abstraction. Add a shared
  helper when duplication is real across the required lessons.
- Validate input and provider output at their boundaries. Use the error behavior
  in the technical spec; preserve the learner's valid scene on a failed operation.
- Preserve existing file conventions once source exists. Do not invent class,
  directory, or naming claims for code that has not been created.
- Put directory-local AGENTS.md guidance beside application source when it is
  created, pointing to the relevant rules here rather than copying them.

## Library authority

Use live official documentation or available documentation tools, then relevant
installed skills, then local installed-package documentation, then this guide.
Verify the actual manifest/lockfile before relying on a version-sensitive API.

| Library/tool | Project use | Authority |
| --- | --- | --- |
| Next.js | Integrated frontend and server tutor route | Official Next.js documentation for the installed release; accepted D-003. |
| React Three Fiber and Three.js | Actual 3D geometry through lesson scene adapters | Official R3F/Three.js docs; installed `core-3d-animation:react-three-fiber` skill. |
| Drei | Camera/label helpers where they remove work | Documentation matching the installed package; verify React/R3F compatibility. |
| Ollama | Development tutor through server-side fetch | Official chat/structured-output docs and accepted D-006; model tag stays configurable. |
| Python | Repository context guard | Standard library; the guard adds no dependency. |

The JavaScript libraries are pinned in the manifest and [lockfile](../package-lock.json).
Use `npm ci` to restore them. Keep provider integration in
one lesson-neutral function; a second production provider is a deployment choice.

## Verification and tooling

Run `python scripts/check-context.py` from the repository root. The guard checks
real document pointers, the contract-list mirror, human acceptance records,
and diagram evidence binding. It does not validate application identifiers,
types, algorithm behavior, or AI inference.

Use `npm test` for the Node 24 engine/player checks, `npm run typecheck` for
Next route generation and TypeScript, and `npm run build` for production.
The pure engine tests run without React or renderer imports and check nested
immutability and the accepted fixture. Avoid tests of private implementation details.
UI verification includes the actual keyboard, pointer, reduced-motion, and
fallback journeys. Report measured behavior separately from planned targets.

## UI sources

The [product visual requirements](../prd.md#3-visual-experience-and-information-design)
are the direction. Theme tokens live in [globals.css](../src/app/globals.css);
the shared controls live in [components](../src/components/).

Live shadcn/Magic UI registry tools are not available in this session and no
project registry configuration exists. Registry setup is deferred by the owner
until application scaffolding. Show the host-appropriate configuration before
installing it. Inspect official registry source/examples before vendoring a
needed control; use installed UI skills and official docs as the interim route.

## Deferred tooling

Git contract hooks and registry configuration are deferred until scaffolding.
Type checking and engine tests are runnable now. Additional formatting,
import linting, and UI token checks remain future tooling.
The manual contract review applies meanwhile; no placeholder enforcement is claimed.
