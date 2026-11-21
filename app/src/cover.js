// Velvet Heat Cover Studio — poster renderer (Canvas 2D).
// One renderer drives the live preview, the PNG exports and the
// screenshot scenes, so what the editor shows is what gets exported.
// All artwork is drawn in code; photos come from the user's machine or
// from the demo cast shipped under app/samples/.

export const PHOTO_ROLES = [
  'THE DRIVER', 'THE BOSS', 'THE FIXER',
  'THE CAPTAIN', 'THE MECHANIC', 'THE LOOKOUT',
];

export const DEMO_CAST = [
  { src: 'samples/boulevard.jpg', role: 'THE DRIVER' },
  { src: 'samples/cast-man-rooftop.jpg', role: 'THE BOSS' },
  { src: 'samples/cast-friends-neon.jpg', role: 'THE FIXER' },
  { src: 'samples/pier.jpg', role: 'THE CAPTAIN' },
  { src: 'samples/cast-woman-boat.jpg', role: 'THE MECHANIC' },
  { src: 'samples/cast-man-motel.jpg', role: 'THE LOOKOUT' },
];

export const GRADES = {
  gold: {
    label: 'Sunset Gold',
    filter: 'saturate(1.28) contrast(1.06) brightness(1.03) sepia(0.16) hue-rotate(-6deg)',
    title: ['#ffe259', '#ffa751', '#ff5e7a', '#c94bff'],
    script: '#ff2e88', accent: '#ffb347', tint: ['rgba(255,150,60,0.20)', 'rgba(200,40,160,0.20)'],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.12) brightness(0.96) hue-rotate(18deg)',
    title: ['#00e5ff', '#7c4dff', '#ff2ea6', '#ffea00'],
    script: '#00e5ff', accent: '#ff2ea6', tint: ['rgba(0,220,255,0.16)', 'rgba(255,20,150,0.22)'],
  },
  teal: {
    label: 'Tropic Teal',
    filter: 'saturate(1.2) contrast(1.04) brightness(1.04) hue-rotate(28deg)',
    title: ['#a8ff78', '#00e5a0', '#00b4d8', '#4361ee'],
    script: '#00e5a0', accent: '#a8ff78', tint: ['rgba(0,220,160,0.18)', 'rgba(0,90,200,0.18)'],
  },
  ultra: {
    label: 'Ultraviolet',
    filter: 'saturate(1.35) contrast(1.1) brightness(0.94) hue-rotate(-32deg)',
    title: ['#f72585', '#b5179e', '#7209b7', '#3a0ca3'],
    script: '#f72585', accent: '#b5179e', tint: ['rgba(240,30,130,0.18)', 'rgba(60,10,160,0.24)'],
  },
  retro: {
    label: 'Retro Print',
    filter: 'saturate(0.92) contrast(1.12) brightness(1.02) sepia(0.42)',
    title: ['#f4d35e', '#ee964b', '#f95738', '#7b2cbf'],
    script: '#f95738', accent: '#f4d35e', tint: ['rgba(244,200,90,0.16)', 'rgba(200,60,40,0.18)'],
  },
};

export const LAYOUTS = {
  mosaic: { label: 'Cast Mosaic' },
  strips: { label: 'Diagonal Strips' },
  grid: { label: 'Six Grid' },
};

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

