# Original concept diagrams

The course includes 34 concept diagrams, selected for lessons where relationships, transitions, or boundaries benefit from a visual explanation. The diagrams are original compositions authored for C++ Foundry from its own lesson contracts and programs. No external textbook figures, screenshots, brand illustrations, tracing, stock artwork, or third-party diagram templates were used. The renderer uses native SVG and system fonts, with no external diagram service or runtime library.

The new original diagram material follows the repository’s [Christopher Snow copyright notice](../LICENSE). Each standalone SVG includes that notice in its metadata.

## Sources and maintenance

- `dist/diagrams.js`: editable nodes, connections, captions, and lesson associations.
- `dist/diagram-view.js`: SVG rendering, accessible descriptions and lesson figures.
- `native/diagrams/`: generated standalone SVGs, linked from exported chapter readings.
- `tools/export.mjs`: regenerate the SVGs and chapter links with `npm run export`.

The ordinary course concepts themselves are expressed in newly written labels, layouts, captions, and descriptions. This provenance record applies to these diagrams; it does not relicense the repository or its separately attributed compiler dependencies, and is not a claim of legal clearance for unrelated material.

## Reading conventions

Arrow meaning is specified by each caption: it can represent progression through a process, a branch, ownership, or a data dependency. It is not a universal memory-address notation. Ownership and observation diagrams use solid and dashed connections respectively; their captions and text descriptions name the distinction, so color or dash recognition is not required. Tree diagrams are schematic and explicitly identify their ordering assumptions and model limits.

Each browser figure has a title, an SVG text description, a visible caption, and an expandable text equivalent. The exported SVG includes its own title and description without relying on browser styles. The same caption and textual relationships are included in exported Markdown. Diagrams supplement the complete program and written explanation rather than replace them.

Coverage includes program building, RAII, observation and move semantics; vector and hash invalidation; erase loops, stream iterators and remove/erase; lazy ranges, variants, strict parsing, durations, weak ownership and PMR; binary search, memoization, ring buffers, probing, trees, heaps and BFS; SQL parsing, query operators, candidate decoding, page pinning, bounded B+ routing, transaction checks and redo recovery; release/acquire publication, futures, MVCC reclamation, joins and generation replacement.

## Verification

The diagram check verifies lesson associations and graph references, exports, accessible text, label bounds inside nodes, and page overflow on phone and desktop viewports. Screenshots cover ownership, branching, and pipeline examples. Conceptual accuracy still requires reviewing captions alongside each lesson: visual consistency alone is not evidence that an arbitrary concurrency or recovery protocol is correct.
