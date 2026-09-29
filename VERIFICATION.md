# Verification — 29 September 2026

Development preview 0.1.0-dev. Tested with Node.js 24.19.0 on Linux in the build
workspace. Source contract inspected against Omarchy quattro commit
`b421b1b479ee9ea0863792282eee4ffeb50923dc`; this is not a live Omarchy test.

Passed:

- `npm ci` with the committed lockfile and `.npmrc` settings.
- `./tests/run`: manifest validation, strict TypeScript typecheck, five Node tests
  covering decimal rounding, invalid input, draft number/revision/corruption rules,
  real PDF rendering, and stdin helper new/save/list/preview from a different cwd.
- Toolkit `validate_plugin.py .`: valid, including the installed dependency tree.
- Qt 6.8 `qmlformat -n Panel.qml`: QML syntax accepted. This does not resolve or
  validate Quickshell/Omarchy imports and runtime bindings.
- Fictional three-line invoice: exported PDF text and rendered page visually
  inspected. Embedded DejaVu fonts corrected the original standard-font spacing.
- 31-line document: seven pages; `pdftotext` retains every item and GBP 836.63 total.

Not run: Omarchy's installed validator, live discovery/enablement, actual panel
controls, focus, Escape/close, repeated summon/hide, multi-monitor placement,
reload, fresh plugin installation/removal and the platform PDF viewer action.

Before release, install on the target machine and exercise those paths. Save a
draft, restart the shell and confirm restoration. Verify invalid prices, an
unwritable data directory, missing node_modules and a PDF render failure show
useful errors. Compare output in the target PDF viewer. Capture an actual panel
screenshot only after those checks; preview.png is exported PDF output.

This development source is published in `tcballard/omarchy-plugin-pdfstudio`.
No release or marketplace submission has been performed.