// Small deterministic PRNG so grain, halftone and the barcode are stable.
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Panel rectangles per layout and aspect. Coordinates are fractions of the
// poster width/height; tilt is in degrees; hero marks the large panel.
// These coordinates are the studio's own composition.
export function layoutRects(layout, aspect) {
  if (layout === 'strips') {
    if (aspect === 'tall') {
      return [
        { x: 0.02, y: 0.10, w: 0.225, h: 0.40, tilt: -2.5 },
        { x: 0.265, y: 0.10, w: 0.225, h: 0.40, tilt: 2 },
        { x: 0.51, y: 0.10, w: 0.225, h: 0.40, tilt: -2 },
        { x: 0.755, y: 0.10, w: 0.225, h: 0.40, tilt: 2.5 },
        { x: 0.02, y: 0.73, w: 0.47, h: 0.15, tilt: -1.5 },
        { x: 0.51, y: 0.73, w: 0.47, h: 0.15, tilt: 1.5 },
      ];
    }
    if (aspect === 'square') {
      return [
        { x: 0.02, y: 0.10, w: 0.31, h: 0.30, tilt: -2 },
        { x: 0.345, y: 0.10, w: 0.31, h: 0.30, tilt: 2 },
        { x: 0.67, y: 0.10, w: 0.31, h: 0.30, tilt: -2 },
        { x: 0.02, y: 0.67, w: 0.31, h: 0.21, tilt: 2 },
        { x: 0.345, y: 0.67, w: 0.31, h: 0.21, tilt: -2 },
        { x: 0.67, y: 0.67, w: 0.31, h: 0.21, tilt: 2 },
      ];
    }
    return [
      { x: 0.02, y: 0.10, w: 0.15, h: 0.78, tilt: -2.5 },
      { x: 0.185, y: 0.10, w: 0.15, h: 0.78, tilt: 2 },
      { x: 0.35, y: 0.10, w: 0.15, h: 0.78, tilt: -2, hero: true },
      { x: 0.515, y: 0.10, w: 0.15, h: 0.78, tilt: 2.5 },
      { x: 0.68, y: 0.10, w: 0.15, h: 0.78, tilt: -2 },
      { x: 0.845, y: 0.10, w: 0.135, h: 0.78, tilt: 2 },
    ];
  }
  if (layout === 'grid') {
    if (aspect === 'tall') {
      return [
        { x: 0.02, y: 0.10, w: 0.47, h: 0.17, tilt: -1 },
        { x: 0.51, y: 0.10, w: 0.47, h: 0.17, tilt: 1 },
        { x: 0.02, y: 0.29, w: 0.47, h: 0.17, tilt: 1 },
        { x: 0.51, y: 0.29, w: 0.47, h: 0.17, tilt: -1 },
        { x: 0.02, y: 0.73, w: 0.47, h: 0.15, tilt: -1 },
        { x: 0.51, y: 0.73, w: 0.47, h: 0.15, tilt: 1 },
      ];
    }
    if (aspect === 'square') {
      return [
        { x: 0.02, y: 0.10, w: 0.31, h: 0.30, tilt: -1 },
        { x: 0.345, y: 0.10, w: 0.31, h: 0.30, tilt: 1 },
        { x: 0.67, y: 0.10, w: 0.31, h: 0.30, tilt: -1 },
        { x: 0.02, y: 0.67, w: 0.31, h: 0.21, tilt: 1 },
        { x: 0.345, y: 0.67, w: 0.31, h: 0.21, tilt: -1 },
        { x: 0.67, y: 0.67, w: 0.31, h: 0.21, tilt: 1 },
      ];
    }
    return [
      { x: 0.02, y: 0.10, w: 0.31, h: 0.37, tilt: -1 },
      { x: 0.345, y: 0.10, w: 0.31, h: 0.37, tilt: 1 },
      { x: 0.67, y: 0.10, w: 0.31, h: 0.37, tilt: -1 },
      { x: 0.02, y: 0.51, w: 0.31, h: 0.37, tilt: 1 },
      { x: 0.345, y: 0.51, w: 0.31, h: 0.37, tilt: -1 },
      { x: 0.67, y: 0.51, w: 0.31, h: 0.37, tilt: 1 },
    ];
  }
  // mosaic (default)
  if (aspect === 'tall') {
    return [
      { x: 0.02, y: 0.10, w: 0.225, h: 0.36, tilt: -1.5 },
      { x: 0.265, y: 0.10, w: 0.225, h: 0.36, tilt: 1.5 },
      { x: 0.51, y: 0.10, w: 0.225, h: 0.36, tilt: -1.5, hero: true },
      { x: 0.755, y: 0.10, w: 0.225, h: 0.36, tilt: 1.5 },
      { x: 0.02, y: 0.73, w: 0.47, h: 0.15, tilt: 1 },
      { x: 0.51, y: 0.73, w: 0.47, h: 0.15, tilt: -1 },
    ];
  }
  if (aspect === 'square') {
    return [
      { x: 0.02, y: 0.10, w: 0.31, h: 0.30, tilt: -1.5 },
      { x: 0.345, y: 0.10, w: 0.31, h: 0.30, tilt: 1.5, hero: true },
      { x: 0.67, y: 0.10, w: 0.31, h: 0.30, tilt: -1.5 },
      { x: 0.02, y: 0.67, w: 0.31, h: 0.21, tilt: 1.5 },
      { x: 0.345, y: 0.67, w: 0.31, h: 0.21, tilt: -1.5 },
      { x: 0.67, y: 0.67, w: 0.31, h: 0.21, tilt: 1.5 },
    ];
  }
  return [
    { x: 0.02, y: 0.10, w: 0.32, h: 0.37, tilt: -1.5 },
    { x: 0.36, y: 0.10, w: 0.30, h: 0.78, tilt: 0, hero: true },
    { x: 0.68, y: 0.10, w: 0.30, h: 0.37, tilt: 1.5 },
    { x: 0.02, y: 0.51, w: 0.32, h: 0.37, tilt: 1 },
    { x: 0.68, y: 0.51, w: 0.30, h: 0.17, tilt: -1 },
    { x: 0.68, y: 0.70, w: 0.30, h: 0.18, tilt: 1 },
  ];
}

