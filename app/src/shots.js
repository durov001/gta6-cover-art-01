// Velvet Heat Cover Studio — screenshot scenes.
// URL params pick a scene for headless captures:
//   ?shot=cover    full-bleed 16:9 poster, no editor chrome (1280x720)
//   ?shot=editor   the full editor with a panel selected (1024x640)
//   ?shot=cover45  full-bleed 4:5 poster reflow (1024x1280)
//   ?shot=cover11  full-bleed 1:1 poster reflow (1080x1080)
//   &hero=alt      swap the hero photo with another cast member
// Every scene sets window.__shotReady = true once painted.

import { renderCover, defaultState, DEMO_CAST } from './cover.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot') || 'editor';

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function waitFor(predicate, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (predicate()) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

async function loadDemoPhotos(state) {
  const jobs = state.photos.map(async (photo, i) => {
    photo.img = await loadImage(DEMO_CAST[i].src);
  });
  await Promise.all(jobs);
}

async function renderFullBleed(width, height, aspect, swapHero) {
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.background = '#0d0518';
  const app = document.getElementById('app');
  if (app) app.style.display = 'none';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  document.body.appendChild(canvas);
  const state = defaultState();
  await document.fonts.ready;
  await loadDemoPhotos(state);
  if (swapHero) {
    const tmp = state.photos[1];
    state.photos[1] = state.photos[3];
    state.photos[3] = tmp;
  }
  renderCover(canvas, state, aspect, -1);
  window.__shotReady = true;
}

async function runEditorScene() {
  await document.fonts.ready;
  await waitFor(() => document.querySelectorAll('.slot').length >= 6);
  await waitFor(() => document.querySelectorAll('.slot img').length >= 4, 20000);
  const slots = document.querySelectorAll('.slot');
  if (slots[1]) slots[1].click();
  await new Promise((r) => setTimeout(r, 400));
  window.__shotReady = true;
}

async function runShot() {
  try {
    if (shot === 'cover') {
      await renderFullBleed(1280, 720, 'wide', false);
    } else if (shot === 'cover45') {
      await renderFullBleed(1024, 1280, 'tall', false);
    } else if (shot === 'cover11') {
      await renderFullBleed(1080, 1080, 'square', params.get('hero') === 'alt');
    } else {
      await runEditorScene();
    }
  } catch (err) {
    window.__shotError = String(err);
    window.__shotReady = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runShot);
} else {
  runShot();
}
