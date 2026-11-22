# Offline and update adapter for C++ Foundry

The [shared offline/update design](https://github.com/snowch/cuda-cpp-lab/blob/main/docs/offline-update-design.md) defines the reusable mechanism. This adapter uses the same release validator, status controller and service worker, with a separate `cpp-foundry:` cache prefix and this app's scope. Other labs' caches and learner storage are never removed.

## User contract

Online navigation loads the current published course; saving an offline copy is optional. App status checks at startup, on return to the page and periodically while visible. A check fetches small release metadata, not the complete compiler. A complete save includes all 270 lessons, diagrams, sources, fonts, JavaScript and compressed compiler assets. Native tools and external reference websites are not included.

A first save is **Save offline copy**. When a newer saved version is offered, **Update offline copy** downloads and verifies it; **Restart to update** is then shown. Only a complete, byte-verified release can be described as downloaded and ready to use offline. Merely viewing a lesson or running the compiler does not establish that all files are saved.

An interrupted or cancelled download retains verified files and leaves the previous complete release usable. Reopening App status resumes supported unfinished downloads. Browsers may suspend background tabs; no promise of uninterrupted background execution is made. The ready state is derived from verified files, not a remembered percentage or flag. Removing the offline copy preserves learner drafts, completion, preferences and `people.cpf`.

## Build and deployment

`tools/build.mjs` creates `.build/site`, versions application assets and calls `tools/offline.mjs` to create a SHA-256 manifest and immutable `releases/<id>/` tree. `dist/` is authored, tracked source and must not be deleted as build cleanup. Gzip toolchain archives are reproducible. On publication, `tools/retain-for-publish.mjs` preserves two earlier immutable releases and verifies their original byte hashes. A retention failure blocks publication. This keeps older open tabs' first Run working after a deployment, including compiler changes. First adoption has no previous manifest to retain.

Service-worker installation does not silently download the full compiler. Release membership and hashes are checked before a saved copy can be used. Online responses and offline fallbacks follow the shared worker policy. An update never combines lesson code from one release with compiler/runtime modules from another.

## Restart and learner-work preservation

`dist/experiment-state.mjs` is the course adapter for PREPARE_RESTART → COMMIT_RESTART / ABORT_RESTART. All open controlled windows must acknowledge a successful save before promotion. In-progress execution, text composition or failed storage cancels restart. Draft source and stdin use their existing durable storage; per-tab session snapshots preserve current output, open disclosures, lesson hash and scroll. The workbench's revision-checked IndexedDB database remains separate. An unsaved workbench file blocks restart until saved or exported.

## Runner files versus learner errors

Missing, failed, corrupt or incompatible runtime downloads are infrastructure failures, not incorrect C++. Keep the last genuine program output and its provenance. Show a persistent modal **Code runner files could not be loaded**, with a dimmed background, a primary **Reload lesson** and **Stay on lesson**. Explain that reloading needs an online connection, saves work first and does not automatically execute the code. Escape stays on the lesson. Return focus to the originating control. Keep detailed download diagnostics optional and retain an inline recovery action after the modal closes.

Before reload, save source, stdin and per-tab result state. If storage fails, show the failure inside the dialog and keep the current page open. Do not replace the last genuine result with a network error. Compiler diagnostics and program failures stay next to the editor, without this modal; a valid edit producing different output is not a failed original-example check.

## Required journeys

Test first visit without a compiler download; complete save followed by real offline navigation and compilation; warm use between lessons; fresh offline tab; interruption/cancel/resume; an update with an older complete copy; restart with drafts/results/completion and the saved workbench file; two tabs and a busy or storage-blocked tab; missing runtime asset versus invalid C++; return online; removal of offline files; and older open tabs after deployment. Verify that status text, primary action and actual cache state agree.

Browser storage can be cleared or evicted by the browser or device. Request persistent storage when saving where supported; never promise immunity from eviction. Verify readiness immediately before a learner relies on it.
