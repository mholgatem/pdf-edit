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
const ALL_VIEWS = ['view-landing','view-combine','view-split','view-modify','view-repaginate','view-forms'];
let _currentView = 'view-landing';
let _prevView    = 'view-landing';

function showView(id) {
  _prevView    = _currentView;
  _currentView = id;
  ALL_VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (!el) return;
    el.classList.toggle('hidden', v !== id);
    el.classList.toggle('active', v === id);
  });
  document.getElementById('back-btn').classList.toggle('hidden', id === 'view-landing');
}

function goBack() {
  showView(_prevView || 'view-landing');
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
//  REPAGINATE
// ══════════════════════════════════════════════════════════════════════════════
const PAGE_SIZES = {
  letter:  [612,  792],
  a4:      [595,  842],
  legal:   [612, 1008],
  tabloid: [792, 1224],
};

let repagFile      = null;
let repagPdfDoc    = null;   // pdf-lib document
let repagPdfJs     = null;   // PDF.js document
let repagSrcPage   = null;   // PDF.js page object
let repagPageW     = 0;      // native PDF pts
let repagPageH     = 0;
let repagScale     = 1;      // CSS px per PDF pt
let repagRects     = [];     // [{ id, x, y, w, h, outX, outY, outW, outH }] in PDF pts
let repagNextId    = 0;
let repagOutW      = 612;
let repagOutH      = 792;
let repagGutter    = 0;
let repagViewMode  = 'A';    // 'A' = source+overlays | 'B' = output preview
let repagSelId     = null;
let repagDrag      = null;       // { type:'move'|'resize', id, corner, startPt, startRect, anchorSvgX, anchorSvgY }
let repagPreviewDrag = null;     // { type:'move'|'resize', corner, startPt, startPlacement, anchorSvgX, anchorSvgY }
let repagPreviewScale = 1;       // CSS px per output PDF pt (set when rendering mode B canvas)
let repagSrcPageNum = 1;
let repagTotalPages = 1;
let repagPreviewIdx = 0;         // selected output page index for mode B

function setupRepaginate() {
  const dropzone  = document.getElementById('repag-dropzone');
  const fileInput = document.getElementById('repag-input');
  document.getElementById('repag-pick-btn').addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('dz-hover'); });
  dropzone.addEventListener('dragleave', e => { if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('dz-hover'); });
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('dz-hover');
    const f = [...e.dataTransfer.files].find(isPDF);
    if (f) loadRepagFile(f);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadRepagFile(fileInput.files[0]); fileInput.value = ''; });

  document.getElementById('repag-clear-btn').addEventListener('click', clearRepagFile);

  document.getElementById('repag-size-preset').addEventListener('change', e => {
    const v = e.target.value;
    document.getElementById('repag-custom-size').classList.toggle('hidden', v !== 'custom');
    if (v !== 'custom') { [repagOutW, repagOutH] = PAGE_SIZES[v]; }
    else { repagOutW = +document.getElementById('repag-out-w').value || 612; repagOutH = +document.getElementById('repag-out-h').value || 792; }
  });
  document.getElementById('repag-out-w').addEventListener('change', e => { repagOutW = +e.target.value || 612; });
  document.getElementById('repag-out-h').addEventListener('change', e => { repagOutH = +e.target.value || 792; });
  document.getElementById('repag-gutter').addEventListener('change', e => { repagGutter = clamp(+e.target.value || 0, 0, 500); renderRepagOverlay(); });

  document.getElementById('repag-src-page').addEventListener('change', e => {
    const v = clamp(+e.target.value || 1, 1, repagTotalPages);
    e.target.value = v;
    repagSrcPageNum = v;
    loadRepagSourcePage();
  });

  document.getElementById('repag-add-rect-btn').addEventListener('click', addRepagRect);
  document.getElementById('repag-del-rect-btn').addEventListener('click', deleteRepagRect);
  document.getElementById('repag-toggle-view-btn').addEventListener('click', toggleRepagView);
  document.getElementById('repag-run-btn').addEventListener('click', runRepaginate);

  // Keyboard delete / backspace removes selected source rectangle
  document.addEventListener('keydown', e => {
    if (_currentView !== 'view-repaginate') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && repagSelId !== null) {
      if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      deleteRepagRect();
    }
  });

  // SVG overlay mouse events
  const overlay = document.getElementById('repag-overlay');
  overlay.addEventListener('mousedown', onRepagMouseDown);
  window.addEventListener('mousemove',  onRepagMouseMove);
  window.addEventListener('mouseup',    onRepagMouseUp);
}

async function loadRepagFile(file) {
  showLoading('Loading PDF…');
  try {
    const buf = await file.arrayBuffer();
    repagPdfDoc = await PDFLib.PDFDocument.load(buf);
    repagTotalPages = repagPdfDoc.getPageCount();
    repagPdfJs  = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
  } catch (err) {
    hideLoading(); alert('Could not read PDF: ' + err.message); return;
  }
  hideLoading();

  repagFile       = file;
  repagRects      = [];
  repagNextId     = 0;
  repagSelId      = null;
  repagSrcPageNum = 1;
  repagViewMode   = 'A';

  document.getElementById('repag-fname').textContent = file.name;
  document.getElementById('repag-dz-wrap').classList.add('hidden');
  document.getElementById('repag-controls').classList.remove('hidden');

  const pagePick = document.getElementById('repag-page-pick');
  if (repagTotalPages > 1) {
    pagePick.classList.remove('hidden');
    document.getElementById('repag-src-page').max = repagTotalPages;
    document.getElementById('repag-page-total').textContent = `of ${repagTotalPages}`;
  } else {
    pagePick.classList.add('hidden');
  }

  document.getElementById('repag-workspace').classList.remove('hidden');
  await loadRepagSourcePage();
}

async function loadRepagSourcePage() {
  showLoading('Rendering page…');
  try {
    repagSrcPage = await repagPdfJs.getPage(repagSrcPageNum);
    const vp1 = repagSrcPage.getViewport({ scale: 1 });
    repagPageW = vp1.width;
    repagPageH = vp1.height;

    const wrap = document.getElementById('repag-canvas-wrap');
    const dpr  = window.devicePixelRatio || 1;
    const cssW = Math.min(wrap.clientWidth - 48, 900);  // max 900px wide
    repagScale  = cssW / repagPageW;
    const cssH  = repagPageH * repagScale;

    const canvas = document.getElementById('repag-canvas');
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';

    const vp = repagSrcPage.getViewport({ scale: repagScale * dpr });
    await repagSrcPage.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;

    const overlay = document.getElementById('repag-overlay');
    overlay.setAttribute('width',  cssW);
    overlay.setAttribute('height', cssH);
    overlay.style.width  = cssW + 'px';
    overlay.style.height = cssH + 'px';
  } catch (err) {
    hideLoading(); console.error(err); return;
  }
  hideLoading();
  renderRepagOverlay();
  updateRepagThumbs();
}

function clearRepagFile() {
  repagFile = repagPdfDoc = repagPdfJs = repagSrcPage = null;
  repagRects = []; repagNextId = 0; repagSelId = null;
  document.getElementById('repag-dz-wrap').classList.remove('hidden');
  document.getElementById('repag-controls').classList.add('hidden');
  document.getElementById('repag-workspace').classList.add('hidden');
  document.getElementById('repag-overlay').innerHTML = '';
  document.getElementById('repag-run-btn').disabled = true;
  document.getElementById('repag-del-rect-btn').disabled = true;
}

function addRepagRect() {
  // Default: place at top-left of page at output size (capped to source page size)
  const w = Math.min(repagOutW, repagPageW);
  const h = Math.min(repagOutH, repagPageH);
  const x = 0;
  const y = repagPageH - h; // top of document (PDF Y origin is bottom-left)
  // Output placement defaults to filling the entire output page
  repagRects.push({ id: ++repagNextId, x, y, w, h,
    outX: 0, outY: 0, outW: repagOutW, outH: repagOutH });
  repagSelId = repagNextId;
  // If we're in preview mode, switch back to edit mode so the new rect is visible
  if (repagViewMode === 'B') {
    repagViewMode = 'A';
    document.getElementById('repag-toggle-view-btn').textContent = 'Preview Output';
    document.getElementById('repag-overlay').style.display = '';
    loadRepagSourcePage();
    return;
  }
  renderRepagOverlay();
  updateRepagThumbs();
  document.getElementById('repag-run-btn').disabled = false;
  document.getElementById('repag-del-rect-btn').disabled = false;
}

function deleteRepagRect() {
  if (repagSelId === null) return;
  repagRects = repagRects.filter(r => r.id !== repagSelId);
  repagSelId = null;
  renderRepagOverlay();
  updateRepagThumbs();
  document.getElementById('repag-run-btn').disabled  = repagRects.length === 0;
  document.getElementById('repag-del-rect-btn').disabled = true;
}

function selectRepagRect(id) {
  repagSelId = id;
  document.getElementById('repag-del-rect-btn').disabled = (id === null);
  renderRepagOverlay();
}

// Convert PDF pts → SVG/screen px
function pdfToSvg(px, py, pw, ph) {
  return {
    x: px * repagScale,
    y: (repagPageH - py - ph) * repagScale,
    w: pw * repagScale,
    h: ph * repagScale,
  };
}
// Convert SVG px → PDF pts (given top-left corner and dimensions in SVG space)
function svgToPdf(sx, sy, sw, sh) {
  return {
    x: sx / repagScale,
    y: repagPageH - sy / repagScale - sh / repagScale,
    w: sw / repagScale,
    h: sh / repagScale,
  };
}

function renderRepagOverlay() {
  const overlay = document.getElementById('repag-overlay');
  overlay.innerHTML = '';

  const ns = 'http://www.w3.org/2000/svg';
  const gutterPx = repagGutter * repagScale;

  repagRects.forEach((r, idx) => {
    const s = pdfToSvg(r.x, r.y, r.w, r.h);
    const selected = r.id === repagSelId;
    const g = document.createElementNS(ns, 'g');
    g.dataset.id = r.id;

    // Main rect
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', s.x); rect.setAttribute('y', s.y);
    rect.setAttribute('width', s.w); rect.setAttribute('height', s.h);
    rect.setAttribute('class', 'repag-rect' + (selected ? ' selected' : ''));
    rect.dataset.id = r.id;
    g.appendChild(rect);

    // Gutter guide
    if (gutterPx > 0 && s.w > gutterPx * 2 && s.h > gutterPx * 2) {
      const gr = document.createElementNS(ns, 'rect');
      gr.setAttribute('x', s.x + gutterPx); gr.setAttribute('y', s.y + gutterPx);
      gr.setAttribute('width', s.w - gutterPx * 2); gr.setAttribute('height', s.h - gutterPx * 2);
      gr.setAttribute('class', 'repag-gutter-rect');
      g.appendChild(gr);
    }

    // Page number label
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', s.x + 6); label.setAttribute('y', s.y + 6);
    label.setAttribute('class', 'repag-rect-label');
    label.textContent = idx + 1;
    g.appendChild(label);

    // Corner handles (only when selected)
    if (selected) {
      const corners = [
        { id: 'tl', cx: s.x,       cy: s.y       },
        { id: 'tr', cx: s.x + s.w, cy: s.y       },
        { id: 'bl', cx: s.x,       cy: s.y + s.h },
        { id: 'br', cx: s.x + s.w, cy: s.y + s.h },
      ];
      corners.forEach(c => {
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', c.cx); circle.setAttribute('cy', c.cy);
        circle.setAttribute('class', 'repag-handle');
        circle.dataset.corner = c.id;
        circle.dataset.id     = r.id;
        g.appendChild(circle);
      });
    }

    overlay.appendChild(g);
  });
}

