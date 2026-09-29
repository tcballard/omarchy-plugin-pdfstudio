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
- Dependencies: Node.js 22+ and default PDF viewer. React, Forme, WASM and fonts
  ship in the repository. npm is used only by developers and CI to rebuild;
  install, update and rendering do not run a package manager or fetch assets.
- Distribution: readable ESM bundle plus Forme CJS/WASM in `dist/`, with upstream
  licences and source/asset SHA-256 hashes. CI rejects stale output and verifies
  operation without node_modules, npm or tsx. Node itself remains a host runtime.
- Boundary: invoice content is JSON sent over stdin, not executable templates or
  command-line arguments. No arbitrary user font/image/template URLs are accepted.
- Limits: 100 lines, bounded text/decimals, 256 KiB helper request, 45s operation
  timeout. Currency restricted to GBP/EUR/USD. One manually chosen tax rate.
- Storage: private files/directories, atomic replacement, exclusive write lock,
  revision comparison, unique invoice numbers and non-overwriting PDF export.
- Failures: invalid input, missing renderer, storage error, concurrent edit and
  rendering failure are shown as errors. Existing data is preserved on corruption.
- Close: visible close/Escape prompts for unsaved edits. Host hide releases focus
  and keeps memory; shell restart loses unsaved edits. Saved drafts survive removal.
- Deferred: customer book, logos, quotes, status ledger, in-panel PDF preview,
  marketplace publication.
