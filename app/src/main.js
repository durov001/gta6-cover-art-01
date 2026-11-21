// Velvet Heat Cover Studio — editor wiring.
// Owns the app state, the photo store, undo/redo, panel cropping and
// the PNG exports. Everything runs locally; no photo ever leaves the
// machine and the app makes no network request.

import {
  GRADES, LAYOUTS, EXPORT_SIZES, DEMO_CAST, PHOTO_ROLES,
  renderCover, defaultState, layoutRects,
} from './cover.js';

const $ = (id) => document.getElementById(id);
const PREVIEW_W = 960;
const PREVIEW_H = 540;

export const state = defaultState();
export const photoStore = new Map();
let userCounter = 0;
let selectedIndex = 1;
let lastRects = [];
let dragStart = null;

// ---- photo store -------------------------------------------------------

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadDemoCast() {
  const jobs = DEMO_CAST.map(async (demo, i) => {
    const id = `demo-${i}`;
    try {
      const img = await loadImage(demo.src);
      photoStore.set(id, { img, src: demo.src, name: demo.role });
    } catch (err) {
      photoStore.set(id, { img: null, src: demo.src, name: demo.role });
    }
    state.photos[i].storeId = id;
    attachImages();
    renderPreview();
  });
  await Promise.all(jobs);
  refreshSlots();
}

function attachImages() {
  state.photos.forEach((photo) => {
    const entry = photoStore.get(photo.storeId);
    photo.img = entry ? entry.img : null;
  });
}

function addUserPhoto(file, slotIndex) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const id = `user-${++userCounter}`;
      try {
        const img = await loadImage(reader.result);
        photoStore.set(id, { img, src: reader.result, name: file.name });
      } catch (err) {
        return resolve(false);
      }
      const idx = slotIndex >= 0 ? slotIndex : firstEmptySlot();
      pushHistory();
      state.photos[idx] = {
        storeId: id,
        role: state.photos[idx].role || PHOTO_ROLES[idx % PHOTO_ROLES.length],
        crop: { x: 0, y: 0, zoom: 1, flip: false },
        img: photoStore.get(id).img,
      };
      selectedIndex = idx;
      refreshSlots();
      renderPreview();
      resolve(true);
    };
    reader.readAsDataURL(file);
  });
}

function firstEmptySlot() {
  for (let i = 0; i < state.photos.length; i++) {
    if (!state.photos[i].img) return i;
  }
  return selectedIndex;
}

// ---- history (undo / redo) ---------------------------------------------

const past = [];
const future = [];
const HISTORY_LIMIT = 30;

function serializeState() {
  return JSON.stringify({
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    script: state.script,
    tagline: state.tagline,
    reviewQuote: state.reviewQuote,
    reviewSource: state.reviewSource,
    billingLines: state.billingLines,
    seal: state.seal,
    sealRing: state.sealRing,
    edition: state.edition,
    release: state.release,
    effects: state.effects,
    extras: state.extras,
    autoTags: state.autoTags,
    photos: state.photos.map((p) => ({ storeId: p.storeId, role: p.role, crop: p.crop })),
  });
}

function restoreState(json) {
  const data = JSON.parse(json);
  Object.assign(state, data);
  state.photos = data.photos.map((p) => ({ ...p, img: null }));
  attachImages();
  syncForm();
  refreshSlots();
  renderPreview();
}

function pushHistory() {
  past.push(serializeState());
  if (past.length > HISTORY_LIMIT) past.shift();
  future.length = 0;
  updateHistoryButtons();
}

function undo() {
  if (!past.length) return;
  future.push(serializeState());
  restoreState(past.pop());
  updateHistoryButtons();
}

function redo() {
  if (!future.length) return;
  past.push(serializeState());
  restoreState(future.pop());
  updateHistoryButtons();
}

function updateHistoryButtons() {
  $('undoBtn').disabled = past.length === 0;
  $('redoBtn').disabled = future.length === 0;
}

// ---- preview -----------------------------------------------------------

export function renderPreview() {
  const canvas = $('previewCanvas');
  canvas.width = PREVIEW_W;
  canvas.height = PREVIEW_H;
  attachImages();
  const out = renderCover(canvas, state, 'wide', selectedIndex);
  lastRects = out.rects;
  updateCropBar();
}

