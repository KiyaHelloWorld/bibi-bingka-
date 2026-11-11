// Pastel rounded-square menu icons in pixel art, drawn in code (in the style of the UI mockup).
// Each icon becomes a texture called `tile-<name>`, e.g. tile-food, tile-game.
// To change a color, edit ICONS below. To change a symbol, edit its draw function.

const S = 128;  // drawing size (shapes are drawn at this size first)
const PIXELS = 32; // final icon size in pixels: smaller = chunkier pixels

export const ICONS = {
  stats:    { color: '#f7888b', draw: drawGauge },
  food:     { color: '#7fcf8a', draw: drawForkKnife },
  shower:   { color: '#8ec5f7', draw: drawBathtub },
  home:     { color: '#fbbd7d', draw: drawHouse },
  sleep:    { color: '#8fa8f0', draw: drawMoon },
  door:     { color: '#8fd58f', draw: drawDoor },
  game:     { color: '#e78ad8', draw: drawController },
  phone:    { color: '#f68bb6', draw: drawPhone },
  settings: { color: '#b8a2f2', draw: drawGear },
  back:     { color: '#f6898c', draw: drawArrow },
  heart:    { color: '#ff8fb1', draw: drawHeart }, // used by the Happy meter
};

export function makeMenuIcons(scene) {
  for (const [name, { color, draw }] of Object.entries(ICONS)) {
    const key = `tile-${name}`;
    if (scene.textures.exists(key)) continue;
    // drawn big, then shrunk to PIXELS x PIXELS with hard edges (pixel art, like the rest of the game)
    scene.textures.addCanvas(key, pixelIcon(color, draw));
  }
}

// ---------- pixel-art version ----------

function pixelIcon(color, draw) {
  const N = PIXELS;
  const body = bodyCanvas(color);
  const glyph = glyphCanvas(draw);

  const out = document.createElement('canvas');
  out.width = N;
  out.height = N;
  const ctx = out.getContext('2d');
  ctx.drawImage(shrink(body, N, { posterize: 14, outline: shade(color, -80) }), 0, 0);
  ctx.globalAlpha = 0.45;
  ctx.drawImage(shrink(tint(glyph, shade(color, -50)), N), 0, 1); // shadow under the symbol
  ctx.globalAlpha = 1;
  ctx.drawImage(shrink(glyph, N, { solid: '#ffffff' }), 0, 0);
  return out;
}

// shrink a big drawing to N x N with hard edges: every pixel is either fully there or not
function shrink(src, N, { posterize = 0, outline = null, solid = null } = {}) {
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, N, N);
  const img = ctx.getImageData(0, 0, N, N);
  const d = img.data;
  const solidRGB = solid && [1, 3, 5].map((i) => parseInt(solid.slice(i, i + 2), 16));
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) {
      d[i + 3] = 0;
      continue;
    }
    d[i + 3] = 255;
    if (solidRGB) [d[i], d[i + 1], d[i + 2]] = solidRGB;
    else if (posterize) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / posterize) * posterize;
  }
  // darker 1-pixel outline on the edge of the shape
  if (outline) {
    const o = outline.match(/\d+/g).map(Number);
    const solidAt = (x, y) => x >= 0 && y >= 0 && x < N && y < N && d[(y * N + x) * 4 + 3] === 255;
    const edge = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (solidAt(x, y) && (!solidAt(x - 1, y) || !solidAt(x + 1, y) || !solidAt(x, y - 1) || !solidAt(x, y + 1))) edge.push((y * N + x) * 4);
      }
    }
    edge.forEach((i) => ([d[i], d[i + 1], d[i + 2]] = o));
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// ---------- the button (drawn big) ----------

function bodyCanvas(color) {
  const c = canvas();
  const ctx = c.getContext('2d');
  const m = 4;
  const corner = 26; // corner roundness (0 = sharp square)
  ctx.fillStyle = shade(color, -28);
  roundRect(ctx, m, m, S - m * 2, S - m * 2, corner);
  const grad = ctx.createRadialGradient(S * 0.3, S * 0.25, 4, S / 2, S / 2, S * 0.75);
  grad.addColorStop(0, shade(color, 34));
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, shade(color, -6));
  ctx.fillStyle = grad;
  roundRect(ctx, m + 2, m, S - m * 2 - 4, S - m * 2 - 10, corner - 2);
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, m + 16, m + 8, S - m * 2 - 32, 12, 6);
  ctx.restore();
  return c;
}

// draws a symbol in white; `cut` erases holes (so the button color shows through)
function glyphCanvas(draw) {
  const c = canvas();
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const cut = (fn) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    fn();
    ctx.restore();
  };
  draw(ctx, cut);
  return c;
}

// ---------- symbols (drawn on a 128 x 128 square) ----------

function drawGauge(ctx) {
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(64, 70, 31, Math.PI * 0.8, Math.PI * 2.2);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (const a of [0.95, 1.25, 1.5, 1.75, 2.05]) {
    const t = Math.PI * a;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(t) * 20, 70 + Math.sin(t) * 20);
    ctx.lineTo(64 + Math.cos(t) * 24, 70 + Math.sin(t) * 24);
    ctx.stroke();
  }
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(64, 70);
  ctx.lineTo(80, 52);
  ctx.stroke();
  circle(ctx, 64, 70, 8);
}

