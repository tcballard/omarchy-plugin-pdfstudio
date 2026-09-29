# Verification — 29 September 2026

Development preview 0.1.0-dev. Tested with Node.js 24.19.0 on Linux in the build
workspace. Source contract inspected against Omarchy quattro commit
`b421b1b479ee9ea0863792282eee4ffeb50923dc`; this is not a live Omarchy test.

Passed:

- `npm ci` with the committed lockfile and `.npmrc` settings.
- `./tests/run`: manifest validation, strict TypeScript typecheck, thirty-two Node tests
  covering decimal rounding, invalid input, draft number/revision/corruption rules,
  real PDF rendering, stdin helper new/save/list/preview from a different cwd,
  and the distributed renderer with no source, node_modules, npm or tsx available.
  Hardening regressions cover oversized unterminated byte streams (including
  multibyte text), unknown-field removal, paged summaries and on-demand loading,
  storage size/count limits without data replacement, editing at the count limit,
  concurrent writers, old empty lock files and SIGKILL recovery.
  The follow-up pass adds response byte/error caps, encoded PDF file URLs, and
  execution of the actual InvoicePanel.qml JavaScript functions with stubbed Process,
  Timer and ListModel interfaces. Panel regressions cover both completion orders,
  nonzero/crashed exits, malformed and incomplete replies, timeout/late output,
  queued-action serialization, failed discard-and-load, host hide during save,
  and discard/cancel behavior. These JavaScript stubs do not verify Qt focus or host IPC.
- `python3 tests/qml-popup.py` with Qt/PySide6 6.8.3: the actual Qt controls load
  without QML warnings, the modal popup takes focus, Tab stays inside it, Ctrl+S
  cannot bypass confirmation, and Escape cancels without losing edits. This
  caught a popup shortcut-scope bug missed by the JavaScript tests. CI runs this
  offscreen check with PySide6-Essentials; Quickshell and Wayland remain stubbed.
- `npm run check:bundle`: rebuilt output exactly matches committed assets and
  the source/lockfile hashes. The check is now part of `./tests/run`.
- Earlier packaging pass: a clean checkout at a different filesystem path
  passed `npm ci` and `./tests/run` with the committed bundle unchanged.
- `npm audit --json`: zero reported vulnerabilities after pinning esbuild 0.28.2.
- Toolkit `validate_plugin.py --json --security` on tracked release files:
  manifest valid; advisory capability review is not security certification.
- Qt 6.8 `qmlformat -n Panel.qml`: QML syntax accepted. This does not resolve or
  validate Quickshell/Omarchy imports and runtime bindings.
- Fictional three-line invoice: exported PDF text and rendered page visually
  inspected. Embedded DejaVu fonts corrected the original standard-font spacing.
- 31-line document: seven pages; `pdftotext` retains every item and GBP 836.63 total.

Designer extension checks:

- Four backend tests cover all starting templates, schema/content limits,
  unsafe image references, revision conflicts, template copies, separate invoice
  storage, locks/corruption, local image copies and changed asset detection.
- The shipped designer runs in a temporary directory with only `dist/` and fonts,
  without node_modules or source. It saves/reopens templates and renders all eight
  block types with sans/serif/mono fonts. Poppler verifies two-page pagination,
  text from both columns and the table, and the requested second-page PNG.
- Four additional state tests execute Designer.qml functions: coalesced undo,
  reordering, undo after save, helper completion ordering, failed replacement,
  crash/timeout handling, save-before-switch, host hide and undoable image import.
- `python tests/qml-popup.py --designer` creates all eight blocks using the actual
  Qt controls, types into a TextArea, edits a table cell, exercises undo/redo and
  repeats the popup keyboard checks. No QML warnings remain. This caught and
  fixed a selected-block binding loop. Host imports, Process and the window
  surface are stubbed; this is not a screenshot or test of Omarchy itself.
- A fictional landscape brochure was rendered and visually inspected for serif
  typography, margins, colour and two-column flow.
- CI installs Poppler for the portable preview tests. Six bundled font files and
  their licence are included in the reproducible build's source hashes.

Not run: Omarchy's installed validator, live discovery/enablement, actual panel
controls, focus, Escape/close, repeated summon/hide, multi-monitor placement,
reload, fresh plugin installation/removal and the platform PDF viewer action.

The previous CI mismatch was caused by building with locally installed esbuild
0.28.2 while the lockfile pinned 0.28.0. The build now checks the installed esbuild
version against the lockfile and records its version in the asset manifest.
Save locking uses `/usr/bin/flock` from util-linux, without invoking a shell;
its persistent lock file must not be deleted. No npm setup is needed at runtime.

Before release, install on the target machine and exercise those paths. Check
Previous/Next with over 50 drafts and opening a saved draft after unsaved edits.
Verify the save/discard/cancel popup traps keyboard input, Escape cancels it,
Ctrl+S cannot bypass it, and a missing Node executable produces a retryable error.
Draft writes now fsync the temporary file before rename and the containing
folder afterward; sudden power loss has not been simulated.
Save a
draft, restart the shell and confirm restoration. Verify invalid prices, an
unwritable data directory, a missing Node runtime and a PDF render failure show
useful errors. Compare output in the target PDF viewer. Capture an actual panel
screenshot only after those checks; preview.png is exported PDF output.

This development source is published in `tcballard/omarchy-plugin-pdfstudio`.
No release or marketplace submission has been performed.

For the designer's live test, import a local PNG and JPEG through the native file
picker, edit and reorder blocks, refresh each page, export and compare the PDF.
Save a template, use it twice, and verify each document remains independent.
Test Save / Discard / Cancel when switching to Invoices and back, restore saved
documents after a shell restart, and check the horizontal scroll on a small screen.
Inline preview is optional; verify the external-viewer fallback without Poppler.

Free-layout extension:

- Three backend tests verify geometry bounds, finite coordinates and page IDs;
  saved templates preserve geometry and layer order; real PDFs preserve absolute
  text coordinates, blank pages, clipping and overlapping red/blue layers. Raster
  pixels confirm content outside the text frame stays blank. A 40-row table in a
  short frame does not create unintended pages.
- Two editor-state tests cover conversion and undo, geometry clamping after page
  changes, nudging, copying, page removal and selected layer ordering.
- `python tests/qml-popup.py --designer --free` sends actual mouse press/move/release
  events to move and resize a block, undoes/redoes the gesture, nudges by keyboard
  and drags with zoom and snapping enabled. It also runs the modal keyboard checks.
  The offscreen run emits no QML warnings. Quickshell/Wayland remain stubbed.
- Free layout uses schema 2. Existing flow documents remain schema 1. Downgrading
  to a designer without schema-2 support fails closed for the document collection.

On-device follow-up: drag and resize with mouse/touchpad at fit and zoomed scales,
scroll to page edges, check snapping, select overlapping layers, move blocks across
pages, save/reopen a template, and compare Refresh against the exported PDF. Check
that a host hide during a drag cancels the unfinished gesture without losing earlier
edits. Canvas text is a Qt approximation; the rendered PDF is the export reference.
