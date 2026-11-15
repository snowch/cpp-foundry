# Learning-order audit

Reviewed 2026-11-15. This audit covers the ordered chapter entry points, all lesson prerequisite links, and a curated first-use vocabulary scan across every lesson’s prose, program, walkthrough, question, answers, feedback and experiment. It is not a proof that every sentence is understandable to every reader.

## Corrections

- Replaced the original first program with literal text output. It now explains #include, main, braces, semicolons, quoted text, std::cout, <<, newline, compilation and return 0 before asking a question about them. Removed premature ownership, destructor, caller and flush comparisons.

- Replaced the early numeric overflow/optional program with named integers and addition. Replaced the early optional average function with a single-input function. Replaced the reference-based string-vector loop with an integer vector loop explained by value.

- Added text, decisions, repetition and scope lessons. The first eight lessons now build one small step at a time, rather than using references, exceptions and optional results to introduce basic syntax.

- Moved the standard-library chapters after ownership, lifetime, template and polymorphism foundations. Existing lesson IDs and saved-work keys are retained; global chapter numbers change with the corrected sequence.

- Added chapter-specific entry explanations and earlier prerequisite links across all 54 chapters. Added point-of-use explanations of unfamiliar terms and notation; those explanations are rendered before the prose that uses them and exported with the readings.

## Scope and remaining judgment

The vocabulary catalogue is a review aid, not an automatic measure of teaching quality. Pattern matching can identify a word or source form without understanding the sentence. The chapter introductions and opening rewrites are authored teaching content; the tests check specific regressions and ordering, not pedagogical completeness. Some advanced examples remain substantial and should be worked through after their linked prerequisites. No claim is made that every possible implicit assumption has been eliminated.

## Chapter-by-chapter trace