function getRepagSvgPoint(e) {
  const overlay = document.getElementById('repag-overlay');
  const rect    = overlay.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onRepagMouseDown(e) {
  const target = e.target;
  const id     = target.dataset.id ? +target.dataset.id : null;

  // ── Mode B: placement handles ─────────────────────────────────────────────
  if (repagViewMode === 'B') {
    const r = repagRects[clamp(repagPreviewIdx, 0, repagRects.length - 1)];
    if (!r) return;

    if (target.classList.contains('repag-handle') && target.dataset.role === 'placement') {
      e.preventDefault();
      const corner = target.dataset.corner;
      const sx = r.outX * repagPreviewScale;
      const sy = (repagOutH - r.outY - r.outH) * repagPreviewScale;
      const sw = r.outW * repagPreviewScale;
      const sh = r.outH * repagPreviewScale;
      const anchors = {
        tl: { x: sx + sw, y: sy + sh }, tr: { x: sx,      y: sy + sh },
        bl: { x: sx + sw, y: sy      }, br: { x: sx,      y: sy      },
      };
      const pt = getRepagSvgPoint(e);
      repagPreviewDrag = { type: 'resize', corner, anchorSvgX: anchors[corner].x, anchorSvgY: anchors[corner].y,
                           startPt: pt, startPlacement: { outX: r.outX, outY: r.outY, outW: r.outW, outH: r.outH } };
    } else if (target.classList.contains('repag-placement-rect')) {
      e.preventDefault();
      const pt = getRepagSvgPoint(e);
      repagPreviewDrag = { type: 'move', startPt: pt,
                           startPlacement: { outX: r.outX, outY: r.outY, outW: r.outW, outH: r.outH } };
    }
    return;
  }

  // ── Mode A: source rectangle handles ─────────────────────────────────────
  if (target.classList.contains('repag-handle') && id !== null) {
    // Resize source rect
    e.preventDefault();
    const r  = repagRects.find(r => r.id === id);
    if (!r) return;
    const s  = pdfToSvg(r.x, r.y, r.w, r.h);
    const corner = target.dataset.corner;
    const anchors = { tl: { x: s.x + s.w, y: s.y + s.h }, tr: { x: s.x,       y: s.y + s.h },
                      bl: { x: s.x + s.w, y: s.y       }, br: { x: s.x,       y: s.y       } };
    const pt = getRepagSvgPoint(e);
    repagDrag = { type: 'resize', id, corner, anchorSvgX: anchors[corner].x, anchorSvgY: anchors[corner].y, startPt: pt };
    selectRepagRect(id);
  } else if (target.classList.contains('repag-rect') && id !== null) {
    // Move source rect
    e.preventDefault();
    const r  = repagRects.find(r => r.id === id);
    if (!r) return;
    const pt = getRepagSvgPoint(e);
    repagDrag = { type: 'move', id, startPt: pt, startRect: { ...r } };
    selectRepagRect(id);
  } else {
    // Deselect
    repagSelId = null;
    document.getElementById('repag-del-rect-btn').disabled = true;
    renderRepagOverlay();
  }
}

function onRepagMouseMove(e) {
  // ── Mode B: move/resize output placement ──────────────────────────────────
  if (repagPreviewDrag) {
    e.preventDefault();
    const pt = getRepagSvgPoint(e);
    const r  = repagRects[clamp(repagPreviewIdx, 0, repagRects.length - 1)];
    if (!r) return;
    const sp = repagPreviewDrag.startPlacement;

    if (repagPreviewDrag.type === 'move') {
      const dx = (pt.x - repagPreviewDrag.startPt.x) / repagPreviewScale;
      const dy = -(pt.y - repagPreviewDrag.startPt.y) / repagPreviewScale; // flip Y
      r.outX = clamp(sp.outX + dx, 0, repagOutW - r.outW);
      r.outY = clamp(sp.outY + dy, 0, repagOutH - r.outH);
    } else {
      // Resize via anchor
      const ax = repagPreviewDrag.anchorSvgX, ay = repagPreviewDrag.anchorSvgY;
      const left   = Math.min(ax, pt.x);
      const top    = Math.min(ay, pt.y);
      const right  = Math.max(ax, pt.x);
      const bottom = Math.max(ay, pt.y);
      const minPx  = 8 * repagPreviewScale;
      if (right - left < minPx || bottom - top < minPx) return;
      // Convert SVG coords to output PDF coords
      const newW = (right - left) / repagPreviewScale;
      const newH = (bottom - top) / repagPreviewScale;
      const newX = left / repagPreviewScale;
      const newY = repagOutH - top / repagPreviewScale - newH;
      r.outX = clamp(newX, 0, repagOutW);
      r.outY = clamp(newY, 0, repagOutH);
      r.outW = Math.min(newW, repagOutW - r.outX);
      r.outH = Math.min(newH, repagOutH - r.outY);
    }
    // Redraw canvas and overlay (skip async re-render — use existing offscreen approach)
    _repagRedrawOutputCanvas(r);
    renderRepagPlacementOverlay();
    return;
  }

  // ── Mode A: move/resize source rect ───────────────────────────────────────
  if (!repagDrag) return;
  e.preventDefault();
  const pt = getRepagSvgPoint(e);
  const r  = repagRects.find(r => r.id === repagDrag.id);
  if (!r) return;

  if (repagDrag.type === 'move') {
    const dx = (pt.x - repagDrag.startPt.x) / repagScale;
    const dy = -(pt.y - repagDrag.startPt.y) / repagScale; // flip Y
    r.x = clamp(repagDrag.startRect.x + dx, 0, repagPageW - r.w);
    r.y = clamp(repagDrag.startRect.y + dy, 0, repagPageH - r.h);
  } else {
    // Resize: compute rect from anchor + current mouse
    const ax = repagDrag.anchorSvgX, ay = repagDrag.anchorSvgY;
    const left   = Math.min(ax, pt.x);
    const top    = Math.min(ay, pt.y);
    const right  = Math.max(ax, pt.x);
    const bottom = Math.max(ay, pt.y);
    const minPx  = 20 * repagScale; // min 20pt
    if (right - left < minPx || bottom - top < minPx) return;
    const np = svgToPdf(left, top, right - left, bottom - top);
    r.x = clamp(np.x, 0, repagPageW);
    r.y = clamp(np.y, 0, repagPageH);
    r.w = Math.min(np.w, repagPageW - r.x);
    r.h = Math.min(np.h, repagPageH - r.y);
  }
  renderRepagOverlay();
}

function onRepagMouseUp(e) {
  if (repagPreviewDrag) {
    repagPreviewDrag = null;
    updateRepagThumbs();
    return;
  }
  if (!repagDrag) return;
  repagDrag = null;
  updateRepagThumbs();
}

// Synchronous fast redraw of the output preview canvas during placement drag
// (avoids re-invoking PDF.js async render on every mouse move)
let _repagOffscreenCache = null; // { pageNum, canvas } — cached offscreen render

function _repagRedrawOutputCanvas(r) {
  const canvas = document.getElementById('repag-canvas');
  const ctx    = canvas.getContext('2d');
  const dpr    = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!_repagOffscreenCache) return; // not yet cached — full re-render needed
  const off  = _repagOffscreenCache;
  const srcX = r.x * repagScale * dpr;
  const srcY = (repagPageH - r.y - r.h) * repagScale * dpr;
  const srcW = r.w * repagScale * dpr;
  const srcH = r.h * repagScale * dpr;
  const dstX = r.outX  * repagPreviewScale * dpr;
  const dstY = (repagOutH - r.outY - r.outH) * repagPreviewScale * dpr;
  const dstW = r.outW  * repagPreviewScale * dpr;
  const dstH = r.outH  * repagPreviewScale * dpr;
  if (srcW > 0 && srcH > 0 && dstW > 0 && dstH > 0) {
    ctx.drawImage(off, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
  }
}

function updateRepagThumbs() {
  const strip = document.getElementById('repag-thumbs');
  const label = document.getElementById('repag-thumbs-label');
  const dpr    = window.devicePixelRatio || 1;
  // In mode B the main canvas contains the output preview, not the source page.
  // Use the cached offscreen source render instead so thumbnails crop the right content.
  const canvas = (repagViewMode === 'B' && _repagOffscreenCache)
    ? _repagOffscreenCache
    : document.getElementById('repag-canvas');

  // Remove existing thumbs (keep label)
  strip.querySelectorAll('.repag-thumb').forEach(el => el.remove());
  label.textContent = 'Output Pages';

  // Always show output page thumbnails (both in edit and preview mode)
  repagRects.forEach((r, idx) => {
    const thumbW = 160, thumbH = Math.round(thumbW * (repagOutH / repagOutW));
    const off = document.createElement('canvas');
    off.width = thumbW; off.height = thumbH;
    const ctx = off.getContext('2d');
    // White background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, thumbW, thumbH);
    const srcX = r.x * repagScale * dpr;
    const srcY = (repagPageH - r.y - r.h) * repagScale * dpr;
    const srcW = r.w * repagScale * dpr;
    const srcH = r.h * repagScale * dpr;
    if (srcW > 0 && srcH > 0) {
      // Draw at placement position within thumbnail
      const thumbScale = thumbW / repagOutW;
      const dstX = r.outX * thumbScale;
      const dstY = (repagOutH - r.outY - r.outH) * thumbScale;
      const dstW = r.outW * thumbScale;
      const dstH = r.outH * thumbScale;
      ctx.drawImage(canvas, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
    }

    const div = document.createElement('div');
    div.className = 'repag-thumb' + (idx === repagPreviewIdx ? ' active' : '');
    div.dataset.idx = idx;
    const img = document.createElement('img');
    img.src = off.toDataURL();
    img.alt = `Page ${idx + 1}`;
    const lbl = document.createElement('div');
    lbl.className = 'repag-thumb-label';
    lbl.textContent = `Page ${idx + 1}`;
    div.appendChild(img); div.appendChild(lbl);
    div.addEventListener('click', () => {
      repagPreviewIdx = idx;
      strip.querySelectorAll('.repag-thumb').forEach(t => t.classList.remove('active'));
      div.classList.add('active');
      // In preview mode, clicking a thumbnail loads that page's preview
      if (repagViewMode === 'B') {
        renderRepagOutputPreview();
        renderRepagPlacementOverlay();
      }
    });
    strip.appendChild(div);
  });
}

function toggleRepagView() {
  if (repagRects.length === 0) return; // nothing to preview
  repagViewMode = repagViewMode === 'A' ? 'B' : 'A';
  const btn = document.getElementById('repag-toggle-view-btn');
  btn.textContent = repagViewMode === 'A' ? 'Preview Output' : 'Edit Source';

  if (repagViewMode === 'B') {
    // Overlay stays visible — will show placement handles instead of source rects
    repagPreviewIdx = clamp(repagPreviewIdx, 0, repagRects.length - 1);
    _repagOffscreenCache = null; // invalidate cache; renderRepagOutputPreview will rebuild
    renderRepagOutputPreview();
    // renderRepagPlacementOverlay() is called inside renderRepagOutputPreview() after async render
  } else {
    _repagOffscreenCache = null;
    // Restore source canvas + source overlays
    loadRepagSourcePage(); // async — calls renderRepagOverlay + updateRepagThumbs internally
  }
}

function renderRepagOutputPreview() {
  if (repagRects.length === 0) return;
  const idx = clamp(repagPreviewIdx, 0, repagRects.length - 1);
  const r   = repagRects[idx];
  const dpr = window.devicePixelRatio || 1;

  // Determine output page display size
  const wrap   = document.getElementById('repag-canvas-wrap');
  const maxW   = Math.min(wrap.clientWidth - 48, 900);
  const aspect = repagOutH / repagOutW;
  const dispW  = Math.min(maxW, repagOutW);
  const dispH  = Math.round(dispW * aspect);
  repagPreviewScale = dispW / repagOutW;

  // Resize the main canvas to match output page dimensions
  const canvas = document.getElementById('repag-canvas');
  canvas.width  = Math.round(dispW * dpr);
  canvas.height = Math.round(dispH * dpr);
  canvas.style.width  = dispW + 'px';
  canvas.style.height = dispH + 'px';

  // Also resize the SVG overlay to match
  const overlay = document.getElementById('repag-overlay');
  overlay.setAttribute('width',  dispW);
  overlay.setAttribute('height', dispH);
  overlay.style.width  = dispW + 'px';
  overlay.style.height = dispH + 'px';

  // Draw white output page background immediately
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render source page off-screen, then crop to placement rect on output canvas
  const offCanvas = document.createElement('canvas');
  const cssW = repagPageW * repagScale;
  const cssH = repagPageH * repagScale;
  offCanvas.width  = Math.round(cssW * dpr);
  offCanvas.height = Math.round(cssH * dpr);

  const renderVp = repagSrcPage.getViewport({ scale: repagScale * dpr });
  repagSrcPage.render({ canvasContext: offCanvas.getContext('2d'), viewport: renderVp }).promise.then(() => {
    // Cache the offscreen render for fast redraws during drag
    _repagOffscreenCache = offCanvas;
    // Draw onto output canvas
    _repagRedrawOutputCanvas(r);
    // Draw placement handles overlay
    renderRepagPlacementOverlay();
  });
}

function renderRepagPlacementOverlay() {
  const overlay = document.getElementById('repag-overlay');
  overlay.innerHTML = '';
  if (repagRects.length === 0) return;

  const ns = 'http://www.w3.org/2000/svg';
  const r  = repagRects[clamp(repagPreviewIdx, 0, repagRects.length - 1)];
  const sx = r.outX * repagPreviewScale;
  const sy = (repagOutH - r.outY - r.outH) * repagPreviewScale;
  const sw = r.outW * repagPreviewScale;
  const sh = r.outH * repagPreviewScale;

  // Placement rect (movable body)
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', sx); rect.setAttribute('y', sy);
  rect.setAttribute('width', sw); rect.setAttribute('height', sh);
  rect.setAttribute('class', 'repag-placement-rect');
  overlay.appendChild(rect);

  // Corner handles
  const corners = [
    { id: 'tl', cx: sx,      cy: sy      },
    { id: 'tr', cx: sx + sw, cy: sy      },
    { id: 'bl', cx: sx,      cy: sy + sh },
    { id: 'br', cx: sx + sw, cy: sy + sh },
  ];
  corners.forEach(c => {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', c.cx); circle.setAttribute('cy', c.cy);
    circle.setAttribute('class', 'repag-handle');
    circle.dataset.corner = c.id;
    circle.dataset.role   = 'placement';
    overlay.appendChild(circle);
  });
}

async function runRepaginate() {
  if (!repagFile || repagRects.length === 0) return;
  showLoading('Generating PDF…');
  try {
    const { PDFDocument } = PDFLib;
    const buf    = await repagFile.arrayBuffer();
    const srcDoc = await PDFDocument.load(buf);
    const newDoc = await PDFDocument.create();
    const srcPages = srcDoc.getPages();
    const srcPg  = srcPages[repagSrcPageNum - 1];

    for (let i = 0; i < repagRects.length; i++) {
      setProgress(5 + (i / repagRects.length) * 85, `Building page ${i + 1} of ${repagRects.length}…`);
      await tick();
      const r = repagRects[i];
      const embedded = await newDoc.embedPage(srcPg, {
        left:   r.x,
        bottom: r.y,
        right:  r.x + r.w,
        top:    r.y + r.h,
      });
      const outPage = newDoc.addPage([repagOutW, repagOutH]);
      outPage.drawPage(embedded, { x: r.outX, y: r.outY, width: r.outW, height: r.outH });
    }

    setProgress(93, 'Saving…');
    await tick();
    const bytes = await newDoc.save();
    setProgress(100, 'Done!');
    await tick();

    const outName = (repagFile.name.replace(/\.pdf$/i, '') || 'document') + '_repaginated.pdf';
    triggerDownload(new Blob([bytes], { type: 'application/pdf' }), outName);
  } catch (err) {
    console.error(err);
    alert('Error generating PDF: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORM EDITOR
// ══════════════════════════════════════════════════════════════════════════════
let formsFile       = null;
let formsPdfDoc     = null;   // pdf-lib document (fresh copy for editing)
let formsPdfJsDoc   = null;   // PDF.js document
let formsPageCount  = 0;
let formsCurPage    = 1;
let formsScales     = [];     // CSS px/pt per page
let formsFields     = [];     // [{ id, type, page, x, y, w, h, settings }]
let formsNextId     = 0;
let formsSelId      = null;
let formsTool       = 'select';
let formsDrag       = null;   // same structure as repagDrag
let formsTabDragIdx  = null;
let formsEditingId   = null;   // field id being edited in popup
let _pendingNewField = null;   // temp field not yet added to formsFields
let _snapGuides      = [];     // { x1,y1,x2,y2 } lines to draw during drag
let _lastClickId     = null;   // for manual double-click detection
let _lastClickTime   = 0;

const FORMS_DEFAULTS = {
  text:      { name:'',label:'',defaultValue:'',required:false,numericOnly:false,maxLength:0,borderVisible:true },
  checkbox:  { name:'',label:'',group:'',checkedValue:'Yes',required:false,borderVisible:true },
  radio:     { groupName:'',value:'',label:'',required:false,borderVisible:true },
  dropdown:  { name:'',label:'',options:['Option 1','Option 2'],defaultIndex:0,required:false,borderVisible:true },
  list:      { name:'',label:'',options:['Option 1','Option 2'],multiSelect:false,required:false,borderVisible:true },
  label:     { text:'Label', fontSize:11, fontFamily:'Helvetica', color:'#000000', bgColor:'' },
  highlight: { bgColor:'rgba(255,235,59,0.4)' },
  picture:   { src: '' },
};
const FORMS_FIELD_SIZE = {
  text:      [150, 22],
  checkbox:  [14,  14],
  radio:     [14,  14],
  dropdown:  [140, 20],
  list:      [140, 60],
  label:     [80,  14],
  highlight: [120, 40],
  picture:   [120, 90],
};
let formsNameCounters = { text:0, checkbox:0, radio:0, dropdown:0, list:0, label:0, highlight:0, picture:0 };

const SNAP_PX = 8;
let formsSnapEnabled = true;  // toggled by header snap button

function setupForms() {
  const dropzone  = document.getElementById('forms-dropzone');
  const fileInput = document.getElementById('forms-input');
  document.getElementById('forms-pick-btn').addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('dz-hover'); });
  dropzone.addEventListener('dragleave', e => { if (!dropzone.contains(e.relatedTarget)) dropzone.classList.remove('dz-hover'); });
  dropzone.addEventListener('drop', e => {
    e.preventDefault(); dropzone.classList.remove('dz-hover');
    const f = [...e.dataTransfer.files].find(isPDF);
    if (f) loadFormsFile(f);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadFormsFile(fileInput.files[0]); fileInput.value = ''; });

  document.getElementById('forms-clear-btn').addEventListener('click', clearFormsFile);
  document.getElementById('forms-delete-btn').addEventListener('click', deleteSelectedField);
  document.getElementById('forms-tab-order-btn').addEventListener('click', openTabOrderPanel);
  document.getElementById('forms-tab-close-btn').addEventListener('click', closeTabOrderPanel);
  document.getElementById('forms-save-btn').addEventListener('click', runSaveForms);

  // Tool buttons — popup-first flow
  document.querySelectorAll('.forms-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openNewFieldPopup(btn.dataset.tool);
    });
  });

  // Keyboard delete
  document.addEventListener('keydown', e => {
    if (_currentView !== 'view-forms') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && formsSelId !== null) {
      if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      deleteSelectedField();
    }
  });

  // Global mouse events for drag
  window.addEventListener('mousemove', onFormsMouseMove);
  window.addEventListener('mouseup',   onFormsMouseUp);

  // Close popup on backdrop click
  document.getElementById('forms-field-popup').addEventListener('click', e => {
    if (e.target === document.getElementById('forms-field-popup')) closeFieldPopup();
  });
}

