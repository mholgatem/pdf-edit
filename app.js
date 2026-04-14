/* ═══════════════════════════════════════════════
   PDF TOOLS — app.js
   ═══════════════════════════════════════════════ */

// ── SVG icon strings ──────────────────────────────────────────────────────────
const ICON_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN  = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const ICON_PDF  = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="pdf-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
const ICON_DRAG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5"  r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5"  r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/></svg>`;
const ICON_X    = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// ── PDF.js worker config ──────────────────────────────────────────────────────
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
function getCookie(name) {
  const entry = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
  return entry ? entry.split('=')[1] : null;
}
function setCookie(name, value) {
  document.cookie = `${name}=${value};path=/;max-age=31536000;SameSite=Lax`;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.className = theme;
  document.getElementById('theme-toggle').innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
  setCookie('theme', theme);
}
function toggleTheme() {
  applyTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
}

// ── View navigation ───────────────────────────────────────────────────────────
function showView(id) {
  ['view-landing', 'view-combine', 'view-split'].forEach(v => {
    const el = document.getElementById(v);
    el.classList.toggle('hidden', v !== id);
    el.classList.toggle('active', v === id);
  });
  const backBtn = document.getElementById('back-btn');
  backBtn.classList.toggle('hidden', id === 'view-landing');
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

// ── Progress overlay ──────────────────────────────────────────────────────────
function showLoading(title) {
  document.getElementById('loader-title').textContent = title;
  document.getElementById('loader-sub').textContent   = 'Please wait…';
  setProgress(0);
  document.getElementById('loading-overlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}
function setProgress(pct, sub) {
  const fill  = document.getElementById('progress-fill');
  const label = document.getElementById('progress-pct');
  const subEl = document.getElementById('loader-sub');
  fill.style.width   = clamp(pct, 0, 100) + '%';
  label.textContent  = Math.round(clamp(pct, 0, 100)) + '%';
  if (sub !== undefined) subEl.textContent = sub;
}

// Yield to the browser so the UI can repaint before heavy work
function tick() { return new Promise(r => setTimeout(r, 16)); }

// ── Smart combined filename ───────────────────────────────────────────────────
function smartCombinedName(files) {
  if (!files.length) return 'combined.pdf';

  // Tokenise: strip extension, split on spaces/dashes/underscores, keep words ≥3 chars
  const tokenise = name =>
    name.replace(/\.pdf$/i, '')
        .replace(/[-_]+/g, ' ')
        .split(/\s+/)
        .map(w => w.replace(/[^a-z0-9]/gi, ''))
        .filter(w => w.length >= 3)
        .map(w => w.toLowerCase());

  const allTokens = files.map(f => tokenise(f.name));

  // Intersection: words present in every file's token list
  const common = allTokens[0].filter(w => allTokens.every(t => t.includes(w)));

  if (!common.length) return 'combined.pdf';

  // Reconstruct using the casing from the first filename
  const firstWords = files[0].name
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .filter(w => w.replace(/[^a-z0-9]/gi, '').length >= 3);

  const result = firstWords
    .filter(w => common.includes(w.replace(/[^a-z0-9]/gi, '').toLowerCase()))
    .join(' ');

  return result ? `${result} combined.pdf` : 'combined.pdf';
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMBINE
// ══════════════════════════════════════════════════════════════════════════════
let combineFiles = [];   // File[]
let dragSrcIndex = null; // index of item being dragged

function setupCombine() {
  const dropzone  = document.getElementById('combine-dropzone');
  const fileInput = document.getElementById('combine-input');
  const pickBtn   = document.getElementById('combine-pick-btn');

  // Open file picker
  pickBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  // OS file drag onto dropzone
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('dz-hover'); });
  dropzone.addEventListener('dragleave', e => { if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('dz-hover'); });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dz-hover');
    const pdfs = [...e.dataTransfer.files].filter(isPDF);
    if (pdfs.length) addCombineFiles(pdfs);
  });

  fileInput.addEventListener('change', () => {
    addCombineFiles([...fileInput.files]);
    fileInput.value = '';
  });

  document.getElementById('combine-run-btn').addEventListener('click', runCombine);
}

function isPDF(file) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function addCombineFiles(files) {
  combineFiles.push(...files);
  renderCombineList();
}

function renderCombineList() {
  const list    = document.getElementById('combine-list');
  const footer  = document.getElementById('combine-footer');
  const noFiles = combineFiles.length === 0;

  footer.classList.toggle('hidden', noFiles);

  if (noFiles) { list.innerHTML = ''; return; }

  list.innerHTML = combineFiles.map((f, i) => `
    <li class="file-item" draggable="true" data-idx="${i}">
      <span class="drag-handle" aria-hidden="true">${ICON_DRAG}</span>
      ${ICON_PDF}
      <span class="item-name" title="${escHtml(f.name)}">${escHtml(f.name)}</span>
      <span class="item-size">${formatBytes(f.size)}</span>
      <button type="button" class="btn-icon btn-remove" data-rm="${i}" aria-label="Remove ${escHtml(f.name)}">${ICON_X}</button>
    </li>
  `).join('');

  // Remove buttons
  list.querySelectorAll('[data-rm]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      combineFiles.splice(+btn.dataset.rm, 1);
      renderCombineList();
    });
  });

  // Drag-to-reorder (within the list — not OS files)
  list.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrcIndex = +item.dataset.idx;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', ''); // required for Firefox
      requestAnimationFrame(() => item.classList.add('is-dragging'));
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      list.querySelectorAll('.file-item').forEach(i => i.classList.remove('drop-target'));
      dragSrcIndex = null;
    });
    item.addEventListener('dragover', e => {
      // Only handle internal reorder drags, not OS file drags
      if (dragSrcIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      list.querySelectorAll('.file-item').forEach(i => i.classList.remove('drop-target'));
      item.classList.add('drop-target');
    });
    item.addEventListener('dragleave', e => {
      if (!item.contains(e.relatedTarget)) item.classList.remove('drop-target');
    });
    item.addEventListener('drop', e => {
      if (dragSrcIndex === null) return;
      e.preventDefault();
      const targetIdx = +item.dataset.idx;
      if (dragSrcIndex === targetIdx) return;
      const [moved] = combineFiles.splice(dragSrcIndex, 1);
      combineFiles.splice(targetIdx, 0, moved);
      dragSrcIndex = null;
      renderCombineList();
    });
  });

  // Update smart filename
  document.getElementById('combine-outname').value = smartCombinedName(combineFiles);
}

async function runCombine() {
  if (combineFiles.length < 1) return;
  showLoading('Combining PDFs…');
  try {
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();

    for (let i = 0; i < combineFiles.length; i++) {
      setProgress((i / combineFiles.length) * 82, `Merging file ${i + 1} of ${combineFiles.length}…`);
      await tick();
      const buf  = await combineFiles[i].arrayBuffer();
      const doc  = await PDFDocument.load(buf);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }

    setProgress(90, 'Saving PDF…');
    await tick();
    const pdfBytes = await merged.save();

    setProgress(100, 'Done!');
    await tick();

    let fname = document.getElementById('combine-outname').value.trim() || 'combined.pdf';
    if (!fname.toLowerCase().endsWith('.pdf')) fname += '.pdf';
    triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), fname);
  } catch (err) {
    console.error(err);
    alert('Error combining PDFs: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  SPLIT
// ══════════════════════════════════════════════════════════════════════════════
let splitFile      = null;
let splitPageCount = 0;
let splits         = [];   // { id, startPage, endPage, name }
let splitNextId    = 0;

const MAX_SPLITS = 25;

function setupSplit() {
  const dropzone  = document.getElementById('split-dropzone');
  const fileInput = document.getElementById('split-input');
  const pickBtn   = document.getElementById('split-pick-btn');

  pickBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });

  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('dz-hover'); });
  dropzone.addEventListener('dragleave', e => { if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('dz-hover'); });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dz-hover');
    const file = [...e.dataTransfer.files].find(isPDF);
    if (file) loadSplitFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadSplitFile(fileInput.files[0]);
    fileInput.value = '';
  });

  document.getElementById('split-clear-btn').addEventListener('click', clearSplitFile);
  document.getElementById('split-add-btn').addEventListener('click', addSplit);
  document.getElementById('split-auto-btn').addEventListener('click', autoSplit);
  document.getElementById('split-run-btn').addEventListener('click', runSplit);
}

async function loadSplitFile(file) {
  try {
    const buf  = await file.arrayBuffer();
    const doc  = await PDFLib.PDFDocument.load(buf);
    splitPageCount = doc.getPageCount();
  } catch (err) {
    alert('Could not read PDF: ' + err.message);
    return;
  }

  splitFile = file;
  splits    = [];
  splitNextId = 0;

  document.getElementById('split-fname').textContent = file.name;
  document.getElementById('split-fmeta').textContent =
    `${splitPageCount} page${splitPageCount !== 1 ? 's' : ''} · ${formatBytes(file.size)}`;

  document.getElementById('split-dropzone').classList.add('hidden');
  document.getElementById('split-file-bar').classList.remove('hidden');
  document.getElementById('split-editor').classList.remove('hidden');

  renderSplitCards();
  addSplit(); // auto-create first split
  document.getElementById('split-auto-btn').disabled = false;
}

function clearSplitFile() {
  splitFile      = null;
  splitPageCount = 0;
  splits         = [];

  document.getElementById('split-dropzone').classList.remove('hidden');
  document.getElementById('split-file-bar').classList.add('hidden');
  document.getElementById('split-editor').classList.add('hidden');
  document.getElementById('split-auto-btn').disabled = true;
}

function defaultSplitName(startPage, endPage) {
  const base = splitFile ? splitFile.name.replace(/\.pdf$/i, '') : 'document';
  return `${base}_p${startPage}-${endPage}.pdf`;
}

function isDefaultSplitName(name, startPage, endPage) {
  // Matches the auto-generated pattern so we can auto-update it
  return /^.+_p\d+-\d+\.pdf$/i.test(name);
}

function addSplit() {
  if (splits.length >= MAX_SPLITS) return;
  const id = ++splitNextId;
  const s  = { id, startPage: 1, endPage: splitPageCount, name: '' };
  s.name   = defaultSplitName(s.startPage, s.endPage);
  splits.push(s);
  renderSplitCards();
}

function removeSplit(id) {
  splits = splits.filter(s => s.id !== id);
  renderSplitCards();
}

function renderSplitCards() {
  const container = document.getElementById('split-cards');
  const runBtn    = document.getElementById('split-run-btn');
  const addBtn    = document.getElementById('split-add-btn');

  runBtn.disabled = splits.length === 0;
  addBtn.disabled = splits.length >= MAX_SPLITS;

  container.innerHTML = splits.map((s, i) => `
    <div class="split-card" data-sid="${s.id}">
      <div class="split-badge">${i + 1}</div>

      <div class="split-field">
        <label for="sp-start-${s.id}">Start Page</label>
        <input type="number" id="sp-start-${s.id}" class="sp-start" data-sid="${s.id}"
               value="${s.startPage}" min="1" max="${splitPageCount}" autocomplete="off">
      </div>

      <div class="split-field">
        <label for="sp-end-${s.id}">End Page</label>
        <input type="number" id="sp-end-${s.id}" class="sp-end" data-sid="${s.id}"
               value="${s.endPage}" min="1" max="${splitPageCount}" autocomplete="off">
      </div>

      <div class="split-field">
        <label for="sp-name-${s.id}">Output Filename</label>
        <input type="text" id="sp-name-${s.id}" class="sp-name" data-sid="${s.id}"
               value="${escHtml(s.name)}" spellcheck="false" autocomplete="off">
      </div>

      <button type="button" class="btn-icon btn-remove" data-rm-split="${s.id}" aria-label="Remove split ${i + 1}">${ICON_X}</button>
    </div>
  `).join('');

  // Wire up inputs without full re-render (avoids losing focus)
  container.querySelectorAll('.sp-start, .sp-end').forEach(input => {
    input.addEventListener('change', () => {
      const id   = +input.dataset.sid;
      const split = splits.find(s => s.id === id);
      if (!split) return;

      const val = clamp(parseInt(input.value, 10) || 1, 1, splitPageCount);
      input.value = val;

      if (input.classList.contains('sp-start')) split.startPage = val;
      else split.endPage = val;

      // Auto-update filename if it still looks like the default pattern
      const nameInput = container.querySelector(`.sp-name[data-sid="${id}"]`);
      if (nameInput && isDefaultSplitName(nameInput.value)) {
        const newName = defaultSplitName(split.startPage, split.endPage);
        nameInput.value = newName;
        split.name = newName;
      }
    });
  });

  container.querySelectorAll('.sp-name').forEach(input => {
    input.addEventListener('input', () => {
      const split = splits.find(s => s.id === +input.dataset.sid);
      if (split) split.name = input.value;
    });
  });

  container.querySelectorAll('[data-rm-split]').forEach(btn => {
    btn.addEventListener('click', () => removeSplit(+btn.dataset.rmSplit));
  });
}

async function runSplit() {
  if (!splitFile || splits.length === 0) return;
  showLoading('Generating splits…');
  try {
    const { PDFDocument } = PDFLib;

    setProgress(5, 'Loading source PDF…');
    await tick();

    const srcBuf = await splitFile.arrayBuffer();
    const srcDoc = await PDFDocument.load(srcBuf);

    const zip = new JSZip();

    for (let i = 0; i < splits.length; i++) {
      const s   = splits[i];
      const pct = 10 + ((i + 1) / splits.length) * 70;
      setProgress(pct, `Processing split ${i + 1} of ${splits.length}…`);
      await tick();

      const outDoc = await PDFDocument.create();
      const start  = clamp(s.startPage, 1, splitPageCount) - 1; // 0-based
      const end    = clamp(s.endPage,   1, splitPageCount) - 1; // 0-based inclusive
      const indices = [];
      for (let p = start; p <= end; p++) indices.push(p);

      if (indices.length > 0) {
        const copied = await outDoc.copyPages(srcDoc, indices);
        copied.forEach(p => outDoc.addPage(p));
      }

      const pdfBytes = await outDoc.save();
      let fname = (s.name || defaultSplitName(s.startPage, s.endPage)).trim();
      if (!fname.toLowerCase().endsWith('.pdf')) fname += '.pdf';
      zip.file(fname, pdfBytes);
    }

    setProgress(84, 'Building ZIP archive…');
    await tick();

    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      meta => setProgress(84 + meta.percent * 0.15)
    );

    setProgress(100, 'Done!');
    await tick();

    const zipName = (splitFile.name.replace(/\.pdf$/i, '') || 'splits') + '_splits.zip';
    triggerDownload(zipBlob, zipName);
  } catch (err) {
    console.error(err);
    alert('Error splitting PDF: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTO SPLIT
// ══════════════════════════════════════════════════════════════════════════════

function sanitizeTitle(title) {
  return title
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

async function autoSplit() {
  if (!splitFile) return;

  if (typeof pdfjsLib === 'undefined') {
    alert('PDF.js failed to load. Check your internet connection and try again.');
    return;
  }

  showLoading('Scanning for chapters…');
  setProgress(5, 'Loading PDF…');
  await tick();

  try {
    const arrayBuffer = await splitFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Tier 1: outline/bookmarks
    setProgress(15, 'Checking PDF outline…');
    await tick();
    let chapters = await tryOutline(pdf);

    // Tier 2: text + font-size heuristic
    if (!chapters) {
      setProgress(25, 'Scanning page text…');
      await tick();
      chapters = await tryTextScan(pdf);
    }

    // Nothing found
    if (!chapters || chapters.length === 0) {
      hideLoading();
      alert(chapters === null
        ? 'No chapter text found. This may be a scanned (image-only) PDF.'
        : 'No chapter headings detected in this PDF.');
      return;
    }

    // Truncate to MAX_SPLITS
    let truncated = false;
    if (chapters.length > MAX_SPLITS) {
      chapters  = chapters.slice(0, MAX_SPLITS);
      truncated = true;
    }

    // Build splits array
    setProgress(95, 'Building splits…');
    await tick();

    splits      = [];
    splitNextId = 0;

    chapters.forEach((ch, i) => {
      const startPage = ch.page;
      const endPage   = chapters[i + 1] ? chapters[i + 1].page - 1 : splitPageCount;
      const id        = ++splitNextId;
      const safe      = ch.title ? sanitizeTitle(ch.title) : '';
      splits.push({ id, startPage, endPage, name: safe ? safe + '.pdf' : defaultSplitName(startPage, endPage) });
    });

    setProgress(100, 'Done!');
    await tick();
    renderSplitCards();

    if (truncated) {
      setTimeout(() => alert(`Showing first ${MAX_SPLITS} chapters. Additional chapters were truncated.`), 100);
    }

  } catch (err) {
    console.error('Auto Split error:', err);
    alert('Auto Split failed: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ── Tier 1: PDF outline/bookmarks ─────────────────────────────────────────────
async function tryOutline(pdf) {
  try {
    const outline = await pdf.getOutline();
    if (!outline || outline.length === 0) return undefined;

    const chapters = [];
    for (const item of outline) {
      try {
        let dest = item.dest;
        // Named destination (string) must be resolved first
        if (typeof dest === 'string') dest = await pdf.getDestination(dest);
        if (!Array.isArray(dest) || !dest[0]) continue;
        const pageIndex = await pdf.getPageIndex(dest[0]);
        chapters.push({ title: item.title || null, page: pageIndex + 1 });
      } catch {
        continue; // malformed destination — skip item
      }
    }

    chapters.sort((a, b) => a.page - b.page);
    // Need ≥2 items to be useful
    return chapters.length >= 2 ? chapters : undefined;

  } catch {
    return undefined;
  }
}

// ── Tier 2: text pattern + font-size heuristic ────────────────────────────────
const HEADING_REGEX  = /^(chapter|part|section|unit|book|appendix|prologue|epilogue|introduction|conclusion)\s+(\d+|[ivxlcdm]+|[a-z]+)/i;
const NUMBERED_REGEX = /^\d+\.\s+[A-Z]/;

async function tryTextScan(pdf) {
  const chapters  = [];
  let totalItems  = 0;

  for (let p = 1; p <= pdf.numPages; p++) {
    // Yield every 5 pages to keep the UI responsive
    if (p % 5 === 0 || p === pdf.numPages) {
      setProgress(25 + (p / pdf.numPages) * 65, `Scanning page ${p} of ${pdf.numPages}…`);
      await tick();
    }

    try {
      const page    = await pdf.getPage(p);
      const content = await page.getTextContent();
      const items   = content.items.filter(i => i.str.trim().length > 0);
      totalItems   += items.length;
      if (!items.length) continue;

      // Median font height across all items on this page
      const heights = items.map(i => Math.abs(i.transform[3])).sort((a, b) => a - b);
      const median  = heights[Math.floor(heights.length / 2)];

      // Full page text for keyword matching (first 200 chars is enough)
      const pageText = items.map(i => i.str).join(' ').trim().slice(0, 200);

      const matchesKeyword = HEADING_REGEX.test(pageText) || NUMBERED_REGEX.test(pageText);

      // Top-of-page items (highest y-coordinate in PDF space)
      const topItems = [...items]
        .sort((a, b) => b.transform[5] - a.transform[5])
        .slice(0, 3);

      const hasLargeFont = topItems.some(i => median > 0 && Math.abs(i.transform[3]) >= median * 1.4);

      // Chapter page: keyword match, OR large heading font on a sparse page
      if (matchesKeyword || (hasLargeFont && items.length < 30)) {
        const title = matchesKeyword
          ? pageText.slice(0, 80)
          : (topItems[0]?.str.trim().slice(0, 80) || null);
        chapters.push({ title, page: p });
      }
    } catch {
      continue;
    }
  }

  // null = scanned PDF (no text at all); [] = text present but no headings found
  if (totalItems === 0) return null;

  chapters.sort((a, b) => a.page - b.page);
  // Deduplicate consecutive detections on the same page
  return chapters.filter((ch, i) => i === 0 || ch.page !== chapters[i - 1].page);
}

// ── Escape HTML (used in template literals) ───────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  applyTheme(getCookie('theme') || 'light');
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Navigation
  document.getElementById('btn-go-combine').addEventListener('click', () => showView('view-combine'));
  document.getElementById('btn-go-split').addEventListener('click',   () => showView('view-split'));
  document.getElementById('back-btn').addEventListener('click',        () => showView('view-landing'));

  // Features
  setupCombine();
  setupSplit();
});