// Where the title band sits per aspect (fractions of poster height).
function titleBand(aspect) {
  if (aspect === 'tall') return { y: 0.50, h: 0.16 };
  if (aspect === 'square') return { y: 0.43, h: 0.17 };
  return { y: 0.42, h: 0.20 };
}

function drawStarPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawSkyline(ctx, w, h, color) {
  const base = h * 0.985;
  const rnd = seededRandom(4242);
  ctx.fillStyle = color;
  let x = 0;
  while (x < w) {
    const bw = w * (0.03 + rnd() * 0.05);
    const bh = h * (0.02 + rnd() * 0.055);
    ctx.fillRect(x, base - bh, bw, bh);
    if (rnd() > 0.6) ctx.fillRect(x + bw * 0.4, base - bh - h * 0.012, bw * 0.12, h * 0.012);
    x += bw + w * 0.004;
  }
}

function drawPalm(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.03);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.22, y - s * 0.62);
  ctx.stroke();
  const topX = x + s * 0.22;
  const topY = y - s * 0.62;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (0.15 + i * 0.14);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * s * 0.3, topY - Math.sin(a) * s * 0.28,
      topX + Math.cos(a) * s * 0.52, topY - Math.sin(a) * s * 0.12,
    );
    ctx.stroke();
  }
}

// Pre-baked effect tiles, generated once per render call.
function makeNoiseTile(size, seed) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const rnd = seededRandom(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function makeHalftoneTile(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  const step = size / 4;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      g.beginPath();
      g.arc(x * step + step / 2, y * step + step / 2, step * 0.22, 0, Math.PI * 2);
      g.fill();
    }
  }
  return c;
}

function drawCoverImage(ctx, img, dx, dy, dw, dh, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = crop.zoom || 1;
  const base = Math.max(dw / iw, dh / ih) * zoom;
  const sw = dw / base;
  const sh = dh / base;
  const slackX = Math.max(0, iw - sw);
  const slackY = Math.max(0, ih - sh);
  let sx = (iw - sw) / 2 + (crop.x || 0) * slackX;
  let sy = (ih - sh) / 2 + (crop.y || 0) * slackY;
  sx = Math.min(Math.max(sx, 0), Math.max(0, iw - sw));
  sy = Math.min(Math.max(sy, 0), Math.max(0, ih - sh));
  if (crop.flip) {
    ctx.save();
    ctx.translate(dx + dw / 2, dy + dh / 2);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }
}

