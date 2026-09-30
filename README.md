<h1 align="center">PDF Studio</h1>

<p align="center">
  <a href="https://github.com/tcballard/omarchy-badges"><img src="https://raw.githubusercontent.com/tcballard/omarchy-badges/75975e5b5bf75e7ede3764bcd2950046f7abfe2c/badges/v1/omarchy-plugin.svg" alt="Built for Omarchy: Plugin" height="24"></a>
</p>

<p align="center"><strong>Start with a blank page. Make it yours. Export the PDF.</strong></p>

PDF Studio brings document design to an Omarchy panel. Arrange text, images, tables and columns, choose your typography and page settings, and export a PDF. Start from scratch or reuse a template for letters, reports and brochures. The invoice editor remains one click away. Documents stay on your machine, with no account or subscription required.

**Development preview:** PDF generation, storage and offscreen Qt editing are tested; the panel still needs live Omarchy testing. [Install and setup](#try-the-development-checkout).

*Panel screenshot pending an on-device capture.* [View a sample invoice](demo/sample-invoice.pdf) generated with pdfcn and Forme.

## What works in this build

- A native document designer with a page workspace, optional layers and contextual controls.
- Headings, text, PNG/JPEG images, tables, dividers, spacers, two text columns and page breaks.
- Reorder, duplicate and remove blocks; undo/redo up to 30 changes.
- Free layout: drag and resize blocks anywhere on a page, with layers, snapping,
  zoom, keyboard nudging and exact position/size controls.
- Sans, serif and monospace fonts; size, bold, colour, alignment and spacing.
- A4/Letter pages, portrait/landscape orientation, margins and background colour.
- Blank, letter, report and brochure starters, plus your own reusable templates.
- Save/reopen documents; refresh the preview, browse pages and export to `~/Documents/PDF Studio`.
- The original invoice editor, including fractional quantities, GBP/EUR/USD,
  automatic numbering, calculated totals and a single tax rate.
- Embedded fonts and local rendering; no account, API key, daemon or document upload.

## Design a document

Open PDF Studio and use **File** to start a document, or **+ Insert** to add
content to the blank page. **Layers** shows the block list; select a block there
or on the free canvas to edit it in **Content**. Use the layer arrows to change
its order. New blank documents start in **Free layout**, ready to drag and resize.
Letter, report and brochure presets use **Flow layout**, where text continues
onto new pages. Switch modes in **Page setup**. Nested layouts are not supported yet.
Two-column blocks contain two editable text areas. Tables support up to 40 rows
and six columns, with an optional repeated header row.

In **Free layout**, drag a block to move it and drag its lower-right handle to
resize it. **Position & size…** provides X, Y, width, height and page controls in points
(72 pt = one inch), measured from the top-left of the page. **Snap 8 pt** enables
grid snapping; the zoom selector enlarges the canvas with scrollbars. With canvas
focus, arrow keys move the selected block by 1 pt, or 10 pt with Shift. Ctrl+Z
undoes and Ctrl+Shift+Z redoes; each drag or resize is one undo step. Delete removes
the selected block and Ctrl+D duplicates it while the canvas has focus. **Fit width**
makes content readable while you scroll; **Fit page** shows the complete page.

The layer list runs back to front. **To back / To front** changes which block
covers another. Use **+ Page** for another page, and the block's Page control to
move it between pages. Empty pages can be removed; documents support 50 explicit
pages. Margins are visual guides in free layout, so content can reach the edges.
Images fit within their frames while retaining their proportions.

**Content outside a free-layout frame is clipped in the PDF.** Resize the frame
or shorten the content if needed. The canvas uses Qt text layout as an editing
guide; **Preview PDF / Update preview** shows the exact exported PDF, including font metrics and table
layout. Use **Edit canvas / Show PDF** to switch views. Export always uses the
current coordinates, even if the preview is stale.

Converting an existing flowing document creates an initial arrangement of frames;
check their sizes before exporting. Page-break blocks become explicit pages.
Switching back to Flow orders blocks by page and position and removes their
frames. Either conversion can be undone. Free-layout documents use format version
2 so older designer builds reject them rather than silently erase positioning;
existing version-1 flow documents continue to work.

Choose **Preview PDF / Update preview** to see the actual rendered PDF. The preview is marked stale
after edits; updating it is explicit. **Export PDF** uses the current editor contents
and displays the exported PDF in the editor. If the page image cannot be generated
or loaded, the editor shows an error and keeps **Open PDF** available.
Saving the editable document is a separate action: preview/export does not save
it. **File → Save as template** creates a reusable copy; choosing that template starts
a new document without changing the original. Close, switching editors and
opening another document offer Save / Discard / Cancel when there are edits.

Images are copied into local storage when imported. PNG and JPEG files are
supported up to 4 MiB and 12 megapixels each, with at most eight images per
document. Each document supports 80 blocks and 128 KiB of content; text areas
accept up to 4,000 characters and table cells up to 300. Colour fields use
`#RRGGBB`. The helper reports invalid values without discarding your edits.

Choose **File → Invoice editor** for the dedicated invoice form. Invoice preview/export saves
its draft first, then displays the result in the **PDF preview** tab. Use
**Invoice details** to return to editing, or **Open PDF** for your external viewer.
Addresses, payment details and notes accept multiple lines. Each line rounds half-up to cents/pence, then tax rounds half-up
on the subtotal. No tax-inclusive pricing or mixed rates yet. Invoices support
100 line items; business/customer addresses, notes and payment fields accept
500 characters, and line descriptions accept 200.

## Try the development checkout

Requirements: Omarchy Quattro, Node.js 22+, Git, util-linux (`/usr/bin/flock`) and a PDF viewer.
Inline PDF previews also need Poppler (`/usr/bin/pdfinfo` and
`/usr/bin/pdftoppm`) and coreutils (`/usr/bin/timeout`). Without Poppler, the PDF
still renders and can be opened in your viewer. On Arch, install it with `sudo pacman -S poppler`. Current Omarchy
installs configure Node.js through Mise; it must be available to the shell.

```bash
omarchy plugin add https://github.com/tcballard/omarchy-plugin-pdfstudio.git --enable
omarchy-shell shell summon io.github.tcballard.pdf-studio '{}'
```

The ready-to-run renderer, React/Forme dependencies, WebAssembly engine and fonts
ship in the repository. **No npm install, build step or first-run download is
needed.** Rendering works offline. The Node.js runtime itself is not bundled.
The helper starts on demand and exits after one JSON request.

Use Save (or Save draft in Invoices) before restarting or disabling the shell. Close/Escape offers
Save, Discard or Cancel. A host hide retains the draft in memory via `keepLoaded`;
only an explicit save persists it across a shell restart. After updating, restart the shell if the kept panel has already loaded the
previous code. The updated renderer is included in the plugin update.

## Data and removal

Drafts live in `$XDG_DATA_HOME/omarchy-pdf-studio/drafts.json` (normally
`~/.local/share/omarchy-pdf-studio`). Writes use a lock and atomic file replacement;
stale revisions and duplicate numbers are rejected. This is local draft storage,
not an accounting ledger. Exporting does not issue, send or mark an invoice paid.

Designer documents and templates live in `designs.json` beside the invoice store,
and imported images live in `assets/`. Invoice data is not migrated or changed by
the designer. The designer store supports 128 documents/templates and 16 MiB;
the image library supports 128 images and 128 MiB. Save/import operations use
separate persistent `designs.lock` and `assets.lock` files. Back up the entire
data directory to preserve editable documents and their images. There is no
in-panel document/template deletion or image cleanup yet.

Preview PDFs and PNGs are in `$XDG_CACHE_HOME/omarchy-pdf-studio` (normally
`~/.cache/omarchy-pdf-studio`). Exports receive unique filenames and never overwrite
an existing PDF. Files are private to your user. Preview cache files remain until
you clear them. Removing the plugin preserves all drafts and exported documents:

```bash
omarchy plugin remove io.github.tcballard.pdf-studio
```

The operating system releases save locks after a helper exits or crashes. The
`write.lock` file stays in place and should not be removed. Corrupt or oversized
data fails closed and is never replaced with an empty list. Storage supports up
to 1,000 drafts and 16 MiB; existing drafts can still be edited at the count limit.
The draft picker shows 50 summaries per page and loads invoice details on demand.
Requests are limited to 256 KiB before parsing, and unknown invoice fields are
removed before saving.

## Development and evidence

```bash
npm ci
# Portable tests also require Poppler (poppler-utils on Debian/Ubuntu).
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

Still to build: nested layouts, automatic live PDF preview, document/image
cleanup and reusable customer/business profiles.

MIT; vendored pdfcn code retains its MIT notice under `renderer/PDFCN-LICENSE`.
Bundled DejaVu fonts retain their licence under `renderer/fonts/LICENSE`.
Recommended repository topics: `omarchy`, `omarchy-plugin`, `pdf`, `invoicing`.