| Part / chapter | Start after | First-use explanations added in this chapter |
| --- | --- | --- |
| Learn modern C++ / Values before pointers | No prior C++ knowledge | Builds on earlier explanations |
| Learn modern C++ / Decisions and loops | [Keep local names inside their braces](../native/chapters/values/README.md) | invariant, boolean-operators, empty, precondition, index, subscript, class-members, enum, switch, unsigned |
| Learn modern C++ / Functions and program boundaries | [Name a calculation with a function](../native/chapters/values/README.md) | object, reference, const, compound-assignment, exception, auto, struct, structured-binding, checked-access, function-overload, translation-unit, header-guard |
| Learn modern C++ / Text and sequences | [Keep several values in a vector](../native/chapters/values/README.md) | graph, bytes, unicode, capacity, complexity-amortized, member-initialization, iterator, lambda, modulo, algorithm-predicate, optional, string-view, size-types, allocator |
| Learn modern C++ / Design small domain types | [Keep local names inside their braces](../native/chapters/values/README.md) | initialization, constructor, heap, pointer, default-delete, operator-overload |
| Own resources and design types / Ownership and lifetimes | [Keep local names inside their braces](../native/chapters/values/README.md) | character-literal, destructor, unique-ptr, raii, move |
| Own resources and design types / Lifetimes and borrowed views | [RAII ties cleanup to scope](../native/chapters/ownership/README.md) | null-pointer, undefined-behavior, reallocation, array, span, weak-ptr |
| Own resources and design types / Copying, moving, and value semantics | [Unique ownership and moving](../native/chapters/ownership/README.md) | static-assert, type-traits, noexcept |
| Own resources and design types / Templates and generic interfaces | [Define an independent copy when the domain needs one](../native/chapters/copy-move/README.md) | template, thread, arrow-access, requires, constexpr, for-counter, forwarding, value-category |
| Own resources and design types / Runtime and static polymorphism | [A requires expression can check an operation](../native/chapters/templates/README.md) | virtual, variant |
| Own resources and design types / Boundaries and errors | [Visit a closed set of complete value types](../native/chapters/polymorphism/README.md) | error-code, cast, type-alias |
| Own resources and design types / Generic code and object-model contracts | [Forward a callable without inventing ownership](../native/chapters/templates/README.md) | static-member |
| Use the standard library / Use the standard library | [Express required operations without claiming semantic proof](../native/chapters/generic-contracts/README.md) | half-open, ordered-set, strict-order |
| Use the standard library / Container contracts in practice | [Choose ordering and lookup contracts deliberately](../native/chapters/standard-library/README.md) | ordered-map, hash |
| Use the standard library / Iterator categories and invalidation | [Hash equality and rehash contracts](../native/chapters/library-containers/README.md) | Builds on earlier explanations |
| Use the standard library / Algorithm contracts and numeric operations | [Treat stream iteration as single pass](../native/chapters/library-iterators/README.md) | Builds on earlier explanations |
| Use the standard library / Ranges, views, and borrowed lifetimes | [Find a duplicate interval with equal_range](../native/chapters/library-algorithms/README.md) | decltype |
| Use the standard library / Vocabulary types and callable utilities | [Keep algorithm results tied to a living range](../native/chapters/library-ranges/README.md) | tuple, type-erasure |
| Use the standard library / Text conversion, formatting, and stream state | [Choose callable storage and captured state](../native/chapters/library-values/README.md) | integer-limits, alignment |
| Use the standard library / Durations, deterministic randomness, and bits | [Use C++20 format with an explicit support boundary](../native/chapters/library-text-io/README.md) | endianness, fixed-width-integers |
| Reason about algorithms / Algorithms and generic code | [Find a duplicate interval with equal_range](../native/chapters/library-algorithms/README.md) | complexity |
| Reason about algorithms / Complexity and correctness | [Algorithms separate intent from iteration](../native/chapters/algorithms/README.md) | Builds on earlier explanations |
| Reason about algorithms / Searching and partition points | [Distinguish upper bounds from tight bounds](../native/chapters/complexity/README.md) | Builds on earlier explanations |
| Reason about algorithms / Sorting and algorithm strategies | [Maintain a half-open candidate interval](../native/chapters/searching/README.md) | Builds on earlier explanations |
| Reason about algorithms / Recursion and dynamic programming | [Insertion sort maintains a sorted prefix](../native/chapters/sorting-strategies/README.md) | recursion |
| Build data structures / Lists, stacks, and queues | [Cache results for repeated subproblems](../native/chapters/recursion/README.md) | Builds on earlier explanations |
| Build data structures / Hash tables and collisions | [A queue preserves arrival order](../native/chapters/lists-queues/README.md) | Builds on earlier explanations |
| Build data structures / Search trees and balancing | [Check a hash implementation against an independent model](../native/chapters/hashing/README.md) | Builds on earlier explanations |
| Build data structures / Heaps and priority queues | [Keep stored heights consistent with structure](../native/chapters/balanced-trees/README.md) | pair |
| Build data structures / Graphs and traversal | [Make scheduling ties deterministic](../native/chapters/heaps/README.md) | Builds on earlier explanations |
| Build the database / Build a persistent record store | [Weighted shortest paths require a compatible algorithm](../native/chapters/graphs/README.md) | transaction |
| Build the database / Lexing and a SQL subset | [Represent rows as owning values](../native/chapters/records/README.md) | Builds on earlier explanations |
| Build the database / Query execution operators | [Parse into a typed query value](../native/chapters/parsing-sql/README.md) | Builds on earlier explanations |
| Build the database / Binary records and validation | [Define bytes independently of object layout](../native/chapters/records/README.md) | codec, happens-before |
| Build the database / Pages, guards, and caching | [Validate a complete candidate before replacing live state](../native/chapters/binary-codecs/README.md) | output-buffer |
| Index, transact, and recover / A bounded B+ tree | [A scoped guard prevents eviction while a page is borrowed](../native/chapters/pager-cache/README.md) | Builds on earlier explanations |
| Index, transact, and recover / Transaction state and commit | [Check mixed updates against independent membership and structure](../native/chapters/bplus-tree/README.md) | revision, atomic, mutex |
| Index, transact, and recover / Redo logging and recovery | [Publish a complete candidate at commit](../native/chapters/transactions/README.md) | idempotent, wal, checkpoint |
| Index, transact, and recover / Planning and access costs | [A scan produces candidate rows](../native/chapters/query-execution/README.md) | Builds on earlier explanations |
| Write portable C++ / C++ standards and library contracts | [Explain estimates and validate result equivalence](../native/chapters/query-planning/README.md) | cast-reinterpret, abi |
| Write portable C++ / Numeric boundaries in depth | [State the language baseline explicitly](../native/chapters/cpp-standards/README.md) | Builds on earlier explanations |
| Write portable C++ / Files, text, and host boundaries | [An independent byte fixture defines the encoding](../native/chapters/binary-codecs/README.md) | Builds on earlier explanations |
| Write portable C++ / Audit the storage boundary | [Keep logical names separate from host path rules](../native/chapters/host-files-text/README.md) | Builds on earlier explanations |
| Write portable C++ / Filesystem and allocation boundaries | [A weak observer can detect expired shared ownership](../native/chapters/lifetimes-views/README.md) | Builds on earlier explanations |
| Coordinate concurrent work / Engineering beyond the browser | [Keep implementation, tests, and guarantees separate](../native/chapters/storage-audit/README.md) | data-race, join, release-acquire |
| Coordinate concurrent work / Threads, queues, and shutdown | [Protect a shared invariant with a lock](../native/chapters/engineering/README.md) | condition-variable, predicate-wait |
| Coordinate concurrent work / Atomics and the memory model | [Acquire several mutexes with a consistent protocol](../native/chapters/thread-coordination/README.md) | initializer-list, shared-ptr |
| Coordinate concurrent work / Concurrent storage ownership | [Publish a prepared batch before readers inspect it](../native/chapters/atomics-memory/README.md) | Builds on earlier explanations |
| Coordinate concurrent work / Asynchronous results and task contracts | [Join before borrowed worker state is destroyed](../native/chapters/thread-coordination/README.md) | Builds on earlier explanations |
| Extend the database / Isolation and multi-client contracts | [Validate and update under the same mutex](../native/chapters/concurrent-storage/README.md) | serializable |
| Extend the database / Snapshots and version ownership | [Expose a lost update with an explicit schedule](../native/chapters/isolation/README.md) | mvcc |
| Extend the database / Joins, grouping, and richer queries | [Compose operators while preserving the query contract](../native/chapters/query-execution/README.md) | Builds on earlier explanations |
| Extend the database / Maintenance and checkpointing | [Reclaim only versions older than every active reader needs](../native/chapters/mvcc/README.md) | Builds on earlier explanations |
| Extend the database / Reliability and release work | [Publish a replacement without invalidating old readers](../native/chapters/maintenance/README.md) | Builds on earlier explanations |