function drawPanel(ctx, img, rect, w, h, grade, photo, index, selected) {
  const x = rect.x * w;
  const y = rect.y * h;
  const pw = rect.w * w;
  const ph = rect.h * h;
  const cx = x + pw / 2;
  const cy = y + ph / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((rect.tilt || 0) * Math.PI) / 180);
  ctx.translate(-pw / 2, -ph / 2);
  // Photo with the grade's filter, or a procedural placeholder.
  if (img) {
    ctx.filter = grade.filter;
    drawCoverImage(ctx, img, 0, 0, pw, ph, photo.crop || {});
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(0, 0, pw, ph);
    g.addColorStop(0, '#3a1c5c');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `bold ${Math.round(ph * 0.09)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD PHOTO', pw / 2, ph / 2);
  }
  // Warm wash so every panel shares the poster's grade.
  const wash = ctx.createLinearGradient(0, 0, 0, ph);
  wash.addColorStop(0, 'rgba(255,140,60,0.10)');
  wash.addColorStop(1, 'rgba(160,20,120,0.14)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, pw, ph);
  // Thin light frame.
  ctx.strokeStyle = selected ? '#ffd94d' : 'rgba(255,244,220,0.92)';
  ctx.lineWidth = Math.max(2, w * 0.0035) * (selected ? 1.6 : 1);
  ctx.strokeRect(0, 0, pw, ph);
  // Panel number.
  ctx.fillStyle = 'rgba(10,4,20,0.72)';
  const numSize = Math.round(Math.min(pw, ph) * 0.13);
  ctx.fillRect(0, 0, numSize * 1.5, numSize * 1.15);
  ctx.fillStyle = '#ffd94d';
  ctx.font = `${numSize}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(index + 1).padStart(2, '0'), numSize * 0.22, numSize * 0.6);
  // Role name tag.
  const tagH = Math.max(14, ph * 0.115);
  const tagY = ph - tagH;
  ctx.fillStyle = 'rgba(8,3,16,0.92)';
  ctx.fillRect(0, tagY, pw, tagH);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, tagY, Math.max(4, pw * 0.02), tagH);
  ctx.fillStyle = '#ffffff';
  const tagFont = Math.round(tagH * 0.52);
  ctx.font = `${tagFont}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const role = (photo.role || PHOTO_ROLES[index % PHOTO_ROLES.length]).toUpperCase();
  ctx.fillText(role, Math.max(8, pw * 0.035), tagY + tagH / 2 + 1);
  ctx.restore();
  // Selection handles in poster space (for the editor preview).
  if (selected) {
    ctx.save();
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = Math.max(2, w * 0.0025);
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(x - 4, y - 4, pw + 8, ph + 8);
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd94d';
    const hs = Math.max(6, w * 0.006);
    [[x, y], [x + pw, y], [x, y + ph], [x + pw, y + ph]].forEach(([hx, hy]) => {
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    });
    ctx.restore();
  }
}

function fitTitleFont(ctx, text, maxWidth, startSize) {
  let size = startSize;
  for (let i = 0; i < 8; i++) {
    ctx.font = `${size}px Anton, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth || i === 7) return size;
    size = Math.floor(size * (maxWidth / ctx.measureText(text).width) * 0.98);
  }
  return size;
}

