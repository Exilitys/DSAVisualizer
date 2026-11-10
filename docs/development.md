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

Use `npm test` for the Node 24 engine/player and injected playback-scheduler
checks, `npm run typecheck` for Next route generation and TypeScript, and
`npm run build` for production.
Learning tests cover atomic activity setup, the shared gate, versioned evidence and
bounded browser storage. The hook SSR probe checks entry without browser IO.
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

## Local tutor development

Copy the repository `.env.example` to an ignored `.env.local` and set
`OLLAMA_MODEL` to an already installed local chat tag. `OLLAMA_BASE_URL` defaults
to `http://127.0.0.1:11434`; both settings are server-only. Restart the Next.js
process after configuration changes. No browser setting chooses a model or URL.

Use a local Ollama daemon with cloud features disabled and verify its own startup
log reports `Ollama cloud disabled: true` before evaluation. For a task-owned
helper, process-scoped `OLLAMA_NO_CLOUD=1` and a free loopback `OLLAMA_HOST` avoid
changing global settings or interrupting another service. Do not use cloud tags,
download a model automatically, or assume localhost alone proves local inference.
Official authority: [chat API](https://docs.ollama.com/api/chat),
[installed model inventory](https://docs.ollama.com/api/tags), and
[local-only configuration](https://docs.ollama.com/faq#how-do-i-disable-ollamas-cloud-features), checked 17 October 2026.

The integrated `POST /api/tutor` reconstructs engine state before using the
provider. Its local process limits are six admitted requests per minute per
cookie guest, at most 256 live buckets and one active provider transport. These
are development limits; public deployment requires a separate abuse/identity
review. Failure leaves authored guidance, playback and saved practice usable.
The tutor stores no questions or replies. Explicit development evaluation evidence
is separate from content-free runtime logging.