// ── Color helpers ─────────────────────────────────────────────────────────────
// Returns true if text contains any character outside the WinAnsi (Latin-1) range.
function hasNonWinAnsi(text) {
  return /[^\x00-\xFF]/.test(text || '');
}

// Shows the unicode-font confirm dialog; resolves true (embed) or false (fallback).
function showUnicodeConfirm() {
  return new Promise(resolve => {
    const popup = document.getElementById('unicode-confirm-popup');
    popup.classList.remove('hidden');
    const btnYes = document.getElementById('unicode-confirm-yes');
    const btnNo  = document.getElementById('unicode-confirm-no');
    function finish(result) {
      popup.classList.add('hidden');
      btnYes.removeEventListener('click', onYes);
      btnNo.removeEventListener('click',  onNo);
      popup.removeEventListener('click',  onBackdrop);
      resolve(result);
    }
    function onYes()           { finish(true);  }
    function onNo()            { finish(false); }
    function onBackdrop(e)     { if (e.target === popup) finish(false); }
    btnYes.addEventListener('click', onYes);
    btnNo.addEventListener('click',  onNo);
    popup.addEventListener('click',  onBackdrop);
  });
}

// Replace characters outside the WinAnsi range with readable ASCII equivalents.
// Standard PDF fonts (Helvetica, Times-Roman, Courier) use WinAnsi encoding and
// will throw on any codepoint they can't encode.
function winAnsiSafe(text) {
  if (!text) return '';
  const map = {
    // Arrows
    '\u2190':'<-', '\u2192':'->', '\u2191':'^',  '\u2193':'v',
    '\u21D0':'<=', '\u21D2':'=>', '\u21D4':'<=>','\u2194':'<->',
    // Quotes / dashes
    '\u2018':"'",  '\u2019':"'",  '\u201A':",",
    '\u201C':'"',  '\u201D':'"',  '\u201E':',,',
    '\u2013':'-',  '\u2014':'--', '\u2015':'--',
    // Math / misc
    '\u2022':'*',  '\u2026':'...', '\u2020':'+', '\u2021':'++',
    '\u2030':'0/00', '\u2039':'<', '\u203A':'>',
    '\u2122':'(TM)','\u00AE':'(R)', '\u00A9':'(C)',
    '\u2044':'/',  '\u20AC':'EUR', '\u0192':'f',
    '\u2212':'-',  '\u00D7':'x',  '\u00F7':'/',
    '\u221E':'inf','\u2248':'~=', '\u2260':'!=', '\u2264':'<=', '\u2265':'>=',
    '\u00B0':'deg','\u00B5':'u',  '\u00B1':'+/-',
    // Non-breaking / zero-width spaces
    '\u00A0':' ',  '\uFEFF':'',   '\u200B':'',
  };
  return text
    .replace(/[^\x00-\xFF]/g, c => (map[c] !== undefined ? map[c] : '?'));
}