function aspectFor(sizeId) {
  if (sizeId === 'portrait') return 'tall';
  if (sizeId === 'square') return 'square';
  return 'wide';
}

// ---- slots -------------------------------------------------------------

function refreshSlots() {
  const wrap = $('photoSlots');
  wrap.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `slot${i === selectedIndex ? ' selected' : ''}`;
    slot.title = `Panel ${i + 1} — ${photo.role}`;
    const entry = photoStore.get(photo.storeId);
    if (entry && entry.img) {
      const thumb = document.createElement('img');
      thumb.src = entry.src;
      thumb.alt = photo.role;
      slot.appendChild(thumb);
    } else {
      const plus = document.createElement('span');
      plus.className = 'slot-plus';
      plus.textContent = '+';
      slot.appendChild(plus);
    }
    const num = document.createElement('span');
    num.className = 'slot-num';
    num.textContent = String(i + 1).padStart(2, '0');
    slot.appendChild(num);
    slot.addEventListener('click', () => {
      selectedIndex = i;
      refreshSlots();
      renderPreview();
    });
    wrap.appendChild(slot);
  });
  const hint = document.createElement('span');
  hint.className = 'slot-hint';
  hint.textContent = 'Click a slot, then choose a photo to replace it.';
  wrap.appendChild(hint);
}

// ---- form --------------------------------------------------------------

function bindText(id, key) {
  $(id).addEventListener('input', () => {
    state[key] = $(id).value;
    renderPreview();
  });
}

function bindSlider(id, key) {
  $(id).addEventListener('input', () => {
    state.effects[key] = Number($(id).value);
    $(`${id}Val`).textContent = $(id).value;
    renderPreview();
  });
}

