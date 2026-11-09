# Runtime provenance

The published site uses only static local assets. The compiler is loaded on demand; normal reading does not download the toolchain.

| Component | Source | License / notes |
| --- | --- | --- |
| Clang 22.1.8 / LLD 22.1.8 Wasm binaries | [wasm-clang-runtime v0.1.0](https://github.com/cppstudio-io/wasm-clang-runtime/releases/tag/v0.1.0) | LLVM Apache-2.0 with LLVM exception; exact SHA-256 checked by preparation script |
| JavaScript bridge and memfs | [CppStudio commit df1180d](https://github.com/cppstudio-io/wasm-clang-runtime/tree/df1180d80184733c6a01599f76b92b4001d20f87) | Apache-2.0; derived from binji/wasm-clang; original notices retained |
| stb_sprintf.h | Same pinned upstream tree | Sean Barrett, public domain / MIT; license text retained in source |
| SDK headers, static libraries, native memfs build toolchain | [WASI SDK 34](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-34) | LLVM and wasi-libc upstream licenses; archive hash checked |
| wasi-libc | [2e6fb9d](https://github.com/WebAssembly/wasi-libc/tree/2e6fb9d8ee0cdf9e431fbcabe8af3115de000a13) | Apache-2.0 / LLVM exception / MIT, plus included musl and cloudlibc notices |

`dist/compiler/LICENSE`, `LICENSE.llvm`, `NOTICE`, and `licenses/` accompany the generated artifact. Compiler-rt and libc++ are covered by LLVM notices. memfs source and stb_sprintf remain in `tools/runtime/` so the published runtime can be rebuilt.

The bridge originally assumes the old ABI in several places. This release uses a freshly rebuilt WASIp1 memfs, upstream modern-stat and writable-seek compatibility, and course changes for UTF-8 input/output and USTAR prefixes. The exception compiler path explicitly enables Wasm EH, standard exception instructions, and libunwind. Both custom throws and standard-library throws are exercised in the browser.

`tools/prepare_toolchain.py` writes `dist/compiler/toolchain.json` with asset sizes and hashes into the Pages artifact. It is generated for each build and is not checked into Git. `tools/pack_toolchain.py` includes only WASIp1 static libraries and the required headers. Exception handling is required for these lessons.