function drawTitle(ctx, text, cx, cy, maxWidth, baseSize, grade) {
  const size = fitTitleFont(ctx, text, maxWidth, baseSize);
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // CMYK misregistration: cyan and magenta ghosts offset by 2px.
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#00e5ff';
  ctx.fillText(text, cx - 2, cy);
  ctx.fillStyle = '#ff2ea6';
  ctx.fillText(text, cx + 2, cy);
  ctx.globalAlpha = 1;
  // Deep purple drop shadow.
  ctx.fillStyle = 'rgba(30,4,50,0.85)';
  ctx.fillText(text, cx + size * 0.045, cy + size * 0.06);
  // Sunset gradient fill + horizontal stripes, painted on an offscreen
  // canvas so the stripes clip to the letters only.
  const tw = ctx.measureText(text).width;
  const off = document.createElement('canvas');
  off.width = Math.ceil(tw + size * 0.4);
  off.height = Math.ceil(size * 1.6);
  const g = off.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, off.height);
  grade.title.forEach((stop, i) => grad.addColorStop(i / (grade.title.length - 1), stop));
  g.font = `${size}px Anton, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = grad;
  g.fillText(text, off.width / 2, off.height / 2);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = 'rgba(20,4,40,0.55)';
  const stripeH = Math.max(2, size * 0.045);
  const gap = size * 0.16;
  for (let yy = off.height * 0.12; yy < off.height * 0.95; yy += gap) {
    g.fillRect(0, yy, off.width, stripeH);
  }
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
  // Thick white outline on top.
  ctx.lineWidth = Math.max(2, size * 0.045);
  ctx.strokeStyle = '#ffffff';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, cx, cy);
  return size;
}

function drawScript(ctx, text, cx, cy, size, color) {
  ctx.save();
  ctx.font = `${size}px Yellowtail, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.85;
  ctx.font = `${size * 0.92}px Yellowtail, cursive`;
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawReviewStrip(ctx, quote, source, w, h, grade) {
  const y = h * 0.018;
  const stripH = h * 0.052;
  ctx.fillStyle = 'rgba(8,3,16,0.82)';
  ctx.fillRect(w * 0.02, y, w * 0.96, stripH);
  const starR = stripH * 0.3;
  let sx = w * 0.045;
  const sy = y + stripH / 2;
  ctx.fillStyle = '#ffd94d';
  for (let i = 0; i < 5; i++) {
    drawStarPath(ctx, sx + i * starR * 2.3, sy, starR);
    ctx.fill();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const quoteSize = Math.round(stripH * 0.42);
  ctx.font = `${quoteSize}px Anton, sans-serif`;
  ctx.fillStyle = '#ffffff';
  const quoteX = sx + 5 * starR * 2.3 + w * 0.012;
  ctx.fillText(`"${quote}"`, quoteX, sy);
  const qw = ctx.measureText(`"${quote}"`).width;
  ctx.font = `${Math.round(stripH * 0.34)}px Anton, sans-serif`;
  ctx.fillStyle = grade.accent;
  ctx.fillText(`— ${source}`, quoteX + qw + w * 0.012, sy);
}

function drawBadge(ctx, text, w, h, grade) {
  const bw = w * 0.115;
  const bh = h * 0.045;
  const x = w * 0.965 - bw;
  const y = h * 0.082;
  ctx.save();
  ctx.translate(x + bw / 2, y + bh / 2);
  ctx.rotate(0.06);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1.5, w * 0.0015);
  ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(bh * 0.5)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}

