export const learningModels = {
  "declarations-linking": {
    "title": "Declarations and definitions meet at different stages",
    "question": "What does the header supply, and what must the linker still find?",
    "kind": "panels",
    "panels": [
      {
        "label": "Compile each source",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "h",
              "label": "Header",
              "x": 50,
              "y": 15
            },
            {
              "id": "a",
              "label": "Source A",
              "x": 20,
              "y": 80
            },
            {
              "id": "b",
              "label": "Source B",
              "x": 80,
              "y": 80
            }
          ],
          "edges": [
            {
              "from": "h",
              "to": "a",
              "label": "declarations"
            },
            {
              "from": "h",
              "to": "b",
              "label": "declarations"
            }
          ],
          "legend": "Each compiled source produces an object file with definitions and unresolved references.",
          "height": 300
        }
      },
      {
        "label": "Link the program",
        "model": {
          "kind": "flow",
          "steps": [
            {
              "label": "Object files and needed library code"
            },
            {
              "label": "Resolve references to definitions"
            },
            {
              "label": "Produce a runnable program"
            }
          ]
        }
      }
    ],
    "note": "This is a build overview, not an extra command the learner must run. Including a declaration does not supply a missing function implementation.",
    "description": "What does the header supply, and what must the linker still find? Compile each source. Nodes: Header, Source A, Source B. Connections: Header leads to Source A (declarations); Header leads to Source B (declarations). Each compiled source produces an object file with definitions and unresolved references.; Link the program. Object files and needed library code; Resolve references to definitions; Produce a runnable program. This is a build overview, not an extra command the learner must run. Including a declaration does not supply a missing function implementation."
  },
  "raii": {
    "title": "An owner releases its resource when its lifetime ends",
    "question": "What still runs when an exception leaves work?",
    "kind": "branch",
    "root": "Resource-owning local object was constructed successfully",
    "paths": [
      {
        "when": "Normal block exit",
        "result": "Owner destructor releases the resource",
        "detail": ""
      },
      {
        "when": "Exception unwinds the block",
        "result": "Owner destructor releases the resource",
        "detail": "The enclosing catch then handles the exception."
      }
    ],
    "note": "The supplied work function throws. This rule covers normal destruction and exception unwinding, not abrupt process termination or destruction of a complete object whose construction never finished.",
    "description": "What still runs when an exception leaves work? Resource-owning local object was constructed successfully. Normal block exit. Owner destructor releases the resource. ; Exception unwinds the block. Owner destructor releases the resource. The enclosing catch then handles the exception.. The supplied work function throws. This rule covers normal destruction and exception unwinding, not abrupt process termination or destruction of a complete object whose construction never finished."
  },
  "observer-owner": {
    "title": "Ownership and observation reach one resource",
    "question": "Why does observer not keep the int alive after owner.reset()?",
    "kind": "references",
    "states": [
      {
        "label": "Before reset",
        "objects": [
          {
            "label": "One allocated int",
            "value": "42",
            "refs": [
              {
                "name": "owner",
                "edge": "owns via unique_ptr"
              },
              {
                "name": "observer",
                "edge": "borrows; does not own"
              }
            ]
          }
        ]
      },
      {
        "label": "After reset and observer = nullptr",
        "objects": [
          {
            "label": "Old int: lifetime ended",
            "value": "released resource",
            "refs": [],
            "dead": true
          },
          {
            "label": "owner and observer",
            "value": "both empty after the explicit assignments",
            "refs": []
          }
        ]
      }
    ],
    "note": "Only the owner releases the resource. reset does not automatically clear raw aliases; the starter explicitly sets observer to nullptr before later use.",
    "description": "Why does observer not keep the int alive after owner.reset()? Before reset: One allocated int contains 42. owner owns via unique_ptr One allocated int; observer borrows; does not own One allocated int. After reset and observer = nullptr: Old int: lifetime ended contains released resource; lifetime ended. ; owner and observer contains both empty after the explicit assignments. . Only the owner releases the resource. reset does not automatically clear raw aliases; the starter explicitly sets observer to nullptr before later use."
  },
  "moves": {
    "title": "An owning handle moves while its source object remains",
    "question": "Why is first empty after moving it into second?",
    "kind": "references",
    "states": [
      {
        "label": "Before the move",
        "objects": [
          {
            "label": "Allocated string",
            "value": "page 7",
            "refs": [
              {
                "name": "first",
                "edge": "owns"
              }
            ]
          }
        ]
      },
      {
        "label": "After std::move(first)",
        "objects": [
          {
            "label": "Same resource",
            "value": "page 7",
            "refs": [
              {
                "name": "second",
                "edge": "now owns"
              }
            ]
          },
          {
            "label": "Moved-from unique_ptr first",
            "value": "empty",
            "refs": []
          }
        ]
      },
      {
        "label": "After second.reset()",
        "objects": [
          {
            "label": "Resource lifetime ended",
            "value": "released string",
            "refs": [],
            "dead": true
          },
          {
            "label": "unique_ptr second",
            "value": "empty",
            "refs": []
          }
        ]
      }
    ],
    "note": "This specific unique_ptr move transfers ownership. Move behavior for other types follows their own contracts; a generic move is not guaranteed to transfer an allocation.",
    "description": "Why is first empty after moving it into second? Before the move: Allocated string contains page 7. first owns Allocated string. After std::move(first): Same resource contains page 7. second now owns Same resource; Moved-from unique_ptr first contains empty. . After second.reset(): Resource lifetime ended contains released string; lifetime ended. ; unique_ptr second contains empty. . This specific unique_ptr move transfers ownership. Move behavior for other types follows their own contracts; a generic move is not guaranteed to transfer an allocation."
  },
  "lib-unordered-contracts": {
    "title": "Rehash reorganizes buckets, not logical key equality",
    "question": "Why does Ada still have count 2 after rehash?",
    "kind": "table",
    "headings": [
      "State",
      "Logical entries",
      "Observer rule"
    ],
    "rows": [
      [
        "After two increments",
        "Ada → 2; Grace absent",
        "Equivalent keys must have equal hashes"
      ],
      [
        "After rehash(100)",
        "Ada → 2; Grace absent",
        "Iterators invalidated; surviving element references remain valid"
      ]
    ],
    "label": "",
    "links": [],
    "note": "Bucket count is at least the requested bound, not necessarily exactly 100. Collisions are permitted and iteration order is unspecified. The output is count 2 and contains(Grace)=0.",
    "description": "Why does Ada still have count 2 after rehash? State; Logical entries; Observer rule. After two increments; Ada → 2; Grace absent; Equivalent keys must have equal hashes; After rehash(100); Ada → 2; Grace absent; Iterators invalidated; surviving element references remain valid. . . Bucket count is at least the requested bound, not necessarily exactly 100. Collisions are permitted and iteration order is unspecified. The output is count 2 and contains(Grace)=0."
  },
  "lib-erase-return": {
    "title": "Erasing and keeping choose different next iterators",
    "question": "Why must the erase path avoid a second increment?",
    "kind": "branch",
    "root": "At current iterator it",
    "paths": [
      {
        "when": "Odd value · keep",
        "result": "++it",
        "detail": "Advance past the retained element."
      },
      {
        "when": "Even value · erase",
        "result": "it = v.erase(it)",
        "detail": "Use the returned iterator to the next surviving position."
      }
    ],
    "note": "For [1,2,4,3], erasing 2 moves 4 into its position; the next iteration must inspect 4. The final output is 13. Old iterators at/after a vector erase are invalidated.",
    "description": "Why must the erase path avoid a second increment? At current iterator it. Odd value · keep. ++it. Advance past the retained element.; Even value · erase. it = v.erase(it). Use the returned iterator to the next surviving position.. For [1,2,4,3], erasing 2 moves 4 into its position; the next iteration must inspect 4. The final output is 13. Old iterators at/after a vector erase are invalidated."
  },
  "lib-stream-iterators": {
    "title": "One stream position is consumed",
    "question": "Why does accumulate consume 3,4,5 only once?",
    "kind": "table",
    "headings": [
      "Consumed value",
      "Running total",
      "Still available input"
    ],
    "rows": [
      [
        "3",
        "3",
        "4 5"
      ],
      [
        "4",
        "7",
        "5"
      ],
      [
        "5",
        "12",
        "end of stream"
      ]
    ],
    "label": "",
    "links": [],
    "note": "istream_iterator is single-pass. A copied input iterator does not create an independent rewindable stream; materialize values if another full pass is needed.",
    "description": "Why does accumulate consume 3,4,5 only once? Consumed value; Running total; Still available input. 3; 3; 4 5; 4; 7; 5; 5; 12; end of stream. . . istream_iterator is single-pass. A copied input iterator does not create an independent rewindable stream; materialize values if another full pass is needed."
  },
  "lib-remove-erase": {
    "title": "Logical end and vector size are different boundaries",
    "question": "Why does the program print 4, then 2, then 2?",
    "kind": "slots",
    "rows": [
      {
        "label": "Original vector",
        "values": [
          1,
          2,
          2,
          3
        ],
        "note": "size=4.",
        "active": [],
        "muted": []
      },
      {
        "label": "After std::remove(...,2)",
        "values": [
          1,
          3,
          "?",
          "?"
        ],
        "note": "Logical end is index 2; size is still 4. The trailing values are unspecified.",
        "active": [
          0,
          1
        ],
        "muted": [
          2,
          3
        ],
        "tags": {
          "2": "logical end"
        }
      },
      {
        "label": "After erase(end,v.end())",
        "values": [
          1,
          3,
          "not live",
          "not live"
        ],
        "note": "size=2. Capacity need not shrink.",
        "active": [
          0,
          1
        ],
        "muted": [
          2,
          3
        ]
      }
    ],
    "note": "Question marks mean unspecified trailing values, not uninitialized storage or reliably removed 2s. The last two displayed positions are boundary markers after erase, not two remaining live elements.",
    "description": "Why does the program print 4, then 2, then 2? Original vector: index 0 = 1, index 1 = 2, index 2 = 2, index 3 = 3. size=4.. After std::remove(...,2): index 0 = 1, index 1 = 3, index 2 = ?, index 3 = ?. Logical end is index 2; size is still 4. The trailing values are unspecified.. After erase(end,v.end()): index 0 = 1, index 1 = 3, index 2 = not live, index 3 = not live. size=2. Capacity need not shrink.. Question marks mean unspecified trailing values, not uninitialized storage or reliably removed 2s. The last two displayed positions are boundary markers after erase, not two remaining live elements."
  },
  "lib-lazy-views": {
    "title": "A consumer drives the lazy pipeline",
    "question": "Which values are filtered and squared when the loop requests them?",
    "kind": "flow",
    "steps": [
      {
        "label": "Source vector [1,2,3,4]",
        "detail": "The view borrows the vector."
      },
      {
        "label": "Filter even values",
        "detail": "Traversal selects 2 and 4."
      },
      {
        "label": "Transform each selected value",
        "detail": "Yield 4 and 16 to the printing loop."
      }
    ],
    "note": "These are conceptual traversal stages, not three stored containers. Constructing the view alone does not evaluate every result. Source lifetime and invalidation rules still apply.",
    "description": "Which values are filtered and squared when the loop requests them? Source vector [1,2,3,4]. The view borrows the vector.; Filter even values. Traversal selects 2 and 4.; Transform each selected value. Yield 4 and 16 to the printing loop.. These are conceptual traversal stages, not three stored containers. Constructing the view alone does not evaluate every result. Source lifetime and invalidation rules still apply."
  },
  "lib-variant-visit": {
    "title": "Only the active alternative is visited",
    "question": "Which visitor branch prints number=7 and which prints text=Ada?",
    "kind": "branch",
    "root": "Active variant alternative at the time of visit",
    "paths": [
      {
        "when": "First visit: int 7",
        "result": "Integer branch → number=7",
        "detail": ""
      },
      {
        "when": "Second visit: string Ada",
        "result": "String branch → text=Ada",
        "detail": ""
      }
    ],
    "note": "The starter assigns the string between the two visits. Only one alternative is active at each visit; the visitor must be valid for all alternatives. valueless_by_exception is outside this ordinary-value example.",
    "description": "Which visitor branch prints number=7 and which prints text=Ada? Active variant alternative at the time of visit. First visit: int 7. Integer branch → number=7. ; Second visit: string Ada. String branch → text=Ada. . The starter assigns the string between the two visits. Only one alternative is active at each visit; the visitor must be valid for all alternatives. valueless_by_exception is outside this ordinary-value example."
  },
  "lib-charconv-complete": {
    "title": "A successful prefix is not a complete field",
    "question": "Why is 42 accepted but 42x rejected?",
    "kind": "table",
    "headings": [
      "Field",
      "Conversion result",
      "Whole field accepted?"
    ],
    "rows": [
      [
        "42",
        "No error; end reaches position 2",
        "Yes"
      ],
      [
        "42x",
        "Numeric prefix 42; end stops at x",
        "No: suffix remains"
      ],
      [
        "99999999999999999999",
        "Out of int range",
        "No: error code is set"
      ]
    ],
    "label": "",
    "links": [],
    "note": "Acceptance requires both a clear error code and a stopping pointer at the field end. No conversion and an out-of-range result are distinct failures.",
    "description": "Why is 42 accepted but 42x rejected? Field; Conversion result; Whole field accepted?. 42; No error; end reaches position 2; Yes; 42x; Numeric prefix 42; end stops at x; No: suffix remains; 99999999999999999999; Out of int range; No: error code is set. . . Acceptance requires both a clear error code and a stopping pointer at the field end. No conversion and an out-of-range result are distinct failures."
  },
  "lib-chrono-units": {
    "title": "An integral duration conversion discards the remainder",
    "question": "Where do the extra 750 milliseconds go?",
    "kind": "table",
    "headings": [
      "Quantity",
      "Exact stored duration",
      "Converted whole seconds"
    ],
    "rows": [
      [
        "2s + 750ms",
        "2750ms",
        "2s"
      ],
      [
        "Remainder",
        "750ms",
        "Not represented in the integer seconds count"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The fixture is positive. duration_cast to integral seconds truncates toward zero; floor and round express different policies, especially for negative durations.",
    "description": "Where do the extra 750 milliseconds go? Quantity; Exact stored duration; Converted whole seconds. 2s + 750ms; 2750ms; 2s; Remainder; 750ms; Not represented in the integer seconds count. . . The fixture is positive. duration_cast to integral seconds truncates toward zero; floor and round express different policies, especially for negative durations."
  },
  "binary-search-invariant": {
    "title": "Lower bound preserves original positions",
    "question": "Why does lower(values,3) return 1?",
    "kind": "slots",
    "rows": [
      {
        "label": "[0,5)",
        "values": [
          1,
          3,
          3,
          5,
          9
        ],
        "note": "3 is not less than target 3: hi=2.",
        "active": [
          0,
          1,
          2,
          3,
          4
        ],
        "muted": [],
        "tags": {
          "2": "mid"
        }
      },
      {
        "label": "[0,2)",
        "values": [
          1,
          3,
          3,
          5,
          9
        ],
        "note": "3 is not less than target 3: hi=1.",
        "active": [
          0,
          1
        ],
        "muted": [
          2,
          3,
          4
        ],
        "tags": {
          "1": "mid"
        }
      },
      {
        "label": "[0,1)",
        "values": [
          1,
          3,
          3,
          5,
          9
        ],
        "note": "1 < 3: lo=1; stop at position 1.",
        "active": [
          0
        ],
        "muted": [
          1,
          2,
          3,
          4
        ],
        "tags": {
          "0": "mid"
        }
      }
    ],
    "note": "The other printed queries return position 3 for absent key 4 and position 5 for key 10. Position 5 is past the last element. Sorted/partitioned input is required.",
    "description": "Why does lower(values,3) return 1? [0,5): index 0 = 1, index 1 = 3, index 2 = 3, index 3 = 5, index 4 = 9. 3 is not less than target 3: hi=2.. [0,2): index 0 = 1, index 1 = 3, index 2 = 3, index 3 = 5, index 4 = 9. 3 is not less than target 3: hi=1.. [0,1): index 0 = 1, index 1 = 3, index 2 = 3, index 3 = 5, index 4 = 9. 1 < 3: lo=1; stop at position 1.. The other printed queries return position 3 for absent key 4 and position 5 for key 10. Position 5 is past the last element. Sorted/partitioned input is required."
  },
  "memoization": {
    "title": "Two callers can need the same subproblem",
    "question": "Why should the second request reuse fib(2)?",
    "kind": "graph",
    "nodes": [
      {
        "id": "4",
        "label": "fib(4)",
        "x": 50,
        "y": 15
      },
      {
        "id": "3",
        "label": "fib(3)",
        "x": 20,
        "y": 52
      },
      {
        "id": "2",
        "label": "fib(2)",
        "x": 80,
        "y": 52
      },
      {
        "id": "1",
        "label": "fib(1)",
        "x": 20,
        "y": 88
      }
    ],
    "edges": [
      {
        "from": "4",
        "to": "3",
        "label": ""
      },
      {
        "from": "4",
        "to": "2",
        "label": ""
      },
      {
        "from": "3",
        "to": "2",
        "label": "reuse"
      },
      {
        "from": "3",
        "to": "1",
        "label": ""
      }
    ],
    "legend": "A small dependency excerpt from fib(10), whose result is 55. Completed answers are cached by their n value.",
    "height": 340,
    "note": "This is not the complete call tree. Memoization requires all answer-affecting inputs in the key; caching alone does not make cyclic dependencies terminate.",
    "description": "Why should the second request reuse fib(2)? Nodes: fib(4), fib(3), fib(2), fib(1). Connections: fib(4) leads to fib(3); fib(4) leads to fib(2); fib(3) leads to fib(2) (reuse); fib(3) leads to fib(1). A small dependency excerpt from fib(10), whose result is 55. Completed answers are cached by their n value.. This is not the complete call tree. Memoization requires all answer-affecting inputs in the key; caching alone does not make cyclic dependencies terminate."
  },
  "ring-buffer": {
    "title": "Logical order can wrap across array index zero",
    "question": "Where does the successful push(4) store its value?",
    "kind": "slots",
    "rows": [
      {
        "label": "Full: head=0, count=3",
        "values": [
          1,
          2,
          3
        ],
        "note": "The first push(4) is rejected; nothing is overwritten.",
        "active": [
          0,
          1,
          2
        ],
        "muted": [],
        "tags": {
          "0": "head"
        }
      },
      {
        "label": "After pop returns 1",
        "values": [
          1,
          2,
          3
        ],
        "note": "head=1, count=2; index 0 is no longer a live queue member.",
        "active": [
          1,
          2
        ],
        "muted": [
          0
        ],
        "tags": {
          "1": "head"
        }
      },
      {
        "label": "After successful push(4)",
        "values": [
          4,
          2,
          3
        ],
        "note": "Logical pop order follows indices 1 → 2 → 0: values 2,3,4.",
        "active": [
          0,
          1,
          2
        ],
        "muted": [],
        "tags": {
          "1": "head",
          "0": "new back"
        }
      }
    ],
    "note": "Three fixed slots remain in the same positions. The explicit count distinguishes full from empty; old bits in a removed slot are not a live element.",
    "description": "Where does the successful push(4) store its value? Full: head=0, count=3: index 0 = 1, index 1 = 2, index 2 = 3. The first push(4) is rejected; nothing is overwritten.. After pop returns 1: index 0 = 1, index 1 = 2, index 2 = 3. head=1, count=2; index 0 is no longer a live queue member.. After successful push(4): index 0 = 4, index 1 = 2, index 2 = 3. Logical pop order follows indices 1 → 2 → 0: values 2,3,4.. Three fixed slots remain in the same positions. The explicit count distinguishes full from empty; old bits in a removed slot are not a live element."
  },
  "tombstones": {
    "title": "A deleted probe slot must not stop a search",
    "question": "How can key 8 remain findable after key 1 is deleted?",
    "kind": "slots",
    "rows": [
      {
        "label": "Hash capacity 7: both keys start at bucket 1",
        "values": [
          "empty",
          "1→10",
          "8→80",
          "empty",
          "empty",
          "empty",
          "empty"
        ],
        "note": "Key 8 probes from index 1 to index 2.",
        "active": [
          1,
          2
        ],
        "muted": []
      },
      {
        "label": "After erase(1)",
        "values": [
          "empty",
          "deleted",
          "8→80",
          "empty",
          "empty",
          "empty",
          "empty"
        ],
        "note": "get(8) crosses the tombstone at index 1 and finds 80 at index 2.",
        "active": [
          2
        ],
        "muted": [
          1
        ]
      }
    ],
    "note": "A tombstone differs from an unused empty slot. An unused slot can end an unsuccessful search; a bounded probe count is still required when no empty slot remains.",
    "description": "How can key 8 remain findable after key 1 is deleted? Hash capacity 7: both keys start at bucket 1: index 0 = empty, index 1 = 1→10, index 2 = 8→80, index 3 = empty, index 4 = empty, index 5 = empty, index 6 = empty. Key 8 probes from index 1 to index 2.. After erase(1): index 0 = empty, index 1 = deleted, index 2 = 8→80, index 3 = empty, index 4 = empty, index 5 = empty, index 6 = empty. get(8) crosses the tombstone at index 1 and finds 80 at index 2.. A tombstone differs from an unused empty slot. An unused slot can end an unsuccessful search; a bounded probe count is still required when no empty slot remains."
  },
  "tree-ordering": {
    "title": "The ancestor bounds the whole subtree",
    "question": "Which path finds key 3?",
    "kind": "graph",
    "nodes": [
      {
        "id": "4",
        "label": "4",
        "x": 58,
        "y": 12
      },
      {
        "id": "2",
        "label": "2",
        "x": 30,
        "y": 46
      },
      {
        "id": "6",
        "label": "6",
        "x": 84,
        "y": 46
      },
      {
        "id": "1",
        "label": "1",
        "x": 14,
        "y": 85
      },
      {
        "id": "3",
        "label": "3",
        "x": 45,
        "y": 85
      }
    ],
    "edges": [
      {
        "from": "4",
        "to": "2",
        "label": "< 4"
      },
      {
        "from": "4",
        "to": "6",
        "label": "> 4"
      },
      {
        "from": "2",
        "to": "1",
        "label": "< 2"
      },
      {
        "from": "2",
        "to": "3",
        "label": "> 2"
      }
    ],
    "legend": "Search 3: root 4 → left 2 → right 3. In-order output is 1,2,3,4,6.",
    "height": 350,
    "note": "Every descendant must satisfy its ancestor bounds, not just the immediate child. This starter uses unique keys; ordering does not imply balance.",
    "description": "Which path finds key 3? Nodes: 4, 2, 6, 1, 3. Connections: 4 leads to 2 (< 4); 4 leads to 6 (> 4); 2 leads to 1 (< 2); 2 leads to 3 (> 2). Search 3: root 4 → left 2 → right 3. In-order output is 1,2,3,4,6.. Every descendant must satisfy its ancestor bounds, not just the immediate child. This starter uses unique keys; ordering does not imply balance."
  },
  "heap-order": {
    "title": "Heap order constrains parents, not siblings",
    "question": "Why is 1 the minimum even though the array is not fully sorted?",
    "kind": "graph",
    "nodes": [
      {
        "id": "1",
        "label": "1",
        "x": 50,
        "y": 15
      },
      {
        "id": "2",
        "label": "2",
        "x": 25,
        "y": 50
      },
      {
        "id": "8",
        "label": "8",
        "x": 78,
        "y": 50
      },
      {
        "id": "5",
        "label": "5",
        "x": 16,
        "y": 85
      }
    ],
    "edges": [
      {
        "from": "1",
        "to": "2",
        "label": "≤"
      },
      {
        "from": "1",
        "to": "8",
        "label": "≤"
      },
      {
        "from": "2",
        "to": "5",
        "label": "≤"
      }
    ],
    "legend": "After inserting 5,2,8,1, the heap array is [1,2,8,5]. Every parent is no greater than its children.",
    "height": 350,
    "note": "Sibling order is not a sorting guarantee. The starter reports minimum=1 and valid=1; repeated extraction is a separate operation.",
    "description": "Why is 1 the minimum even though the array is not fully sorted? Nodes: 1, 2, 8, 5. Connections: 1 leads to 2 (≤); 1 leads to 8 (≤); 2 leads to 5 (≤). After inserting 5,2,8,1, the heap array is [1,2,8,5]. Every parent is no greater than its children.. Sibling order is not a sorting guarantee. The starter reports minimum=1 and valid=1; repeated extraction is a separate operation."
  },
  "breadth-first": {
    "title": "FIFO discovery follows unweighted distance layers",
    "question": "Why do vertices 1 and 2 both have distance 1?",
    "kind": "graph",
    "nodes": [
      {
        "id": "0",
        "label": "0",
        "x": 50,
        "y": 15
      },
      {
        "id": "1",
        "label": "1",
        "x": 20,
        "y": 50
      },
      {
        "id": "2",
        "label": "2",
        "x": 80,
        "y": 50
      },
      {
        "id": "3",
        "label": "3",
        "x": 50,
        "y": 85
      }
    ],
    "edges": [
      {
        "from": "0",
        "to": "1",
        "label": ""
      },
      {
        "from": "0",
        "to": "2",
        "label": ""
      },
      {
        "from": "1",
        "to": "3",
        "label": ""
      },
      {
        "from": "2",
        "to": "3",
        "label": ""
      }
    ],
    "legend": "Distance layers: 0→0, 1→1, 2→1, 3→2. Mark on discovery to avoid enqueueing vertex 3 twice.",
    "height": 300,
    "note": "These edges are directed and unweighted. FIFO BFS is not the weighted shortest-path algorithm.",
    "description": "Why do vertices 1 and 2 both have distance 1? Nodes: 0, 1, 2, 3. Connections: 0 leads to 1; 0 leads to 2; 1 leads to 3; 2 leads to 3. Distance layers: 0→0, 1→1, 2→1, 3→2. Mark on discovery to avoid enqueueing vertex 3 twice.. These edges are directed and unweighted. FIFO BFS is not the weighted shortest-path algorithm."
  },
  "sql-select-ast": {
    "title": "Parsing creates a description before execution",
    "question": "What differs between SELECT all and SELECT by ID?",
    "kind": "table",
    "headings": [
      "SQL input",
      "Parsed table",
      "Optional ID field"
    ],
    "rows": [
      [
        "SELECT * FROM people;",
        "people",
        "absent: select all"
      ],
      [
        "SELECT * FROM people WHERE id=7;",
        "people",
        "present: 7"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The parser validates the documented subset and rejects trailing tokens. Building the parsed description does not execute a query or imply full SQL support.",
    "description": "What differs between SELECT all and SELECT by ID? SQL input; Parsed table; Optional ID field. SELECT * FROM people;; people; absent: select all; SELECT * FROM people WHERE id=7;; people; present: 7. . . The parser validates the documented subset and rejects trailing tokens. Building the parsed description does not execute a query or imply full SQL support."
  },
  "operator-composition": {
    "title": "Operators have different responsibilities",
    "question": "Which stage selects rows and which orders the selected names?",
    "kind": "flow",
    "steps": [
      {
        "label": "Read fixture rows"
      },
      {
        "label": "Filter score ≥ 90",
        "detail": "Exclude rows that do not match."
      },
      {
        "label": "Sort selected rows",
        "detail": "Score descending; break ties with ID ascending."
      },
      {
        "label": "Print names",
        "detail": "Only selected rows reach this output."
      }
    ],
    "note": "This is the order in the supplied program. The filter explicitly stores a selected vector; do not infer that every possible query pipeline materializes every stage or that this program applies LIMIT.",
    "description": "Which stage selects rows and which orders the selected names? Read fixture rows; Filter score ≥ 90. Exclude rows that do not match.; Sort selected rows. Score descending; break ties with ID ascending.; Print names. Only selected rows reach this output.. This is the order in the supplied program. The filter explicitly stores a selected vector; do not infer that every possible query pipeline materializes every stage or that this program applies LIMIT."
  },
  "codec-candidate-import": {
    "title": "A partial candidate never replaces the live values",
    "question": "Why does the failed second read leave live as [7,8]?",
    "kind": "table",
    "headings": [
      "Step",
      "Private candidate",
      "Live values"
    ],
    "rows": [
      [
        "Before decoding",
        "empty",
        "[7,8]"
      ],
      [
        "Read first complete u32",
        "[1]",
        "[7,8]"
      ],
      [
        "Read second u32: truncated",
        "Reject this candidate",
        "[7,8]"
      ],
      [
        "swap is not reached",
        "Discard partial result",
        "[7,8]"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The input contains only four bytes. The worked decoder stages two fields; a full importer must additionally validate its schema, uniqueness and complete input consumption.",
    "description": "Why does the failed second read leave live as [7,8]? Step; Private candidate; Live values. Before decoding; empty; [7,8]; Read first complete u32; [1]; [7,8]; Read second u32: truncated; Reject this candidate; [7,8]; swap is not reached; Discard partial result; [7,8]. . . The input contains only four bytes. The worked decoder stages two fields; a full importer must additionally validate its schema, uniqueness and complete input consumption."
  },
  "pin-guards": {
    "title": "Pins keep frames ineligible for eviction",
    "question": "Why is pin(3) rejected until the first two guards leave scope?",
    "kind": "table",
    "headings": [
      "Boundary",
      "Frame with page 1",
      "Frame with page 2",
      "Can load page 3?"
    ],
    "rows": [
      [
        "Both guards live",
        "pinned",
        "pinned",
        "No unpinned victim"
      ],
      [
        "Both guards destroyed",
        "unpinned",
        "unpinned",
        "A frame is eligible"
      ]
    ],
    "label": "Pin lifetime versus eviction eligibility",
    "links": [],
    "note": "Unpinned means eligible, not immediately evicted. Dirty-page handling and I/O errors are separate contracts; this picture does not invent a replacement policy.",
    "description": "Why is pin(3) rejected until the first two guards leave scope? Boundary; Frame with page 1; Frame with page 2; Can load page 3?. Both guards live; pinned; pinned; No unpinned victim; Both guards destroyed; unpinned; unpinned; A frame is eligible. Pin lifetime versus eviction eligibility. . Unpinned means eligible, not immediately evicted. Dirty-page handling and I/O errors are separate contracts; this picture does not invent a replacement policy."
  },
  "bplus-routing": {
    "title": "The fifth key splits the four-key leaf",
    "question": "Which leaf receives boundary key 3 after the split?",
    "kind": "panels",
    "panels": [
      {
        "label": "Before inserting 5",
        "model": {
          "kind": "slots",
          "rows": [
            {
              "label": "Leaf capacity 4",
              "values": [
                1,
                2,
                3,
                4
              ],
              "note": "One full leaf.",
              "active": [],
              "muted": []
            }
          ]
        }
      },
      {
        "label": "After inserting 5",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "s",
              "label": "3",
              "x": 50,
              "y": 18
            },
            {
              "id": "l",
              "label": "[1,2]",
              "x": 22,
              "y": 80
            },
            {
              "id": "r",
              "label": "[3,4,5]",
              "x": 78,
              "y": 80
            }
          ],
          "edges": [
            {
              "from": "s",
              "to": "l",
              "label": "< 3"
            },
            {
              "from": "s",
              "to": "r",
              "label": "≥ 3"
            }
          ],
          "legend": "Two leaves: sizes 2 and 3. key 2 routes to leaf 0; key 3 routes to leaf 1.",
          "height": 300
        }
      }
    ],
    "note": "This is the bounded teaching index. The routing fence repeats the first right-hand key; rows remain in leaves. It is not an arbitrary-height production B+ tree.",
    "description": "Which leaf receives boundary key 3 after the split? Before inserting 5. Leaf capacity 4: index 0 = 1, index 1 = 2, index 2 = 3, index 3 = 4. One full leaf.; After inserting 5. Nodes: 3, [1,2], [3,4,5]. Connections: 3 leads to [1,2] (< 3); 3 leads to [3,4,5] (≥ 3). Two leaves: sizes 2 and 3. key 2 routes to leaf 0; key 3 routes to leaf 1.. This is the bounded teaching index. The routing fence repeats the first right-hand key; rows remain in leaves. It is not an arbitrary-height production B+ tree."
  },
  "bplus-split": {
    "title": "The fifth key splits the four-key leaf",
    "question": "Which leaf receives boundary key 3 after the split?",
    "kind": "panels",
    "panels": [
      {
        "label": "Before inserting 5",
        "model": {
          "kind": "slots",
          "rows": [
            {
              "label": "Leaf capacity 4",
              "values": [
                1,
                2,
                3,
                4
              ],
              "note": "One full leaf.",
              "active": [],
              "muted": []
            }
          ]
        }
      },
      {
        "label": "After inserting 5",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "s",
              "label": "3",
              "x": 50,
              "y": 18
            },
            {
              "id": "l",
              "label": "[1,2]",
              "x": 22,
              "y": 80
            },
            {
              "id": "r",
              "label": "[3,4,5]",
              "x": 78,
              "y": 80
            }
          ],
          "edges": [
            {
              "from": "s",
              "to": "l",
              "label": "< 3"
            },
            {
              "from": "s",
              "to": "r",
              "label": "≥ 3"
            }
          ],
          "legend": "Two leaves: sizes 2 and 3. key 2 routes to leaf 0; key 3 routes to leaf 1.",
          "height": 300
        }
      }
    ],
    "note": "This is the bounded teaching index. The routing fence repeats the first right-hand key; rows remain in leaves. It is not an arbitrary-height production B+ tree.",
    "description": "Which leaf receives boundary key 3 after the split? Before inserting 5. Leaf capacity 4: index 0 = 1, index 1 = 2, index 2 = 3, index 3 = 4. One full leaf.; After inserting 5. Nodes: 3, [1,2], [3,4,5]. Connections: 3 leads to [1,2] (< 3); 3 leads to [3,4,5] (≥ 3). Two leaves: sizes 2 and 3. key 2 routes to leaf 0; key 3 routes to leaf 1.. This is the bounded teaching index. The routing fence repeats the first right-hand key; rows remain in leaves. It is not an arbitrary-height production B+ tree."
  },
  "transaction-commit": {
    "title": "The revision check precedes publication",
    "question": "What happens if the transaction’s observed revision is stale?",
    "kind": "branch",
    "root": "Prepare private candidate; set row 1 to 99",
    "paths": [
      {
        "when": "Observed revision still current · starter",
        "result": "Publish candidate; advance revision",
        "detail": "The live row becomes 99."
      },
      {
        "when": "Revision changed · comparison case",
        "result": "Reject commit",
        "detail": "Keep the newer live state; do not overwrite it."
      }
    ],
    "note": "Rollback discards private changes. This bounded transaction fixture does not establish a complete multi-client durable storage engine.",
    "description": "What happens if the transaction’s observed revision is stale? Prepare private candidate; set row 1 to 99. Observed revision still current · starter. Publish candidate; advance revision. The live row becomes 99.; Revision changed · comparison case. Reject commit. Keep the newer live state; do not overwrite it.. Rollback discards private changes. This bounded transaction fixture does not establish a complete multi-client durable storage engine."
  },
  "wal-torn-tail": {
    "title": "A complete prepare record is not a commit",
    "question": "Why must the torn commit tail leave the update unpublished?",
    "kind": "table",
    "headings": [
      "Log region",
      "Validation / decision",
      "Recovery effect"
    ],
    "rows": [
      [
        "P(tx 1,value 42)",
        "Complete valid prepare record",
        "Remember tentative value only"
      ],
      [
        "C(tx 1)",
        "Last byte missing: incomplete tail",
        "No complete commit decision"
      ],
      [
        "Recovered state",
        "Keep earlier committed value",
        "Do not publish tentative 42"
      ]
    ],
    "label": "",
    "links": [],
    "note": "Recovery accepts only the validated committed prefix. The lesson uses a single-value redo model and does not specify production fsync ordering or corruption repair.",
    "description": "Why must the torn commit tail leave the update unpublished? Log region; Validation / decision; Recovery effect. P(tx 1,value 42); Complete valid prepare record; Remember tentative value only; C(tx 1); Last byte missing: incomplete tail; No complete commit decision; Recovered state; Keep earlier committed value; Do not publish tentative 42. . . Recovery accepts only the validated committed prefix. The lesson uses a single-value redo model and does not specify production fsync ordering or corruption repair."
  },
  "lib-weak-ownership": {
    "title": "Locking a weak observer can temporarily acquire ownership",
    "question": "Why does lock succeed inside the scope and expire afterward?",
    "kind": "references",
    "states": [
      {
        "label": "Inside the scope",
        "objects": [
          {
            "label": "One allocated int",
            "value": "7",
            "refs": [
              {
                "name": "owner",
                "edge": "strong ownership"
              },
              {
                "name": "locked",
                "edge": "temporary strong owner"
              },
              {
                "name": "observer",
                "edge": "weak observation only"
              }
            ]
          }
        ]
      },
      {
        "label": "After both strong owners are destroyed",
        "objects": [
          {
            "label": "Int lifetime ended",
            "value": "released value",
            "refs": [],
            "dead": true
          },
          {
            "label": "Weak observer",
            "value": "expired() == true",
            "refs": []
          }
        ]
      }
    ],
    "note": "A successful lock keeps the value alive while locked is held. A later lock can return empty after strong ownership ends. Weak/shared ownership does not synchronize mutable pointee accesses.",
    "description": "Why does lock succeed inside the scope and expire afterward? Inside the scope: One allocated int contains 7. owner strong ownership One allocated int; locked temporary strong owner One allocated int; observer weak observation only One allocated int. After both strong owners are destroyed: Int lifetime ended contains released value; lifetime ended. ; Weak observer contains expired() == true. . A successful lock keeps the value alive while locked is held. A later lock can return empty after strong ownership ends. Weak/shared ownership does not synchronize mutable pointee accesses."
  },
  "lib-pmr-lifetimes": {
    "title": "The arena outlives every active allocation",
    "question": "Why is arena.release() after the vector’s scope?",
    "kind": "table",
    "headings": [
      "Phase",
      "512-byte buffer / arena",
      "Vector allocations"
    ],
    "rows": [
      [
        "Create arena",
        "Backing storage alive",
        "None yet"
      ],
      [
        "Inner vector scope",
        "Arena available",
        "reserve(4); store value 7"
      ],
      [
        "Leave vector scope",
        "Arena still alive",
        "Vector destroyed"
      ],
      [
        "arena.release()",
        "Reclaim arena storage",
        "No live vector allocation remains"
      ]
    ],
    "label": "Required lifetime nesting",
    "links": [],
    "note": "The null upstream resource makes an exceeded budget fail explicitly. Releasing an arena while a container still uses its storage invalidates that storage; it is not a safe way to clear the container.",
    "description": "Why is arena.release() after the vector’s scope? Phase; 512-byte buffer / arena; Vector allocations. Create arena; Backing storage alive; None yet; Inner vector scope; Arena available; reserve(4); store value 7; Leave vector scope; Arena still alive; Vector destroyed; arena.release(); Reclaim arena storage; No live vector allocation remains. Required lifetime nesting. . The null upstream resource makes an exceeded budget fail explicitly. Releasing an arena while a container still uses its storage invalidates that storage; it is not a safe way to clear the container."
  },
  "release-acquire-data": {
    "title": "A matching observation publishes the prepared batch",
    "question": "Which load makes reading [20,22] safe?",
    "kind": "table",
    "headings": [
      "Dependency",
      "Writer / main",
      "Reader"
    ],
    "rows": [
      [
        "1",
        "Prepare values={20,22}",
        "Poll ready with acquire"
      ],
      [
        "2",
        "Store ready=true with release",
        "Acquire load observes that true"
      ],
      [
        "3",
        "Earlier writes happen-before the reads",
        "Read values; result=42"
      ],
      [
        "4",
        "Join reader; print batch=42",
        "Thread finished"
      ]
    ],
    "label": "Cross-thread ordering, not elapsed time",
    "links": [
      "The release store → the acquire load that observes it is the synchronizes-with edge."
    ],
    "note": "An arbitrary acquire load is not guaranteed to see the newest write. This example does not publish later unrelated mutations or measure multicore performance.",
    "description": "Which load makes reading [20,22] safe? Dependency; Writer / main; Reader. 1; Prepare values={20,22}; Poll ready with acquire; 2; Store ready=true with release; Acquire load observes that true; 3; Earlier writes happen-before the reads; Read values; result=42; 4; Join reader; print batch=42; Thread finished. Cross-thread ordering, not elapsed time. The release store → the acquire load that observes it is the synchronizes-with edge.. An arbitrary acquire load is not guaranteed to see the newest write. This example does not publish later unrelated mutations or measure multicore performance."
  },
  "lib-future-promise": {
    "title": "The shared result state connects producer and consumer",
    "question": "When can result.get() return 42?",
    "kind": "table",
    "headings": [
      "Participant",
      "Action",
      "Dependency"
    ],
    "rows": [
      [
        "main",
        "get_future()",
        "Obtain the one future before moving the promise"
      ],
      [
        "worker",
        "set_value(42)",
        "Make the shared result ready"
      ],
      [
        "main",
        "result.get()",
        "Wait for readiness; consume the value"
      ]
    ],
    "label": "One shared result state",
    "links": [],
    "note": "An ordinary future permits one get. The same shared state can transport an exception in other cases; the unchanged starter sets a value. Result readiness is not a general lock for unrelated objects.",
    "description": "When can result.get() return 42? Participant; Action; Dependency. main; get_future(); Obtain the one future before moving the promise; worker; set_value(42); Make the shared result ready; main; result.get(); Wait for readiness; consume the value. One shared result state. . An ordinary future permits one get. The same shared state can transport an exception in other cases; the unchanged starter sets a value. Result readiness is not a general lock for unrelated objects."
  },
  "oldest-reader-gc": {
    "title": "An old reader keeps the earlier version alive",
    "question": "Why are three versions retained until snapshot 1 is released?",
    "kind": "table",
    "headings": [
      "Value",
      "Visibility interval",
      "Why retained before release?"
    ],
    "rows": [
      [
        "10",
        "[1,2)",
        "Required by snapshot 1"
      ],
      [
        "20",
        "[2,3)",
        "Conservative oldest-reader horizon"
      ],
      [
        "30",
        "[3,forever)",
        "Current version"
      ]
    ],
    "label": "Before releasing the old reader",
    "links": [
      "While snapshot 1 is active: retain 3 versions.",
      "After release with no older reader: reclaim the first two, retain current value 30."
    ],
    "note": "Version numbers are committed stamps, not times. The implementation uses a bounded sentinel for forever and an oldest-active-reader horizon. Releasing one reader cannot reclaim data another active reader needs.",
    "description": "The fixture has value 10 visible in [1,2), value 20 in [2,3), and current value 30 from version 3 onward. Active snapshot 1 requires value 10. The conservative oldest-reader horizon also retains intermediate value 20, so three versions remain. After releasing that reader with no other active reader, the horizon becomes 3: values 10 and 20 can be reclaimed, leaving current value 30. Version stamps are not wall-clock times."
  },
  "hash-join-buckets": {
    "title": "One probe can emit several matching pairs",
    "question": "Why does probing key 1 produce AX and AY?",
    "kind": "table",
    "headings": [
      "Stage",
      "Key 1",
      "Key 3"
    ],
    "rows": [
      [
        "Build rows grouped by key",
        "[X,Y]",
        "[Z]"
      ],
      [
        "Probe A with key 1",
        "Match X and Y",
        "Not probed"
      ],
      [
        "Emitted pairs",
        "AX; AY",
        "No output"
      ]
    ],
    "label": "Build buckets → probe → matching pairs",
    "links": [],
    "note": "This small fixture uses std::map for the bucket grouping. It demonstrates duplicate matching multiplicity, not expected constant-time hash lookup or a complete join executor. Actual key equality defines a match.",
    "description": "Why does probing key 1 produce AX and AY? Stage; Key 1; Key 3. Build rows grouped by key; [X,Y]; [Z]; Probe A with key 1; Match X and Y; Not probed; Emitted pairs; AX; AY; No output. Build buckets → probe → matching pairs. . This small fixture uses std::map for the bucket grouping. It demonstrates duplicate matching multiplicity, not expected constant-time hash lookup or a complete join executor. Actual key equality defines a match."
  },
  "generation-publication": {
    "title": "Old readers retain the old generation",
    "question": "Why is old_size 3 while new_size is 2?",
    "kind": "references",
    "states": [
      {
        "label": "Before publication",
        "objects": [
          {
            "label": "Old immutable vector",
            "value": "[1,2,3]",
            "refs": [
              {
                "name": "current",
                "edge": "shared owner"
              },
              {
                "name": "reader",
                "edge": "shared owner"
              }
            ]
          }
        ]
      },
      {
        "label": "After replacing current",
        "objects": [
          {
            "label": "Old immutable vector",
            "value": "[1,2,3]",
            "refs": [
              {
                "name": "reader",
                "edge": "keeps old generation alive"
              }
            ]
          },
          {
            "label": "New immutable vector",
            "value": "[2,3]",
            "refs": [
              {
                "name": "current",
                "edge": "owns new generation"
              }
            ]
          }
        ]
      }
    ],
    "note": "The old generation can be reclaimed only after its last owner releases it. Replacing a handle is separate from reclamation and does not prove durable file replacement.",
    "description": "Why is old_size 3 while new_size is 2? Before publication: Old immutable vector contains [1,2,3]. current shared owner Old immutable vector; reader shared owner Old immutable vector. After replacing current: Old immutable vector contains [1,2,3]. reader keeps old generation alive Old immutable vector; New immutable vector contains [2,3]. current owns new generation New immutable vector. The old generation can be reclaimed only after its last owner releases it. Replacing a handle is separate from reclamation and does not prove durable file replacement."
  },
  "string-bytes": {
    "title": "UTF-8 bytes do not count displayed letters",
    "question": "Why does Zoë occupy four bytes?",
    "kind": "bytes",
    "label": "Starter string: Zoë",
    "values": [
      "5A",
      "6F",
      "C3",
      "AB"
    ],
    "groups": [
      {
        "label": "Z",
        "size": 1
      },
      {
        "label": "o",
        "size": 1
      },
      {
        "label": "ë",
        "size": 2
      }
    ],
    "note": "std::string::size counts char code units; this fixture uses UTF-8 and eight-bit bytes. Code points are not always complete grapheme clusters.",
    "description": "Why does Zoë occupy four bytes? Starter string: Zoë. Z uses byte offsets 0: 5A; o uses byte offsets 1: 6F; ë uses byte offsets 2 through 3: C3, AB. std::string::size counts char code units; this fixture uses UTF-8 and eight-bit bytes. Code points are not always complete grapheme clusters."
  },
  "vector-capacity": {
    "title": "Reserved capacity is not live element count",
    "question": "Why does reserve(20) leave size 2 but resize(4) creates two zeros?",
    "kind": "table",
    "headings": [
      "Operation",
      "Live elements",
      "Storage contract"
    ],
    "rows": [
      [
        "Initial vector",
        "[1,2] · size 2",
        "Capacity is at least 2"
      ],
      [
        "reserve(20)",
        "[1,2] · size 2",
        "Capacity at least 20; no extra elements"
      ],
      [
        "resize(4)",
        "[1,2,0,0] · size 4",
        "Two new int elements are value-initialized"
      ]
    ],
    "label": "",
    "links": [],
    "note": "Do not index reserved capacity beyond size. Exact capacity growth is implementation-dependent.",
    "description": "Why does reserve(20) leave size 2 but resize(4) creates two zeros? Operation; Live elements; Storage contract. Initial vector; [1,2] · size 2; Capacity is at least 2; reserve(20); [1,2] · size 2; Capacity at least 20; no extra elements; resize(4); [1,2,0,0] · size 4; Two new int elements are value-initialized. . . Do not index reserved capacity beyond size. Exact capacity growth is implementation-dependent."
  },
  "safe-slicing": {
    "title": "Validate the complete requested interval",
    "question": "Why is [0,4) inside Lovelace but [2,9) outside Ada?",
    "kind": "panels",
    "panels": [
      {
        "label": "Accepted range",
        "model": {
          "kind": "slots",
          "rows": [
            {
              "label": "Lovelace",
              "values": [
                "L",
                "o",
                "v",
                "e",
                "l",
                "a",
                "c",
                "e"
              ],
              "note": "Start 0, length 4: select Love.",
              "active": [
                0,
                1,
                2,
                3
              ],
              "muted": [
                4,
                5,
                6,
                7
              ]
            }
          ]
        }
      },
      {
        "label": "Rejected request",
        "model": {
          "kind": "table",
          "headings": [
            "Owner length",
            "Requested start",
            "Requested count",
            "Decision"
          ],
          "rows": [
            [
              "3 (Ada)",
              "2",
              "9",
              "Reject before forming the view"
            ]
          ],
          "label": "",
          "links": []
        }
      }
    ],
    "note": "A valid start alone is insufficient; the whole count must fit the remaining owner. The returned view borrows text and does not extend its lifetime.",
    "description": "Why is [0,4) inside Lovelace but [2,9) outside Ada? Accepted range. Lovelace: index 0 = L, index 1 = o, index 2 = v, index 3 = e, index 4 = l, index 5 = a, index 6 = c, index 7 = e. Start 0, length 4: select Love.; Rejected request. Owner length; Requested start; Requested count; Decision. 3 (Ada); 2; 9; Reject before forming the view. . . A valid start alone is insufficient; the whole count must fit the remaining owner. The returned view borrows text and does not extend its lifetime."
  },
  "view-mutation": {
    "title": "Two views reach one backing array",
    "question": "Why does middle.front()=9 change the value seen by read_only?",
    "kind": "slots",
    "rows": [
      {
        "label": "Before mutation",
        "values": [
          1,
          2,
          3
        ],
        "note": "middle is a one-element span over index 1.",
        "active": [
          1
        ],
        "muted": []
      },
      {
        "label": "After mutation through middle",
        "values": [
          1,
          9,
          3
        ],
        "note": "read_only spans the same array and prints 193.",
        "active": [
          1
        ],
        "muted": []
      }
    ],
    "note": "A span does not own or copy the elements. span<const int> prevents writes through that view; it does not prevent another valid writable view from changing the same array.",
    "description": "Why does middle.front()=9 change the value seen by read_only? Before mutation: index 0 = 1, index 1 = 2, index 2 = 3. middle is a one-element span over index 1.. After mutation through middle: index 0 = 1, index 1 = 9, index 2 = 3. read_only spans the same array and prints 193.. A span does not own or copy the elements. span<const int> prevents writes through that view; it does not prevent another valid writable view from changing the same array."
  },
  "iterator-ranges": {
    "title": "The end iterator is a boundary, not an element",
    "question": "Why must found be compared with end before dereferencing?",
    "kind": "slots",
    "rows": [
      {
        "label": "Original vector",
        "values": [
          2,
          4,
          6
        ],
        "note": "find(...,4) reaches index 1. A search for absent 9 returns the end boundary after index 2.",
        "active": [
          1
        ],
        "muted": [],
        "tags": {
          "1": "found"
        }
      }
    ],
    "note": "The range is [begin,end). end is not another stored element and must not be dereferenced.",
    "description": "Why must found be compared with end before dereferencing? Original vector: index 0 = 2, index 1 = 4, index 2 = 6. find(...,4) reaches index 1. A search for absent 9 returns the end boundary after index 2.. The range is [begin,end). end is not another stored element and must not be dereferenced."
  },
  "lib-bounds-duplicates": {
    "title": "Two bounds enclose every equal key",
    "question": "Why does equal_range return first position 1 and count 3?",
    "kind": "slots",
    "rows": [
      {
        "label": "Search key 2",
        "values": [
          1,
          2,
          2,
          2,
          4
        ],
        "note": "The duplicate interval is [1,4); its length is 4−1=3.",
        "active": [
          1,
          2,
          3
        ],
        "muted": [
          0,
          4
        ],
        "tags": {
          "1": "first",
          "4": "last excluded"
        }
      }
    ],
    "note": "The sorted/partitioned input contract is required. The upper bound is the first greater element, not the last equal element.",
    "description": "Why does equal_range return first position 1 and count 3? Search key 2: index 0 = 1, index 1 = 2, index 2 = 2, index 3 = 2, index 4 = 4. The duplicate interval is [1,4); its length is 4−1=3.. The sorted/partitioned input contract is required. The upper bound is the first greater element, not the last equal element."
  },
  "topological-order": {
    "title": "A task is ready only after all incoming edges are handled",
    "question": "Why can vertex 3 run only after both 1 and 2?",
    "kind": "graph",
    "nodes": [
      {
        "id": "0",
        "label": "0",
        "x": 50,
        "y": 15
      },
      {
        "id": "1",
        "label": "1",
        "x": 20,
        "y": 50
      },
      {
        "id": "2",
        "label": "2",
        "x": 80,
        "y": 50
      },
      {
        "id": "3",
        "label": "3",
        "x": 50,
        "y": 85
      }
    ],
    "edges": [
      {
        "from": "0",
        "to": "1",
        "label": ""
      },
      {
        "from": "0",
        "to": "2",
        "label": ""
      },
      {
        "from": "1",
        "to": "3",
        "label": ""
      },
      {
        "from": "2",
        "to": "3",
        "label": ""
      }
    ],
    "legend": "Initial indegrees: [0,1,1,2]. Processing 0 readies 1 and 2; both must be processed before indegree[3] reaches zero.",
    "height": 300,
    "note": "The starter emits 0,1,2,3 and complete=1. A directed cycle prevents all vertices from being emitted; this is a dependency order, not BFS distance.",
    "description": "Why can vertex 3 run only after both 1 and 2? Nodes: 0, 1, 2, 3. Connections: 0 leads to 1; 0 leads to 2; 1 leads to 3; 2 leads to 3. Initial indegrees: [0,1,1,2]. Processing 0 readies 1 and 2; both must be processed before indegree[3] reaches zero.. The starter emits 0,1,2,3 and complete=1. A directed cycle prevents all vertices from being emitted; this is a dependency order, not BFS distance."
  },
  "weighted-path": {
    "title": "A lower total cost can use more edges",
    "question": "Why are distances to 1 and 3 equal to 2 and 3?",
    "kind": "graph",
    "nodes": [
      {
        "id": "0",
        "label": "0",
        "x": 16,
        "y": 20
      },
      {
        "id": "1",
        "label": "1",
        "x": 84,
        "y": 20
      },
      {
        "id": "2",
        "label": "2",
        "x": 16,
        "y": 80
      },
      {
        "id": "3",
        "label": "3",
        "x": 84,
        "y": 80
      }
    ],
    "edges": [
      {
        "from": "0",
        "to": "1",
        "label": "5"
      },
      {
        "from": "0",
        "to": "2",
        "label": "1"
      },
      {
        "from": "2",
        "to": "1",
        "label": "1"
      },
      {
        "from": "1",
        "to": "3",
        "label": "1"
      },
      {
        "from": "2",
        "to": "3",
        "label": "9"
      }
    ],
    "legend": "0→2→1 costs 2; continuing to 3 costs 3. The direct alternatives cost 5 and 10.",
    "height": 300,
    "note": "All supplied weights are nonnegative. The priority queue selects smallest total distance; FIFO shortest-edge-count reasoning would answer a different question.",
    "description": "Why are distances to 1 and 3 equal to 2 and 3? Nodes: 0, 1, 2, 3. Connections: 0 leads to 1 (5); 0 leads to 2 (1); 2 leads to 1 (1); 1 leads to 3 (1); 2 leads to 3 (9). 0→2→1 costs 2; continuing to 3 costs 3. The direct alternatives cost 5 and 10.. All supplied weights are nonnegative. The priority queue selects smallest total distance; FIFO shortest-edge-count reasoning would answer a different question."
  },
  "codec-length-prefix": {
    "title": "The length prefix bounds the following payload",
    "question": "Which bytes form the three-character name Ada?",
    "kind": "slots",
    "rows": [
      {
        "label": "Encoded bytes",
        "values": [
          3,
          "A",
          "d",
          "a"
        ],
        "note": "Offset 0 declares three payload bytes; offsets 1..3 contain the name.",
        "active": [
          1,
          2,
          3
        ],
        "muted": [],
        "tags": {
          "0": "length"
        }
      }
    ],
    "note": "Check that the declared length fits both the format policy and the available bytes before making a view or copy. The length byte is not part of the name.",
    "description": "Which bytes form the three-character name Ada? Encoded bytes: index 0 = 3, index 1 = A, index 2 = d, index 3 = a. Offset 0 declares three payload bytes; offsets 1..3 contain the name.. Check that the declared length fits both the format policy and the available bytes before making a view or copy. The length byte is not part of the name."
  },
  "bplus-borrow": {
    "title": "A sibling can donate before merging",
    "question": "Which key moves when deleting 1 leaves the left leaf underfull?",
    "kind": "slots",
    "rows": [
      {
        "label": "Before deletion · two leaves",
        "values": [
          1,
          2,
          3,
          4,
          5
        ],
        "note": "Left [1,2]; right [3,4,5]; separator 3.",
        "active": [],
        "muted": [],
        "tags": {
          "2": "right begins"
        }
      },
      {
        "label": "Delete 1, then borrow 3",
        "values": [
          "removed",
          2,
          3,
          4,
          5
        ],
        "note": "Left [2,3]; right [4,5]; routing separator becomes 4.",
        "active": [
          2
        ],
        "muted": [
          0
        ],
        "tags": {
          "3": "right begins"
        }
      }
    ],
    "note": "These fixed key positions preserve identity, not physical page slots. Each non-root leaf requires at least two keys in this bounded model; the donor has spare occupancy.",
    "description": "Which key moves when deleting 1 leaves the left leaf underfull? Before deletion · two leaves: index 0 = 1, index 1 = 2, index 2 = 3, index 3 = 4, index 4 = 5. Left [1,2]; right [3,4,5]; separator 3.. Delete 1, then borrow 3: index 0 = removed, index 1 = 2, index 2 = 3, index 3 = 4, index 4 = 5. Left [2,3]; right [4,5]; routing separator becomes 4.. These fixed key positions preserve identity, not physical page slots. Each non-root leaf requires at least two keys in this bounded model; the donor has spare occupancy."
  },
  "bplus-merge": {
    "title": "Neither sibling can donate after the second deletion",
    "question": "Why do keys 2,3,4 end up in one leaf?",
    "kind": "table",
    "headings": [
      "Operation",
      "Left leaf",
      "Right leaf",
      "Repair"
    ],
    "rows": [
      [
        "Insert 1..5",
        "[1,2]",
        "[3,4,5]",
        "None"
      ],
      [
        "erase(5)",
        "[1,2]",
        "[3,4]",
        "Both at minimum"
      ],
      [
        "erase(1)",
        "[2]",
        "[3,4]",
        "Right cannot donate; merge"
      ],
      [
        "Final",
        "[2,3,4]",
        "No second leaf",
        "leaves=1; valid=1"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The missing right leaf is not zeroed storage. This is the bounded teaching index’s occupancy rule, not a claim that every deletion requires merging.",
    "description": "Why do keys 2,3,4 end up in one leaf? Operation; Left leaf; Right leaf; Repair. Insert 1..5; [1,2]; [3,4,5]; None; erase(5); [1,2]; [3,4]; Both at minimum; erase(1); [2]; [3,4]; Right cannot donate; merge; Final; [2,3,4]; No second leaf; leaves=1; valid=1. . . The missing right leaf is not zeroed storage. This is the bounded teaching index’s occupancy rule, not a claim that every deletion requires merging."
  },
  "mixed-sign": {
    "title": "Mathematical comparison avoids unsigned reinterpretation",
    "question": "Why is std::cmp_less(-1,1u) true?",
    "kind": "table",
    "headings": [
      "Comparison",
      "Interpretation",
      "Result"
    ],
    "rows": [
      [
        "std::cmp_less(-1,1u)",
        "Compare the mathematical values −1 and 1",
        "true"
      ],
      [
        "std::cmp_equal(-1,1u)",
        "Different mathematical values",
        "false"
      ],
      [
        "Ordinary mixed-sign expression · contrast",
        "Conversion rules may convert −1 to unsigned",
        "Must reason about operand types"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The starter uses the comparison helpers deliberately. The contrast is a language-rule explanation, not another printed starter expression.",
    "description": "Why is std::cmp_less(-1,1u) true? Comparison; Interpretation; Result. std::cmp_less(-1,1u); Compare the mathematical values −1 and 1; true; std::cmp_equal(-1,1u); Different mathematical values; false; Ordinary mixed-sign expression · contrast; Conversion rules may convert −1 to unsigned; Must reason about operand types. . . The starter uses the comparison helpers deliberately. The contrast is a language-rule explanation, not another printed starter expression."
  },
  "checked-multiply": {
    "title": "The guard must not overflow before the operation",
    "question": "Why is the maximum unsigned input rejected for multiplication by 2?",
    "kind": "branch",
    "root": "Is multiplication representable?",
    "paths": [
      {
        "when": "6 × 7 fits",
        "result": "Return 42",
        "detail": ""
      },
      {
        "when": "UINT_MAX × 2 does not fit",
        "result": "Return no value",
        "detail": "Check a safe division bound before multiplying."
      }
    ],
    "note": "The helper reports an unrepresentable result without first computing a wrapped product. The exact unsigned maximum depends on the target width.",
    "description": "Why is the maximum unsigned input rejected for multiplication by 2? Is multiplication representable?. 6 × 7 fits. Return 42. ; UINT_MAX × 2 does not fit. Return no value. Check a safe division bound before multiplying.. The helper reports an unrepresentable result without first computing a wrapped product. The exact unsigned maximum depends on the target width."
  },
  "checked-division": {
    "title": "A nonzero divisor is not the only safety check",
    "question": "Why are both divisor 0 and INT_MIN/-1 rejected?",
    "kind": "branch",
    "root": "Checked integer divide",
    "paths": [
      {
        "when": "9 / 2",
        "result": "Return 4",
        "detail": "Integer division truncates toward zero."
      },
      {
        "when": "Divisor is zero",
        "result": "Reject",
        "detail": ""
      },
      {
        "when": "Minimum int divided by -1",
        "result": "Reject if the positive quotient is unrepresentable",
        "detail": ""
      }
    ],
    "note": "Do not evaluate the dangerous quotient as an overflow test. The supplied target uses the asymmetric two’s-complement signed range.",
    "description": "Why are both divisor 0 and INT_MIN/-1 rejected? Checked integer divide. 9 / 2. Return 4. Integer division truncates toward zero.; Divisor is zero. Reject. ; Minimum int divided by -1. Reject if the positive quotient is unrepresentable. . Do not evaluate the dangerous quotient as an overflow test. The supplied target uses the asymmetric two’s-complement signed range."
  },
  "text-byte-slices": {
    "title": "A byte offset can fall inside one UTF-8 scalar",
    "question": "Why is offset 1 not the start of another character in ë?",
    "kind": "bytes",
    "label": "One scalar, two UTF-8 bytes",
    "values": [
      "C3",
      "AB"
    ],
    "groups": [
      {
        "label": "ë",
        "size": 2
      }
    ],
    "note": "The starter prints lead=c3 and continuation=ab. Indexing std::string accesses code units; an arbitrary byte slice need not be valid UTF-8 or align with grapheme boundaries.",
    "description": "Why is offset 1 not the start of another character in ë? One scalar, two UTF-8 bytes. ë uses byte offsets 0 through 1: C3, AB. The starter prints lead=c3 and continuation=ab. Indexing std::string accesses code units; an arbitrary byte slice need not be valid UTF-8 or align with grapheme boundaries."
  },
  "joined-lifetime": {
    "title": "Join orders a worker’s last access before the read",
    "question": "When may main read result safely?",
    "kind": "table",
    "headings": [
      "Dependency",
      "Main",
      "Worker"
    ],
    "rows": [
      [
        "1",
        "result=0; launch borrowed access",
        "Starts"
      ],
      [
        "2",
        "join waits",
        "Write result=42; finish"
      ],
      [
        "3",
        "join returns; print joined=42",
        "No further access"
      ]
    ],
    "label": "Completion order, not a timing trace",
    "links": [],
    "note": "The referenced result stays alive until after the join. This does not measure parallel execution or make unsynchronized earlier reads safe.",
    "description": "When may main read result safely? Dependency; Main; Worker. 1; result=0; launch borrowed access; Starts; 2; join waits; Write result=42; finish; 3; join returns; print joined=42; No further access. Completion order, not a timing trace. . The referenced result stays alive until after the join. This does not measure parallel execution or make unsynchronized earlier reads safe."
  },
  "condition-queue": {
    "title": "Wait for the predicate, then recheck under the lock",
    "question": "Why does closing the queue still allow accepted work to drain?",
    "kind": "branch",
    "root": "After waiting: queue nonempty OR closed",
    "paths": [
      {
        "when": "Queue has an item",
        "result": "Pop the front item",
        "detail": "Continue consuming accepted values, including after close."
      },
      {
        "when": "Queue empty and closed",
        "result": "Return no value",
        "detail": "The consumer exits; main joins before reading sum=15."
      }
    ],
    "note": "Waiting releases and later reacquires the mutex; the predicate is checked again before access. Close rejects new work but this fixture drains queued items. A notification alone is not an item.",
    "description": "Why does closing the queue still allow accepted work to drain? After waiting: queue nonempty OR closed. Queue has an item. Pop the front item. Continue consuming accepted values, including after close.; Queue empty and closed. Return no value. The consumer exits; main joins before reading sum=15.. Waiting releases and later reacquires the mutex; the predicate is checked again before access. Close rejects new work but this fixture drains queued items. A notification alone is not an item."
  },
  "compare-exchange": {
    "title": "Failure updates expected with the observed value",
    "question": "Why does failed compare-exchange leave value=7 but expected=7?",
    "kind": "table",
    "headings": [
      "Boundary",
      "Atomic value",
      "expected",
      "Requested replacement"
    ],
    "rows": [
      [
        "Before comparison",
        "7",
        "5",
        "9"
      ],
      [
        "Compare: 7 != 5",
        "7 unchanged",
        "updated to observed 7",
        "not written"
      ],
      [
        "Printed result",
        "value=7",
        "expected=7",
        "changed=0"
      ]
    ],
    "label": "",
    "links": [],
    "note": "This starter uses compare_exchange_strong. A failed comparison reports the observed value through expected; it does not install the desired 9.",
    "description": "Why does failed compare-exchange leave value=7 but expected=7? Boundary; Atomic value; expected; Requested replacement. Before comparison; 7; 5; 9; Compare: 7 != 5; 7 unchanged; updated to observed 7; not written; Printed result; value=7; expected=7; changed=0. . . This starter uses compare_exchange_strong. A failed comparison reports the observed value through expected; it does not install the desired 9."
  },
  "version-intervals": {
    "title": "Visibility uses half-open committed intervals",
    "question": "Why do snapshots 1 and 2 see 10 and 20 respectively?",
    "kind": "table",
    "headings": [
      "Version value",
      "Visibility interval",
      "Reader result"
    ],
    "rows": [
      [
        "10",
        "[1,2)",
        "snapshot 1 → 10"
      ],
      [
        "20",
        "[2,forever)",
        "snapshot 2 → 20"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The begin stamp is inclusive and end stamp exclusive. Stamps are logical versions, not seconds; uncommitted visibility and concurrent reclamation are separate contracts.",
    "description": "Why do snapshots 1 and 2 see 10 and 20 respectively? Version value; Visibility interval; Reader result. 10; [1,2); snapshot 1 → 10; 20; [2,forever); snapshot 2 → 20. . . The begin stamp is inclusive and end stamp exclusive. Stamps are logical versions, not seconds; uncommitted visibility and concurrent reclamation are separate contracts."
  },
  "generation-handles": {
    "title": "A reused slot is not the same generation",
    "question": "Why must the old handle be rejected even though slot 0 is live again?",
    "kind": "table",
    "headings": [
      "State",
      "Slot index",
      "Generation",
      "Value"
    ],
    "rows": [
      [
        "Old handle",
        "0",
        "1",
        "Identifies the old record"
      ],
      [
        "Initial live slot",
        "0",
        "1",
        "10"
      ],
      [
        "After reuse",
        "0",
        "2",
        "20"
      ],
      [
        "Validation",
        "Index matches",
        "Generation differs",
        "Reject stale handle"
      ]
    ],
    "label": "",
    "links": [],
    "note": "The generation check prevents a stale logical handle from silently naming a replacement record. It does not by itself manage concurrent memory lifetime or generation wrap.",
    "description": "Why must the old handle be rejected even though slot 0 is live again? State; Slot index; Generation; Value. Old handle; 0; 1; Identifies the old record; Initial live slot; 0; 1; 10; After reuse; 0; 2; 20; Validation; Index matches; Generation differs; Reject stale handle. . . The generation check prevents a stale logical handle from silently naming a replacement record. It does not by itself manage concurrent memory lifetime or generation wrap."
  },
  "lib-vector-invalidation": {
    "title": "Reallocation changes storage, not the one live value",
    "question": "Why can v.at(0) still read 3 after reserving more capacity?",
    "kind": "references",
    "states": [
      {
        "label": "Before reserve(32) · illustrative reallocation case",
        "objects": [
          {
            "label": "Backing allocation A",
            "value": "[3] · size=1; capacity≥8",
            "refs": [
              {
                "name": "v",
                "edge": "owns storage A"
              }
            ],
            "reserveRef": true
          },
          {
            "label": "Allocation B",
            "value": "not created yet",
            "refs": [],
            "reserveRef": true
          }
        ]
      },
      {
        "label": "If the old capacity was below 32",
        "objects": [
          {
            "label": "Old allocation A",
            "value": "released storage",
            "refs": [],
            "dead": true,
            "reserveRef": true
          },
          {
            "label": "New allocation B",
            "value": "[3] · size=1; capacity≥32",
            "refs": [
              {
                "name": "v",
                "edge": "now owns storage B"
              }
            ],
            "reserveRef": true
          }
        ]
      }
    ],
    "note": "This shows the reallocation case. If old capacity already met 32, reserve keeps that storage instead. Exact capacities and addresses are not promised. When reallocation occurs, old element observers are invalid; the index 0 can reacquire the current element as long as positions have not otherwise changed.",
    "description": "Why can v.at(0) still read 3 after reserving more capacity? Before reserve(32) · illustrative reallocation case: Backing allocation A contains [3] · size=1; capacity≥8. v owns storage A Backing allocation A; Allocation B contains not created yet. . If the old capacity was below 32: Old allocation A contains released storage; lifetime ended. ; New allocation B contains [3] · size=1; capacity≥32. v now owns storage B New allocation B. This shows the reallocation case. If old capacity already met 32, reserve keeps that storage instead. Exact capacities and addresses are not promised. When reallocation occurs, old element observers are invalid; the index 0 can reacquire the current element as long as positions have not otherwise changed."
  },
  "avl-single-rotation": {
    "title": "Rotations change links while preserving keys",
    "question": "Why is the repaired root 20 with children 10 and 30?",
    "kind": "panels",
    "panels": [
      {
        "label": "Before repair: the supplied insertion shape",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "10",
              "label": "10",
              "x": 20,
              "y": 15
            },
            {
              "id": "20",
              "label": "20",
              "x": 50,
              "y": 50
            },
            {
              "id": "30",
              "label": "30",
              "x": 80,
              "y": 85
            }
          ],
          "edges": [
            {
              "from": "10",
              "to": "20",
              "label": "right"
            },
            {
              "from": "20",
              "to": "30",
              "label": "right"
            }
          ],
          "legend": "",
          "height": 260
        }
      },
      {
        "label": "After repair",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "20",
              "label": "20",
              "x": 50,
              "y": 20
            },
            {
              "id": "10",
              "label": "10",
              "x": 22,
              "y": 80
            },
            {
              "id": "30",
              "label": "30",
              "x": 78,
              "y": 80
            }
          ],
          "edges": [
            {
              "from": "20",
              "to": "10",
              "label": "left"
            },
            {
              "from": "20",
              "to": "30",
              "label": "right"
            }
          ],
          "legend": "In-order remains 10,20,30.",
          "height": 260
        }
      }
    ],
    "note": "For 10,20,30, rotate left at 10; the reverse insertion uses a right rotation. For 30,10,20, rotate left at 10 then right at 30. Key values and node identities do not change; the parent/child links do.",
    "description": "Why is the repaired root 20 with children 10 and 30? Before repair: the supplied insertion shape. Nodes: 10, 20, 30. Connections: 10 leads to 20 (right); 20 leads to 30 (right). ; After repair. Nodes: 20, 10, 30. Connections: 20 leads to 10 (left); 20 leads to 30 (right). In-order remains 10,20,30.. For 10,20,30, rotate left at 10; the reverse insertion uses a right rotation. For 30,10,20, rotate left at 10 then right at 30. Key values and node identities do not change; the parent/child links do."
  },
  "avl-double-rotation": {
    "title": "Rotations change links while preserving keys",
    "question": "Why is the repaired root 20 with children 10 and 30?",
    "kind": "panels",
    "panels": [
      {
        "label": "Before repair: the supplied insertion shape",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "30",
              "label": "30",
              "x": 65,
              "y": 15
            },
            {
              "id": "10",
              "label": "10",
              "x": 25,
              "y": 50
            },
            {
              "id": "20",
              "label": "20",
              "x": 43,
              "y": 85
            }
          ],
          "edges": [
            {
              "from": "30",
              "to": "10",
              "label": "left"
            },
            {
              "from": "10",
              "to": "20",
              "label": "right"
            }
          ],
          "legend": "",
          "height": 260
        }
      },
      {
        "label": "After repair",
        "model": {
          "kind": "graph",
          "nodes": [
            {
              "id": "20",
              "label": "20",
              "x": 50,
              "y": 20
            },
            {
              "id": "10",
              "label": "10",
              "x": 22,
              "y": 80
            },
            {
              "id": "30",
              "label": "30",
              "x": 78,
              "y": 80
            }
          ],
          "edges": [
            {
              "from": "20",
              "to": "10",
              "label": "left"
            },
            {
              "from": "20",
              "to": "30",
              "label": "right"
            }
          ],
          "legend": "In-order remains 10,20,30.",
          "height": 260
        }
      }
    ],
    "note": "For 10,20,30, rotate left at 10; the reverse insertion uses a right rotation. For 30,10,20, rotate left at 10 then right at 30. Key values and node identities do not change; the parent/child links do.",
    "description": "Why is the repaired root 20 with children 10 and 30? Before repair: the supplied insertion shape. Nodes: 30, 10, 20. Connections: 30 leads to 10 (left); 10 leads to 20 (right). ; After repair. Nodes: 20, 10, 30. Connections: 20 leads to 10 (left); 20 leads to 30 (right). In-order remains 10,20,30.. For 10,20,30, rotate left at 10; the reverse insertion uses a right rotation. For 30,10,20, rotate left at 10 then right at 30. Key values and node identities do not change; the parent/child links do."
  }
};
