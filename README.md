<h1 align="center">PDF Studio</h1>

<p align="center">
  <a href="https://github.com/tcballard/omarchy-badges"><img src="https://raw.githubusercontent.com/tcballard/omarchy-badges/75975e5b5bf75e7ede3764bcd2950046f7abfe2c/badges/v1/omarchy-plugin.svg" alt="Built for Omarchy: Plugin" height="24"></a>
</p>

<p align="center"><strong>Create an invoice. Save the draft. Export the PDF.</strong></p>

PDF Studio brings invoice creation to an Omarchy panel. Add your business and customer details, enter line items, and export an A4 invoice with calculated totals. Drafts and PDFs stay on your machine, with no account or subscription required.

**Development preview:** PDF generation and draft storage are tested; the panel still needs live Omarchy testing. [Install and setup](#try-the-development-checkout).

*Panel screenshot pending an on-device capture.* [View a sample invoice](demo/sample-invoice.pdf) generated with pdfcn and Forme.

## What works in this build

- Business/customer details, invoice dates, payment details and notes.
- Editable line items, fractional quantities, GBP/EUR/USD and a single tax rate.
- Exact decimal arithmetic: each line rounds half-up to cents/pence, then tax
  rounds half-up on the subtotal. No tax-inclusive pricing or mixed rates yet.
- Save/reopen drafts, automatically allocated invoice numbers and collision checks.
- PDF preview via your default PDF viewer, and export to `~/Documents/PDF Studio`.
- Embedded fonts and local rendering; no account, API key, daemon or document upload.

The first template is a simple A4 invoice. Preview/export saves changes first.
The Calculate total button validates the current amounts. PDF output uses
conservative five-line sections and supports documents with up to 100 line items.
Business/customer addresses, notes and payment fields accept up to 500 characters;
line descriptions accept 200. GBP, EUR and USD use two decimal places.

## Try the development checkout

Requirements: Omarchy Quattro, Node.js 22+, Git and a PDF viewer. Current Omarchy
installs configure Node.js through Mise; it must be available to the shell.

```bash
omarchy plugin add https://github.com/tcballard/omarchy-plugin-pdfstudio.git --enable
omarchy-shell shell summon io.github.tcballard.pdf-studio '{}'
```

The ready-to-run renderer, React/Forme dependencies, WebAssembly engine and fonts
ship in the repository. **No npm install, build step or first-run download is
needed.** Rendering works offline. The Node.js runtime itself is not bundled.
The helper starts on demand and exits after one JSON request.

Use Save draft before restarting or disabling the shell. Close/Escape offers
Save, Discard or Cancel. A host hide retains the draft in memory via `keepLoaded`;
only an explicit save persists it across a shell restart. After updating, restart the shell if the kept panel has already loaded the
previous code. The updated renderer is included in the plugin update.

## Data and removal

Drafts live in `$XDG_DATA_HOME/omarchy-pdf-studio/drafts.json` (normally
`~/.local/share/omarchy-pdf-studio`). Writes use a lock and atomic file replacement;
stale revisions and duplicate numbers are rejected. This is local draft storage,
not an accounting ledger. Exporting does not issue, send or mark an invoice paid.

Preview PDFs are in `$XDG_CACHE_HOME/omarchy-pdf-studio` (normally
`~/.cache/omarchy-pdf-studio`). Exports receive unique filenames and never overwrite
an existing PDF. Files are private to your user. Preview cache files remain until
you clear them. Removing the plugin preserves all drafts and exported documents:

```bash
omarchy plugin remove io.github.tcballard.pdf-studio
```

If a process crashes during a save and leaves `write.lock`, first verify no helper
is running, back up the data directory, then remove that lock. Corrupt data fails
closed and is never replaced with an empty list.

## Development and evidence

```bash
npm ci
npm run build
./tests/run
node --import tsx scripts/render-demo.ts /tmp/sample-invoice.pdf
```

npm is for development only. `npm run build` creates the committed `dist/`
renderer using the lockfile. `./tests/run` checks the generated bundle matches
its source, then tests the renderer with only the shipped runtime files present.
`dist/manifest.json` records source and asset hashes; third-party notices ship
alongside the bundle. Commit rebuilt `dist/` files with renderer changes.

See [DESIGN.md](DESIGN.md) for boundaries and [VERIFICATION.md](VERIFICATION.md)
for exact evidence and live checks still required. Preview PDFs are examples of
renderer output, not screenshots of a running Omarchy panel.

Still to build: reusable customer/business profiles, logos, additional templates,
quotes, duplication, richer invoice status and in-panel PDF preview. The current
panel is an invoice-first vertical slice.

MIT; vendored pdfcn code retains its MIT notice under `renderer/PDFCN-LICENSE`.
Bundled DejaVu fonts retain their licence under `renderer/fonts/LICENSE`.
Recommended repository topics: `omarchy`, `omarchy-plugin`, `pdf`, `invoicing`.