function parseRgba(str) {
  if (!str) return [1, 1, 0, 0.4];
  const m = str.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
  if (m) return [parseFloat(m[1])/255, parseFloat(m[2])/255, parseFloat(m[3])/255, m[4]!=null ? parseFloat(m[4]) : 1];
  return hexToRgbNorm(str);
}
function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return r ? [parseInt(r[1],16), parseInt(r[2],16), parseInt(r[3],16)] : [0,0,0];
}
function hexToRgbNorm(hex) {
  const [r,g,b] = hexToRgb(hex);
  return [r/255, g/255, b/255, 1];
}
function hexToRgba(hex, opacity) {
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${opacity})`;
}
function rgbaToHex(rgba) {
  if (!rgba) return '#ffeb3b';
  const m = rgba.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
  if (!m) return rgba.startsWith('#') ? rgba : '#ffeb3b';
  return '#' + [m[1],m[2],m[3]].map(v => ('0' + Math.round(parseFloat(v)).toString(16)).slice(-2)).join('');
}
function rgbaOpacity(rgba) {
  if (!rgba) return 0.4;
  const m = rgba.match(/rgba?\(\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : 1;
}
function rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
function pdfEscStr(str) {
  return (str || '').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
}
function addAnnotToPage(pg, doc, annotRef) {
  let arr = pg.node.lookupMaybe(PDFLib.PDFName.of('Annots'), PDFLib.PDFArray);
  if (!arr) { arr = doc.context.obj([]); pg.node.set(PDFLib.PDFName.of('Annots'), arr); }
  arr.push(annotRef);
}

// ── Popup-first field creation ────────────────────────────────────────────────
function openNewFieldPopup(type) {
  formsNameCounters[type] = (formsNameCounters[type] || 0) + 1;
  const settings = JSON.parse(JSON.stringify(FORMS_DEFAULTS[type]));
  if (type !== 'label' && type !== 'highlight' && type !== 'picture') {
    settings.name = type + '_' + formsNameCounters[type];
  }
  if (type === 'radio') settings.groupName = 'group_1';
  const tempId = -(++formsNextId);
  const tempField = { id: tempId, type, page: null, x: 0, y: 0, w: 0, h: 0, settings,
    isNew: true, parentId: null, childLabelId: null, childOffset: null };
  formsEditingId   = tempId;
  _pendingNewField = tempField;
  const inner = document.getElementById('forms-popup-inner');
  inner.innerHTML  = buildPopupHTML(tempField);
  document.getElementById('forms-field-popup').classList.remove('hidden');
  if (type === 'dropdown' || type === 'list') wireOptionsListEvents(inner, tempField);
  if (type === 'picture') wirePicturePopupEvents(inner, tempField);
  inner.querySelector('#popup-save-btn').addEventListener('click', saveFieldPopup);
  inner.querySelector('#popup-cancel-btn').addEventListener('click', closeFieldPopup);
}

async function loadFormsFile(file) {
  showLoading('Loading PDF…');
  try {
    const buf    = await file.arrayBuffer();
    formsPdfDoc  = await PDFLib.PDFDocument.load(buf);
    formsPdfJsDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
    formsPageCount = formsPdfDoc.getPageCount();
  } catch (err) {
    hideLoading(); alert('Could not read PDF: ' + err.message); return;
  }

  formsFile   = file;
  formsFields = [];
  formsNextId = 0;
  formsSelId  = null;
  formsCurPage = 1;
  formsScales = [];
  formsNameCounters = { text:0, checkbox:0, radio:0, dropdown:0, list:0, label:0, highlight:0, picture:0 };

  document.getElementById('forms-fname').textContent = file.name;
  document.getElementById('forms-dz-wrap').classList.add('hidden');
  document.getElementById('forms-controls').classList.remove('hidden');
  document.getElementById('forms-workspace').classList.remove('hidden');

  // Detect existing fields
  try { detectExistingFields(); } catch(e) { /* ignore if form API fails */ }

  // Render all pages
  setProgress(0, 'Rendering pages…');
  const editorArea = document.getElementById('forms-editor-area');
  const pagesStrip = document.getElementById('forms-pages-strip');
  editorArea.innerHTML = '';
  pagesStrip.innerHTML = '';

  for (let p = 1; p <= formsPageCount; p++) {
    setProgress((p / formsPageCount) * 90, `Rendering page ${p}…`);
    await tick();
    await renderFormsPage(p, editorArea, pagesStrip);
  }

  hideLoading();
  navigateFormsPage(1);
  renderAllFormsOverlays();
}

async function renderFormsPage(pageNum, editorArea, pagesStrip) {
  const pdfPage = await formsPdfJsDoc.getPage(pageNum);
  const vp1     = pdfPage.getViewport({ scale: 1 });
  const dpr     = window.devicePixelRatio || 1;
  const maxW    = Math.min((document.getElementById('forms-editor-area').clientWidth || 800) - 48, 900);
  const scale   = maxW / vp1.width;
  formsScales[pageNum] = scale;

  const cssW = vp1.width * scale;
  const cssH = vp1.height * scale;

  // Editor area page wrap
  const wrap = document.createElement('div');
  wrap.className = 'forms-page-wrap';
  wrap.dataset.page = pageNum;

  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const vp = pdfPage.getViewport({ scale: scale * dpr });
  // annotationMode: 0 = DISABLE — suppress form widget and annotation rendering on the canvas.
  // The SVG overlay draws all field visuals, so canvas-painted annotations would double-render
  // and leave ghost images when fields are moved in the editor.
  await pdfPage.render({ canvasContext: canvas.getContext('2d'), viewport: vp, annotationMode: 0 }).promise;

  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  overlay.setAttribute('width',  cssW);
  overlay.setAttribute('height', cssH);
  overlay.style.width  = cssW + 'px';
  overlay.style.height = cssH + 'px';
  overlay.dataset.page = pageNum;

  overlay.addEventListener('mousedown', e => onFormsMouseDown(e, pageNum));

  wrap.appendChild(canvas);
  wrap.appendChild(overlay);
  editorArea.appendChild(wrap);

  // Thumbnail
  const thumbCanvas = document.createElement('canvas');
  const tW = 100, tH = Math.round(tW * (vp1.height / vp1.width));
  thumbCanvas.width  = tW; thumbCanvas.height = tH;
  thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, tW, tH);

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'forms-page-thumb';
  thumbWrap.dataset.page = pageNum;
  thumbWrap.appendChild(thumbCanvas);
  const thumbLabel = document.createElement('div');
  thumbLabel.className = 'forms-page-label';
  thumbLabel.textContent = `p.${pageNum}`;
  thumbWrap.appendChild(thumbLabel);
  thumbWrap.addEventListener('click', () => navigateFormsPage(pageNum));
  pagesStrip.appendChild(thumbWrap);
}

function navigateFormsPage(pageNum) {
  formsCurPage = pageNum;
  document.querySelectorAll('.forms-page-wrap').forEach(el => {
    el.classList.toggle('active', +el.dataset.page === pageNum);
  });
  document.querySelectorAll('.forms-page-thumb').forEach(el => {
    el.classList.toggle('active', +el.dataset.page === pageNum);
  });
}

function detectExistingFields() {
  const form = formsPdfDoc.getForm();
  const pdfPages = formsPdfDoc.getPages();

  form.getFields().forEach(field => {
    let type = 'text';
    const fn = field.constructor.name;
    if (fn === 'PDFCheckBox')  type = 'checkbox';
    else if (fn === 'PDFRadioGroup') type = 'radio';
    else if (fn === 'PDFDropdown')   type = 'dropdown';
    else if (fn === 'PDFOptionList') type = 'list';

    const widgets = field.acroField.getWidgets();
    widgets.forEach(widget => {
      try {
        const wr = widget.getRectangle();
        // Determine page
        const pageRef = widget.P();
        const pageIdx = pdfPages.findIndex(p => p.ref === pageRef);
        if (pageIdx < 0) return;
        const pageNum = pageIdx + 1;

        const pdfPg = formsPdfDoc.getPages()[pageIdx];
        const { height: pgH } = pdfPg.getSize();

        const settings = JSON.parse(JSON.stringify(FORMS_DEFAULTS[type]));
        settings.name = field.getName();
        // Read current field values so the editor overlay can display them
        if (type === 'text') {
          try { settings.defaultValue = field.getText() || ''; } catch(e) {}
        } else if (type === 'dropdown' || type === 'list') {
          try { const sel = field.getSelected(); settings.defaultIndex = sel.length ? 0 : -1; } catch(e) {}
        }

        formsFields.push({
          id: ++formsNextId,
          type,
          page: pageNum,
          x: wr.x, y: wr.y, w: wr.width, h: wr.height,
          settings,
          isNew: false, isExisting: true, parentId: null, childLabelId: null, childOffset: null,
        });
        formsNameCounters[type] = (formsNameCounters[type] || 0) + 1;
      } catch(e) { /* skip malformed widget */ }
    });
  });

  // Restore label / highlight fields that were saved as PDF annotations in a previous session
  const { PDFArray: _PA, PDFDict: _PD, PDFString: _PS, PDFName: _PN } = PDFLib;
  formsPdfDoc.getPages().forEach((page, pageIdx) => {
    const pageNum = pageIdx + 1;
    const annotsRef = page.node.lookupMaybe(_PN.of('Annots'), _PA);
    if (!annotsRef) return;
    for (let j = 0; j < annotsRef.size(); j++) {
      try {
        const dict = formsPdfDoc.context.lookupMaybe(annotsRef.get(j), _PD);
        if (!dict) continue;
        const nm = dict.lookupMaybe(_PN.of('NM'), _PS)?.decodeText() || '';
        if (!nm.startsWith('forms-label-') && !nm.startsWith('forms-highlight-')) continue;

        const rawRect = dict.get(_PN.of('Rect'));
        const rectArr = rawRect
          ? (formsPdfDoc.context.lookupMaybe(rawRect, _PA) ?? dict.lookupMaybe(_PN.of('Rect'), _PA))
          : null;
        if (!rectArr) continue;
        const rx = rectArr.get(0).asNumber(), ry = rectArr.get(1).asNumber();
        const rw = rectArr.get(2).asNumber() - rx, rh = rectArr.get(3).asNumber() - ry;

        if (nm.startsWith('forms-label-')) {
          const contents = dict.lookupMaybe(_PN.of('Contents'), _PS)?.decodeText() || '';
          const da = dict.lookupMaybe(_PN.of('DA'), _PS)?.decodeText() || '';
          const fontMatch  = da.match(/\/(\S+)\s+([\d.]+)\s+Tf/);
          const colorMatch = da.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+rg/);
          const fontFamilyMap = { 'Helvetica':'Helvetica', 'Times-Roman':'Times-Roman', 'Courier':'Courier' };
          const fontFamily = fontFamilyMap[fontMatch?.[1]] || 'Helvetica';
          const fontSize   = fontMatch ? parseFloat(fontMatch[2]) : 11;
          const color = colorMatch
            ? rgbToHex(Math.round(parseFloat(colorMatch[1])*255), Math.round(parseFloat(colorMatch[2])*255), Math.round(parseFloat(colorMatch[3])*255))
            : '#000000';
          const settings = { ...JSON.parse(JSON.stringify(FORMS_DEFAULTS.label)), text: contents, fontFamily, fontSize, color };
          formsFields.push({ id: ++formsNextId, type: 'label', page: pageNum, x: rx, y: ry, w: rw, h: rh,
            settings, isNew: false, isExisting: false, parentId: null, childLabelId: null, childOffset: null });
          formsNameCounters.label++;
        } else {
          const rawIC  = dict.get(_PN.of('IC'));
          const icArr  = rawIC ? (formsPdfDoc.context.lookupMaybe(rawIC, _PA) ?? dict.lookupMaybe(_PN.of('IC'), _PA)) : null;
          const caEntry = dict.lookupMaybe(_PN.of('CA'));
          const ca = caEntry ? caEntry.asNumber() : 0.4;
          let bgColor = 'rgba(255,235,59,0.4)';
          if (icArr) {
            const r = Math.round(icArr.get(0).asNumber() * 255);
            const g = Math.round(icArr.get(1).asNumber() * 255);
            const b = Math.round(icArr.get(2).asNumber() * 255);
            bgColor = `rgba(${r},${g},${b},${ca.toFixed(2)})`;
          }
          formsFields.push({ id: ++formsNextId, type: 'highlight', page: pageNum, x: rx, y: ry, w: rw, h: rh,
            settings: { bgColor }, isNew: false, isExisting: false, parentId: null, childLabelId: null, childOffset: null });
          formsNameCounters.highlight++;
        }
      } catch(e) { /* skip malformed annotation */ }
    }
  });
}

function renderAllFormsOverlays() {
  for (let p = 1; p <= formsPageCount; p++) renderFormsOverlay(p);
}

function renderFormsOverlay(pageNum) {
  const overlay = document.querySelector(`svg.forms-overlay[data-page="${pageNum}"], #forms-editor-area svg[data-page="${pageNum}"]`);
  if (!overlay) return;
  overlay.innerHTML = '';
  const ns    = 'http://www.w3.org/2000/svg';
  const scale = formsScales[pageNum] || 1;
  const pdfPg = formsPdfDoc?.getPages()[pageNum - 1];
  if (!pdfPg) return;
  const { height: pgH, width: pgW } = pdfPg.getSize();

  // Draw connector lines between parent fields and child labels first (below fields)
  formsFields.filter(f => f.childLabelId && f.page === pageNum).forEach(parent => {
    const child = formsFields.find(c => c.id === parent.childLabelId);
    if (!child || child.page !== pageNum) return;
    const ps = formsPdfToSvg(parent.x + parent.w/2, parent.y + parent.h/2, 0, 0, pageNum);
    const cs = formsPdfToSvg(child.x  + child.w /2, child.y  + child.h /2, 0, 0, pageNum);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', ps.x); line.setAttribute('y1', ps.y);
    line.setAttribute('x2', cs.x); line.setAttribute('y2', cs.y);
    line.setAttribute('class', 'forms-child-connector');
    overlay.appendChild(line);
  });

  const fields = formsFields.filter(f => f.page === pageNum);
  fields.forEach(f => {
    const sx = f.x * scale;
    const sy = (pgH - f.y - f.h) * scale;
    const sw = f.w * scale;
    const sh = f.h * scale;
    const sel = f.id === formsSelId;
    const t   = f.type;
    const s   = f.settings;

    const g = document.createElementNS(ns, 'g');
    g.dataset.id = f.id;
    if (f.isNew) g.classList.add('forms-field-new');

    if (t === 'highlight') {
      // Translucent colored rect, no stroke
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', sx); rect.setAttribute('y', sy);
      rect.setAttribute('width', sw); rect.setAttribute('height', sh);
      rect.setAttribute('class', 'forms-field-highlight-rect' + (sel ? ' selected' : ''));
      rect.setAttribute('fill', s.bgColor || 'rgba(255,235,59,0.4)');
      rect.dataset.id = f.id;
      g.appendChild(rect);
    } else if (t === 'label') {
      // Optional background rect
      if (s.bgColor) {
        const bg = document.createElementNS(ns, 'rect');
        bg.setAttribute('x', sx); bg.setAttribute('y', sy);
        bg.setAttribute('width', sw); bg.setAttribute('height', sh);
        bg.setAttribute('fill', s.bgColor); bg.setAttribute('stroke', 'none');
        bg.dataset.id = f.id;
        g.appendChild(bg);
      }
      // Clickable/selectable invisible hit rect
      const hit = document.createElementNS(ns, 'rect');
      hit.setAttribute('x', sx); hit.setAttribute('y', sy);
      hit.setAttribute('width', sw); hit.setAttribute('height', sh);
      hit.setAttribute('fill', sel ? 'rgba(99,102,241,0.08)' : 'transparent');
      hit.setAttribute('stroke', sel ? '#6366f1' : 'transparent');
      hit.setAttribute('stroke-width', '1.5');
      hit.setAttribute('stroke-dasharray', '3 2');
      hit.setAttribute('cursor', 'move');
      hit.dataset.id = f.id;
      g.appendChild(hit);
      // Render actual text inside the rect
      const txt = document.createElementNS(ns, 'text');
	  const txtFontSizePx = (s.fontSize || 11) * scale;
      txt.setAttribute('x', sx + 2); txt.setAttribute('y', sy + 2);
      txt.setAttribute('class', 'forms-field-label-text');
      txt.setAttribute('fill', s.color || '#000000');
      txt.setAttribute('font-size', txtFontSizePx + 'px');
      txt.setAttribute('font-family', s.fontFamily || 'Helvetica, sans-serif');
      txt.textContent = s.text || '';
      g.appendChild(txt);
      // Small type badge at top-right corner when selected
      if (sel) {
        const badge = document.createElementNS(ns, 'text');
        badge.setAttribute('x', sx + sw - 2); badge.setAttribute('y', sy + 2);
        badge.setAttribute('class', 'forms-field-label');
        badge.setAttribute('text-anchor', 'end');
        badge.textContent = 'label';
        g.appendChild(badge);
      }
    } else if (t === 'picture') {
      // Hit rect (pointer-events active) for selection and drag
      const hit = document.createElementNS(ns, 'rect');
      hit.setAttribute('x', sx); hit.setAttribute('y', sy);
      hit.setAttribute('width', sw); hit.setAttribute('height', sh);
      hit.setAttribute('fill',   sel ? 'rgba(99,102,241,0.08)' : 'transparent');
      hit.setAttribute('stroke', sel ? '#6366f1' : 'rgba(99,102,241,0.35)');
      hit.setAttribute('stroke-width', sel ? '2.5' : '1');
      hit.setAttribute('stroke-dasharray', sel ? 'none' : '4 2');
      hit.setAttribute('cursor', 'move');
      hit.dataset.id = f.id;
      g.appendChild(hit);
      if (s.src) {
        const imgEl = document.createElementNS(ns, 'image');
        imgEl.setAttribute('x', sx); imgEl.setAttribute('y', sy);
        imgEl.setAttribute('width', sw); imgEl.setAttribute('height', sh);
        imgEl.setAttribute('href', s.src);
        imgEl.setAttribute('preserveAspectRatio', 'none');
        imgEl.setAttribute('pointer-events', 'none'); // fall through to hit rect
        g.appendChild(imgEl);
      } else {
        // Placeholder shown before an image is chosen
        const ph = document.createElementNS(ns, 'text');
        ph.setAttribute('x', sx + sw / 2); ph.setAttribute('y', sy + sh / 2);
        ph.setAttribute('text-anchor', 'middle');
        ph.setAttribute('dominant-baseline', 'middle');
        ph.setAttribute('class', 'forms-field-placeholder');
        ph.textContent = 'No image';
        ph.setAttribute('pointer-events', 'none');
        g.appendChild(ph);
      }
    } else {
      // Interactive field types — styled border rect
      const body = document.createElementNS(ns, 'rect');
      body.setAttribute('x', sx); body.setAttribute('y', sy);
      body.setAttribute('width', sw); body.setAttribute('height', sh);
      body.setAttribute('class', 'forms-field-rect forms-field-body' + (sel ? ' selected' : ''));
      body.dataset.id = f.id;
      g.appendChild(body);

      // Type-specific interior decoration
      if (t === 'checkbox') {
        // X mark inside
        const m = 3 * scale;
        ['tl-br','bl-tr'].forEach(d => {
          const ln = document.createElementNS(ns, 'line');
          if (d === 'tl-br') {
            ln.setAttribute('x1', sx + m); ln.setAttribute('y1', sy + m);
            ln.setAttribute('x2', sx + sw - m); ln.setAttribute('y2', sy + sh - m);
          } else {
            ln.setAttribute('x1', sx + m); ln.setAttribute('y1', sy + sh - m);
            ln.setAttribute('x2', sx + sw - m); ln.setAttribute('y2', sy + m);
          }
          ln.setAttribute('stroke', '#6366f1'); ln.setAttribute('stroke-width', '1.5');
          ln.setAttribute('pointer-events', 'none');
          g.appendChild(ln);
        });
      } else if (t === 'radio') {
        // Hide the square body rect for radio, use circle instead
        body.setAttribute('fill', 'transparent'); body.setAttribute('stroke', 'transparent');
        const cx2 = sx + sw/2, cy2 = sy + sh/2, r = Math.min(sw, sh)/2 - 1;
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', cx2); circle.setAttribute('cy', cy2); circle.setAttribute('r', r);
        circle.setAttribute('fill', sel ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)');
        circle.setAttribute('stroke', '#6366f1'); circle.setAttribute('stroke-width', sel ? '2.5' : '1.5');
        circle.setAttribute('pointer-events', 'none');
        g.appendChild(circle);
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', cx2); dot.setAttribute('cy', cy2); dot.setAttribute('r', Math.max(1, r * 0.35));
        dot.setAttribute('fill', '#6366f1'); dot.setAttribute('pointer-events', 'none');
        g.appendChild(dot);
      } else if (t === 'dropdown') {
        // Placeholder text + downward triangle
        const ph = document.createElementNS(ns, 'text');
        ph.setAttribute('x', sx + 3); ph.setAttribute('y', sy + 3);
        ph.setAttribute('class', 'forms-field-placeholder');
        ph.textContent = s.name || 'Select…';
        g.appendChild(ph);
        const arrowX = sx + sw - 2 - 5 * scale;
        const arrowY = sy + sh / 2;
        const sz = Math.max(3, 4 * scale);
        const tri = document.createElementNS(ns, 'polygon');
        tri.setAttribute('points', `${arrowX - sz},${arrowY - sz/2} ${arrowX + sz},${arrowY - sz/2} ${arrowX},${arrowY + sz/2}`);
        tri.setAttribute('fill', '#6366f1'); tri.setAttribute('pointer-events', 'none');
        g.appendChild(tri);
      } else if (t === 'list') {
        // 3 horizontal lines
        const lineCount = 3, pad = 4 * scale, lineGap = (sh - pad * 2) / (lineCount + 1);
        for (let li = 1; li <= lineCount; li++) {
          const ln = document.createElementNS(ns, 'line');
          const ly = sy + pad + li * lineGap;
          ln.setAttribute('x1', sx + pad); ln.setAttribute('y1', ly);
          ln.setAttribute('x2', sx + sw - pad); ln.setAttribute('y2', ly);
          ln.setAttribute('stroke', 'rgba(99,102,241,0.5)'); ln.setAttribute('stroke-width', '1');
          ln.setAttribute('pointer-events', 'none');
          g.appendChild(ln);
        }
      } else if (t === 'text') {
        // Only show placeholder text when a default/value has been set
        if (s.defaultValue) {
          const ph = document.createElementNS(ns, 'text');
          ph.setAttribute('x', sx + 3); ph.setAttribute('y', sy + 3);
          ph.setAttribute('class', 'forms-field-placeholder');
          ph.textContent = s.defaultValue;
          g.appendChild(ph);
        }
      }

      // Field name/label overlay text — rendered above the rect.
      // CSS sets font-size: 9px + dominant-baseline: hanging, so y = sy - 10 puts
      // the text baseline at sy-1 (1px gap above the rect top edge).
      const lbl = document.createElementNS(ns, 'text');
      lbl.setAttribute('x', sx + 2); lbl.setAttribute('y', sy - 10);
      lbl.setAttribute('class', 'forms-field-label');
      lbl.textContent = (s.name || t) + (s.label ? ` (${s.label})` : '');
      g.appendChild(lbl);
    }

    // Resize handles when selected
    if (sel) {
      [{ id:'tl',cx:sx,    cy:sy    }, { id:'tr',cx:sx+sw, cy:sy    },
       { id:'bl',cx:sx,    cy:sy+sh }, { id:'br',cx:sx+sw, cy:sy+sh }].forEach(c => {
        const h = document.createElementNS(ns, 'circle');
        h.setAttribute('cx', c.cx); h.setAttribute('cy', c.cy);
        h.setAttribute('class', 'forms-handle');
        h.dataset.corner = c.id; h.dataset.id = f.id;
        g.appendChild(h);
      });
    }
    overlay.appendChild(g);
  });

  // Snap guides (active during drag)
  _snapGuides.forEach(gl => {
    const ln = document.createElementNS(ns, 'line');
    ln.setAttribute('x1', gl.x1); ln.setAttribute('y1', gl.y1);
    ln.setAttribute('x2', gl.x2); ln.setAttribute('y2', gl.y2);
    ln.setAttribute('class', 'forms-snap-guide');
    overlay.appendChild(ln);
  });
}