## First-use lesson index

- **Branch on a domain condition** (branch-contracts): invariant.

- **Use short-circuiting to establish a precondition** (short-circuit): boolean-operators, empty, precondition.

- **State what a loop has already processed** (loop-invariants): index, subscript.

- **Dispatch a closed set of commands** (switch-enums): class-members, enum, switch.

- **Make a decreasing measure visible** (termination): unsigned.

- **A value parameter gives independent state** (value-parameters): object, reference, const, compound-assignment.

- **Return related results together** (return-results): exception, auto, struct, structured-binding, checked-access.

- **Overloads select from the static argument types** (overload-resolution): function-overload.

- **A declaration states an interface before its definition** (declarations-linking): translation-unit.

- **Headers must tolerate repeated inclusion** (header-guards): header-guard.

- **Text length and byte length are different contracts** (string-bytes): graph, bytes, unicode.

- **Size describes live elements; capacity describes storage** (vector-capacity): capacity, complexity-amortized.

- **Frame input as complete lines** (line-input): member-initialization.

- **Remove elements with an explicit predicate** (erase-remove): iterator, lambda, modulo, algorithm-predicate.

- **Build subranges from validated bounds** (safe-slicing): optional, string-view, size-types, allocator.

- **Aggregate initialization names a simple value layout** (aggregate-init): initialization, constructor.