function drawSeal(ctx, cx, cy, r, text, ringText, grade) {
  ctx.save();
  ctx.translate(cx, cy);
  // Starburst ring.
  ctx.beginPath();
  const spikes = 14;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.82;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#e8a812';
  ctx.fill();
  ctx.strokeStyle = '#fff3c4';
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.stroke();
  // Inner disc.
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd94d';
  ctx.fill();
  ctx.fillStyle = '#4a2400';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = text.split(' ');
  const fs = r * 0.30;
  ctx.font = `${fs}px Anton, sans-serif`;
  if (words.length > 1) {
    ctx.fillText(words[0], 0, -fs * 0.55);
    ctx.fillText(words.slice(1).join(' '), 0, fs * 0.55);
  } else {
    ctx.fillText(text, 0, 0);
  }
  // Ring text around the seal.
  if (ringText) {
    ctx.fillStyle = '#4a2400';
    ctx.font = `${Math.round(r * 0.16)}px Anton, sans-serif`;
    const chars = ringText.split('');
    const step = (Math.PI * 2) / chars.length;
    chars.forEach((ch, i) => {
      const a = -Math.PI / 2 + i * step;
      ctx.save();
      ctx.translate(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
  }
  ctx.restore();
}

function drawBilling(ctx, lines, w, h, titleText) {
  const y0 = h * 0.905;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,244,220,0.92)';
  const fs = Math.max(9, Math.round(h * 0.0135));
  ctx.font = `${fs}px sans-serif`;
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, y0 + i * fs * 1.55);
  });
  // Barcode, bars seeded by the title so it is stable per poster.
  const rnd = seededRandom(hashString(titleText));
  const bw = w * 0.055;
  const bh = h * 0.032;
  const bx = w * 0.93 - bw;
  const by = h * 0.945;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx - 4, by - 3, bw + 8, bh + 6);
  let px = bx;
  ctx.fillStyle = '#111111';
  while (px < bx + bw) {
    const barW = 1 + Math.floor(rnd() * 3);
    if (rnd() > 0.42) ctx.fillRect(px, by, barW, bh);
    px += barW + 1 + Math.floor(rnd() * 2);
  }
}