function getFormsSvgPoint(e, pageNum) {
  const overlay = document.querySelector(`#forms-editor-area svg[data-page="${pageNum}"]`);
  if (!overlay) return { x: 0, y: 0 };
  const br = overlay.getBoundingClientRect();
  return { x: e.clientX - br.left, y: e.clientY - br.top };
}

function formsSvgToPdf(sx, sy, sw, sh, pageNum) {
  const scale = formsScales[pageNum] || 1;
  const pdfPg = formsPdfDoc.getPages()[pageNum - 1];
  const pgH   = pdfPg ? pdfPg.getSize().height : 792;
  return {
    x: sx / scale,
    y: pgH - sy / scale - sh / scale,
    w: sw / scale,
    h: sh / scale,
  };
}

function formsPdfToSvg(x, y, w, h, pageNum) {
  const scale = formsScales[pageNum] || 1;
  const pdfPg = formsPdfDoc.getPages()[pageNum - 1];
  const pgH   = pdfPg ? pdfPg.getSize().height : 792;
  return { x: x*scale, y: (pgH-y-h)*scale, w: w*scale, h: h*scale };
}

// ── Snap helper ───────────────────────────────────────────────────────────────
function snapFormsField(f, candidateSvgLeft, candidateSvgTop, pageNum, pdfX, pdfY) {
  const scale  = formsScales[pageNum] || 1;
  const pdfPg  = formsPdfDoc?.getPages()[pageNum - 1];
  const pgH    = pdfPg ? pdfPg.getSize().height : 792;
  const svgW   = (pdfPg ? pdfPg.getSize().width : 612) * scale;
  const svgH   = pgH * scale;

  const fSvgW  = f.w * scale;
  const fSvgH  = f.h * scale;
  let sx = candidateSvgLeft;
  let sy = candidateSvgTop;
  const guides = [];

  // Edges and centers of candidate field in SVG space
  const edges = {
    left:    sx,
    centerX: sx + fSvgW / 2,
    right:   sx + fSvgW,
    top:     sy,
    centerY: sy + fSvgH / 2,
    bottom:  sy + fSvgH,
  };

  // Collect other fields on same page — exclude this field's own child label
  const others = formsFields.filter(o => o.id !== f.id && o.page === pageNum && o.id !== f.childLabelId);

  let snapX = null, snapY = null;

  for (const o of others) {
    const os = formsPdfToSvg(o.x, o.y, o.w, o.h, pageNum);
    const oEdges = {
      left: os.x, centerX: os.x + os.w/2, right: os.x + os.w,
      top: os.y,  centerY: os.y + os.h/2, bottom: os.y + os.h,
    };

    // Horizontal alignment (same x)
    if (snapX === null) {
      for (const fKey of ['left','centerX','right']) {
        for (const oKey of ['left','centerX','right']) {
          const diff = edges[fKey] - oEdges[oKey];
          if (Math.abs(diff) < SNAP_PX) {
            sx -= diff;
            snapX = oEdges[oKey];
            guides.push({ x1: snapX, y1: 0, x2: snapX, y2: svgH });
            break;
          }
        }
        if (snapX !== null) break;
      }
    }

    // Vertical alignment (same y)
    if (snapY === null) {
      for (const fKey of ['top','centerY','bottom']) {
        for (const oKey of ['top','centerY','bottom']) {
          const diff = edges[fKey] - oEdges[oKey];
          if (Math.abs(diff) < SNAP_PX) {
            sy -= diff;
            snapY = oEdges[oKey];
            guides.push({ x1: 0, y1: snapY, x2: svgW, y2: snapY });
            break;
          }
        }
        if (snapY !== null) break;
      }
    }
  }

  // Child-to-parent snap for child labels
  if (f.parentId) {
    const parent = formsFields.find(p => p.id === f.parentId);
    if (parent) {
      const ps = formsPdfToSvg(parent.x, parent.y, parent.w, parent.h, pageNum);
      const canonicals = [
        // Above parent (centered)
        { x: ps.x + ps.w/2 - fSvgW/2, y: ps.y - fSvgH - 4 * scale },
        // Below parent (centered)
        { x: ps.x + ps.w/2 - fSvgW/2, y: ps.y + ps.h + 4 * scale },
        // Left of parent (y-centered)
        { x: ps.x - fSvgW - 4 * scale, y: ps.y + ps.h/2 - fSvgH/2 },
        // Right of parent (y-centered)
        { x: ps.x + ps.w + 4 * scale, y: ps.y + ps.h/2 - fSvgH/2 },
      ];
      for (const c of canonicals) {
        const dx = sx - c.x, dy = sy - c.y;
        if (Math.abs(dx) < SNAP_PX * 2 && Math.abs(dy) < SNAP_PX * 2) {
          sx = c.x; sy = c.y;
          guides.length = 0; // clear alignment guides, show parent connector instead
          break;
        }
      }
    }
  }

  // Convert snapped SVG back to PDF coords
  const snappedPdf = formsSvgToPdf(sx, sy, fSvgW, fSvgH, pageNum);
  return { x: snappedPdf.x, y: snappedPdf.y, guides };
}

function isFieldElement(el) {
  return el.classList.contains('forms-field-rect') ||
         el.classList.contains('forms-field-highlight-rect') ||
         el.classList.contains('forms-field-body') ||
         el.classList.contains('forms-field-label-text') ||
         (el.tagName === 'rect' && el.dataset.id);
}