- **Prevent accidental domain conversions** (explicit-construction): heap.

- **Const member functions promise read-only access through this** (member-const): pointer.

- **Define equality from domain meaning** (value-equality): default-delete, operator-overload.

- **References borrow; const restricts access** (references): character-literal.

- **RAII ties cleanup to scope** (raii): destructor, unique-ptr, raii.

- **Unique ownership and moving** (moves): move.

- **An observer does not own the object** (observer-owner): null-pointer.

- **A named owner can outlive an expression** (temporary-lifetime): undefined-behavior.

- **Reallocation invalidates element observers** (vector-invalidation): reallocation.

- **A view can expose mutations without owning them** (view-mutation): array, span.

- **A weak observer can detect expired shared ownership** (shared-weak): weak-ptr.

- **A move-only member makes ownership transfer explicit** (move-only-types): static-assert, type-traits.

- **Nonthrowing movement affects container choices** (noexcept-moves): noexcept.

- **Template argument deduction follows the parameter pattern** (deduction): template.

- **A requires expression can check an operation** (requires-expressions): thread, arrow-access, requires.

- **Select a compile-time branch** (if-constexpr): constexpr.

- **Constexpr permits evaluation in constant-expression contexts** (constexpr-evaluation): for-counter.

- **Forward a callable without inventing ownership** (forwarding): forwarding, value-category.

- **Dispatch through a borrowing base reference** (virtual-interface): virtual.

- **Visit a closed set of complete value types** (variant-visitation): variant.

- **Parse the entire field** (parsing): error-code.

- **Model alternatives explicitly** (sum-types): cast, type-alias.

- **Destroy polymorphic owners through a virtual interface** (gap-virtual-destruction): static-member.

- **Use half-open iterator ranges** (iterator-ranges): half-open.

- **Choose ordering and lookup contracts deliberately** (container-selection): ordered-set.

- **Predicates need coherent semantic rules** (algorithm-predicates): strict-order.

- **Distinguish lookup, insertion, and replacement** (lib-map-insertion): ordered-map.

- **Hash equality and rehash contracts** (lib-unordered-contracts): hash.

- **Keep algorithm results tied to a living range** (lib-borrowed-result): decltype.

- **Expand grouped arguments into a callable** (lib-tuple-apply): tuple.

- **Choose callable storage and captured state** (lib-callable-ownership): type-erasure.

- **Recover deliberately after failed extraction** (lib-stream-state): integer-limits.

- **Use C++20 format with an explicit support boundary** (lib-format-feature): alignment.

- **Check representation before shifting and bit casting** (lib-bit-utilities): endianness, fixed-width-integers.

- **Algorithms separate intent from iteration** (sorting): complexity.

- **A recursive call needs a smaller problem** (recursive-progress): recursion.

- **Make scheduling ties deterministic** (priority-ties): pair.

- **Uniqueness and updates are contracts** (crud): transaction.

- **An independent byte fixture defines the encoding** (codec-exact-bytes): codec.

- **Check remaining bytes before consuming a field** (codec-bounds): happens-before.

- **Separate cache hits from backing loads** (cache-hits): output-buffer.

- **Begin with a private candidate state** (transaction-begin): revision.

- **Publish a complete candidate at commit** (transaction-commit): atomic.

- **Reject a commit based on an old revision** (stale-commit): mutex.

- **Redo should tolerate repeating already applied work** (wal-idempotence): idempotent.

- **Separate checked writes from a host durability request** (wal-native-sync): wal, checkpoint.

- **Object representation is not an interchange format** (object-abi): cast-reinterpret, abi.

- **Protect a shared invariant with a lock** (threads): data-race, join.

- **Publish initialized data with acquire/release** (publication): release-acquire.

- **Wait for a predicate, not just a notification** (condition-queue): condition-variable, predicate-wait.

- **Publish an owning immutable snapshot handle** (atomic-snapshot-owner): initializer-list, shared-ptr.

- **Validate the data a decision depended on** (serial-validation): serializable.

- **Visibility is a half-open version interval** (version-intervals): mvcc.
