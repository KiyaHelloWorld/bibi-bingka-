// Shared look: colors, text styles, and pixel-art textures made in code
// (menu tiles in the same style as food_icon.png / house_icon.png, plus small effects).

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

function inRound(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.6;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.max(0, Math.min(255, ((n >> s) & 255) + amt));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// rounded pixel tile: brown outline, colored fill, white glyph
function tileTexture(scene, key, color, glyph) {
  if (scene.textures.exists(key)) return;
  const S = 22;
  const c = pixelCanvas(S, S, (ctx) => {
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        if (!inRound(x, y, 0, 0, S - 1, S - 1, 5)) continue;
        const inner = inRound(x, y, 2, 2, S - 3, S - 3, 3);
        ctx.fillStyle = !inner ? COLORS.brownHex : y <= 3 ? shade(color, 30) : y >= S - 4 ? shade(color, -30) : color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    const gh = glyph.length;
    const gw = Math.max(...glyph.map((r) => r.length));
    const ox = Math.floor((S - gw) / 2);
    const oy = Math.floor((S - gh) / 2);
    ctx.fillStyle = '#ffffff';
    glyph.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === '#') ctx.fillRect(ox + x, oy + y, 1, 1);
    });
  });
  scene.textures.addCanvas(key, c);
}

const GLYPHS = {
  stats: [
    '....######....',
    '..##......##..',
    '.#..........#.',
    '#.........##.#',
    '#........##..#',
    '#.......##...#',
    '#......##....#',
    '#.....###....#',
    '#....####....#',
    '.#...###....#.',
    '..##########..',
  ],
  shower: [
    '.##...........',
    '#..#..........',
    '#.............',
    '#.............',
    '##############',
    '##############',
    '.############.',
    '.############.',
    '..##########..',
    '..#........#..',
  ],
  door: [
    '..##########..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..#######..#..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..##########..',
    '.############.',
  ],
  gift: [
    '.############.',
    '.############.',
    '..............',
    '..##########..',
    '..###....###..',
    '..##########..',
    '..##########..',
    '..##########..',
    '..##########..',
  ],
  phone: [
    '...########...',
    '...#......#...',
    '...#......#...',
    '...#......#...',
    '...#......#...',
    '...#......#...',
    '...#......#...',
    '...########...',
    '...###..###...',
    '...########...',
  ],
  settings: [
    '.....####.....',
    '..##.####.##..',
    '..##########..',
    '...########...',
    '.####....####.',
    '.####....####.',
    '.####....####.',
    '...########...',
    '..##########..',
    '..##.####.##..',
    '.....####.....',
  ],
  back: [
    '....#.........',
    '...##.........',
    '..###########.',
    '.############.',
    '..###########.',
    '...##.........',
    '....#.........',
  ],
  heart: [
    '.##.##.',
    '#######',
    '#######',
    '.#####.',
    '..###..',
    '...#...',
  ],
};

// menu tile colors from the UI mockup
const TILE_COLORS = {
  stats: '#f7888b',
  shower: '#8ec5f7',
  door: '#8fd58f',
  gift: '#e78ad8',
  phone: '#f68bb6',
  settings: '#b8a2f2',
  back: '#f6898c',
  heart: '#ff8fb1',
};

export function makeUiTextures(scene) {
  for (const [name, color] of Object.entries(TILE_COLORS)) {
    tileTexture(scene, `tile-${name}`, color, GLYPHS[name]);
  }
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
