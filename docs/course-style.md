# Shared course style in C++ Foundry

The [shared course design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md) is the standard for layout, typography, icons, references, completion and navigation. Do not maintain a competing copy here.

Foundry assumes no programming background. Its introduction, first greeting and native-terminal distinctions stay specific to that audience. The homepage illustration follows source → compiler → running program → output. It sits beside the introduction above 900 px and beneath the introduction and Start link below that width. Check both sides of the breakpoint, phone sizes and both themes.

The header offers Code runner, App status and theme. Existing Course and Workbench links remain available. Lessons put the course control and location together, retain essential instructions, a saved optional prediction and the complete program, and end with optional references, reversible completion and previous/next cards. Existing lesson IDs, local-storage namespaces and IndexedDB databases remain unchanged.

The course outline has 270 lessons. Its part selector limits the visible chapter list; this avoids putting all 270 links above the lesson. Completion is an explicit learner decision, independent of compiler success or understanding-question feedback.

References identify operations present in the example and explain what to inspect. External references require internet access. Native investigations require a separate compatible C++20 toolchain. No GPU simulator is involved in this course.

Typography uses locally bundled IBM Plex Sans and IBM Plex Mono with their OFL licences. Functional resource icons use Google's official Material Symbols Rounded, bundled with the Apache 2.0 licence.

## Review and verification

Follow instructions as a beginner: first run, stated edit, named output, understanding question, completion, next lesson. Verify warm runner reuse, stop/retry, ordinary compiler diagnostics, runtime-load recovery and saved work. Test 320–1440 px, both themes and keyboard focus. Functional success does not establish learning effectiveness.

The Foundry now uses the [focused lab-series hub](lab-series.md): numbered lab cards, scoped progress and stable lesson links.


## Foundry navigation

Use Course → Part → Chapter → Lesson. See the [navigation review](navigation-review.md)
for reading order, learner actions, compatibility and verification.
