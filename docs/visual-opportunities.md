# Visual opportunities across the whole course

Reviewed on 25 November 2026 against `460deb2e8600512900eb4790d012f1f8bf5c61a9`. This extends the review beyond existing diagrams: 270 lessons have coverage records, including 23 newly illustrated lessons and 34 revised models.

Follow the [shared course-design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md). No dedicated UX or learning skill was available; this records equivalent design and learning reviews.

## Learning review

Look for references to shared objects, changing slots, exclusive bounds, call/return state, alternative branches, dependency edges, occupancy thresholds and publication/retention boundaries. Add a model when it answers a named question more directly than code/output alone. Keep simple syntax, API lookup and one-step results concise. The JSON companion quotes the passage, pins the starter source, and records each selected question, parts, connections, values, units and assumptions. Keep prerequisite definitions visible. Static models explicitly describe the supplied example, not arbitrary source edits.

## Presentation review

Before: spatial relationships were sometimes encoded in prose cards, small labels or a differently sized example. After: stable indexed cells for storage/ranges, converging name-to-object edges for aliases, actual graph/tree links, explicit alternatives, and labelled dependency tables. Essential model labels use live text at 16px or larger. Use theme roles and text/shape cues as well as color. Retain local scroll only where needed; never shrink the whole model to conceal small type.

## Reading order and scope

Keep the course’s existing reading order and compact lesson navigation. Put models next to the worked explanation/result without moving the editor into another page. Models never execute code, modify source/Input, write storage or mark completion. Keep the existing fgets interaction in C. A model can replace repeated relationship narration; it does not replace preconditions, definitions or caveats.

## Curated additions and revisions

