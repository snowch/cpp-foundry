# UX review


## Focused lab hubs — 2026-11-23

The previous entry page exposed the full curriculum before learners could choose a manageable sequence. The hub now offers 10 numbered labs containing the existing 270 lessons. Each lab has its own URL, prerequisite, progress, direct Start / Continue / Review and lesson list. Lesson routes, drafts and completion keys retain their existing identities. First and last lesson navigation returns to the lab.

Reading order is compact introduction → primary resume → lab choices → optional illustration on narrow screens. On wide screens the illustration sits beside the introduction. The lab list uses one/two/three columns at 390/820/1440 px; theme surfaces and keyboard focus use the shared design tokens. The reusable decision checks cover unfinished resume, advancing after completion, earlier gaps and review. Browser checks exercise actual completion controls, reload, Back/Forward and zero automatic runtime starts. Existing real compiler/offline/saved-work suites provide separate execution evidence. None of these checks establishes learning effectiveness.


## Foundry navigation

Use Course → Part → Chapter → Lesson. See the [navigation review](navigation-review.md)
for reading order, learner actions, compatibility and verification.


## Visual opportunities, 25 November 2026

See [the whole-course visual review](visual-opportunities.md) and its source-pinned lesson records. This pass adds source-specific models as well as revising existing diagrams; the model renderer has no runner, navigation, draft or completion side effects.

## Shared header icon controls

UX and learning-design review: compact Material 3 theme/offline actions replace header text controls; 48px targets, action labels, tooltips and focus outlines preserve discoverability and keyboard access. Existing native theme handlers, offline verification, saved work, runner controls and subject-specific links remain authoritative. The saved badge requires a verified current offline copy; an update dot identifies an offered update. Go keeps a status icon because it offers no complete offline copy. No lesson sequence, teaching claims or prerequisites change. Review phone/tablet/desktop, both themes, keyboard, storage denial and the real save/update state transitions. Functional evidence is recorded with the change; it does not establish learning effectiveness.

Validation: all 270 lesson routes, responsive light/dark layouts, keyboard controls, real offline compilation, Stop/recovery and exact-byte import/export passed. The A→B update journey passed with two tabs, blocked-storage veto and preserved code, prediction, results and completion. Course-part navigation checks passed.


## Visible header labels (2026-11-26)

UX and learning-design review: retain the Material symbols and add visible
**Offline** and **Theme** labels so touch users can identify the actions without
a tooltip. The Code runner name and state, subject-specific tools, native theme
preferences and verified offline/update badges remain. Controls fit their text,
use at least 48px touch targets, and wrap on narrow screens rather than hiding
labels. No execution, lesson instructions, progress or saved-work contract changes.
The shared [course design guide](https://github.com/snowch/cuda-python-lab/blob/main/docs/course-design-guide.md#theme-and-offline-icons)
records this rule. Validation covers the built header at 320, 390, 820 and 1440px
in both themes, keyboard focus, modal opening/Escape, persistence and project-local
asset requests. Functional checks do not establish learning effectiveness.