function onFormsMouseDown(e, pageNum) {
  const target = e.target;
  // id lives on the element directly or propagated from its parent <g>
  const id = target.dataset.id ? +target.dataset.id
           : (target.closest('g[data-id]') ? +target.closest('g[data-id]').dataset.id : null);

  if (target.classList.contains('forms-handle') && id !== null) {
    e.preventDefault();
    const f     = formsFields.find(f => f.id === id);
    if (!f) return;
    const s     = formsPdfToSvg(f.x, f.y, f.w, f.h, pageNum);
    const corner = target.dataset.corner;
    const anchors = {
      tl: { x: s.x + s.w, y: s.y + s.h }, tr: { x: s.x,       y: s.y + s.h },
      bl: { x: s.x + s.w, y: s.y       }, br: { x: s.x,       y: s.y       },
    };
    const pt = getFormsSvgPoint(e, pageNum);
    formsDrag = { type:'resize', id, pageNum, corner, anchorSvgX: anchors[corner].x, anchorSvgY: anchors[corner].y, startPt: pt };
    selectFormsField(id);
  } else if (isFieldElement(target) && id !== null) {
    // Manual double-click detection — the browser's dblclick event is unreliable here
    // because selectFormsField re-renders the overlay on the first click, changing the
    // target element before the second click fires, so dblclick never gets a consistent target.
    const now = Date.now();
    if (id === _lastClickId && now - _lastClickTime < 400) {
      _lastClickId = null; _lastClickTime = 0;
      openFieldPopup(id);
      return;
    }
    _lastClickId = id; _lastClickTime = now;

    const f  = formsFields.find(f => f.id === id);
    if (!f) return;
    const pt = getFormsSvgPoint(e, pageNum);
    formsDrag = { type:'move', id, pageNum, startPt: pt, startField: { ...f } };
    selectFormsField(id);
  } else if (!target.classList.contains('forms-handle') && !isFieldElement(target)) {
    // Blank canvas — deselect
    formsSelId = null;
    document.getElementById('forms-delete-btn').disabled = true;
    renderFormsOverlay(pageNum);
  }
}

function onFormsMouseMove(e) {
  if (!formsDrag) return;
  e.preventDefault();
  const { id, pageNum } = formsDrag;
  const f = formsFields.find(f => f.id === id);
  if (!f) return;
  const scale = formsScales[pageNum] || 1;
  const pdfPg = formsPdfDoc.getPages()[pageNum - 1];
  const pgH   = pdfPg ? pdfPg.getSize().height : 792;
  const pgW   = pdfPg ? pdfPg.getSize().width  : 612;
  const pt    = getFormsSvgPoint(e, pageNum);

  if (formsDrag.type === 'move') {
    const dx = (pt.x - formsDrag.startPt.x) / scale;
    const dy = -(pt.y - formsDrag.startPt.y) / scale;
    let nx = clamp(formsDrag.startField.x + dx, 0, pgW - f.w);
    let ny = clamp(formsDrag.startField.y + dy, 0, pgH - f.h);
    // Snap
    if (formsSnapEnabled) {
      const snapped = snapFormsField(f, nx * scale, (pgH - ny - f.h) * scale, pageNum, nx, ny);
      f.x = snapped.x; f.y = snapped.y;
      _snapGuides = snapped.guides;
    } else {
      f.x = nx; f.y = ny;
      _snapGuides = [];
    }
  } else {
    const ax = formsDrag.anchorSvgX, ay = formsDrag.anchorSvgY;
    const left = Math.min(ax, pt.x), top = Math.min(ay, pt.y);
    const right = Math.max(ax, pt.x), bottom = Math.max(ay, pt.y);
    const minPx = 8 * scale;
    if (right - left < minPx || bottom - top < minPx) return;
    const np = formsSvgToPdf(left, top, right - left, bottom - top, pageNum);
    f.x = clamp(np.x, 0, pgW); f.y = clamp(np.y, 0, pgH);
    f.w = Math.min(np.w, pgW - f.x); f.h = Math.min(np.h, pgH - f.y);
    _snapGuides = [];
  }

  // Move linked child with parent (childOffset is stored on the child)
  if (f.childLabelId) {
    const child = formsFields.find(c => c.id === f.childLabelId);
    if (child?.childOffset) {
      child.x = f.x + child.childOffset.dx;
      child.y = f.y + child.childOffset.dy;
    }
  }

  renderFormsOverlay(pageNum);
}

function onFormsMouseUp(e) {
  if (formsDrag) {
    const { id, pageNum } = formsDrag;
    const f = formsFields.find(f => f.id === id);
    if (f) {
      // Clear new-item glow on first interaction
      if (f.isNew) { f.isNew = false; }
      // Update child offset when child is moved independently
      if (f.parentId && formsDrag.type === 'move') {
        const parent = formsFields.find(p => p.id === f.parentId);
        if (parent) f.childOffset = { dx: f.x - parent.x, dy: f.y - parent.y };
      }
    }
    _snapGuides = [];
    renderFormsOverlay(pageNum);
  }
  formsDrag = null;
}

function selectFormsField(id) {
  formsSelId = id;
  document.getElementById('forms-delete-btn').disabled = (id === null);
  renderAllFormsOverlays();
}

function placeFormsField(type, svgX, svgY, pageNum) {
  const [defW, defH] = FORMS_FIELD_SIZE[type];
  const pdf = formsSvgToPdf(svgX, svgY, defW * (formsScales[pageNum] || 1), defH * (formsScales[pageNum] || 1), pageNum);
  const settings = JSON.parse(JSON.stringify(FORMS_DEFAULTS[type]));
  formsNameCounters[type] = (formsNameCounters[type] || 0) + 1;
  settings.name = type + '_' + formsNameCounters[type];
  if (type === 'radio') settings.groupName = 'group_1';
  const field = { id: ++formsNextId, type, page: pageNum, x: pdf.x, y: pdf.y, w: defW, h: defH, settings };
  formsFields.push(field);
  selectFormsField(field.id);
  openFieldPopup(field.id);
}

function deleteSelectedField() {
  if (formsSelId === null) return;
  const f = formsFields.find(f => f.id === formsSelId);
  const idsToDelete = new Set([formsSelId]);
  if (f?.childLabelId) idsToDelete.add(f.childLabelId);
  // Clean parent's childLabelId reference if deleting a child
  if (f?.parentId) {
    const parent = formsFields.find(p => p.id === f.parentId);
    if (parent) parent.childLabelId = null;
  }
  formsFields = formsFields.filter(f => !idsToDelete.has(f.id));
  formsSelId = null;
  document.getElementById('forms-delete-btn').disabled = true;
  renderAllFormsOverlays();
}

// ── Tab order panel ───────────────────────────────────────────────────────────
function openTabOrderPanel() {
  const panel = document.getElementById('forms-tab-order-panel');
  panel.classList.remove('hidden');
  renderTabOrderList();
}

function closeTabOrderPanel() {
  document.getElementById('forms-tab-order-panel').classList.add('hidden');
}

function renderTabOrderList() {
  const list = document.getElementById('tab-order-list');
  list.innerHTML = '';
  formsFields.filter(f => f.type !== 'picture').forEach((f, idx) => {
    const item = document.createElement('div');
    item.className = 'tab-order-item';
    item.draggable = true;
    item.dataset.idx = idx;

    const num = document.createElement('div');
    num.className = 'tab-order-num'; num.textContent = idx + 1;

    const name = document.createElement('div');
    name.className = 'tab-order-name';
    name.textContent = f.settings.name || f.settings.text || f.type;

    const badge = document.createElement('span');
    badge.className = 'tab-type-badge'; badge.textContent = f.type;

    item.appendChild(num); item.appendChild(name); item.appendChild(badge);

    item.addEventListener('dragstart', () => {
      formsTabDragIdx = idx;
      requestAnimationFrame(() => item.classList.add('is-dragging'));
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      list.querySelectorAll('.tab-order-item').forEach(i => i.classList.remove('drag-over'));
      formsTabDragIdx = null;
    });
    item.addEventListener('dragover', e => {
      if (formsTabDragIdx === null) return;
      e.preventDefault();
      list.querySelectorAll('.tab-order-item').forEach(i => i.classList.remove('drag-over'));
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', e => {
      if (!item.contains(e.relatedTarget)) item.classList.remove('drag-over');
    });
    item.addEventListener('drop', e => {
      if (formsTabDragIdx === null) return;
      e.preventDefault();
      const targetIdx = +item.dataset.idx;
      if (formsTabDragIdx === targetIdx) return;
      const [moved] = formsFields.splice(formsTabDragIdx, 1);
      formsFields.splice(targetIdx, 0, moved);
      formsTabDragIdx = null;
      renderTabOrderList();
    });

    list.appendChild(item);
  });
}

// ── Field settings popup ──────────────────────────────────────────────────────
function openFieldPopup(id) {
  formsEditingId = id;
  const f = formsFields.find(f => f.id === id);
  if (!f) return;
  // Clear new-item glow on explicit double-click open
  if (f.isNew) { f.isNew = false; renderAllFormsOverlays(); }
  const inner = document.getElementById('forms-popup-inner');
  inner.innerHTML = buildPopupHTML(f);
  document.getElementById('forms-field-popup').classList.remove('hidden');
  // Wire options list buttons for dropdown/list
  if (f.type === 'dropdown' || f.type === 'list') wireOptionsListEvents(inner, f);
  if (f.type === 'picture') wirePicturePopupEvents(inner, f);
  inner.querySelector('#popup-save-btn').addEventListener('click', saveFieldPopup);
  inner.querySelector('#popup-cancel-btn').addEventListener('click', closeFieldPopup);
}

