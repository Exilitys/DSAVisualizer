# DSA Atlas Hackathon Product Requirements Document

**Version:** 1.2 Blueprint draft

**Date:** 1 October 2026

**Updated:** 3 October 2026

**Status:** Draft; scope choices confirmed, technical specification review in progress

**Product owner:** Jonathan Carlo

**Event:** ForgeHacks Online 2026

**Proposed track:** AI + Education, subject to the released prompt

**Build horizon:** Seven-day hackathon MVP, followed by a separate product roadmap

## Hackathon delivery charter

This PRD is a build specification for a **student hackathon project**. The first release must deliver a complete, memorable learning experience within the event window. The broader DSA atlas is the product vision; the hackathon submission demonstrates that vision through a small number of working modules.

**Primary selling point: beautiful, playful, interactive 3D visualization of algorithms and data structures.** Learners should be able to manipulate components, follow execution, and explain complex behavior through what they see. Visual quality, direct manipulation, and synchronized representations are core requirements. The AI tutor supports the scene with explanations tied to its actual state.

### Event constraints

- The published event window is October 3 to 10, 2026. Verify the official deadline and timezone at kickoff.
- The organizers say specific track prompts are revealed on Day 1. Adapt the lesson and target learner to the actual education prompt before finalizing scope.
- Use this PRD for preparation. Substantially create the submitted project during the hackathon and clearly disclose any pre-existing work, including the earlier interaction prototype.
- Build for a concise live demonstration and a 2 to 4 minute submission video, with a working app, source repository, and clear README.
- The release targets and stack recommendations in this document are proposed specifications, not measured results or confirmed event requirements.

### What the submission must prove

1. **Visual experience:** real 3D components feel approachable and respond to learner actions.
2. **Explanatory depth:** the scene reveals the underlying state, auxiliary structures, and reasons for each step.
3. **Meaningful AI:** a tutor explains the exact selected step and helps the learner test an idea with a validated example.
4. **Completeness:** the learner can explore, run, inspect, rewind, and complete a short challenge in one polished workflow.

### Scope decision

The submission requires **both a complete heap module and graph traversal with BFS and DFS**. Each module must provide playback, inspection, contextual AI, and challenges. Heap insertion with synchronized tree and array views is the first implementation slice; completing that slice does not remove the required graph journey.

The product owner confirmed both modules on 3 October 2026 after considering a heap-required, graph-optional alternative. This choice supersedes version 1.1's heap-only fallback. The build is solo, with 2–3 hours available per day. The confirmed choices and their sources are recorded in [Blueprint intake](docs/prd/intake.md).

Keep advanced algorithms, a large concept catalog, accounts, and richer progress analytics on the post-hackathon roadmap. Add an extension only after the core demonstration is correct and polished.

### Alignment with judging criteria

| Criterion | Evidence in this project |
| --- | --- |
| Real-world impact and relevance | A defined learner problem, a concrete teaching task, and observed feedback from target users. |
| Technical implementation and AI use | A deterministic engine, synchronized 3D views, replayable traces, and validated state-aware explanations. |
| Innovation and creativity | Atlas-style exploration, tactile components, and connected representations of the same structure. |
| Execution and completeness | One or two complete learning journeys with working controls, responsive behavior, and failure recovery. |
| Presentation and communication | A short demo that shows a learner action, the algorithm's response, and the resulting explanation. |

These are design choices intended to address the published criteria, not a prediction of judging outcomes.

### Product direction

Build a browser-based learning playground where algorithms and data structures become beautiful, manipulable 3D objects. Learners insert nodes, connect edges, follow references, and watch execution unfold. The visual experience is the primary selling point. Guided lessons, code, and an AI tutor explain what the learner is seeing without displacing the scene.

The reference interaction is an anatomy atlas: browse a whole system, select a component, isolate it, inspect its internal structure, and learn how it relates to other components. DSA Atlas applies that interaction to abstract computational systems. Spatial layouts are teaching representations, not claims about physical memory or processor behavior.

### Build decision

The hackathon release requires two complete modules: a min heap with synchronized tree and array views, and a graph playground with BFS and DFS plus visible queue and stack behavior. Build the heap insertion slice first, complete the heap journey, then reuse the framework for graph traversal. Dijkstra remains a P1 extension after all P0 requirements are verified.

### Reusable lesson framework

New algorithms are authored as code modules using a shared DSA framework. The heap and graph modules reuse playback, rewind, synchronized inspection and selection, learning controls, and validated tutor context. Each module supplies its own algorithm behavior, invariants, representations, and authored lessons and challenges. A visual editor for creating lessons without coding is outside the hackathon release.

The framework must be exercised by both required modules. Reuse is demonstrated when their different structures and execution state work through the same controls and run lifecycle. The exact module interface remains a Blueprint technical decision for review.