// The single renderer. state holds photos (with loaded Image objects in
// .img), layout, grade, caption text and effects. aspect is 'wide',
// 'tall' or 'square'. selectedIndex highlights one panel (editor only).
export function renderCover(canvas, state, aspect = 'wide', selectedIndex = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.gold;
  const rects = layoutRects(state.layout, aspect);
  const band = titleBand(aspect);

  // Backdrop: deep violet gradient, sun disc, skyline, palms.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#160826');
  bg.addColorStop(0.55, '#2a0f45');
  bg.addColorStop(1, '#0d0518');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const sunR = w * 0.11;
  const sunX = w * 0.5;
  const sunY = h * (aspect === 'wide' ? 0.52 : 0.30);
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
  sun.addColorStop(0, 'rgba(255,220,120,0.85)');
  sun.addColorStop(0.6, 'rgba(255,120,80,0.5)');
  sun.addColorStop(1, 'rgba(255,80,140,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  drawSkyline(ctx, w, h, 'rgba(6,2,14,0.9)');
  drawPalm(ctx, w * 0.015, h * 0.99, h * 0.16, 'rgba(6,2,14,0.9)');
  drawPalm(ctx, w * 0.965, h * 0.99, h * 0.13, 'rgba(6,2,14,0.9)');

  // Panels.
  rects.forEach((rect, i) => {
    const photo = state.photos[i] || { role: PHOTO_ROLES[i % PHOTO_ROLES.length], crop: {} };
    drawPanel(ctx, photo.img || null, rect, w, h, grade, photo, i, i === selectedIndex);
  });

  // Unified warm grade wash over the whole poster.
  const tint = ctx.createLinearGradient(0, 0, w, h);
  tint.addColorStop(0, grade.tint[0]);
  tint.addColorStop(1, grade.tint[1]);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Title + script + tagline ribbon.
  const titleY = (band.y + band.h * 0.42) * h;
  const titleSize = drawTitle(
    ctx, (state.title || 'VELVET HEAT').toUpperCase(),
    w / 2, titleY, w * 0.94, h * (aspect === 'wide' ? 0.14 : 0.115), grade,
  );
  const scriptY = titleY + titleSize * 0.78;
  drawScript(ctx, state.script || '', w / 2, scriptY, Math.round(titleSize * 0.42), grade.script);
  if (state.tagline) {
    const ribbonY = scriptY + titleSize * 0.42;
    ctx.font = `${Math.round(h * 0.017)}px Anton, sans-serif`;
    const tw = ctx.measureText(state.tagline).width + w * 0.05;
    const rh = h * 0.032;
    ctx.fillStyle = 'rgba(8,3,16,0.85)';
    ctx.fillRect((w - tw) / 2, ribbonY - rh / 2, tw, rh);
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(1, w * 0.001);
    ctx.strokeRect((w - tw) / 2, ribbonY - rh / 2, tw, rh);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.tagline, w / 2, ribbonY + 1);
  }

  // Review strip, badge, seal, billing.
  if (state.extras.review) {
    drawReviewStrip(ctx, state.reviewQuote, state.reviewSource, w, h, grade);
  }
  if (state.edition) drawBadge(ctx, state.edition, w, h, grade);
  if (state.extras.seal) {
    const sealR = Math.min(w, h) * 0.052;
    drawSeal(ctx, w * 0.90, h * (aspect === 'wide' ? 0.60 : 0.60), sealR, state.seal, state.sealRing, grade);
  }
  if (state.extras.billing) {
    drawBilling(ctx, state.billingLines, w, h, state.title || 'VELVET HEAT');
  }

  // Effects: grain tile, halftone tile, light leaks, vignette.
  const fx = state.effects || {};
  if (fx.grain > 0) {
    const tile = makeNoiseTile(128, 777);
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = (fx.grain / 100) * 0.16;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (fx.halftone > 0) {
    const tile = makeHalftoneTile(64);
    const pattern = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = (fx.halftone / 100) * 0.10;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (fx.leaks > 0) {
    ctx.save();
    ctx.globalAlpha = (fx.leaks / 100) * 0.5;
    const leak = ctx.createRadialGradient(w * 0.85, h * 0.08, 0, w * 0.85, h * 0.08, w * 0.5);
    leak.addColorStop(0, 'rgba(255,140,60,0.55)');
    leak.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  if (fx.vignette > 0) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${(fx.vignette / 100) * 0.55})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  return { rects, titleSize };
}

// Default crops for the demo cast: the two portrait kit photos need their
// vertical centre raised so the wide panels show faces, not torsos.
const DEMO_CROPS = [
  { x: 0, y: -0.7, zoom: 1, flip: false },
  { x: 0, y: 0, zoom: 1, flip: false },
  { x: 0, y: 0, zoom: 1, flip: false },
  { x: 0, y: -0.5, zoom: 1, flip: false },
  { x: 0, y: 0, zoom: 1, flip: false },
  { x: 0, y: 0, zoom: 1, flip: false },
];

export function defaultState() {
  return {
    layout: 'mosaic',
    grade: 'gold',
    title: 'VELVET HEAT',
    titleFont: 'Anton',
    script: 'Chasing the Last Light',
    scriptFont: 'Yellowtail',
    tagline: 'SEVEN FACES · ONE SUNSET · NO WAY HOME',
    reviewQuote: 'THE COAST HAS NEVER LOOKED THIS GOOD',
    reviewSource: 'THE PALM COURT POST',
    billingLines: [
      'VELVET HEAT PICTURES PRESENTS  ·  STARRING YOU  ·  WITH THE WHOLE CREW',
      'SHOT ON YOUR OWN CAMERA  ·  GRADED BY HAND  ·  NO PHOTO EVER LEAVES YOUR DEVICE',
      'COMING SOON',
    ],
    seal: 'SUNSET APPROVED',
    sealRing: 'VELVET HEAT · ORIGINAL COVER ART · ',
    edition: 'VOL. 01',
    release: 'SUMMER 2027',
    photos: DEMO_CAST.map((d, i) => ({ src: d.src, role: d.role, crop: { ...DEMO_CROPS[i] }, img: null })),
    effects: { grain: 25, halftone: 0, leaks: 30, vignette: 35 },
    extras: { review: true, tags: true, seal: true, billing: true, frame: true },
    autoTags: true,
  };
}
