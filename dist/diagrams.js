/* Copyright © 2026 Christopher Snow. All rights reserved.
 * Original concept diagrams authored for C++ Foundry. See docs/diagrams.md. */
export const diagrams=[
  {
    "lesson": "declarations-linking",
    "title": "Declarations, compilation, and linking",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Header",
        "lines": [
          "declares the",
          "interface"
        ],
        "labelLines": [
          "Header"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Source files",
        "lines": [
          "compile",
          "separately"
        ],
        "labelLines": [
          "Source files"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Linker",
        "lines": [
          "resolves",
          "definitions"
        ],
        "labelLines": [
          "Linker"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "A header makes declarations visible during compilation. The linker connects separately compiled definitions; a declaration alone does not supply an implementation."
  },
  {
    "lesson": "raii",
    "title": "A resource follows its owner’s lifetime",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Enter scope",
        "lines": [
          "construct the",
          "owner"
        ],
        "labelLines": [
          "Enter scope"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Use the resource",
        "lines": [
          "owner remains",
          "alive"
        ],
        "labelLines": [
          "Use the",
          "resource"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Leave scope",
        "lines": [
          "destructor",
          "releases"
        ],
        "labelLines": [
          "Leave scope"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The sequence includes normal return and exception unwinding after successful construction. It does not describe abrupt process termination; a partially constructed owner is not destroyed as a complete object."
  },
  {
    "lesson": "observer-owner",
    "title": "Ownership and observation are different edges",
    "nodes": [
      {
        "id": "0",
        "x": 75,
        "y": 60,
        "label": "Owner",
        "lines": [
          "controls",
          "lifetime"
        ],
        "labelLines": [
          "Owner"
        ]
      },
      {
        "id": "1",
        "x": 225,
        "y": 60,
        "label": "Observer",
        "lines": [
          "borrows access"
        ],
        "labelLines": [
          "Observer"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 200,
        "label": "Resource",
        "lines": [
          "must still be",
          "alive"
        ],
        "labelLines": [
          "Resource"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "2",
        "label": "owns",
        "dashed": false
      },
      {
        "source": "1",
        "target": "2",
        "label": "borrows",
        "dashed": true
      }
    ],
    "height": 262,
    "caption": "Solid arrow: ownership. Dashed arrow: observation. Destroying the owner can invalidate the observer; the observer does not prolong the resource lifetime."
  },
  {
    "lesson": "moves",
    "title": "Move a resource, not the object’s identity",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Before move",
        "lines": [
          "source owns",
          "resource"
        ],
        "labelLines": [
          "Before move"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Move construction",
        "lines": [
          "destination",
          "takes it"
        ],
        "labelLines": [
          "Move",
          "construction"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "After move",
        "lines": [
          "source still",
          "exists"
        ],
        "labelLines": [
          "After move"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "This sketches transfer by a move-capable owner. The moved-from object still needs a valid destruction path; its other usable operations depend on its type’s contract. A move is not guaranteed to transfer an allocation for every type."
  },
  {
    "lesson": "lib-vector-invalidation",
    "title": "Reallocation changes where elements live",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Before reserve",
        "lines": [
          "elements in old",
          "storage"
        ],
        "labelLines": [
          "Before reserve"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Capacity grows",
        "lines": [
          "new storage",
          "allocated"
        ],
        "labelLines": [
          "Capacity grows"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "After reallocation",
        "lines": [
          "reacquire",
          "element access"
        ],
        "labelLines": [
          "After",
          "reallocation"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Pointers, references, and iterators into the old vector storage are invalidated. An index is useful only if other edits have not changed positions; reserve changes capacity, not size."
  },
  {
    "lesson": "lib-unordered-contracts",
    "title": "Rehash changes buckets, not the key/value contract",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Key and hash",
        "lines": [
          "select a bucket"
        ],
        "labelLines": [
          "Key and hash"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Bucket candidates",
        "lines": [
          "compare keys for",
          "equality"
        ],
        "labelLines": [
          "Bucket",
          "candidates"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "After rehash",
        "lines": [
          "reacquire",
          "iterators"
        ],
        "labelLines": [
          "After rehash"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Equivalent keys must have equal hashes; collisions are permitted. Rehash reorganizes buckets and invalidates iterators, but references and pointers to surviving elements remain valid. No iteration order is promised."
  },
  {
    "lesson": "lib-erase-return",
    "title": "An erase loop has two different next steps",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Current iterator",
        "lines": [
          "inspect the",
          "value"
        ],
        "labelLines": [
          "Current",
          "iterator"
        ]
      },
      {
        "id": "1",
        "x": 75,
        "y": 200,
        "label": "Keep element",
        "lines": [
          "increment",
          "iterator"
        ],
        "labelLines": [
          "Keep element"
        ]
      },
      {
        "id": "2",
        "x": 225,
        "y": 200,
        "label": "Erase element",
        "lines": [
          "take returned",
          "iterator"
        ],
        "labelLines": [
          "Erase element"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "keep",
        "dashed": false
      },
      {
        "source": "0",
        "target": "2",
        "label": "erase",
        "dashed": false
      }
    ],
    "height": 262,
    "caption": "The keep branch increments. The erase branch uses the iterator returned by vector::erase without incrementing again; the old iterator and later vector positions are invalidated."
  },
  {
    "lesson": "lib-stream-iterators",
    "title": "A stream iterator consumes one shared input",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Input characters",
        "lines": [
          "3 4 5"
        ],
        "labelLines": [
          "Input",
          "characters"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Input iterator",
        "lines": [
          "extracts values",
          "once"
        ],
        "labelLines": [
          "Input iterator"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Accumulator",
        "lines": [
          "total becomes 12"
        ],
        "labelLines": [
          "Accumulator"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The stream is consumed as accumulation proceeds. Copying an input iterator does not produce an independently rewindable source; materialize values when multiple passes are needed."
  },
  {
    "lesson": "lib-remove-erase",
    "title": "Logical removal precedes physical erasure",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Initial sequence",
        "lines": [
          "1 2 2 3 : size 4"
        ],
        "labelLines": [
          "Initial",
          "sequence"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "After remove(2)",
        "lines": [
          "retained prefix:",
          "1 3"
        ],
        "labelLines": [
          "After",
          "remove(2)"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "After erase",
        "lines": [
          "size 2; suffix",
          "removed"
        ],
        "labelLines": [
          "After erase"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "remove returns the logical end without shrinking the vector. The trailing values after remove are unspecified; the diagram deliberately does not depict them as the removed elements."
  },
  {
    "lesson": "lib-lazy-views",
    "title": "A view pipeline computes during traversal",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Source vector",
        "lines": [
          "1 2 3 4"
        ],
        "labelLines": [
          "Source vector"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Filter even values",
        "lines": [
          "2 and 4 pass"
        ],
        "labelLines": [
          "Filter even",
          "values"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Transform square",
        "lines": [
          "4 and 16 are",
          "yielded"
        ],
        "labelLines": [
          "Transform",
          "square"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "These are conceptual stages, not three stored containers. This pipeline borrows the source vector; each traversal performs work and must respect source lifetime and invalidation."
  },
  {
    "lesson": "lib-variant-visit",
    "title": "A tag chooses one active alternative",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Variant tag",
        "lines": [
          "which",
          "alternative?"
        ],
        "labelLines": [
          "Variant tag"
        ]
      },
      {
        "id": "1",
        "x": 75,
        "y": 200,
        "label": "Integer active",
        "lines": [
          "visit integer",
          "handler"
        ],
        "labelLines": [
          "Integer active"
        ]
      },
      {
        "id": "2",
        "x": 225,
        "y": 200,
        "label": "String active",
        "lines": [
          "visit string",
          "handler"
        ],
        "labelLines": [
          "String active"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "integer",
        "dashed": false
      },
      {
        "source": "0",
        "target": "2",
        "label": "string",
        "dashed": false
      }
    ],
    "height": 262,
    "caption": "Only the active branch is visited. The visitor must be well-formed for all alternatives. This shows the ordinary active-value case, not a possible valueless_by_exception state."
  },
  {
    "lesson": "lib-charconv-complete",
    "title": "A successful prefix is not a complete field",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Text: 42x",
        "lines": [
          "parse starts at",
          "4"
        ],
        "labelLines": [
          "Text: 42x"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "from_chars",
        "lines": [
          "value 42; stops",
          "at x"
        ],
        "labelLines": [
          "from_chars"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Full-field check",
        "lines": [
          "reject trailing",
          "text"
        ],
        "labelLines": [
          "Full-field",
          "check"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Accept a complete integer field only when the error code is clear and the stopping pointer reaches the end. Range errors and an invalid first character are distinct failure cases."
  },
  {
    "lesson": "lib-chrono-units",
    "title": "Duration conversion can discard a remainder",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "2 seconds + 750 ms",
        "lines": [
          "common unit: ms"
        ],
        "labelLines": [
          "2 seconds +",
          "750 ms"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "2750 milliseconds",
        "lines": [
          "duration count:",
          "2750"
        ],
        "labelLines": [
          "2750",
          "milliseconds"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Cast to whole seconds",
        "lines": [
          "2; fractional",
          "part lost"
        ],
        "labelLines": [
          "Cast to whole",
          "seconds"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "This fixture uses positive durations. duration_cast to integral seconds truncates toward zero; floor and round express other policies, particularly for negative values."
  },
  {
    "lesson": "lib-weak-ownership",
    "title": "Lock a weak observer before using the value",
    "nodes": [
      {
        "id": "0",
        "x": 75,
        "y": 60,
        "label": "Shared owner",
        "lines": [
          "keeps value",
          "alive"
        ],
        "labelLines": [
          "Shared owner"
        ]
      },
      {
        "id": "1",
        "x": 225,
        "y": 60,
        "label": "Weak observer",
        "lines": [
          "does not own",
          "value"
        ],
        "labelLines": [
          "Weak observer"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 200,
        "label": "lock succeeds",
        "lines": [
          "temporary shared",
          "owner"
        ],
        "labelLines": [
          "lock succeeds"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "2",
        "label": "shared lifetime",
        "dashed": false
      },
      {
        "source": "1",
        "target": "2",
        "label": "lock if alive",
        "dashed": true
      }
    ],
    "height": 262,
    "caption": "A successful lock holds ownership while the value is used. Once strong ownership ends, later lock attempts fail. The arrows describe lifetime relationships, not synchronization of mutable object state."
  },
  {
    "lesson": "lib-pmr-lifetimes",
    "title": "Release the arena only after its users finish",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Arena and storage",
        "lines": [
          "constructed",
          "first"
        ],
        "labelLines": [
          "Arena and",
          "storage"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "PMR container",
        "lines": [
          "allocates from",
          "arena"
        ],
        "labelLines": [
          "PMR container"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Destroy container",
        "lines": [
          "then release the",
          "arena"
        ],
        "labelLines": [
          "Destroy",
          "container"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The resource and its backing storage must outlive active allocations. Releasing early invalidates storage still held by containers; a null upstream makes an exceeded budget fail explicitly."
  },
  {
    "lesson": "binary-search-invariant",
    "title": "Binary search keeps a half-open candidate interval",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Candidate interval",
        "lines": [
          "[first, last)"
        ],
        "labelLines": [
          "Candidate",
          "interval"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Inspect midpoint",
        "lines": [
          "discard an",
          "excluded half"
        ],
        "labelLines": [
          "Inspect",
          "midpoint"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Stop condition",
        "lines": [
          "first equals",
          "last"
        ],
        "labelLines": [
          "Stop condition"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The sorted/partitioned input contract justifies discarding a half. This is an interval model rather than a claim that every iterator category supports constant-time midpoint movement."
  },
  {
    "lesson": "memoization",
    "title": "Cache completed subproblems",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Request a subproblem",
        "lines": [
          "look up its key"
        ],
        "labelLines": [
          "Request a",
          "subproblem"
        ]
      },
      {
        "id": "1",
        "x": 75,
        "y": 200,
        "label": "Cache hit",
        "lines": [
          "reuse saved",
          "result"
        ],
        "labelLines": [
          "Cache hit"
        ]
      },
      {
        "id": "2",
        "x": 225,
        "y": 200,
        "label": "Cache miss",
        "lines": [
          "compute and",
          "store"
        ],
        "labelLines": [
          "Cache miss"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "found",
        "dashed": false
      },
      {
        "source": "0",
        "target": "2",
        "label": "absent",
        "dashed": false
      }
    ],
    "height": 262,
    "caption": "Memoization avoids recomputing the same completed state. The cache key must include every input that affects the answer; caching does not by itself prevent cycles in recursive dependencies."
  },
  {
    "lesson": "ring-buffer",
    "title": "Queue positions wrap within fixed storage",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Push at tail",
        "lines": [
          "if capacity",
          "permits"
        ],
        "labelLines": [
          "Push at tail"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Advance tail",
        "lines": [
          "wrap modulo",
          "capacity"
        ],
        "labelLines": [
          "Advance tail"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Pop at head",
        "lines": [
          "advance head",
          "similarly"
        ],
        "labelLines": [
          "Pop at head"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Head and tail positions alone may not distinguish empty from full. The lesson maintains an explicit size; wrapping positions does not overwrite a live element when the full check rejects insertion."
  },
  {
    "lesson": "tombstones",
    "title": "A deleted probe slot is not an empty slot",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Hash selects start",
        "lines": [
          "begin probe",
          "sequence"
        ],
        "labelLines": [
          "Hash selects",
          "start"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Tombstone encountered",
        "lines": [
          "keep probing"
        ],
        "labelLines": [
          "Tombstone",
          "encountered"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Matching key or empty",
        "lines": [
          "found or absent"
        ],
        "labelLines": [
          "Matching key",
          "or empty"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "A tombstone preserves the search path after deletion. An unused empty slot can terminate an unsuccessful search; a bounded probe count is still needed when no empty slot remains."
  },
  {
    "lesson": "tree-ordering",
    "title": "Search-tree ordering divides the key domain",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Root key",
        "lines": [
          "20"
        ],
        "labelLines": [
          "Root key"
        ]
      },
      {
        "id": "1",
        "x": 75,
        "y": 200,
        "label": "Left subtree",
        "lines": [
          "keys below 20"
        ],
        "labelLines": [
          "Left subtree"
        ]
      },
      {
        "id": "2",
        "x": 225,
        "y": 200,
        "label": "Right subtree",
        "lines": [
          "keys above 20"
        ],
        "labelLines": [
          "Right subtree"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "less",
        "dashed": false
      },
      {
        "source": "0",
        "target": "2",
        "label": "greater",
        "dashed": false
      }
    ],
    "height": 262,
    "caption": "This schematic assumes unique keys. Every descendant, not just each immediate child, must satisfy its ancestor bounds. Balance and ownership are additional invariants, not consequences of ordering."
  },
  {
    "lesson": "heap-order",
    "title": "A minimum heap imposes a partial order",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Parent",
        "lines": [
          "minimum at the",
          "root"
        ],
        "labelLines": [
          "Parent"
        ]
      },
      {
        "id": "1",
        "x": 75,
        "y": 200,
        "label": "Left child",
        "lines": [
          "not below parent"
        ],
        "labelLines": [
          "Left child"
        ]
      },
      {
        "id": "2",
        "x": 225,
        "y": 200,
        "label": "Right child",
        "lines": [
          "not below parent"
        ],
        "labelLines": [
          "Right child"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "parent <= child",
        "dashed": false
      },
      {
        "source": "0",
        "target": "2",
        "label": "parent <= child",
        "dashed": false
      }
    ],
    "height": 262,
    "caption": "Each parent is no greater than its children. Siblings need not be ordered, and the underlying array is not a sorted sequence. Separate tie-breaking rules determine which equivalent-priority value comes first."
  },
  {
    "lesson": "breadth-first",
    "title": "Breadth-first traversal expands a frontier",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Start vertex",
        "lines": [
          "mark and enqueue"
        ],
        "labelLines": [
          "Start vertex"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "FIFO frontier",
        "lines": [
          "pop earliest",
          "discovery"
        ],
        "labelLines": [
          "FIFO frontier"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Undiscovered neighbors",
        "lines": [
          "mark and enqueue"
        ],
        "labelLines": [
          "Undiscovered",
          "neighbors"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The FIFO queue explores unweighted distance layers. Marking a vertex on discovery prevents repeated enqueues; weighted shortest paths require a different contract. Repeat the expansion until the queue is empty."
  },
  {
    "lesson": "sql-select-ast",
    "title": "Keep parsing separate from execution",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "SQL text",
        "lines": [
          "external",
          "characters"
        ],
        "labelLines": [
          "SQL text"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Lexer and parser",
        "lines": [
          "tokens become an",
          "AST"
        ],
        "labelLines": [
          "Lexer and",
          "parser"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Validated query",
        "lines": [
          "execution may",
          "begin"
        ],
        "labelLines": [
          "Validated",
          "query"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The parser recognizes only the documented SELECT subset and rejects trailing tokens. Constructing an AST does not execute a query or imply support for the full SQL language."
  },
  {
    "lesson": "operator-composition",
    "title": "Rows move through an operator pipeline",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Scan",
        "lines": [
          "produce input",
          "rows"
        ],
        "labelLines": [
          "Scan"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Filter",
        "lines": [
          "keep matching",
          "rows"
        ],
        "labelLines": [
          "Filter"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Project and limit",
        "lines": [
          "shape and bound",
          "output"
        ],
        "labelLines": [
          "Project and",
          "limit"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "This is the lesson’s operator order. Different orderings may change results, and a limit can stop upstream consumption early. The picture does not imply that each intermediate stage materializes a table."
  },
  {
    "lesson": "codec-candidate-import",
    "title": "Publish decoded state only after validation",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Untrusted bytes",
        "lines": [
          "check lengths",
          "and fields"
        ],
        "labelLines": [
          "Untrusted",
          "bytes"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Candidate state",
        "lines": [
          "validate full",
          "structure"
        ],
        "labelLines": [
          "Candidate",
          "state"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Publish candidate",
        "lines": [
          "replace",
          "committed state"
        ],
        "labelLines": [
          "Publish",
          "candidate"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Any rejected field, duplicate, or trailing byte leaves the previous state intact. This is failure preservation within the model, not an operating-system crash-durability guarantee."
  },
  {
    "lesson": "pin-guards",
    "title": "A pin guard holds an eviction constraint",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Acquire page guard",
        "lines": [
          "pin count",
          "increases"
        ],
        "labelLines": [
          "Acquire page",
          "guard"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Use page contents",
        "lines": [
          "pinned: do not",
          "evict"
        ],
        "labelLines": [
          "Use page",
          "contents"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Destroy page guard",
        "lines": [
          "pin count",
          "decreases"
        ],
        "labelLines": [
          "Destroy page",
          "guard"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "An unpinned page becomes eligible for eviction; it is not necessarily evicted immediately. Dirty-page handling and host I/O errors are separate responsibilities."
  },
  {
    "lesson": "bplus-routing",
    "title": "A separator routes a search to a leaf",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Root separator",
        "lines": [
          "routing boundary"
        ],
        "labelLines": [
          "Root separator"
        ]
      },
      {
        "id": "1",
        "x": 75,
        "y": 200,
        "label": "Left leaf",
        "lines": [
          "keys below",
          "boundary"
        ],
        "labelLines": [
          "Left leaf"
        ]
      },
      {
        "id": "2",
        "x": 225,
        "y": 200,
        "label": "Right leaf",
        "lines": [
          "keys at/above it"
        ],
        "labelLines": [
          "Right leaf"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "lower keys",
        "dashed": false
      },
      {
        "source": "0",
        "target": "2",
        "label": "other keys",
        "dashed": false
      }
    ],
    "height": 262,
    "caption": "The separator is a routing fence for this bounded teaching index. This is not an arbitrary-height production B+ tree. A range scan can continue across leaves after routing to its starting leaf."
  },
  {
    "lesson": "transaction-commit",
    "title": "A private candidate needs a fresh commit check",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Begin",
        "lines": [
          "copy state and",
          "revision"
        ],
        "labelLines": [
          "Begin"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Edit private candidate",
        "lines": [
          "committed state",
          "unchanged"
        ],
        "labelLines": [
          "Edit private",
          "candidate"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Commit check",
        "lines": [
          "publish if",
          "revision agrees"
        ],
        "labelLines": [
          "Commit check"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "A stale revision rejects the commit rather than overwriting a newer state. Rollback discards private changes. This model does not claim a complete multi-client durable transaction engine."
  },
  {
    "lesson": "wal-torn-tail",
    "title": "Recovery accepts a validated committed prefix",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Log bytes",
        "lines": [
          "may end mid-",
          "record"
        ],
        "labelLines": [
          "Log bytes"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Validate records",
        "lines": [
          "stop at an",
          "invalid tail"
        ],
        "labelLines": [
          "Validate",
          "records"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Replay committed work",
        "lines": [
          "ignore",
          "uncommitted work"
        ],
        "labelLines": [
          "Replay",
          "committed work"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The lesson uses a tiny single-value redo-log model. A valid complete record is not automatically committed; commit markers matter. This picture does not specify production flush ordering or corruption-repair policy."
  },
  {
    "lesson": "release-acquire-data",
    "title": "Publication requires a matching synchronization edge",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Producer",
        "lines": [
          "write ordinary",
          "data"
        ],
        "labelLines": [
          "Producer"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Release store",
        "lines": [
          "publish ready",
          "flag"
        ],
        "labelLines": [
          "Release store"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Acquire observes ready",
        "lines": [
          "consumer may",
          "read data"
        ],
        "labelLines": [
          "Acquire",
          "observes ready"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The acquire must observe the matching release (or the applicable release sequence) to establish the depicted happens-before relation. Merely using an atomic flag or unrelated relaxed operations does not publish ordinary data safely."
  },
  {
    "lesson": "lib-future-promise",
    "title": "A shared state carries a value or exception",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Producer",
        "lines": [
          "promise sets",
          "result"
        ],
        "labelLines": [
          "Producer"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Shared state",
        "lines": [
          "becomes ready"
        ],
        "labelLines": [
          "Shared state"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Consumer future",
        "lines": [
          "get waits and",
          "observes"
        ],
        "labelLines": [
          "Consumer",
          "future"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "An ordinary future permits one get. An exception is transported through the same shared state. Result readiness does not provide a general lock for later mutations of unrelated shared objects."
  },
  {
    "lesson": "oldest-reader-gc",
    "title": "An old reader keeps required versions alive",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Register snapshot",
        "lines": [
          "reader keeps old",
          "revision"
        ],
        "labelLines": [
          "Register",
          "snapshot"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "New commit",
        "lines": [
          "new version",
          "becomes current"
        ],
        "labelLines": [
          "New commit"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Reader releases",
        "lines": [
          "reclaim unneeded",
          "history"
        ],
        "labelLines": [
          "Reader",
          "releases"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Reclamation must retain every version required by an active snapshot. This lesson is a bounded one-row MVCC model; releasing one reader does not permit deleting history still needed by another."
  },
  {
    "lesson": "hash-join-buckets",
    "title": "A join separates build and probe work",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Build side",
        "lines": [
          "group rows by",
          "join key"
        ],
        "labelLines": [
          "Build side"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Probe side",
        "lines": [
          "look up matching",
          "bucket"
        ],
        "labelLines": [
          "Probe side"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Emit matching pairs",
        "lines": [
          "duplicates",
          "multiply rows"
        ],
        "labelLines": [
          "Emit matching",
          "pairs"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "Bucket membership produces candidates; the join still relies on equality semantics. Duplicate matches produce multiple pairs. An inner join drops unmatched rows; outer joins need an explicit unmatched-row policy."
  },
  {
    "lesson": "generation-publication",
    "title": "Publish a new generation without breaking old readers",
    "nodes": [
      {
        "id": "0",
        "x": 150,
        "y": 60,
        "label": "Build new generation",
        "lines": [
          "old generation",
          "still live"
        ],
        "labelLines": [
          "Build new",
          "generation"
        ]
      },
      {
        "id": "1",
        "x": 150,
        "y": 200,
        "label": "Publish new handle",
        "lines": [
          "new readers use",
          "it"
        ],
        "labelLines": [
          "Publish new",
          "handle"
        ]
      },
      {
        "id": "2",
        "x": 150,
        "y": 340,
        "label": "Retire old generation",
        "lines": [
          "after its",
          "readers finish"
        ],
        "labelLines": [
          "Retire old",
          "generation"
        ]
      }
    ],
    "edges": [
      {
        "source": "0",
        "target": "1",
        "label": "then"
      },
      {
        "source": "1",
        "target": "2",
        "label": "then"
      }
    ],
    "height": 402,
    "caption": "The picture separates publication from reclamation. Existing readers keep their old generation alive; a handle swap alone does not justify freeing old storage or prove durable file replacement."
  }
];
