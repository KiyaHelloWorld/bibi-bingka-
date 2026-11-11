import Phaser from 'phaser';

// Round pastel menu icons, drawn in code (in the style of the UI mockup).
// Each icon becomes a texture called `tile-<name>`, e.g. tile-food, tile-game.
// To change a color, edit ICONS below. To change a symbol, edit its draw function.

const S = 128; // texture size in pixels (drawn smooth, then scaled to fit the menu)

export const ICONS = {
  stats:    { color: '#f7888b', draw: drawGauge },
  food:     { color: '#f9a26c', draw: drawForkKnife },
  shower:   { color: '#8ec5f7', draw: drawBathtub },
  home:     { color: '#fbbd7d', draw: drawHouse },
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
    scene.textures.addCanvas(key, iconCanvas(color, draw));
    // smooth edges for these (the rest of the game stays pixel-crisp)
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
}

// ---------- the round button ----------

function iconCanvas(color, draw) {
  const c = canvas();
  const ctx = c.getContext('2d');
  const r = S / 2 - 3;

  // darker bottom edge (gives the button some depth)
  circle(ctx, S / 2, S / 2, r, shade(color, -28));

  // main face, a little higher, with a soft light from the top-left
  const grad = ctx.createRadialGradient(S * 0.36, S * 0.3, 4, S / 2, S / 2, r);
  grad.addColorStop(0, shade(color, 34));
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, shade(color, -6));
  circle(ctx, S / 2, S / 2 - 3, r - 3, grad);

  // glossy highlight
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(S * 0.38, S * 0.24, 24, 11, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // the white symbol, with a soft shadow under it
  const glyph = glyphCanvas(draw);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.drawImage(tint(glyph, shade(color, -45)), 0, 3);
  ctx.restore();
  ctx.drawImage(glyph, 0, 0);
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
    // D-pad
    roundRect(ctx, 32, 61, 22, 8, 2);
    roundRect(ctx, 39, 54, 8, 22, 2);
    // buttons
    circle(ctx, 84, 58, 5);
    circle(ctx, 94, 67, 5);
    circle(ctx, 74, 67, 5);
    circle(ctx, 84, 76, 5);
    // start / select
    roundRect(ctx, 57, 56, 6, 4, 2);
    roundRect(ctx, 66, 56, 6, 4, 2);
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