function syncForm() {
  $('titleInput').value = state.title;
  $('scriptInput').value = state.script;
  $('taglineInput').value = state.tagline;
  $('reviewInput').value = state.reviewQuote;
  $('reviewSourceInput').value = state.reviewSource;
  $('billingInput').value = state.billingLines.join('\n');
  $('sealInput').value = state.seal;
  $('sealRingInput').value = state.sealRing;
  $('editionInput').value = state.edition;
  $('releaseInput').value = state.release;
  ['grain', 'halftone', 'leaks', 'vignette'].forEach((key) => {
    $(`${key}Slider`).value = state.effects[key];
    $(`${key}SliderVal`).textContent = state.effects[key];
  });
  $('reviewToggle').checked = state.extras.review;
  $('sealToggle').checked = state.extras.seal;
  $('billingToggle').checked = state.extras.billing;
  $('autoTagsCheck').checked = state.autoTags;
  buildTagInputs();
  document.querySelectorAll('.layout-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('.grade-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
}

function buildTagInputs() {
  const wrap = $('tagInputs');
  wrap.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const label = document.createElement('label');
    label.className = 'tag-row';
    const span = document.createElement('span');
    span.textContent = `Panel ${i + 1}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = photo.role;
    input.maxLength = 24;
    input.addEventListener('input', () => {
      photo.role = input.value.toUpperCase();
      renderPreview();
    });
    label.append(span, input);
    wrap.appendChild(label);
  });
}

function buildPickers() {
  const layoutWrap = $('layoutPicker');
  Object.entries(LAYOUTS).forEach(([key, meta]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.dataset.layout = key;
    b.textContent = meta.label;
    b.addEventListener('click', () => {
      pushHistory();
      state.layout = key;
      syncForm();
      renderPreview();
    });
    layoutWrap.appendChild(b);
  });
  const gradeWrap = $('gradePicker');
  Object.entries(GRADES).forEach(([key, meta]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn';
    b.dataset.grade = key;
    const swatch = document.createElement('span');
    swatch.className = 'grade-swatch';
    swatch.style.background = `linear-gradient(135deg, ${meta.title[0]}, ${meta.title[2]})`;
    b.append(swatch, document.createTextNode(meta.label));
    b.addEventListener('click', () => {
      pushHistory();
      state.grade = key;
      syncForm();
      renderPreview();
    });
    gradeWrap.appendChild(b);
  });
}

// ---- crop bar ----------------------------------------------------------

function updateCropBar() {
  const photo = state.photos[selectedIndex];
  if (!photo) return;
  $('zoomSlider').value = photo.crop.zoom || 1;
  $('zoomVal').textContent = `${Math.round((photo.crop.zoom || 1) * 100)}%`;
  $('cropLabel').textContent = `Panel ${selectedIndex + 1} — ${photo.role}`;
  $('flipBtn').classList.toggle('active', !!photo.crop.flip);
}

function selectedPhoto() {
  return state.photos[selectedIndex];
}

// ---- one-photo cover + shuffle ------------------------------------------

function buildMyCover() {
  pushHistory();
  const heroId = state.photos[0].storeId;
  const heroImg = photoStore.get(heroId)?.img;
  if (!heroImg) return;
  state.layout = 'mosaic';
  const crops = [
    { x: -0.5, y: -0.3, zoom: 2.1, flip: false },
    { x: 0, y: 0, zoom: 1.15, flip: false },
    { x: 0.5, y: 0.3, zoom: 2.4, flip: true },
    { x: -0.4, y: 0.4, zoom: 1.9, flip: false },
  ];
  [0, 1, 2, 3].forEach((slot, k) => {
    state.photos[slot] = {
      storeId: heroId,
      role: state.photos[slot].role,
      crop: { ...crops[k] },
      img: heroImg,
    };
  });
  // The two remaining panels keep the demo scene photos.
  [4, 5].forEach((slot) => {
    state.photos[slot] = {
      storeId: `demo-${slot}`,
      role: state.photos[slot].role,
      crop: { x: 0, y: 0, zoom: 1, flip: false },
      img: photoStore.get(`demo-${slot}`)?.img || null,
    };
  });
  selectedIndex = 1;
  syncForm();
  refreshSlots();
  renderPreview();
}

function shuffleLook() {
  pushHistory();
  const layoutKeys = Object.keys(LAYOUTS);
  const gradeKeys = Object.keys(GRADES);
  state.layout = layoutKeys[Math.floor(Math.random() * layoutKeys.length)];
  state.grade = gradeKeys[Math.floor(Math.random() * gradeKeys.length)];
  syncForm();
  renderPreview();
}

// ---- export ------------------------------------------------------------

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve();
    }, 'image/png');
  });
}

async function exportSize(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state, aspectFor(size.id), -1);
  await downloadCanvas(canvas, `velvet-heat-${size.id}-${size.w}x${size.h}.png`);
}

async function exportAll() {
  $('exportAllBtn').disabled = true;
  $('exportAllBtn').textContent = 'Exporting…';
  for (const size of EXPORT_SIZES) {
    await exportSize(size);
    await new Promise((r) => setTimeout(r, 350));
  }
  $('exportAllBtn').disabled = false;
  $('exportAllBtn').textContent = 'Export all 3 PNGs';
}

// ---- canvas interaction -------------------------------------------------

function canvasPoint(event) {
  const canvas = $('previewCanvas');
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * PREVIEW_W,
    y: ((event.clientY - box.top) / box.height) * PREVIEW_H,
  };
}

function hitPanel(point) {
  for (let i = lastRects.length - 1; i >= 0; i--) {
    const r = lastRects[i];
    if (
      point.x >= r.x * PREVIEW_W && point.x <= (r.x + r.w) * PREVIEW_W
      && point.y >= r.y * PREVIEW_H && point.y <= (r.y + r.h) * PREVIEW_H
    ) return i;
  }
  return -1;
}

function bindCanvas() {
  const canvas = $('previewCanvas');
  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    const hit = hitPanel(point);
    if (hit < 0) return;
    selectedIndex = hit;
    refreshSlots();
    const photo = selectedPhoto();
    dragStart = { x: point.x, y: point.y, cropX: photo.crop.x || 0, cropY: photo.crop.y || 0 };
    canvas.setPointerCapture(event.pointerId);
    renderPreview();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragStart) return;
    const point = canvasPoint(event);
    const rect = lastRects[selectedIndex];
    if (!rect) return;
    const photo = selectedPhoto();
    const dx = (point.x - dragStart.x) / (rect.w * PREVIEW_W);
    const dy = (point.y - dragStart.y) / (rect.h * PREVIEW_H);
    photo.crop.x = Math.max(-1, Math.min(1, dragStart.cropX + dx));
    photo.crop.y = Math.max(-1, Math.min(1, dragStart.cropY + dy));
    renderPreview();
  });
  const endDrag = () => { dragStart = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const photo = selectedPhoto();
    const zoom = (photo.crop.zoom || 1) * (event.deltaY < 0 ? 1.08 : 0.93);
    photo.crop.zoom = Math.max(1, Math.min(4, zoom));
    renderPreview();
  }, { passive: false });
}

// ---- init ---------------------------------------------------------------

export async function initEditor() {
  buildPickers();
  bindText('titleInput', 'title');
  bindText('scriptInput', 'script');
  bindText('taglineInput', 'tagline');
  bindText('reviewInput', 'reviewQuote');
  bindText('reviewSourceInput', 'reviewSource');
  bindText('sealInput', 'seal');
  bindText('sealRingInput', 'sealRing');
  bindText('editionInput', 'edition');
  $('releaseInput').addEventListener('input', () => {
    state.release = $('releaseInput').value;
    state.billingLines[2] = `COMING ${state.release}`;
    $('billingInput').value = state.billingLines.join('\n');
    renderPreview();
  });
  $('billingInput').addEventListener('input', () => {
    state.billingLines = $('billingInput').value.split('\n');
    renderPreview();
  });
  ['grain', 'halftone', 'leaks', 'vignette'].forEach((key) => bindSlider(`${key}Slider`, key));
  $('reviewToggle').addEventListener('change', () => { state.extras.review = $('reviewToggle').checked; renderPreview(); });
  $('sealToggle').addEventListener('change', () => { state.extras.seal = $('sealToggle').checked; renderPreview(); });
  $('billingToggle').addEventListener('change', () => { state.extras.billing = $('billingToggle').checked; renderPreview(); });
  $('autoTagsCheck').addEventListener('change', () => {
    state.autoTags = $('autoTagsCheck').checked;
    if (state.autoTags) {
      state.photos.forEach((p, i) => { p.role = PHOTO_ROLES[i % PHOTO_ROLES.length]; });
      buildTagInputs();
      renderPreview();
    }
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
      event.preventDefault();
      redo();
    }
  });
  $('photoInput').addEventListener('change', async (event) => {
    const files = [...event.target.files].filter((f) => f.type.startsWith('image/'));
    for (const file of files) {
      await addUserPhoto(file, selectedIndex);
      selectedIndex = (selectedIndex + 1) % state.photos.length;
    }
    event.target.value = '';
  });
  $('demoBtn').addEventListener('click', async () => {
    pushHistory();
    await loadDemoCast();
    state.photos.forEach((p, i) => { p.role = DEMO_CAST[i].role; });
    syncForm();
    refreshSlots();
    renderPreview();
  });
  $('buildBtn').addEventListener('click', buildMyCover);
  $('shuffleBtn').addEventListener('click', shuffleLook);
  $('zoomSlider').addEventListener('input', () => {
    selectedPhoto().crop.zoom = Number($('zoomSlider').value);
    renderPreview();
  });
  $('flipBtn').addEventListener('click', () => {
    const photo = selectedPhoto();
    photo.crop.flip = !photo.crop.flip;
    renderPreview();
  });
  $('resetCropBtn').addEventListener('click', () => {
    selectedPhoto().crop = { x: 0, y: 0, zoom: 1, flip: false };
    renderPreview();
  });
  $('exportAllBtn').addEventListener('click', exportAll);
  document.querySelectorAll('.export-one').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = EXPORT_SIZES.find((s) => s.id === btn.dataset.size);
      if (size) exportSize(size);
    });
  });
  // Drag and drop + paste anywhere in the window.
  const dropZone = $('app');
  ['dragover', 'dragenter'].forEach((name) => {
    dropZone.addEventListener(name, (event) => {
      event.preventDefault();
      dropZone.classList.add('dragging');
    });
  });
  ['dragleave', 'drop'].forEach((name) => {
    dropZone.addEventListener(name, (event) => {
      event.preventDefault();
      dropZone.classList.remove('dragging');
    });
  });
  dropZone.addEventListener('drop', async (event) => {
    const files = [...event.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    for (const file of files) {
      await addUserPhoto(file, selectedIndex);
      selectedIndex = (selectedIndex + 1) % state.photos.length;
    }
  });
  document.addEventListener('paste', async (event) => {
    const items = [...(event.clipboardData?.items || [])];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) await addUserPhoto(file, selectedIndex);
      }
    }
  });
  bindCanvas();
  syncForm();
  refreshSlots();
  updateHistoryButtons();
  await document.fonts.ready;
  await loadDemoCast();
  renderPreview();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}
