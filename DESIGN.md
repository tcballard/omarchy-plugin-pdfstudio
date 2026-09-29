# PDF Studio — development design

- Product: one Omarchy plugin; no separate application or always-running service.
- ID: `io.github.tcballard.pdf-studio` (plugin identity; repository: `tcballard/omarchy-plugin-pdfstudio`).
- Kind: panel; `Panel.qml` is a hosted Item with open/close lifecycle.
- Invocation: shell summon/toggle; one window on the focused monitor when opened.
- Theme: Omarchy popup background/text/border and corner radius; Qt Quick controls.
- State: transient editor in the kept panel; versioned saved drafts outside shell
  configuration, owned by the helper. Explicit save, no hidden invoice issuance.
- Renderer: selected MIT pdfcn components + pinned Forme, embedded DejaVu fonts.
- Commands: Node.js for JSON helper; Qt's external URL opener for the PDF viewer.
  No shell command interpolation. No plugin install hooks or privileged actions.
- Dependencies: Node.js 22+, util-linux flock and a default PDF viewer. React, Forme, WASM and fonts
  ship in the repository. npm is used only by developers and CI to rebuild;
  install, update and rendering do not run a package manager or fetch assets.
- Distribution: readable ESM bundle plus Forme CJS/WASM in `dist/`, with upstream
  licences and source/asset SHA-256 hashes. CI rejects stale output and verifies
  operation without node_modules, npm or tsx. Node itself remains a host runtime.
- Boundary: invoice content is JSON sent over stdin, not executable templates or
  command-line arguments. No arbitrary user font/image/template URLs are accepted.
- Limits: 100 lines, bounded text/decimals, 256 KiB helper request, 45s operation
  timeout, bounded helper replies and plain-text status messages. Currency restricted to GBP/EUR/USD. One manually chosen tax rate.
- Storage: private files/directories, atomic replacement, exclusive write lock,
  revision comparison, unique invoice numbers and non-overwriting PDF export.
  Draft saves flush the temporary file before replacement and its directory after.
- Panel requests: serialize work through process completion and queued follow-ups;
  require both parsed stdout and a successful normal exit before applying results.
  Failed replacements preserve edits. Host hide cancels queued navigation/rendering
  while allowing an explicit save already in progress to finish.
- Runtime failures: five-second startup and fifty-second whole-operation watchdogs;
  terminate the supervised helper on timeout and ignore its late result.
  Node preload environment variables are removed from the helper environment.
- Failures: invalid input, missing renderer, storage error, concurrent edit and
  rendering failure are shown as errors. Existing data is preserved on corruption.
- Close: visible close/Escape prompts for unsaved edits. Host hide releases focus
  and keeps memory; shell restart loses unsaved edits. Saved drafts survive removal.
- Invoice-specific work deferred: customer book, logos, quotes and status ledger.
  Marketplace publication remains pending. The general designer is described below.

## Visual document builder

The accepted next scope is a native flow-based designer: heading, text, image,
table, divider, spacer, two text columns and page-break blocks; reorder, duplicate,
undo/redo, page settings, a rendered page preview and reusable templates.
`Panel.qml` routes between the designer and the existing invoice editor. Existing
invoice storage and numbering remain intact. Designer data lives in `designs.json`
and imported PNG/JPEG assets under `assets/`, outside shell configuration.
No remote image URLs, executable templates or HTML are accepted. Images are copied
by content hash with byte/pixel limits. Preview rasterization uses Poppler's
`pdfinfo` and `pdftoppm` (optional for the inline preview; PDF export remains usable
without them). Fonts and the PDF renderer remain bundled. Preview refresh is
explicit, keeping typing responsive. Precise free-positioning is deferred.
