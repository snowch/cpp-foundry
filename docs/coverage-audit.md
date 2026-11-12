# Curriculum coverage audit

Reviewed 2026-11-12 against the authored lesson programs and readings, not just header inclusion counts. This revision adds 10 chapters and 40 worked lessons: 32 standard-library lessons and eight lessons on generic/object-model contracts and asynchronous result transport. Total: 9 parts, 54 chapters, 266 lessons; 240 browser programs and 26 native investigations.

“Dedicated” means the topic has its own explanation, complete example, exact expected result, walkthrough, pitfall, question, and experiment. It does not imply exhaustive API reference coverage. A feature used inside a database model is not automatically counted as comprehensive instruction in that feature.

## Standard library changes

| Area | Added instruction | Important contracts and boundaries |
| --- | --- | --- |
| Containers | vector capacity, deque/list/splice, ordered insertion/lookup, unordered maps | Size versus capacity; reallocation/erase/rehash invalidation; compatible splice allocators; hash/equality consistency; average versus worst-case lookup |
| Iterators | Categories, erase-return loops, output adapters, stream input iterators | Multipass versus single-pass; iterator movement costs; initialized destination storage; invalidation |
| Algorithms and numeric | remove/erase, strict ordering, accumulate/scans/reduce, duplicate bounds | Logical versus physical removal; strict weak ordering; accumulator type; regrouping; partitioning preconditions |
| Ranges | Lazy filter/transform, projections, bounded iota, borrowed results | Source lifetime; work during traversal; stable versus unstable ordering; termination; dangling versus borrowed_range |
| Vocabulary types | optional, variant/visit, tuple/apply/tie, callable ownership | Eager fallback arguments; active alternatives; valueless states; borrowed references; copyable type-erased targets |
| Text and I/O | from_chars, stream recovery, persistent formatting, C++20 format | Complete consumption; range errors; state plus input-position repair; locale/presentation; library feature support |
| Time/random/bits | Duration conversion, clock domains, engines/distributions, bit utilities | Truncation versus rounding; monotonic versus civil clocks; reproducible engines versus distribution mapping; shift preconditions; no cryptographic promise |
| Files and memory | Filesystem errors and lexical paths, weak ownership, PMR | TOCTOU; symlinks/containment; weak locking; shared lifetime versus synchronization; resource lifetime and bounded upstream allocation |
| Async library | promise/future, packaged_task, launch policy, shared_future | One-shot results; exception transport; scheduling versus result transport; deferred captures; blocking destruction; shared-result lifetime |

The filesystem and asynchronous result investigations run natively. The browser provides neither a host filesystem security boundary nor native threading for these lessons. All other additions are exercised by the browser compiler suite; native compilation independently checks every lesson.

## Review of the rest of the course

| Part | Existing instruction reviewed | Gap addressed in this revision | Remaining scope limit |
| --- | --- | --- | --- |
| Language | Initialization, control flow, functions/declarations/linking, text, domain types | Seven dedicated library chapters replace reliance on incidental library usage | Full multi-file build exercises, preprocessing/ODR failure fixtures, and CMake/CTest workflow need a separate practical track; modules and coroutines are not taught |
| Ownership/types | RAII, views/lifetimes, copy/move, exceptions, templates, dispatch | Forwarding references, semantic limits of concepts, constant evaluation, polymorphic deletion | No exhaustive overload-resolution, template specialization, ABI/object-layout, or allocator-aware type-design treatment |
| Algorithms | Complexity, bounds/search, sorting, recursion/DP | Standard algorithm contracts, scans/folds, iterator complexity, ranges | No comprehensive combinatorics, advanced graph optimization, or numerical-analysis course; asymptotic claims remain tied to stated models |
| Data structures | Owned lists/queues, open-addressed hash, AVL, heaps, traversals | Standard-container counterparts and invalidation make implementation-versus-library choices explicit | No arbitrary-height production disk index, allocator benchmark suite, or concurrent lock-free structure |
| Database basics | Records, SQL-subset lexer/parser, operators, codec, pin-guard cache | Numeric/text parsing and filesystem contracts strengthen boundary literacy | The SQL grammar is deliberately restricted; no full SQL type system, schema migration engine, network protocol, or production buffer manager |
| Reliability | Bounded B+ index, transactions, redo recovery, access costs | No new durability claims; existing bounded-model warnings retained | The index is a bounded root/leaf model, WAL is a tiny single-value model, transactions are not a production recovery subsystem; OS flush/error-injection integration remains separate work |
| Portability | Standards/features, numeric limits, files/text, storage audit | Explicit path/error semantics, PMR resource lifetimes, format library boundary | No Windows/POSIX cross-platform CI matrix, exhaustive Unicode processing, locale collation, or host filesystem security implementation |
| Concurrency | jthread/stop, queues, mutexes, atomics, publication, storage/reclamation | Futures/promises, task errors, explicit launch policy, shared results | No thread pool/work-stealing implementation, sanitizer qualification, or proof of arbitrary lock-free reclamation |
| Advanced storage/release | Isolation schedules, one-row MVCC, joins/aggregates, maintenance, release checks | Audit distinguishes executable components from an assembled engine | Components are not integrated into one production DB; full serializability, multi-process crash testing, fuzzing infrastructure and statistically controlled benchmarks remain future work |

## Deliberately not claimed as comprehensive

The course now has a substantially broader practical standard-library foundation, not exhaustive coverage of every header or overload. Further library work should prioritize associative node handles and transparent lookup, string encoding/search depth, allocator propagation, execution policies, calendar/time-zone facilities, regex tradeoffs, and more complete format customization. C++23 facilities such as expected, print and newer ranges adaptors require an explicitly versioned extension beyond the C++20 baseline.

Recommended next larger tracks are (1) native build/debug/test tooling with multi-file fixtures and sanitizer/fuzz runs, (2) integration of storage components under a real file adapter with crash injection, and (3) deeper library composition projects. These are recorded gaps rather than promises implied by the current lesson count.

## Verification

The native suite compiles each program with C++20 and strict warnings, checks exact output, and retains the independent storage-model tests. The browser suite compiles and executes every browser-designated lesson. Interface checks visit every lesson, verify its reading/question/experiment, and exercise filtering, progress, drafts, persistence and responsive layouts. Curriculum validation checks unique identities and teaching fields; it does not evaluate pedagogical completeness. No test result establishes full standard conformance or production database safety.
