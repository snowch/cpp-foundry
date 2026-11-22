# Shared browser C++ runner

`dist/course-controls.mjs` owns one compiler worker per reading window. Hash navigation keeps the worker's compiled Wasm modules and sysroot bytes warm. Each run creates an isolated memfs, so lesson files and a previous run's database do not leak into another program. The capstone receives only its explicit saved `people.cpf` bytes. Tabs do not share an executing worker.

The header shows Stopped, Starting, Compiling, Linking, Running, Ready or a failed startup. Start runner prepares the toolchain without executing learner code. Free memory terminates the worker. Run starts it automatically if necessary. The default idle timeout is 30 minutes; learners may select 5, 15, 30 or 60 minutes. The preference is saved. Idle time uses wall-clock elapsed time and is checked on return from a suspended tab. Never stop a currently executing run merely because an idle deadline elapsed.

The first implicit start explains local CPU/memory use before work begins. An explicit start from the header acknowledges that explanation so Run does not repeat it. The notice is a persistent native modal, with a dimmed background and keyboard dismissal; it does not arrive after execution or disappear on a timer. Settings remain accessible in the header.

Loading/building has a two-minute deadline; program execution has a separate five-second deadline. Stop interrupts the worker, keeps source, stdin, previous output and the saved database, then permits a clean run. Ordinary compiler failures keep the warm compiled modules. Runtime download failures discard poisoned asset promises and use the shared recovery dialog. See [offline/update recovery](offline-update-design.md).

A ready worker reserves memory but is not continuously compiling. Do not display whole-tab JavaScript heap as Wasm memory, or fabricated per-worker CPU percentages. The browser API cannot reliably report a portable total. Explain this in optional settings rather than adding noisy numbers to the lesson.