function buildPopupHTML(f) {
  const s = f.settings;
  const t = f.type;
  let html = `<div class="popup-title">Configure ${t.charAt(0).toUpperCase()+t.slice(1)} Field</div>`;

  // Label and Highlight types have their own structure
  if (t === 'label') {
    const bgHex = s.bgColor ? rgbaToHex(s.bgColor) : '#ffffff';
    html += `
      <div class="popup-field">
        <label>Text</label>
        <input type="text" id="pp-label-text" value="${escHtml(s.text||'')}" autocomplete="off">
      </div>
      <div class="popup-row">
        <div class="popup-field">
          <label>Font</label>
          <select id="pp-font">
            <option value="Helvetica" ${s.fontFamily==='Helvetica'?'selected':''}>Helvetica</option>
            <option value="Times-Roman" ${s.fontFamily==='Times-Roman'?'selected':''}>Times Roman</option>
            <option value="Courier" ${s.fontFamily==='Courier'?'selected':''}>Courier</option>
          </select>
        </div>
        <div class="popup-field">
          <label>Size</label>
          <input type="number" id="pp-fontsize" value="${s.fontSize||11}" min="6" max="72" style="width:70px">
        </div>
      </div>
      <div class="popup-row">
        <div class="popup-field">
          <label>Text Color</label>
          <input type="color" id="pp-color" value="${s.color||'#000000'}">
        </div>
        <div class="popup-field">
          <label>Background</label>
          <input type="color" id="pp-bgcolor" value="${bgHex}">
          <label class="popup-check-row" style="margin-top:6px">
            <input type="checkbox" id="pp-bg-transparent" ${!s.bgColor?'checked':''}> Transparent
          </label>
        </div>
      </div>
      <div class="popup-footer">
        <button type="button" class="btn btn-outline btn-sm" id="popup-cancel-btn">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" id="popup-save-btn">Save</button>
      </div>`;
    return html;
  }

  if (t === 'highlight') {
    const bgHex = rgbaToHex(s.bgColor || 'rgba(255,235,59,0.4)');
    const bgOp  = Math.round(rgbaOpacity(s.bgColor || 'rgba(255,235,59,0.4)') * 100);
    html += `
      <div class="popup-field">
        <label>Highlight Color</label>
        <input type="color" id="pp-bgcolor" value="${bgHex}">
      </div>
      <div class="popup-field">
        <label>Opacity: <span id="pp-opacity-label">${bgOp}%</span></label>
        <input type="range" id="pp-opacity" min="5" max="100" value="${bgOp}" style="width:100%"
          oninput="document.getElementById('pp-opacity-label').textContent=this.value+'%'">
      </div>
      <div class="popup-footer">
        <button type="button" class="btn btn-outline btn-sm" id="popup-cancel-btn">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" id="popup-save-btn">Save</button>
      </div>`;
    return html;
  }

  if (t === 'picture') {
    html += `
      <div class="popup-field">
        <label>Image File</label>
        <label class="btn btn-outline btn-sm" for="pp-img-input" style="cursor:pointer;display:inline-block">
          Choose Image…
        </label>
        <input type="file" id="pp-img-input" accept=".jpg,.jpeg,.png,.bmp" style="display:none">
      </div>
      <div class="popup-field" id="pp-preview-wrap" style="display:${s.src ? 'block' : 'none'}">
        <label>Preview</label>
        <img id="pp-preview" src="${escHtml(s.src || '')}" alt="preview"
             style="max-width:100%;max-height:160px;border-radius:4px;border:1px solid var(--border)">
      </div>
      <p style="font-size:0.78rem;color:var(--text-muted);margin:0 0 8px">
        Supported: JPG, PNG (with transparency), BMP.
      </p>
      <div class="popup-footer">
        <button type="button" class="btn btn-outline btn-sm" id="popup-cancel-btn">Cancel</button>
        <button type="button" class="btn btn-primary btn-sm" id="popup-save-btn" ${s.src ? '' : 'disabled'}>Save</button>
      </div>`;
    return html;
  }

  // Common: name + label (for interactive field types)
  html += `
    <div class="popup-field">
      <label>Field Name (unique ID)</label>
      <input type="text" id="pp-name" value="${escHtml(s.name||'')}" placeholder="${t}_1" autocomplete="off">
    </div>
    <div class="popup-field">
      <label>Label (visible to user)</label>
      <input type="text" id="pp-label" value="${escHtml(s.label||'')}" autocomplete="off">
    </div>`;

  if (t === 'text') {
    html += `
      <div class="popup-field">
        <label>Default / Placeholder Value</label>
        <input type="text" id="pp-default" value="${escHtml(s.defaultValue)}" autocomplete="off">
      </div>
      <div class="popup-divider"></div>
      <div class="popup-section-label">Validation</div>
      <label class="popup-check-row"><input type="checkbox" id="pp-required" ${s.required?'checked':''}> Required</label>
      <label class="popup-check-row"><input type="checkbox" id="pp-numeric" ${s.numericOnly?'checked':''}> Numeric only</label>
      <div class="popup-field">
        <label>Max length (0 = unlimited)</label>
        <input type="number" id="pp-maxlen" value="${s.maxLength}" min="0" max="32767" style="width:90px">
      </div>`;
  } else if (t === 'checkbox') {
    html += `
      <div class="popup-field">
        <label>Group (optional, groups related checkboxes)</label>
        <input type="text" id="pp-group" value="${escHtml(s.group)}" autocomplete="off">
      </div>
      <div class="popup-field">
        <label>Value when checked</label>
        <input type="text" id="pp-checked-value" value="${escHtml(s.checkedValue)}" autocomplete="off">
      </div>
      <label class="popup-check-row"><input type="checkbox" id="pp-required" ${s.required?'checked':''}> Required</label>`;
  } else if (t === 'radio') {
    html += `
      <div class="popup-field">
        <label>Group Name (same name = same group)</label>
        <input type="text" id="pp-group-name" value="${escHtml(s.groupName)}" autocomplete="off">
      </div>
      <div class="popup-field">
        <label>This option's value</label>
        <input type="text" id="pp-value" value="${escHtml(s.value)}" autocomplete="off">
      </div>
      <label class="popup-check-row"><input type="checkbox" id="pp-required" ${s.required?'checked':''}> Required</label>`;
  } else if (t === 'dropdown' || t === 'list') {
    html += `
      <div class="popup-section-label">Options</div>
      <div class="popup-options-list" id="pp-options-list">`;
    s.options.forEach((opt, i) => {
      html += `<div class="popup-option-row" data-oi="${i}">
        <input type="text" class="pp-opt-input" value="${escHtml(opt)}" placeholder="Option ${i+1}">
        <button type="button" class="btn-icon btn-remove pp-opt-remove">${ICON_X}</button>
      </div>`;
    });
    html += `</div>
      <button type="button" class="btn btn-outline btn-sm" id="pp-add-option" style="margin-bottom:12px">+ Add Option</button>`;
    if (t === 'dropdown') {
      html += `<div class="popup-field"><label>Default selected index (0 = first)</label>
        <input type="number" id="pp-default-idx" value="${s.defaultIndex}" min="0" style="width:70px"></div>`;
    }
    if (t === 'list') {
      html += `<label class="popup-check-row"><input type="checkbox" id="pp-multiselect" ${s.multiSelect?'checked':''}> Allow multiple selections</label>`;
    }
    html += `<label class="popup-check-row"><input type="checkbox" id="pp-required" ${s.required?'checked':''}> Required</label>`;
  }

  // Border visibility (all types)
  html += `
    <div class="popup-divider"></div>
    <label class="popup-check-row"><input type="checkbox" id="pp-border" ${s.borderVisible?'checked':''}> Show border</label>
    <div class="popup-footer">
      <button type="button" class="btn btn-outline btn-sm" id="popup-cancel-btn">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="popup-save-btn">Save</button>
    </div>`;
  return html;
}

function wireOptionsListEvents(inner, f) {
  inner.querySelector('#pp-add-option').addEventListener('click', () => {
    const list = inner.querySelector('#pp-options-list');
    const idx  = list.querySelectorAll('.popup-option-row').length;
    const row  = document.createElement('div');
    row.className = 'popup-option-row'; row.dataset.oi = idx;
    row.innerHTML = `<input type="text" class="pp-opt-input" value="" placeholder="Option ${idx+1}"><button type="button" class="btn-icon btn-remove pp-opt-remove">${ICON_X}</button>`;
    list.appendChild(row);
    wireRemoveOptBtn(row, inner);
  });
  inner.querySelectorAll('.pp-opt-remove').forEach(btn => wireRemoveOptBtn(btn.closest('.popup-option-row'), inner));
}

function wireRemoveOptBtn(row, inner) {
  row.querySelector('.pp-opt-remove').addEventListener('click', () => {
    if (inner.querySelectorAll('.popup-option-row').length > 1) row.remove();
  });
}

function wirePicturePopupEvents(inner, f) {
  const fileInput   = inner.querySelector('#pp-img-input');
  const preview     = inner.querySelector('#pp-preview');
  const previewWrap = inner.querySelector('#pp-preview-wrap');
  const saveBtn     = inner.querySelector('#popup-save-btn');

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const isBmp = /\.bmp$/i.test(file.name) || file.type === 'image/bmp';
    let dataUrl;
    if (isBmp) {
      // BMP → PNG via off-screen canvas (pdf-lib has no native BMP support)
      dataUrl = await new Promise((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          URL.revokeObjectURL(objUrl);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = objUrl;
      });
    } else {
      // JPG/PNG: read bytes directly — no re-encode, preserves JPEG quality and PNG alpha
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    f.settings.src = dataUrl;
    preview.src = dataUrl;
    previewWrap.style.display = '';
    saveBtn.disabled = false;
  });
}

function saveFieldPopup() {
  // Determine whether this is a pending new field or an existing one
  const isPending = _pendingNewField !== null && _pendingNewField.id === formsEditingId;
  const f = isPending ? _pendingNewField : formsFields.find(f => f.id === formsEditingId);
  if (!f) { closeFieldPopup(); return; }
  const s = f.settings;
  const t = f.type;
  const g = id => document.getElementById(id);

  // Read type-specific settings from popup
  if (t === 'label') {
    s.text       = (g('pp-label-text')?.value || '').trim() || 'Label';
    s.fontFamily = g('pp-font')?.value || 'Helvetica';
    s.fontSize   = Math.max(6, parseInt(g('pp-fontsize')?.value || '11', 10));
    s.color      = g('pp-color')?.value || '#000000';
    s.bgColor    = g('pp-bg-transparent')?.checked ? '' : (g('pp-bgcolor')?.value || '');
  } else if (t === 'highlight') {
    const hex = g('pp-bgcolor')?.value || '#ffeb3b';
    const op  = (parseInt(g('pp-opacity')?.value || '40', 10) / 100).toFixed(2);
    s.bgColor = hexToRgba(hex, op);
  } else if (t === 'picture') {
    if (!s.src) { alert('Please choose an image file first.'); return; }
    // src already set on f.settings by wirePicturePopupEvents — nothing else to read
  } else {
    s.name  = (g('pp-name')?.value  || '').trim() || (t + '_' + f.id);
    s.label = (g('pp-label')?.value || '').trim();
    s.borderVisible = g('pp-border')?.checked ?? true;
    s.required      = g('pp-required')?.checked ?? false;

    if (t === 'text') {
      s.defaultValue = g('pp-default')?.value || '';
      s.numericOnly  = g('pp-numeric')?.checked ?? false;
      s.maxLength    = Math.max(0, parseInt(g('pp-maxlen')?.value || '0', 10));
    } else if (t === 'checkbox') {
      s.group        = g('pp-group')?.value || '';
      s.checkedValue = g('pp-checked-value')?.value || 'Yes';
    } else if (t === 'radio') {
      s.groupName = g('pp-group-name')?.value || 'group_1';
      s.value     = g('pp-value')?.value || 'option';
    } else if (t === 'dropdown' || t === 'list') {
      s.options = [...document.querySelectorAll('.pp-opt-input')].map(i => i.value).filter(v => v.trim());
      if (!s.options.length) s.options = ['Option 1'];
      if (t === 'dropdown') s.defaultIndex = Math.max(0, parseInt(g('pp-default-idx')?.value || '0', 10));
      if (t === 'list') s.multiSelect = g('pp-multiselect')?.checked ?? false;
    }
  }

  if (isPending) {
    // Place at center of current page
    const page   = formsCurPage || 1;
    const pdfPg  = formsPdfDoc?.getPages()[page - 1];
    const pgW    = pdfPg ? pdfPg.getSize().width  : 612;
    const pgH    = pdfPg ? pdfPg.getSize().height : 792;
    const [defW, defH] = FORMS_FIELD_SIZE[t];
    f.id   = ++formsNextId;   // replace negative temp id with real id
    f.page = page;
    f.x    = Math.max(0, (pgW - defW) / 2);
    f.y    = Math.max(0, (pgH - defH) / 2);
    f.w    = defW;
    f.h    = defH;
    f.isNew = true;
    formsFields.push(f);
    _pendingNewField = null;
    formsEditingId   = null;
    maybeCreateChildLabel(f);
    closeFieldPopup();
    selectFormsField(f.id);
  } else {
    // Existing field — sync child label text if applicable
    const child = f.childLabelId ? formsFields.find(c => c.id === f.childLabelId) : null;
    if (child && f.settings.label) child.settings.text = f.settings.label;
    // Auto-create child label if label text newly added
    maybeCreateChildLabel(f);
    closeFieldPopup();
    renderAllFormsOverlays();
  }
}

function closeFieldPopup() {
  document.getElementById('forms-field-popup').classList.add('hidden');
  formsEditingId   = null;
  _pendingNewField = null;
  // Reset any active tool button styling
  document.querySelectorAll('.forms-tool-btn').forEach(b => b.classList.remove('active'));
}

// ── Linked child labels ───────────────────────────────────────────────────────
function maybeCreateChildLabel(f) {
  if (f.type === 'label' || f.type === 'highlight' || f.type === 'picture') return;
  if (!f.settings.label || f.childLabelId != null) return;
  const [lW, lH] = FORMS_FIELD_SIZE.label;
  const child = {
    id: ++formsNextId,
    type: 'label',
    page: f.page,
    x: f.x,
    y: f.y + f.h + 4,
    w: lW, h: lH,
    settings: { ...JSON.parse(JSON.stringify(FORMS_DEFAULTS.label)), text: f.settings.label },
    isNew: false,
    parentId: f.id,
    childLabelId: null,
    childOffset: { dx: 0, dy: f.h + 4 },
  };
  f.childLabelId = child.id;
  formsFields.push(child);
}

function clearFormsFile() {
  formsFile = formsPdfDoc = formsPdfJsDoc = null;
  formsFields = []; formsNextId = 0; formsSelId = null;
  formsPageCount = 0; formsCurPage = 1; formsScales = [];
  document.getElementById('forms-dz-wrap').classList.remove('hidden');
  document.getElementById('forms-controls').classList.add('hidden');
  document.getElementById('forms-workspace').classList.add('hidden');
  document.getElementById('forms-editor-area').innerHTML = '';
  document.getElementById('forms-pages-strip').innerHTML = '';
  document.getElementById('forms-delete-btn').disabled = true;
  closeFieldPopup(); closeTabOrderPanel();
}