function drawForkKnife(ctx) {
  // fork
  for (const x of [38, 46, 54]) roundRect(ctx, x, 30, 5, 24, 2.5);
  roundRect(ctx, 38, 48, 21, 12, 6);
  roundRect(ctx, 45, 54, 7, 44, 3.5);
  // knife
  ctx.beginPath();
  ctx.moveTo(76, 30);
  ctx.quadraticCurveTo(94, 40, 91, 66);
  ctx.lineTo(77, 66);
  ctx.closePath();
  ctx.fill();
  roundRect(ctx, 77, 60, 8, 38, 4);
}

function drawBathtub(ctx) {
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(38, 62);
  ctx.lineTo(38, 42);
  ctx.arc(48, 42, 10, Math.PI, Math.PI * 1.9);
  ctx.stroke();
  circle(ctx, 60, 44, 4);
  roundRect(ctx, 22, 60, 84, 9, 4.5);
  ctx.beginPath();
  ctx.moveTo(28, 66);
  ctx.lineTo(100, 66);
  ctx.lineTo(98, 78);
  ctx.quadraticCurveTo(95, 92, 80, 92);
  ctx.lineTo(48, 92);
  ctx.quadraticCurveTo(33, 92, 30, 78);
  ctx.closePath();
  ctx.fill();
  roundRect(ctx, 38, 88, 7, 12, 3);
  roundRect(ctx, 83, 88, 7, 12, 3);
}

function drawHouse(ctx, cut) {
  ctx.beginPath();
  ctx.moveTo(64, 26);
  ctx.lineTo(104, 60);
  ctx.lineTo(94, 60);
  ctx.lineTo(94, 100);
  ctx.lineTo(34, 100);
  ctx.lineTo(34, 60);
  ctx.lineTo(24, 60);
  ctx.closePath();
  ctx.lineWidth = 6;
  ctx.fill();
  ctx.stroke();
  cut(() => {
    circle(ctx, 64, 66, 9);
    ctx.beginPath();
    ctx.ellipse(64, 98, 17, 16, 0, Math.PI, 0);
    ctx.fill();
  });
}

function drawMoon(ctx, cut) {
  // crescent moon
  circle(ctx, 58, 66, 32);
  cut(() => circle(ctx, 76, 54, 28));
  // one bold "z"
  ctx.lineWidth = 8;
  for (const [x, y, s] of [[82, 30, 24]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x + s, y + s);
    ctx.stroke();
  }
}

function drawDoor(ctx, cut) {
  roundRect(ctx, 40, 26, 48, 76, 5);
  cut(() => roundRect(ctx, 47, 33, 34, 69, 2));
  // the door, swung slightly open
  ctx.beginPath();
  ctx.moveTo(47, 33);
  ctx.lineTo(70, 39);
  ctx.lineTo(70, 102);
  ctx.lineTo(47, 102);
  ctx.closePath();
  ctx.fill();
  cut(() => circle(ctx, 64, 70, 3.5));
}

function drawController(ctx, cut) {
  roundRect(ctx, 22, 46, 84, 38, 19);
  circle(ctx, 36, 80, 15);
  circle(ctx, 92, 80, 15);
  cut(() => {
    // D-pad (big enough to stay readable as pixels)
    roundRect(ctx, 28, 59, 28, 11, 2);
    roundRect(ctx, 37, 50, 11, 28, 2);
    // two buttons
    circle(ctx, 80, 70, 7);
    circle(ctx, 94, 58, 7);
  });
}

function drawPhone(ctx, cut) {
  roundRect(ctx, 42, 22, 44, 84, 11);
  cut(() => {
    roundRect(ctx, 48, 33, 32, 56, 3);
    circle(ctx, 64, 97, 4.5);
    roundRect(ctx, 58, 27, 12, 3, 1.5);
  });
}

function drawGear(ctx, cut) {
  ctx.save();
  ctx.translate(64, 64);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    roundRect(ctx, -8, -38, 16, 18, 4);
  }
  ctx.restore();
  circle(ctx, 64, 64, 27);
  cut(() => circle(ctx, 64, 64, 11));
}

function drawArrow(ctx) {
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(96, 64);
  ctx.lineTo(38, 64);
  ctx.moveTo(60, 40);
  ctx.lineTo(36, 64);
  ctx.lineTo(60, 88);
  ctx.stroke();
}

function drawHeart(ctx) {
  ctx.beginPath();
  ctx.moveTo(64, 98);
  ctx.bezierCurveTo(26, 74, 24, 50, 34, 40);
  ctx.bezierCurveTo(44, 30, 60, 32, 64, 46);
  ctx.bezierCurveTo(68, 32, 84, 30, 94, 40);
  ctx.bezierCurveTo(104, 50, 102, 74, 64, 98);
  ctx.fill();
}

// ---------- helpers ----------

function canvas() {
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  return c;
}

function circle(ctx, x, y, r, fill) {
  if (fill) ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// a copy of `src` in one flat color (for the symbol's shadow)
function tint(src, color) {
  const c = canvas();
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, S, S);
  return c;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
