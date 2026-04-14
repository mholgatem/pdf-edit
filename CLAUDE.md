# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A standalone, static browser-based PDF editor hosted on GitHub Pages. No build step, no server, no framework — pure HTML/CSS/JS served as static files.

**Two features only:**
1. Combine multiple PDFs into one
2. Split a single PDF into multiple PDFs (user selects which pages go into each output file)

## Deployment

Hosted on GitHub Pages as a static site. The entry point is `index.html` at the repo root. To preview locally, use any static file server — for example:

```bash
npx serve .
# or
python -m http.server 8080
```

There is no build, lint, or test pipeline.

## Architecture

Single-page application with no dependencies beyond a PDF manipulation library loaded via CDN. The two features (combine, split) are implemented as distinct UI panels within one page.

**PDF library:** Use [pdf-lib](https://pdf-lib.js.org/) (`https://unpkg.com/pdf-lib/dist/pdf-lib.min.js`) for all PDF read/write operations. It runs entirely in the browser with no server calls. For rendering PDF page previews (thumbnails), use [PDF.js](https://mozilla.github.io/pdf.js/) (`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/`).

**File I/O pattern:**
- Input: `<input type="file" accept=".pdf">` — read files with `FileReader` or `file.arrayBuffer()`
- Output: trigger a download via a temporary `<a>` element with an object URL (`URL.createObjectURL(blob)`)

All PDF processing happens client-side in the main thread (no Web Workers needed at this scale).