### Success means

- A new learner can perform a meaningful action in the scene within one minute without reading a tutorial.
- The learner can explain an operation by following synchronized objects, execution state, and short explanations.
- The simulation remains correct, reversible, and useful when the AI service is unavailable.
- The same visual primitives can explain deeper topics such as tree rotations, shortest paths, recursion, and dynamic programming.

## Contents

- [1 Users and learning outcomes](#1-users-and-learning-outcomes)
- [2 Release scope and priorities](#2-release-scope-and-priorities)
- [3 Visual experience and information design](#3-visual-experience-and-information-design)
- [4 Interaction model and learning journey](#4-interaction-model-and-learning-journey)
- [5 Heap module specification](#5-heap-module-specification)
- [6 Graph module specification](#6-graph-module-specification)
- [7 Curriculum and advanced visualization](#7-curriculum-and-advanced-visualization)
- [8 AI tutor and learning support](#8-ai-tutor-and-learning-support)
- [9 System architecture](#9-system-architecture)
- [10 State model and service contracts](#10-state-model-and-service-contracts)
- [11 Functional requirements and acceptance](#11-functional-requirements-and-acceptance)
- [12 Quality accessibility and correctness](#12-quality-accessibility-and-correctness)
- [13 Product measurement and validation](#13-product-measurement-and-validation)
- [14 Implementation plan and milestones](#14-implementation-plan-and-milestones)
- [15 Demo release decisions and references](#15-demo-release-decisions-and-references)

## 1 Users and learning outcomes

The initial audience is students and self-directed developers learning data structures and algorithms. A secondary audience is teachers and mentors who need a clear visual aid during an explanation. Start with English content and a responsive web experience that requires no account.

### Problems to solve

- Code and static diagrams require learners to mentally reconstruct changes in structure, references, and execution state.
- Animations can move too quickly or hide the auxiliary structures that explain why the algorithm behaves as it does.
- Dense topic catalogs make it difficult to choose a starting point or understand relationships between concepts.
- Complex algorithms become harder to follow when each lesson introduces a different visual language and control scheme.

### Core user stories

- As a beginner, I want to touch a structure and try an operation so I can understand its behavior before studying implementation details.
- As a learner, I want to stop on any step and inspect the exact values, references, and decisions that produced it.
- As an interview candidate, I want to change the input and compare execution so I can reason about edge cases and complexity.
- As a teacher, I want to focus a component and reveal details gradually so I can explain one idea at a time.
- As a learner who is stuck, I want an explanation of the selected object or current event rather than a generic definition.

### Observable learning outcomes

Heap learners should explain the complete-tree shape, parent-child ordering, insertion through sift-up, and the relationship to array indices. Graph learners should distinguish discovery from processing, identify the queue or stack frontier, and explain why BFS finds paths with the fewest edges in an unweighted graph.

A correct prediction or explanation provides evidence for a specific objective. Exploration time and animation completion do not establish mastery. A single incorrect answer should prompt a follow-up rather than a firm diagnosis.

### Product principles

Give every object a clear role and every movement a clear cause. Preserve context while revealing detail. Let learners experiment without losing their ability to rewind. Support both playful discovery and precise inspection.

## 2 Release scope and priorities

Priorities describe the proposed build sequence. P0 is required for the hackathon release; P1 extends the first release after the core is stable; P2 belongs to the broader product. Final event scope must match the education prompt revealed at kickoff.

| Priority | Capability | Release boundary |
| --- | --- | --- |
| P0 | 3D playground | Actual spatial geometry; orbit, zoom, selection, focus, and direct operations. |
| P0 | Heap module | Insert and extract minimum with tree and array synchronization. |
| P0 | Graph module | Edit a small graph; BFS and iterative DFS; visible frontier. |
| P0 | Execution controls | Play, pause, next, previous, restart, speed, and timeline seek. |
| P0 | AI explanation | Explain the current state or selected object; suggest validated actions. |
| P0 | Guided learning | One short lesson and three prediction challenges per module. |
| P0 | Resilience | Guest access, local progress, responsive controls, and a semantic fallback. |
| P1 | Shortest paths | Dijkstra with nonnegative weights and a visible priority queue. |
| P1 | Teaching tools | Presenter mode, shareable scene inputs, comparison views. |
| P2 | Expanded curriculum | Balanced trees, recursion, sorting, hashing, and dynamic programming. |

### Full product direction

The long-term atlas organizes Arrays, Linked Structures, Trees, Graphs, Hashing, and Algorithmic Techniques into connected regions. Relationships have explicit meanings such as requires, implemented using, special case of, and used by. Regions expand progressively; completed lessons never gate free exploration.

### Scope constraints

The initial release uses authored algorithms and validated input schemas. Arbitrary user-code execution, unrestricted generation of new algorithms, multiplayer worlds, VR, institution dashboards, and broad automated content ingestion are deferred. The early heap preview is an interaction sketch; production acceptance requires the renderer, controls, and reliability specified here.

## 3 Visual experience and information design

The 3D scene is the main workspace. It should feel like a carefully designed interactive exhibit: tactile components, restrained materials, readable labels, and deliberate motion. Visual quality is a release requirement, alongside correctness.

### Scene composition

- Use a clean stage with a gentle ground reference, soft lighting, and enough depth to distinguish components. Keep labels readable as the camera moves.
- Use consistent primitives: value blocks, node spheres, directed links, containers, pointer markers, and execution frames. Stable identities persist as objects move.
- Frame the active structure on entry. Provide focus selection and fit scene so camera exploration cannot strand the learner.
- Keep the scene dominant on desktop. On phones, keep the scene above a compact control area with inspection and code in dismissible sheets.
- Offer preset spatial and top-down views of the same state. The 3D view remains the default product experience; the top-down view supports exact inspection.

### Meaningful visual language

Neutral materials identify ordinary objects. A consistent highlight identifies the current event. Additional states such as frontier, processed, selected, and path use labels or symbols as well as color. Numeric labels retain contrast against their objects. Decorative color must not imply algorithmic meaning.

Animations show causal change: a pointer reconnects, a node exchanges position, an edge is considered, or a value changes. Show comparison before swap and discovery before frontier insertion. Avoid confetti, ambient motion, bloom, or particles that compete with an explanation. Optional completion feedback is brief and respects reduced motion.

### Complex concepts without visual overload

Reveal auxiliary structures beside the main structure only when they matter. Use synchronized selection across views, local focus, and a small current-event explanation. Allow a learner to isolate a subtree or path while preserving an obvious return to the complete structure. Hide distant labels by default; selection restores detail.

### Visual acceptance

- Default camera positions show every required component without overlapping value labels at the supported scene sizes.
- Orbiting preserves the ability to select and identify objects; focus makes any selected component readable.
- Tree and array objects share stable identities and matching selection through every swap.
- Every motion has an identifiable algorithm event, and paused scenes remain readable without animation.

## 4 Interaction model and learning journey

### First minute

Open directly into a working example with two choices: play with a heap or explore a graph. Show one lightweight invitation such as Insert 1 or Choose a start node. The first interaction changes the scene immediately. Explain the relevant concept after the learner acts. The broader atlas is available through **Browse**, with only implemented lessons offered as playable.

### Controls and direct manipulation

- Camera: drag empty space to orbit; use explicit zoom controls and supported pinch gestures; focus selection and fit scene restore orientation.
- Selection: click or tap an object, or choose it through a semantic object list. Its counterparts in other views highlight together.
- Editing: select an operation and edit values on the object or in a compact form. Separate graph edit mode from camera navigation to avoid ambiguous gestures.
- Playback: play, pause, previous, next, restart, speed, and seek operate on semantic steps. A comparison is its own step even if no value changes.
- Inspection: reveal values, indices, references, current variables, auxiliary structures, pseudocode, and operation counts progressively.

### Playback and editing rules

Pause stops at a stable semantic boundary. Previous and seek reconstruct an exact trace snapshot. Restart returns to that run's original input. An input edit pauses playback and creates a new run from the chosen stable state. Future steps from the old run are discarded after confirmation when a meaningful lesson would be lost. Camera movement and selection do not change algorithm state.

### Learning layers

Explore allows free manipulation. Explain adds authored annotations and synchronized pseudocode. Challenge asks for a prediction before revealing the next event. These layers share the same scene and controls. Switching layers preserves input and camera context; entering a seeded challenge creates a clearly identified new run.

### Example learner journey

A learner inserts 1 into a min heap. The new node appears at the next open position. They predict whether it will move, inspect its parent, and advance through compare and swap events. Selecting the moving node highlights its current array cell. After a fresh challenge, the learner can explain why insertion preserves both complete shape and heap ordering.

### Teacher journey

A teacher selects a prepared scene, focuses a component, advances one step at a time, and reveals pseudocode only when needed. Presenter mode and saved public scenes are P1; the P0 playground already supports a live explanation without an account.

## 5 Heap module specification

The P0 heap is a binary min heap. Its tree is complete, and every parent value is less than or equal to each child value. Its array representation uses zero-based indices. For index i, the parent is floor((i - 1) / 2) for non-root nodes; children are 2i + 1 and 2i + 2 when those positions exist.

### Supported input and operations

Accept integer values from 0 through 99 and at most 15 nodes in the hackathon scene. Duplicates are allowed. If learners enter an initial array, offer an explicit build-heap operation rather than silently claiming an arbitrary array is already a heap. Insert and extract minimum are P0; build-heap input is P1 unless required to support the chosen onboarding flow.

- Insert: append at the next open position, compare with the parent, swap if strictly smaller, and continue until ordered or at the root. Equal values do not swap.
- Extract minimum: identify the root, move the last item to the root, remove the last position, then sift down toward the smaller child. Prefer the left child on equal values.
- Inspect: show node identity, value, current index, parent, children, and ordering status. Missing children are shown as absent, not fabricated.
- Explain: distinguish heap ordering from full sorting and show that parent-child constraints do not order all siblings or subtrees.

### Paired representations

Tree and array read from the same snapshot. When values exchange positions, their identities and matching highlights travel together. The pseudocode line and comparison counter change at the same semantic boundary. A temporary ordering violation during a repair step is labeled as intermediate state; the completed operation must satisfy all invariants.

### Acceptance examples

- Starting from [3, 7, 5, 12, 9, 8, 6], inserting 1 ends at [1, 3, 5, 7, 9, 8, 6, 12]. Each compare and swap is independently inspectable.
- Extracting the minimum from that original heap returns 3 and ends at [5, 7, 6, 12, 9, 8]. Empty and single-node heaps behave correctly.
- Rewinding from a completed insertion restores the exact earlier identities, indices, values, counts, and explanation.
- Challenges test the next swap, the affected array index, and the distinction between heap order and sorted order.

### Complexity explanation

Show actual comparisons for the current run beside an authored explanation of logarithmic insertion and removal and constant-time minimum inspection. Measured animation duration is never presented as algorithm runtime.

## 6 Graph module specification

The P0 graph playground supports undirected, unweighted graphs with up to 20 nodes and 40 edges. Learners can add or remove nodes, connect or disconnect edges, move node positions, and choose a start node. Reject duplicate edges and self-loops in this release. A maze is an optional preset of the same graph model.

### Deterministic traversal

Assign stable node IDs and use a documented neighbor order based on creation order. Moving a node changes layout only. BFS marks a node discovered when enqueued, records its predecessor, and processes a FIFO queue. DFS uses an explicit stack of frames to explore one neighbor at a time, preserving a recursive-style traversal with visible backtracking. Both implementations handle cycles and disconnected components.

### Visible state

- Main graph: distinguish undiscovered, frontier, current, and processed nodes with text or symbols as well as color.
- Auxiliary view: show queue order for BFS and stack frames with next-neighbor progress for DFS. Identify which end is removed or pushed.
- Inspection: show current node, examined edge, visited state, predecessor, traversal sequence, and selected pseudocode line.
- Completion: summarize reached nodes; unreachable nodes remain visibly unvisited. A disconnected graph is a valid case.

### Learning objectives

Explain how queue and stack behavior changes exploration order. BFS computes shortest paths by edge count from the start in an unweighted graph. DFS finds reachable nodes but does not guarantee the path with fewest edges. Show a counterexample rather than claiming one traversal always explores fewer nodes.

### Acceptance examples

- For edges A-B, A-C, B-D, C-D, D-E created in that order, BFS from A discovers A, B, C, D, E. Each node is enqueued once.
- With the stated frame-based DFS and neighbor order, discovery is A, B, D, C, E. The stack shows the return from C before exploration reaches E.
- Adding isolated F leaves F unvisited when traversal starts at A. Cycles do not cause infinite traversal.
- Repositioning nodes preserves traversal results. Editing adjacency creates a new run, invalidating the old future trace.

### P1 shortest paths

Dijkstra adds nonnegative edge weights, tentative distances, predecessor updates, and a visible priority queue. Reject negative weights. Show edge relaxation and stale queue-entry handling if a duplicate-entry queue is used. Test zero-cost edges, ties, and unreachable targets before presenting the module as complete.

## 7 Curriculum and advanced visualization

Extend the product through reusable primitives and consistent playback controls. Each new lesson must specify its invariants, event vocabulary, synchronized views, worked example, edge cases, and assessment objectives before its scene is built.

| Topic | Spatial experience | Concept to make visible |
| --- | --- | --- |
| Arrays and searching | Indexed blocks with movable pointer markers | Contiguous indexing, search interval, and sorted-input requirement. |
| Linked structures | Separate nodes connected by directed references | Traversal cost, relinking, head updates, and absent references. |
| Stacks and queues | A vertical container or a directed lane | Insertion and removal ends; LIFO and FIFO. |
| Binary search trees | A branching structure with a highlighted path | Ordering, search decisions, and degeneration. |
| Balanced trees | An isolated subtree rotating into a new shape | Preserved in-order sequence and repaired balance. |
| Sorting | Value blocks with tracked identities and partitions | Comparisons, swaps, stability, and partition boundaries. |
| Recursion | Nested execution frames beside the main problem | Call entry, local state, return values, and base cases. |
| Hash tables | Buckets with visible collisions and probe paths | Hash mapping, collision resolution, and load. |
| Dynamic programming | A problem graph paired with a result table | Repeated subproblems, dependency order, and reuse. |

### Explaining complex algorithms

Provide a global overview and a focused local operation. For an AVL rotation, isolate the three affected subtrees and retain their identities through the rotation. For dynamic programming, keep the recurrence dependency graph and table cells linked. For recursion, freeze the structure while the active call frame changes so learners can distinguish data state from control flow.

### Concept atlas

The atlas describes conceptual relationships; a lesson scene describes a concrete structure and execution. Keep these graph models separate. A heap connects to arrays through implemented using and to Dijkstra through used by. A compact breadcrumb preserves the route back to related lessons. The initial release needs only a small browsable catalog with these authored relationships.

## 8 AI tutor and learning support

AI is a context-aware explanation layer. It receives the current validated snapshot, the selected object, the current semantic event, and authored concept guidance. The execution engine remains the authority for algorithm behavior. The tutor can explain, ask questions, and propose actions through supported commands.

### P0 capabilities

- Explain this: explain the selected node, edge, container, pseudocode line, or current event in plain language.
- Why this step: identify the actual comparison, traversal decision, or invariant involved using current values.
- Try an example: select an authored counterexample or propose a small input that passes the module validator.
- Prediction support: provide a hint after an attempt, without revealing a future event when challenge mode hides it.

### State context and response contract

Each request includes module ID, algorithm version, run ID, snapshot ID, selected entity IDs, current event, visible variables, relevant invariant status, learner question, and objective ID when applicable. Send only the state needed to answer. A basic JSON payload is sufficient for the small P0 scenes; a vector database is not required.

Responses contain explanation text, referenced entity IDs, optional proposed commands, and an optional follow-up question. Validate every referenced ID and command. Discard or label a response as belonging to an earlier state if the learner changes run or step during the request. Proposed changes appear as a preview and execute only after the learner selects Apply.

### Correctness and availability

Use a server-side provider adapter so model choice can change without altering lessons. Keep API keys out of browser code. Rate-limit anonymous requests, cap context and output, allow cancellation, and show a retry action after timeout. Authored event explanations remain available when AI is offline. Never substitute a fabricated response for a failed model call.

### Secondary learning diagnosis

P1 can map repeated prediction and explanation evidence to objectives and recommend prerequisites. Label outcomes as explored, practiced, evidence of understanding, or needs review. Avoid medical-style certainty or a mastery claim based on one answer. The learner can always return to free exploration.

### Acceptance

Test at least 20 questions across normal steps, empty structures, intermediate violations, stale responses, and offline behavior. Explanations must agree with the snapshot and avoid inventing nodes, distances, or executed actions. Record observed correctness; do not claim universal reliability.

## 9 System architecture

Use a TypeScript simulation core shared by visual and semantic views. The renderer presents snapshots; it does not decide algorithm behavior. An animation scheduler interpolates between stable snapshots while all inspection, pseudocode, and counters refer to the selected semantic step.

| Layer | Proposed choice | Responsibility |
| --- | --- | --- |
| Application | React and TypeScript | Navigation, controls, inspection, challenges, and responsive layout. |
| 3D scene | Three.js with React Three Fiber | Spatial geometry, camera, picking, materials, and animation. |
| Scene helpers | Drei where useful | Camera controls and readable labels; validate compatibility. |
| Simulation | Pure TypeScript modules | Input validation, ordered events, invariants, and deterministic traces. |
| State | Small typed store | Run lifecycle, playback, selection, layout, and learner evidence. |
| AI service | Thin server-side API | Provider adapter, validated context, limits, and error handling. |
| Persistence | Browser storage for P0 | Versioned input presets, settings, and local learning progress. |
| Verification | Unit tests and browser tests | Algorithm correctness, trace replay, interactions, and responsive behavior. |

### Data flow

A learner action becomes a validated module command. The simulation builds a deterministic trace and invariant annotations. The player selects a snapshot. The 3D scene, auxiliary views, inspector, and pseudocode consume that snapshot. A tutor request takes a bounded copy of the same state and returns a separately validated explanation or proposed command.

### Rendering strategy

Use actual 3D geometry for the shipped scenes, not a static image or a flat diagram with decorative perspective. Share geometries and materials, limit shadow cost, and render on demand when idle. Bound the drawing-buffer resolution and scale visual effects down on slower devices. Preserve labels, selection, and controls when lowering quality.

### Module boundary

Each lesson supplies metadata, input schema, command schema, initial-state builder, trace generator, invariant checks, scene adapter, pseudocode mapping, and challenge definitions. A new algorithm should reuse playback and tutor context instead of introducing a separate control system.

### Deployment boundary

A static frontend plus one server-side AI endpoint is sufficient for P0. Account services and a shared database are P1. Record exact dependency versions in the lockfile during implementation; the stack here is a recommendation rather than a compatibility guarantee.

## 10 State model and service contracts

### Canonical records

| Record | Required fields | Rule |
| --- | --- | --- |
| ModuleDefinition | id, version, concepts, schemas, pseudocode, objectives | Versions identify the meaning of stored traces. |
| SceneInput | moduleId, values or nodes and edges, operation, seed | Layout is separate from logical data. |
| Run | id, moduleVersion, initialInput, algorithm, orderedSteps | Editing logical input starts a new run. |
| StepSnapshot | id, ordinal, entities, frontier, variables, counters | All views use the same selected snapshot. |
| AlgorithmEvent | type, affectedIds, operands, result, codeLine, explanationKey | Every visible operation has an inspectable event. |
| SceneLayout | entityId, position, camera, viewPreset | Visual movement does not affect traversal order. |
| LearningEvidence | objectiveId, challengeVersion, attempt, outcome | Scope conclusions to the objective tested. |
| TutorExchange | runId, snapshotId, context, response, status | Validate responses against the requested state. |

### Event vocabulary

Shared events include select, compare, swap, update value, reconnect, push, pop, enqueue, dequeue, discover, examine edge, return, and complete. Modules can add a typed event such as relax edge. Each event declares stable affected identities and a code-line mapping. A compare event can preserve all values while still advancing the trace.

### Replay and animation

For the small release scenes, store immutable snapshots rather than rebuilding previous states through fragile inverse operations. A seed and deterministic tie rules make a run reproducible. Never modify a stored snapshot to animate. Seek cancels active interpolation and snaps to the selected stable state; playback resumes from that state.

### AI endpoint

POST /api/tutor accepts the bounded context described in Section 8 and returns explanation, entity references, proposed commands, and request-state identifiers. Errors include invalid context, unknown entity, rate limited, provider unavailable, and timeout. A cancelled or stale response never changes the current run.

### Persistence and sharing

Persist settings and progress locally with a schema version. Validate restored data and recover to a safe preset if migration fails. P1 share links carry versioned initial input and selected operation, not arbitrary executable code or full chat history. Apply the same scene-size limits to imported or shared content.

## 11 Functional requirements and acceptance

All requirements below are P0 unless explicitly marked P1. Release acceptance is based on completed behavior, not the presence of a screen or control.

| ID | Requirement | Acceptance check |
| --- | --- | --- |
| FR01 | Immediate guest access | A working scene opens without registration or an AI request. |
| FR02 | Spatial navigation | Orbit, zoom, focus, and fit work with pointer and touch controls. |
| FR03 | Synchronized inspection | Selecting an entity highlights the same identity in every paired view. |
| FR04 | Deterministic execution | Same input, seed, and algorithm version produce identical steps. |
| FR05 | Reversible playback | Previous and seek restore state, frontier, counters, and code line. |
| FR06 | Input validation | Invalid values, excess nodes, and unsupported edges show actionable errors. |
| FR07 | Heap operations | Insert and extract pass examples, invariants, and edge-case tests. |
| FR08 | Graph operations | BFS and frame-based DFS match documented ordering and stop on cycles. |
| FR09 | Guided explanation | Authored annotations and pseudocode follow the current event. |
| FR10 | Contextual AI | The tutor explains the supplied snapshot and validates referenced entities. |
| FR11 | Challenges | Three challenges per module evaluate predictions against deterministic state. |
| FR12 | Graceful AI failure | Playback and authored guidance remain usable when the provider fails. |
| FR13 | Local continuity | Settings and progress restore; malformed storage does not break entry. |
| FR14 | Accessible operations | Essential operations can be performed outside the canvas using keyboard controls. |
| FR15 | Browse relationships | Implemented lessons expose clear links to their supporting structures. |
| FR16 | Dijkstra extension P1 | Correct relaxation, priority ordering, and nonnegative-weight validation. |
| FR17 | Reusable code modules | Heap and graph lessons use the same playback, selection, inspection, challenge, and tutor framework. Adding a lesson uses the shared module interface without rewriting those controls. |

### End to end acceptance journey

A guest inserts 1 into the preset heap, steps through a swap, selects the matching array cell, rewinds, and asks why the step occurred. They then open a graph, choose A, run BFS, inspect the queue, change to DFS on the same input, and complete a fresh prediction challenge. This journey works at desktop and mobile widths with no blocked controls or contradictory state.

## 12 Quality accessibility and correctness

These are proposed engineering targets to verify on named test devices, not measured results. Capture browser version, hardware, scene size, and network profile with each benchmark.

| Area | Target | Verification |
| --- | --- | --- |
| Scene responsiveness | Local selection or operation responds within 100 ms at the 95th percentile. | Measure event to first visible response on the supported scene sizes. |
| Animation | Aim for 60 fps on a typical laptop and at least 30 fps on a midrange phone. | Test heap 15 nodes and graph 20 nodes with 40 edges. |
| Initial load | First usable example within 3 seconds under a documented mobile network profile. | Measure a cold load; load other modules lazily. |
| AI availability | Show request status immediately; cancel after 15 seconds and offer retry. | Simulate timeout, rate limit, cancellation, and network failure. |
| Responsive layout | Usable at 360 px mobile width and 1280 px desktop width. | Verify portrait, landscape, browser zoom, and opening panels. |
| Interaction | Touch controls have approximately 44 px effective targets. | Test camera, operation controls, and selection alternatives. |

### Accessibility requirements

Provide keyboard-accessible operation controls, a semantic object list, clear focus indicators, and readable text. Represent meaning through labels or shapes in addition to color. Respect reduced motion and allow instant transitions. Announce semantic step changes without narrating every animation frame. Target WCAG AA text contrast. When 3D rendering is unsupported, provide the same operation and trace controls through a labeled 2D or textual representation.

### Algorithm and replay verification

Test empty, single-item, duplicate-value, boundary-size, and invalid-input heaps. Test cycles, disconnected nodes, isolated start nodes, graph ties, and repeat runs. Use invariant checks at operation boundaries and documented intermediate states during repairs. Compare completed outputs with reference implementations. Verify that animation speed, camera position, and layout edits do not change logical results.

### Resource and error behavior

Bound trace size and AI requests. Dispose of geometries, event listeners, and renderer resources when changing modules. Recover from rendering-context loss or show a fallback. Explain input and service errors beside the relevant control; do not erase a learner's valid work after a transient failure.

## 13 Product measurement and validation

The first evaluation should establish whether learners can operate the scene and explain the concept. Visual appeal is essential, but it must be assessed alongside comprehension and usability. All targets below are hypotheses to test.

### Small pilot

Recruit 5 to 8 learners with mixed DSA experience. Ask them to perform a heap insertion and compare BFS with DFS without a guided walkthrough. Record where they hesitate, what they select, and whether the labels or camera obscure the explanation. Follow with a new input rather than repeating the demonstrated example.

| Measure | Initial target | Interpretation |
| --- | --- | --- |
| First useful action | At least 80 percent perform an operation within 60 seconds. | Tests discoverability of the visual controls. |
| Core task completion | At least 80 percent finish the chosen task without facilitator intervention. | Tests the complete workflow, including inspection and rewind. |
| Transfer question | At least 70 percent correctly explain the same concept on a fresh input. | A small pilot provides directional evidence, not proof of learning impact. |
| Visual experience | Median 4 out of 5 for clarity and enjoyment, rated separately. | Do not collapse aesthetic appeal and understanding into one score. |
| Tutor agreement | At least 90 percent of 20 authored evaluation questions agree with state. | Investigate every disagreement; critical contradictions block release. |

### Event instrumentation

If analytics are enabled, record module opened, operation started, step selected, entity inspected, view changed, challenge attempted, tutor requested, tutor failed, and session ended. Attach module version, run ID, step ID, and coarse timing where needed. Do not collect raw learner questions by default. Anonymous events should have a documented retention period and an opt-out.

### Learning evidence

Local progress stores objectives practiced and outcomes on authored challenges. A repeated error can suggest a prerequisite lesson, with an explanation of the supporting attempts. Free exploration remains available regardless of progress labels.

### Evidence for the hackathon demo

Show one real execution trace, a supported learner task, and any pilot observations collected. Label sample evaluation cases and simulated data clearly. Report actual measured figures only after running the corresponding check; a polished scene does not justify an unmeasured learning or speed claim.

## 14 Implementation plan and milestones

The build is solo, with 2–3 hours available per day, as confirmed on 3 October 2026. Across seven build days this is approximately 14–21 hours of effort. Both modules remain required, so tasks run in dependency order and optional capabilities stay outside the release. The milestones below are proposed sequencing; the detailed delivery plan still needs review. At kickoff, confirm the released education prompt before expanding scope.

| Day | Build focus | Exit condition |
| --- | --- | --- |
| 1 | Confirm prompt and build foundation | Typed state model, scene shell, camera, one node, and one validated operation. |
| 2 | Complete heap engine and paired views | Correct insert and extract traces with identity-preserving tree and array updates. |
| 3 | Polish heap learning experience | Playback, inspection, responsive controls, one lesson, and three challenges. |
| 4 | Build graph vertical slice | Editable graph, BFS, visible queue, and deterministic traversal. |
| 5 | Finish DFS and contextual AI | Stack frames, comparison flow, validated tutor context, and offline guidance. |
| 6 | Pilot and refine | Learner feedback, device measurements, accessibility checks, and resolved critical defects. |
| 7 | Freeze and submit | Working deployment, concise README, architecture, screenshots, and demo video. |

### Dependency order

Build deterministic snapshots before animation. Build selection identity before paired views. Build event annotations before AI context. Add challenges only after the engine can reveal the correct next event consistently. Polish camera framing and label readability throughout, rather than leaving visual design to the final day.

### Work ownership

The solo builder owns simulation and correctness, scene and motion, application controls, authored lessons, and tutor integration. Agree on the shared event and module interfaces before implementation. Complete and polish the heap journey before applying the same framework to graphs.

### Scope control rule

If the heap journey is not complete by the end of day 3, reduce optional presets, catalog breadth, and decorative work to protect the required graph journey and release verification. A heap-only submission does not satisfy the confirmed scope. Dijkstra, additional concepts, and teaching tools remain P1 or P2 until the complete two-module release passes its checks.

### Post hackathon roadmap

P1 adds shortest paths, presenter mode, saved scenes, share links, and richer learning evidence. P2 expands the atlas through authored module packages, with balanced trees, recursion, and dynamic programming as demonstrations of advanced explanatory depth.

## 15 Demo release decisions and references

### Suggested submission video sequence

Aim for a roughly three-minute video, adjusting to the current submission requirements.

| Time | Show | Purpose |
| --- | --- | --- |
| 0:00 to 0:20 | The learner problem and the 3D playground | Establish who benefits and make the visual experience clear immediately. |
| 0:20 to 1:10 | Heap insertion with tree and array synchronization | Show direct manipulation and explain a complex operation through paired views. |
| 1:10 to 1:40 | Rewind, inspect, and ask the tutor about the exact step | Demonstrate state accuracy and meaningful AI integration. |
| 1:40 to 2:20 | Graph traversal and its frontier, if shipped | Show that the visual components generalize to another algorithm. |
| 2:20 to 2:45 | A fresh prediction challenge and actual pilot observations | Connect exploration to an observable learning task. |
| 2:45 to 3:00 | Shipped scope, architecture, and next extension | Make the implementation and future direction clear. |

The submission video must show both the heap and graph learning journeys. Use the graph segment for traversal, visible frontier state, and a fresh prediction. Show the actual product and clearly distinguish implemented functionality from roadmap ideas.

### Demo narrative

Open with the problem: a learner can read heap code but cannot explain what moves or why. In the 3D scene, insert 1, inspect a comparison, and follow the same identity through the tree and array. Rewind and ask the AI about that exact step. Then show graph traversal with its queue or stack, and end on a fresh prediction challenge. Keep the scene visible throughout most of the demo.

### Release checklist

- [ ] All P0 requirements pass: FR01 through FR15 and FR17. Both heap and graph journeys are required; FR16 remains P1.
- [ ] No unresolved critical algorithm, replay, identity, or tutor-state contradictions remain.
- [ ] 3D scenes are readable and responsive on the tested desktop and phone; fallback and reduced motion work.
- [ ] The submission describes the actual education prompt, implemented scope, technical approach, and observed validation.
- [ ] Source repository, setup instructions, demo video, screenshots, and deployment are ready; disclose existing work and additions made during the event.

### Risks and decisions

The main risks are overbuilding the catalog, visual occlusion, contradictory AI explanations, and low-end device performance. Mitigate them through complete modules, default camera presets, validated snapshot context, and adaptive rendering. Decide the working name, test devices, provider budget, and final lesson scope at kickoff. English and guest access are the proposed release defaults.

### Reference material

Human Body Atlas reference shared by the product owner: https://share.google/b1Z0S8zkY51vDVlWy. The supplied screenshot informs browse, select, isolate, and learn interactions; it does not establish how the reference app is implemented.

ForgeHacks official site: https://www.forgehacks.dev/. Retrieved 1 October 2026. The event lists October 3 to 10 and says specific track prompts are released on Day 1. Event requirements should be rechecked at kickoff.

ForgeHacks rules and submission requirements: https://forgehacks-2026.devpost.com/rules and https://forgehacks-2026.devpost.com/. Use the current event pages to confirm eligibility, permitted existing work, and submission details.

Three.js responsive rendering guidance: https://threejs.org/manual/pages/responsive.html. React Three Fiber performance guidance: https://r3f.docs.pmnd.rs/next/advanced/scaling-performance. Retrieved 1 October 2026. These support responsive drawing-buffer sizing and performance adaptation; engineering targets in this PRD remain proposed targets.
