# C++ Foundry

[Open the course](https://snowch.github.io/cpp-foundry/#/course) · [Workbench](https://snowch.github.io/cpp-foundry/#/workbench) · [Open in Codespaces](https://codespaces.new/snowch/cpp-foundry?quickstart=1)

A modern C++20 course with **six chapters and 24 authored lessons**, ending in a working persistent record store. Each lesson includes an explanation, a complete worked program, expected output, a walkthrough, a pitfall, an understanding question with feedback, and an experiment. All readings and programs are also exported into `native/`.

| Chapter | Lessons | Focus |
| --- | ---: | --- |
| Values before pointers | 4 | Programs, numeric boundaries, owning strings/vectors, functions |
| Ownership and lifetimes | 4 | References, invariants, RAII, unique ownership and moves |
| Algorithms and generic code | 4 | Sorting/searching, maps, lazy ranges, concepts |
| Boundaries and errors | 4 | Borrowed views, complete parsing, exception guarantees, sum types |
| Build a persistent record store | 4 | Row contracts, CRUD, explicit byte formats, file ownership |
| Engineering beyond the browser | 4 | Independent checks, portability assumptions, locks, publication |

**22 examples compile and run in the browser.** The two thread investigations use a native C++20 toolchain in Codespaces or locally. Native execution commands and source links appear directly in those lessons. This is the first usable course release, not a translation of all 226 C Foundry lessons.

## Read, edit, and run

Run compiles the current source to WebAssembly in a worker, links it against real C/C++ libraries, and executes it. Standard input is preloaded text; execution reaches EOF when that text is exhausted. Stop interrupts compilation or execution. Reset restores the original worked program. Download exports your current source.

Drafts and input have independent localStorage keys per lesson. **Mark lesson as done** explicitly records reading completion; running code does not automatically complete a lesson. Completion changes reconcile across tabs. Browser storage failures retain session choices and explain how to keep a downloaded copy. Source drafts edited simultaneously in multiple tabs use the last successful localStorage write; they are not a collaborative editor.

## Workbench and record-store capstone

The Workbench contains the complete editable [C++ implementation](native/record-store.cpp). It uses owning rows, `std::map`, checked integer conversion, UTF-8 validation, explicit little-endian serialization, checked file close, and candidate-state import before commit.

```text
INSERT 1 "Ada" 90
INSERT 2 "Grace" 95
UPDATE 1 "Ada Lovelace" 99
LIST
DELETE 2
COUNT
SAVE
LOAD
```

Commands are case-sensitive and names must be quoted. IDs are positive uint32 values, scores are 0–100, and names contain 1–63 valid UTF-8 bytes without C0/C1 control characters. Capacity is 1,000 rows. Duplicate insertions and missing updates/deletes report errors. A rejected row does not modify valid state.

The program opens `people.cpf` at startup. Changes remain in memory until SAVE. SAVE writes a candidate file, checks close, and renames the candidate. LOAD validates an entire candidate table before swapping it into live state. The file contains a `CPF1` magic, a little-endian uint32 row count, then rows of uint32 ID, uint32 score, one-byte name length, and UTF-8 bytes. Decoding rejects truncation, duplicate IDs, invalid fields, excess rows, and trailing bytes.

After a successful Workbench run, its `people.cpf` is retained in IndexedDB. Reloading the page or starting a new run reopens that snapshot. Runs that trap, fail compilation, time out, or return a nonzero exit status retain the previous saved snapshot. Only the named database file is persisted; arbitrary files from edited source are temporary. A revision check prevents an older tab from overwriting a newer saved database. A rejected stale save remains downloadable for that session.

Import validates the format before replacing the current browser database. Download exports the exact bytes. Clearing site data removes local work, so keep downloaded copies of valuable files. Browser IndexedDB persistence and native rename behavior do not establish power-loss durability. The teaching store has no SQL parser, disk B-tree, WAL, or multi-client transaction system.

## Local development and native programs

```sh
npm ci
python3 tools/prepare_toolchain.py
npm run serve
# Open http://localhost:8080
```

Preparing browser assets requires **Linux x86_64, Python 3.12+, and curl**. The dev container and Pages workflow provide that build host. Preparation downloads pinned Clang/LLD binaries and an official WASI SDK, verifies their SHA-256 hashes, builds memfs, and packs an exception-enabled sysroot. Assets are generated into `dist/compiler/` and excluded from Git; they are included in the deployed Pages artifact. The first uncached setup downloads about 247 MB. Later setups reuse verified archives in `.cache/toolchain/`.

The browser site itself is a static directory; there is no application build or server compilation API. Serve `dist/` from the repository subpath or domain root. Hash routes and relative asset URLs support GitHub Pages project hosting.

```sh
make example EXAMPLE=raii
make example EXAMPLE=threads
make record-store
# Native record-store commands arrive through stdin; Ctrl-D ends input on Unix.
```

`make example` runs in a temporary directory. `make record-store` runs in the current directory and retains `people.cpf` there. Native file replacement follows the host’s rename semantics; Windows replacement behavior may require an adapter. Native files and browser IndexedDB files are independent; download/import transfers the documented CPF1 bytes. Codespaces uses your GitHub compute/storage allowance and is created only when you choose to launch it.

## Verify and publish

```sh
npm run export             # regenerate native examples/readings and browser capstone source
npm run test:native        # all 24 examples and record-store contracts, strict C++20
npx playwright install chromium
npm test                   # real browser compiler and interface checks
```

Tests use Playwright’s installed Chromium or `/usr/bin/chromium`; set `CHROMIUM_PATH` to override it. Native checks use `g++` by default; set `CXX` to another compiler. The browser suite serves the site under `/cpp-foundry/` to exercise Pages-relative paths.

The compiler suite executes every browser example with exact output checks, plus compiler diagnostics, nonzero exits, UTF-8 input/output, and capstone persistence, rejection, update/delete, and corrupt-file handling. Native capstone checks compare against independently specified exact bytes. Interface checks cover all lesson routes, question feedback, draft/completion persistence, tab reconciliation, compilation after network requests are blocked, Stop/recovery, database reload/download/import, stale-tab preservation, and 390/768/1024px layouts. Screenshots are produced in `test-results/` and uploaded by Actions.

`.github/workflows/pages.yml` verifies generated readings, runs native and real-browser checks, uploads `dist/`, and deploys through `actions/deploy-pages` after success. The repository’s Pages source must be **GitHub Actions**. Pushes to `main` and manual workflow runs can deploy; pull requests run checks without publishing.

## Runtime and limits

Browser compilation uses **Clang/LLD 22.1.8**, distributed by [CppStudio’s Apache-licensed wasm-clang-runtime](https://github.com/cppstudio-io/wasm-clang-runtime), with **WASI SDK 34** headers and exception-enabled static libc++/libc++abi/libunwind. These selected C++20 features and library combinations are verified by the executable suite. The first compiler use loads about **28.1 MB of gzip-compressed assets from this site**. Compilation and execution stay inside browser workers; no submitted source is sent to a compilation service. After assets load, the same worker can compile fresh edits without further requests. A complete offline reload is not provided.

The browser needs WebAssembly, workers, DecompressionStream, BigInt, and support for standard Wasm exception-handling instructions. No SharedArrayBuffer, compilation server, or cross-origin-isolation headers are required for the core examples. Current Chromium is tested. Other browsers and physical mobile devices have not been qualified.

Limits are 256 KB source, 64 KB preloaded stdin, 100 KB output, 1 MB database, a two-minute initialization/build deadline, and a five-second execution deadline. This single-file teaching editor does not provide native threads, interactive stdin, network sockets, a debugger, sanitizers, or arbitrary host-file access. Use the native toolchain for those investigations.

Upstream JavaScript/memfs sources are pinned at `df1180d80184733c6a01599f76b92b4001d20f87`. Local changes support USTAR path prefixes and UTF-8 argv/stdin/output with streaming decoding. Existing upstream WASI/file compatibility fixes are retained. Third-party notices and licenses are served in [`dist/compiler/`](dist/compiler/); see [runtime provenance](docs/runtime.md).

Finite successful tests establish the demonstrated behaviors, not complete C++20 conformance, absence of undefined behavior for every edited program, race freedom for arbitrary extensions, or production database reliability.