| Lesson | Decision | Question answered |
| --- | --- | --- |
| [A declaration states an interface before its definition](https://snowch.github.io/cpp-foundry/#/lesson/declarations-linking) | Revised | What does the header supply, and what must the linker still find? |
| [Text length and byte length are different contracts](https://snowch.github.io/cpp-foundry/#/lesson/string-bytes) | Added | Why does Zoë occupy four bytes? |
| [Size describes live elements; capacity describes storage](https://snowch.github.io/cpp-foundry/#/lesson/vector-capacity) | Added | Why does reserve(20) leave size 2 but resize(4) creates two zeros? |
| [Build subranges from validated bounds](https://snowch.github.io/cpp-foundry/#/lesson/safe-slicing) | Added | Why is [0,4) inside Lovelace but [2,9) outside Ada? |
| [RAII ties cleanup to scope](https://snowch.github.io/cpp-foundry/#/lesson/raii) | Revised | What still runs when an exception leaves work? |
| [Unique ownership and moving](https://snowch.github.io/cpp-foundry/#/lesson/moves) | Revised | Why is first empty after moving it into second? |
| [An observer does not own the object](https://snowch.github.io/cpp-foundry/#/lesson/observer-owner) | Revised | Why does observer not keep the int alive after owner.reset()? |
| [A view can expose mutations without owning them](https://snowch.github.io/cpp-foundry/#/lesson/view-mutation) | Added | Why does middle.front()=9 change the value seen by read_only? |
| [Use half-open iterator ranges](https://snowch.github.io/cpp-foundry/#/lesson/iterator-ranges) | Added | Why must found be compared with end before dereferencing? |
| [Reserve capacity without creating elements](https://snowch.github.io/cpp-foundry/#/lesson/lib-vector-invalidation) | Revised | Why can v.at(0) still read 3 after reserving more capacity? |
| [Hash equality and rehash contracts](https://snowch.github.io/cpp-foundry/#/lesson/lib-unordered-contracts) | Revised | Why does Ada still have count 2 after rehash? |
| [Continue traversal using erase’s result](https://snowch.github.io/cpp-foundry/#/lesson/lib-erase-return) | Revised | Why must the erase path avoid a second increment? |
| [Treat stream iteration as single pass](https://snowch.github.io/cpp-foundry/#/lesson/lib-stream-iterators) | Revised | Why does accumulate consume 3,4,5 only once? |
| [Separate logical removal from physical erasure](https://snowch.github.io/cpp-foundry/#/lesson/lib-remove-erase) | Revised | Why does the program print 4, then 2, then 2? |
| [Find a duplicate interval with equal_range](https://snowch.github.io/cpp-foundry/#/lesson/lib-bounds-duplicates) | Added | Why does equal_range return first position 1 and count 3? |
| [Observe a lazy pipeline before materializing](https://snowch.github.io/cpp-foundry/#/lesson/lib-lazy-views) | Revised | Which values are filtered and squared when the loop requests them? |
| [Handle each tagged alternative](https://snowch.github.io/cpp-foundry/#/lesson/lib-variant-visit) | Revised | Which visitor branch prints number=7 and which prints text=Ada? |
| [Require complete numeric consumption](https://snowch.github.io/cpp-foundry/#/lesson/lib-charconv-complete) | Revised | Why is 42 accepted but 42x rejected? |
| [Convert duration units explicitly](https://snowch.github.io/cpp-foundry/#/lesson/lib-chrono-units) | Revised | Where do the extra 750 milliseconds go? |
| [Maintain a half-open candidate interval](https://snowch.github.io/cpp-foundry/#/lesson/binary-search-invariant) | Revised | Why does lower(values,3) return 1? |
| [Cache results for repeated subproblems](https://snowch.github.io/cpp-foundry/#/lesson/memoization) | Revised | Why should the second request reuse fib(2)? |
| [Separate a ring’s logical order from its array positions](https://snowch.github.io/cpp-foundry/#/lesson/ring-buffer) | Revised | Where does the successful push(4) store its value? |
| [Deletion must preserve later probe paths](https://snowch.github.io/cpp-foundry/#/lesson/tombstones) | Revised | How can key 8 remain findable after key 1 is deleted? |
| [Preserve the search-tree ordering invariant](https://snowch.github.io/cpp-foundry/#/lesson/tree-ordering) | Revised | Which path finds key 3? |
| [A rotation transfers ownership while preserving order](https://snowch.github.io/cpp-foundry/#/lesson/avl-single-rotation) | Added | Why is the repaired root 20 with children 10 and 30? |
| [Resolve a zigzag imbalance in two steps](https://snowch.github.io/cpp-foundry/#/lesson/avl-double-rotation) | Added | Why is the repaired root 20 with children 10 and 30? |
| [A heap maintains a partial ordering](https://snowch.github.io/cpp-foundry/#/lesson/heap-order) | Revised | Why is 1 the minimum even though the array is not fully sorted? |
| [Breadth-first traversal discovers shortest hop counts](https://snowch.github.io/cpp-foundry/#/lesson/breadth-first) | Revised | Why do vertices 1 and 2 both have distance 1? |
| [Acyclic dependencies admit a topological order](https://snowch.github.io/cpp-foundry/#/lesson/topological-order) | Added | Why can vertex 3 run only after both 1 and 2? |
| [Weighted shortest paths require a compatible algorithm](https://snowch.github.io/cpp-foundry/#/lesson/weighted-path) | Added | Why are distances to 1 and 3 equal to 2 and 3? |
| [Parse into a typed query value](https://snowch.github.io/cpp-foundry/#/lesson/sql-select-ast) | Revised | What differs between SELECT all and SELECT by ID? |
| [Compose operators while preserving the query contract](https://snowch.github.io/cpp-foundry/#/lesson/operator-composition) | Revised | Which stage selects rows and which orders the selected names? |
| [A length prefix needs its own domain bound](https://snowch.github.io/cpp-foundry/#/lesson/codec-length-prefix) | Added | Which bytes form the three-character name Ada? |
| [Validate a complete candidate before replacing live state](https://snowch.github.io/cpp-foundry/#/lesson/codec-candidate-import) | Revised | Why does the failed second read leave live as [7,8]? |
| [A scoped guard prevents eviction while a page is borrowed](https://snowch.github.io/cpp-foundry/#/lesson/pin-guards) | Revised | Why is pin(3) rejected until the first two guards leave scope? |
| [Route a key through leaf separator values](https://snowch.github.io/cpp-foundry/#/lesson/bplus-routing) | Revised | Which leaf receives boundary key 3 after the split? |
| [Split an overflowing leaf before publishing structure](https://snowch.github.io/cpp-foundry/#/lesson/bplus-split) | Added | Which leaf receives boundary key 3 after the split? |
| [Borrow from a sibling with spare occupancy](https://snowch.github.io/cpp-foundry/#/lesson/bplus-borrow) | Added | Which key moves when deleting 1 leaves the left leaf underfull? |
| [Merge when neither sibling can donate](https://snowch.github.io/cpp-foundry/#/lesson/bplus-merge) | Added | Why do keys 2,3,4 end up in one leaf? |
| [Publish a complete candidate at commit](https://snowch.github.io/cpp-foundry/#/lesson/transaction-commit) | Revised | What happens if the transaction’s observed revision is stale? |
| [A truncated final record is not a complete record](https://snowch.github.io/cpp-foundry/#/lesson/wal-torn-tail) | Revised | Why must the torn commit tail leave the update unpublished? |
| [Compare signed and unsigned values deliberately](https://snowch.github.io/cpp-foundry/#/lesson/mixed-sign) | Added | Why is std::cmp_less(-1,1u) true? |
| [Check multiplication without overflowing the check](https://snowch.github.io/cpp-foundry/#/lesson/checked-multiply) | Added | Why is the maximum unsigned input rejected for multiplication by 2? |
| [Division has more than a zero-denominator boundary](https://snowch.github.io/cpp-foundry/#/lesson/checked-division) | Added | Why are both divisor 0 and INT_MIN/-1 rejected? |
| [A Unicode boundary is not an arbitrary byte position](https://snowch.github.io/cpp-foundry/#/lesson/text-byte-slices) | Added | Why is offset 1 not the start of another character in ë? |
| [Observe shared state without creating a cycle](https://snowch.github.io/cpp-foundry/#/lesson/lib-weak-ownership) | Revised | Why does lock succeed inside the scope and expire afterward? |
| [Bound an allocation resource lifetime](https://snowch.github.io/cpp-foundry/#/lesson/lib-pmr-lifetimes) | Revised | Why is arena.release() after the vector’s scope? |
| [Join before borrowed worker state is destroyed](https://snowch.github.io/cpp-foundry/#/lesson/joined-lifetime) | Added | When may main read result safely? |
| [Wait for a predicate, not just a notification](https://snowch.github.io/cpp-foundry/#/lesson/condition-queue) | Added | Why does closing the queue still allow accepted work to drain? |
| [A failed compare-exchange updates the expected value](https://snowch.github.io/cpp-foundry/#/lesson/compare-exchange) | Added | Why does failed compare-exchange leave value=7 but expected=7? |
| [Publish a prepared batch before readers inspect it](https://snowch.github.io/cpp-foundry/#/lesson/release-acquire-data) | Revised | Which load makes reading [20,22] safe? |
| [Transfer one result through a shared state](https://snowch.github.io/cpp-foundry/#/lesson/lib-future-promise) | Revised | When can result.get() return 42? |
| [Visibility is a half-open version interval](https://snowch.github.io/cpp-foundry/#/lesson/version-intervals) | Added | Why do snapshots 1 and 2 see 10 and 20 respectively? |
| [Reclaim only versions older than every active reader needs](https://snowch.github.io/cpp-foundry/#/lesson/oldest-reader-gc) | Revised | Why are three versions retained until snapshot 1 is released? |
| [Keep every build row for a join key](https://snowch.github.io/cpp-foundry/#/lesson/hash-join-buckets) | Revised | Why does probing key 1 produce AX and AY? |
| [A reused slot needs a generation check](https://snowch.github.io/cpp-foundry/#/lesson/generation-handles) | Added | Why must the old handle be rejected even though slot 0 is live again? |
| [Publish a replacement without invalidating old readers](https://snowch.github.io/cpp-foundry/#/lesson/generation-publication) | Revised | Why is old_size 3 while new_size is 2? |

## Complete coverage

See [all per-lesson decisions, passages and model specifications](visual-opportunities.json). “Keep prose” means no additional visual is selected for that focused objective in this pass; it is not a claim that no possible illustration could help. Existing figures outside the changed set remain available.

## Verification

The build and curriculum checks passed. All 57 curated models passed 342 phone/tablet/desktop theme states, with readable live labels, valid byte groups/edges, no overlapping graph nodes, expanded text alternatives and no automatic compiler startup. An additional check confirms fixed allocation-box positions across before/after states. All 34 legacy SVG exports also passed node-label bounds checks; current chapter readings link the richer standalone HTML figures and their text equivalents.

The existing compiler, interface, saved-work, offline/update and navigation suites passed, as did native C++ and storage-model checks (4000 AVL operations, 4000 bounded B+ operations, 4000 heap operations, 2000 MVCC operations, 421 crash prefixes and 420 single-bit corruptions). These checks cover behavior, not measured learning effectiveness.
