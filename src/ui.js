import { makeMenuIcons } from './menuIcons.js';

// Shared look: colors, text styles, and small pixel-art effect textures made in code.
// The round menu icons are drawn in menuIcons.js.

export const COLORS = {
  cream: 0xfff4d6,
  creamHex: '#fff4d6',
  brown: 0x4b2e14,
  brownHex: '#4b2e14',
  night: 0x1d2240,
  gold: 0xffcf57,
  white: 0xffffff,
};

export const FONT = '"Courier New", Courier, monospace';

// 1 unit = 1px on an 800 x 480 screen; everything scales with the real screen
export function unit(scene) {
  const { width, height } = scene.scale;
  return Math.min(width / 800, height / 480);
}

export function textStyle(scene, size, extra = {}) {
  return {
    fontFamily: FONT,
    fontStyle: 'bold',
    fontSize: `${Math.max(10, Math.round(size * unit(scene)))}px`,
    color: COLORS.brownHex,
    ...extra,
  };
}

// background covers the whole screen (edges may crop, never stretches)
export function cover(img, width, height) {
  img.setPosition(width / 2, height / 2);
  img.setScale(Math.max(width / img.width, height / img.height));
}

// add a "crop" frame around the visible part of a full-canvas image
export function addCrop(scene, key, [x, y, w, h]) {
  const tex = scene.textures.get(key);
  if (!tex.has('crop')) tex.add('crop', 0, x, y, w, h);
}

// measure the visible (non-transparent) part of a full-canvas image -> [x, y, w, h]
export function autoCrop(scene, key) {
  const src = scene.textures.get(key).getSourceImage();
  const step = 4; // scan at 1/4 size, it's plenty for a crop box
  const w = Math.ceil(src.width / step);
  const h = Math.ceil(src.height / step);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(src, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return [0, 0, src.width, src.height];
  const X = Math.max(0, (x0 - 1) * step);
  const Y = Math.max(0, (y0 - 1) * step);
  return [X, Y, Math.min(src.width - X, (x1 - x0 + 3) * step), Math.min(src.height - Y, (y1 - y0 + 3) * step)];
}

// fit an image (any frame) inside a w x h box, keeping its shape
export function fit(img, w, h) {
  const s = Math.min(w / img.frame.width, h / img.frame.height);
  img.setScale(s);
  return img;
}

function pixelCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'));
  return c;
}

function pixelTexture(scene, key, rows, palette) {
  if (scene.textures.exists(key)) return;
  const w = Math.max(...rows.map((r) => r.length));
  const c = pixelCanvas(w, rows.length, (ctx) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = palette[row[x]];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
  });
  scene.textures.addCanvas(key, c);
}

const GLYPHS = {
  heart: [
    '.##.##.',
    '#######',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ],
};

export function makeUiTextures(scene) {
  makeMenuIcons(scene); // round menu icons (tile-stats, tile-food, ...)
  pixelTexture(scene, 'fx-heart', GLYPHS.heart.map((r) => r.replace(/#/g, 'h')), { h: '#ff6f91' });
  pixelTexture(scene, 'fx-drop', ['b', 'b', 'B'], { b: '#8fd3ff', B: '#4aa8ec' });
  pixelTexture(scene, 'fx-bubble', ['.ww.', 'w..w', 'w..w', '.ww.'], { w: '#ffffff' });
  pixelTexture(scene, 'fx-sparkle', ['..y..', '..y..', 'yyyyy', '..y..', '..y..'], { y: '#ffd84a' });
  pixelTexture(scene, 'fx-stink', ['.g.', 'g..', '.g.', '..g', '.g.', 'g..'], { g: '#8db24a' });
  pixelTexture(scene, 'fx-shard', ['oo', 'og'], { o: '#e9a13b', g: '#3f8a2a' });
  pixelTexture(scene, 'fx-showerhead', [
    '.....bbbb.....',
    '.....bccb.....',
    '...bbbbbbbb...',
    '..bccccccccb..',
    '.bccccccccccb.',
    'bbbbbbbbbbbbbb',
    '.b.b.b.b.b.b..',
  ], { b: '#4b2e14', c: '#b9c7d4' });
  pixelTexture(scene, 'fx-dot', ['.oo.', 'oooo', 'oooo', '.oo.'], { o: '#ffffff' });
}