// ── Save forms PDF ────────────────────────────────────────────────────────────
async function runSaveForms() {
  if (!formsFile) return;

  // ── Pre-scan: check for non-WinAnsi characters in label fields ───────────────
  const unicodeLabels = formsFields.filter(
    f => f.type === 'label' && hasNonWinAnsi(f.settings.text || '')
  );
  let unicodeFont = null; // embedded Liberation font, set if user opts in

  if (unicodeLabels.length > 0) {
    const embed = await showUnicodeConfirm();
    if (embed) {
      // Determine which Liberation font to fetch based on the first affected field
      const familyToFile = {
        'Helvetica':   './src/fonts/LiberationSans-Regular.ttf',
        'Times-Roman': './src/fonts/LiberationSerif-Regular.ttf',
        'Courier':     './src/fonts/LiberationMono-Regular.ttf',
      };
      const firstFamily = unicodeLabels[0].settings.fontFamily || 'Helvetica';
      const fontPath = familyToFile[firstFamily] || familyToFile['Helvetica'];
      // fontBytes fetched below after doc is loaded (stored here as a promise)
      unicodeFont = fontPath; // temporarily hold the path; replaced with the embedded font below
    }
  }

  showLoading('Building form PDF…');
  try {
    const { PDFDocument, PDFName, PDFArray, PDFDict, PDFString, PDFNumber } = PDFLib;
    const buf    = await formsFile.arrayBuffer();
    const newDoc = await PDFDocument.load(buf);

    // If the user chose to embed a Unicode font, do so now
    if (typeof unicodeFont === 'string') {
      setProgress(2, 'Fetching Unicode font…'); await tick();
      newDoc.registerFontkit(fontkit);
      const fontBytes = await fetch(unicodeFont).then(r => {
        if (!r.ok) throw new Error(`Could not load font: ${unicodeFont}`);
        return r.arrayBuffer();
      });
      unicodeFont = await newDoc.embedFont(fontBytes); // replace path with embedded font object
    }

    const form   = newDoc.getForm();
    const pages  = newDoc.getPages();
    const radioGroups  = {};
    const stdFontCache = {}; // cache standard font embeds to avoid duplicates

    // Strip any previously-saved forms-editor annotations (label/highlight) from all pages
    // so they can be rewritten cleanly without stacking on re-save.
    newDoc.getPages().forEach(pg => {
      const annotsRef = pg.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      if (!annotsRef) return;
      const kept = [];
      for (let k = 0; k < annotsRef.size(); k++) {
        const ref  = annotsRef.get(k);
        const dict = newDoc.context.lookupMaybe(ref, PDFDict);
        const nm   = dict?.lookupMaybe(PDFName.of('NM'), PDFString)?.decodeText() || '';
        if (!nm.startsWith('forms-label-') && !nm.startsWith('forms-highlight-')) kept.push(ref);
      }
      pg.node.set(PDFName.of('Annots'), newDoc.context.obj(kept));
    });

    for (let i = 0; i < formsFields.length; i++) {
      setProgress(5 + (i / formsFields.length) * 85, `Adding field ${i + 1}…`);
      await tick();

      const f  = formsFields[i];
      const s  = f.settings;
      const pg = pages[f.page - 1];
      if (!pg) continue;

      // Existing AcroForm fields are already embedded in the loaded PDF; only update their position.
      if (f.isExisting) {
        try {
          const existingField = form.getField(s.name);
          const widgets = existingField.acroField.getWidgets();
          if (widgets.length > 0) {
            widgets[0].setRectangle({ x: f.x, y: f.y, width: f.w, height: f.h });
          }
        } catch(e) { /* field may have been renamed or removed – skip */ }
        continue;
      }

      const bw = s.borderVisible ? 1 : 0;
      const opts = { x: f.x, y: f.y, width: f.w, height: f.h, borderWidth: bw };

      if (f.type === 'text') {
        const tf = form.createTextField(s.name || ('text_' + f.id));
        if (s.defaultValue) tf.setText(s.defaultValue);
        if (s.required)     tf.enableRequired();
        if (s.maxLength > 0) tf.setMaxLength(s.maxLength);
        // pdf-lib only generates an appearance stream (making text visible) when a font
        // is explicitly supplied to addToPage — without it the widget has no /AP and many
        // viewers (Chromium, web) render it blank.
        const helvetica = stdFontCache[PDFLib.StandardFonts.Helvetica]
          ?? (stdFontCache[PDFLib.StandardFonts.Helvetica] = await newDoc.embedFont(PDFLib.StandardFonts.Helvetica));
        tf.addToPage(pg, { ...opts, font: helvetica });
        if (s.numericOnly) {
          try {
            const widgets = tf.acroField.getWidgets();
            if (widgets.length > 0) {
              const aa = PDFDict.withContext(newDoc.context);
              const jsStr = PDFString.of('AFNumber_Keystroke(2, 0, 0, 0, "", true);');
              const ksAction = PDFDict.withContext(newDoc.context);
              ksAction.set(PDFName.of('Type'), PDFName.of('Action'));
              ksAction.set(PDFName.of('S'),    PDFName.of('JavaScript'));
              ksAction.set(PDFName.of('JS'),   jsStr);
              aa.set(PDFName.of('K'), newDoc.context.register(ksAction));
              widgets[0].dict.set(PDFName.of('AA'), newDoc.context.register(aa));
            }
          } catch(e) { /* numeric JS injection failed — continue */ }
        }
      } else if (f.type === 'checkbox') {
        const cb = form.createCheckBox(s.name || ('checkbox_' + f.id));
        cb.addToPage(pg, opts);
      } else if (f.type === 'radio') {
        const gname = s.groupName || 'group_1';
        if (!radioGroups[gname]) {
          try { radioGroups[gname] = form.getRadioGroup(gname); }
          catch { radioGroups[gname] = form.createRadioGroup(gname); }
        }
        radioGroups[gname].addOptionToPage(s.value || 'opt', pg, opts);
      } else if (f.type === 'dropdown') {
        const dd = form.createDropdown(s.name || ('dropdown_' + f.id));
        const opts2 = s.options.length ? s.options : ['Option 1'];
        dd.addOptions(opts2);
        if (s.defaultIndex >= 0 && s.defaultIndex < opts2.length) dd.select(opts2[s.defaultIndex]);
        if (s.required) dd.enableRequired();
        dd.addToPage(pg, opts);
      } else if (f.type === 'list') {
        const lb = form.createOptionList(s.name || ('list_' + f.id));
        const opts2 = s.options.length ? s.options : ['Option 1'];
        lb.addOptions(opts2);
        if (s.multiSelect) lb.enableMultiselect();
        if (s.required)    lb.enableRequired();
        lb.addToPage(pg, opts);
      } else if (f.type === 'label') {
        // Saved as a FreeText annotation (round-trippable; stripped and re-written each save)
        let pdfFont, drawText;
        const stdMap2 = {
          'Helvetica':   PDFLib.StandardFonts.Helvetica,
          'Times-Roman': PDFLib.StandardFonts.TimesRoman,
          'Courier':     PDFLib.StandardFonts.Courier,
        };
        const fontKey2 = stdMap2[s.fontFamily] || PDFLib.StandardFonts.Helvetica;
        if (!stdFontCache[fontKey2]) stdFontCache[fontKey2] = await newDoc.embedFont(fontKey2);
        if (unicodeFont && hasNonWinAnsi(s.text)) { pdfFont = unicodeFont; drawText = s.text; }
        else { pdfFont = stdFontCache[fontKey2]; drawText = winAnsiSafe(s.text || ''); }

        const fontRef  = pdfFont.ref;
        const fontName = 'F0';
        const sz  = s.fontSize || 11;
        const [cr, cg2, cb2] = hexToRgb(s.color || '#000000');

        let apContent = '';
        const apRes = { Font: newDoc.context.obj({ [fontName]: fontRef }) };
        if (s.bgColor) {
          const [br, bgv, bb2, ba] = parseRgba(s.bgColor);
          apContent += `/GS0 gs ${br} ${bgv} ${bb2} rg 0 0 ${f.w} ${f.h} re f `;
          apRes.ExtGState = newDoc.context.obj({ GS0: newDoc.context.obj({ Type: 'ExtGState', ca: ba }) });
        }
        apContent += `BT /${fontName} ${sz} Tf ${cr/255} ${cg2/255} ${cb2/255} rg 2 2 Td (${pdfEscStr(drawText)}) Tj ET`;

        const apStream = newDoc.context.stream(apContent, {
          Type: 'XObject', Subtype: 'Form', FormType: 1,
          BBox: newDoc.context.obj([0, 0, f.w, f.h]),
          Resources: newDoc.context.obj(apRes),
        });
        const apRef = newDoc.context.register(apStream);
        const labelAnnotRef = newDoc.context.register(newDoc.context.obj({
          Type: 'Annot', Subtype: 'FreeText',
          Rect: newDoc.context.obj([f.x, f.y, f.x + f.w, f.y + f.h]),
          Contents: PDFString.of(drawText),
          NM: PDFString.of(`forms-label-${f.id}`),
          DA: PDFString.of(`/${fontName} ${sz} Tf ${cr/255} ${cg2/255} ${cb2/255} rg`),
          AP: newDoc.context.obj({ N: apRef }),
          Border: newDoc.context.obj([0, 0, 0]),
          F: 4,
        }));
        addAnnotToPage(pg, newDoc, labelAnnotRef);

      } else if (f.type === 'highlight') {
        // Saved as a Square annotation (round-trippable; stripped and re-written each save)
        const [hr, hg2, hb2, ha] = parseRgba(s.bgColor || 'rgba(255,235,59,0.4)');
        const hlApContent = `/GS0 gs ${hr} ${hg2} ${hb2} rg 0 0 ${f.w} ${f.h} re f`;
        const hlApStream = newDoc.context.stream(hlApContent, {
          Type: 'XObject', Subtype: 'Form', FormType: 1,
          BBox: newDoc.context.obj([0, 0, f.w, f.h]),
          Resources: newDoc.context.obj({
            ExtGState: newDoc.context.obj({ GS0: newDoc.context.obj({ Type: 'ExtGState', ca: ha, CA: ha }) }),
          }),
        });
        const hlApRef = newDoc.context.register(hlApStream);
        const hlAnnotRef = newDoc.context.register(newDoc.context.obj({
          Type: 'Annot', Subtype: 'Square',
          Rect: newDoc.context.obj([f.x, f.y, f.x + f.w, f.y + f.h]),
          NM: PDFString.of(`forms-highlight-${f.id}`),
          IC: newDoc.context.obj([hr, hg2, hb2]),
          CA: ha,
          AP: newDoc.context.obj({ N: hlApRef }),
          Border: newDoc.context.obj([0, 0, 0]),
          BS: newDoc.context.obj({ W: 0 }),
          F: 4,
        }));
        addAnnotToPage(pg, newDoc, hlAnnotRef);
      } else if (f.type === 'picture') {
        if (!s.src) continue;
        const isPng = s.src.startsWith('data:image/png');
        const b64   = s.src.slice(s.src.indexOf(',') + 1);
        const bStr  = atob(b64);
        const bytes = new Uint8Array(bStr.length);
        for (let k = 0; k < bStr.length; k++) bytes[k] = bStr.charCodeAt(k);
        let embeddedImg;
        try {
          embeddedImg = isPng ? await newDoc.embedPng(bytes) : await newDoc.embedJpg(bytes);
        } catch (embedErr) {
          console.warn('Picture embed failed for field', f.id, embedErr);
          continue;
        }
        // pdf-lib drawImage uses bottom-left origin natively — same as f.x, f.y, f.w, f.h
        pg.drawImage(embeddedImg, { x: f.x, y: f.y, width: f.w, height: f.h });
      }
    }

    // Set tab order (/CO array)
    try {
      const acroFormRef = newDoc.catalog.lookup(PDFName.of('AcroForm'));
      if (acroFormRef) {
        const acroForm = acroFormRef instanceof PDFDict ? acroFormRef
          : newDoc.context.lookup(acroFormRef);
        if (acroForm) {
          const coArr = PDFArray.withContext(newDoc.context);
          form.getFields().forEach(field => {
            coArr.push(field.acroField.ref);
          });
          acroForm.set(PDFName.of('CO'), coArr);
        }
      }
    } catch(e) { /* tab order optional */ }

    setProgress(93, 'Saving…'); await tick();
    const bytes = await newDoc.save();
    setProgress(100, 'Done!'); await tick();

    const outName = (formsFile.name.replace(/\.pdf$/i, '') || 'document') + '_form.pdf';
    triggerDownload(new Blob([bytes], { type: 'application/pdf' }), outName);
  } catch (err) {
    console.error(err);
    alert('Error saving form PDF: ' + err.message);
  } finally {
    hideLoading();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  applyTheme(getCookie('theme') || 'light');
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Snap toggle
  const snapBtn = document.getElementById('snap-toggle');
  snapBtn.addEventListener('click', () => {
    formsSnapEnabled = !formsSnapEnabled;
    snapBtn.classList.toggle('snap-on', formsSnapEnabled);
    snapBtn.innerHTML = formsSnapEnabled ? '&#10003; Snap' : '&#10007; Snap';
  });
  snapBtn.classList.toggle('snap-on', formsSnapEnabled);
  snapBtn.innerHTML = formsSnapEnabled ? '&#10003; Snap' : '&#10007; Snap';

  // Navigation
  document.getElementById('btn-go-combine').addEventListener('click',    () => showView('view-combine'));
  document.getElementById('btn-go-split').addEventListener('click',      () => showView('view-split'));
  document.getElementById('btn-go-modify').addEventListener('click',     () => showView('view-modify'));
  document.getElementById('btn-go-repaginate').addEventListener('click', () => showView('view-repaginate'));
  document.getElementById('btn-go-forms').addEventListener('click',      () => showView('view-forms'));
  document.getElementById('back-btn').addEventListener('click', goBack);

  // Features
  setupCombine();
  setupSplit();
  setupRepaginate();
  setupForms();
});
