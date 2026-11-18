# Learner wording and interface review

## Opening review

The first chapter assumes no C++ experience. Later lessons identify earlier reading and introduce new terms at their first use. The review covered the home page, the course outline and ten part filters, 270 lessons across 54 chapters, the Workbench, and the missing-route page. It included original source, output, questions and feedback, all 34 concept diagrams, and the optional chapter projects. The native exports mirror the reviewed lesson instructions.

The original lesson asked readers to make a change only after passing the editor, the worked result, and the understanding question. Many prompts omitted the exact location, change or evidence. Native prompts sometimes implied that the lesson’s code could be edited on the page. The editor left old output beside changed source and restored a starter by overwriting the draft. Workbench’s file-import label was unavailable by keyboard.

## Closing review

- Every lesson identifies what the browser or checkout supplies, the location of the starter, a literal edit, when to run and what to compare. The 26 native lessons name the editable source and use a terminal command from the repository root. That command runs in a fresh temporary directory.
- The experiment sits beside the editor or native command. The original output, native source listing, diagram text alternative, and larger chapter project are optional references. The formulas, actions and questions needed for the current step remain visible. Headings and status labels identify the task or result.
- Program output, compiler and runtime diagnostics, exit status, and choices in the understanding question have distinct labels. After an edit or failed attempt, earlier output says which run it belongs to. Successful changes are compared with the original output by the learner. Some programs intentionally return nonzero when their own check fails.
- The Workbench explains preloaded commands, temporary per-run changes and the saved browser file. Its walkthrough inserts or updates a record, saves the file, and reopens it with LIST. Model captions and lesson wording distinguish tiny checked fixtures, host file operations and production database guarantees.
- Source and input keys are preserved. Restoring source retains the prior draft under Undo restore. A quota failure cannot replace the durable draft with a shorter starter if the longer recovery copy cannot be saved. A failed durable write during Undo keeps the saved recovery copy available. Browser storage failures display directions for keeping the source or input.
- One Run code button starts a browser program. Stop appears during the run. Editor tools contains source recovery and export, and optional input explains when its text is supplied. File import, answers and main controls can be reached by keyboard.

## Functional evidence

- The built course opened all 284 routes at 320, 390, 820 and 1440 CSS pixels in Chromium across light and dark system preferences. The site uses its existing light palette. The sweep found no horizontal page overflow or JavaScript errors. The independent release test loaded the versioned route graph despite simulated stale cached files.
- Strict native C++20 checks ran all 270 original examples and all 270 specified edits with GCC. The independently observed outcomes include intentional compile errors and program-defined nonzero exits. Focused browser walkthroughs covered the exact greeting edit, compiler diagnostics with older-output labeling, keyboard file import, exact file export, and source recovery after reload and quota failures.
- The existing browser compiler suite checks every supported original against the expected output. The separate edited-source run compares the documented browser variants with native results and explicit compile-error cases. The Workbench also checks exact CPF1 bytes, persistence, rejection preservation and cross-tab conflicts.

The checks establish behavior on the tested toolchains and viewports. Learner understanding and transfer remain unmeasured. Other browsers, physical mobile devices, and platform-wide filesystem guarantees were outside the local verification.
