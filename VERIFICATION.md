# Verification — 29 September 2026

Development preview 0.1.0-dev. Tested with Node.js 24.19.0 on Linux in the build
workspace. Source contract inspected against Omarchy quattro commit
`b421b1b479ee9ea0863792282eee4ffeb50923dc`; this is not a live Omarchy test.

Passed:

- `npm ci` with the committed lockfile and `.npmrc` settings.
- `./tests/run`: manifest validation, strict TypeScript typecheck, twelve Node tests
  covering decimal rounding, invalid input, draft number/revision/corruption rules,
  real PDF rendering, stdin helper new/save/list/preview from a different cwd,
  and the distributed renderer with no source, node_modules, npm or tsx available.
  Hardening regressions cover oversized unterminated byte streams (including
  multibyte text), unknown-field removal, paged summaries and on-demand loading,
  storage size/count limits without data replacement, editing at the count limit,
  concurrent writers, old empty lock files and SIGKILL recovery.
- `npm run check:bundle`: rebuilt output exactly matches committed assets and
  the source/lockfile hashes. The check is now part of `./tests/run`.
- Clean checkout at a different filesystem path: `npm ci` followed by
  `./tests/run` passes with the committed bundle unchanged.
- `npm audit --json`: zero reported vulnerabilities after pinning esbuild 0.28.2.
- Toolkit `validate_plugin.py --json --security` on tracked release files:
  manifest valid; advisory capability review is not security certification.
- Qt 6.8 `qmlformat -n Panel.qml`: QML syntax accepted. This does not resolve or
  validate Quickshell/Omarchy imports and runtime bindings.
- Fictional three-line invoice: exported PDF text and rendered page visually
  inspected. Embedded DejaVu fonts corrected the original standard-font spacing.
- 31-line document: seven pages; `pdftotext` retains every item and GBP 836.63 total.

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
Save a
draft, restart the shell and confirm restoration. Verify invalid prices, an
unwritable data directory, a missing Node runtime and a PDF render failure show
useful errors. Compare output in the target PDF viewer. Capture an actual panel
screenshot only after those checks; preview.png is exported PDF output.

This development source is published in `tcballard/omarchy-plugin-pdfstudio`.
No release or marketplace submission has been performed.
