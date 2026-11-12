import Phaser from 'phaser';
import StatBar from '../objects/StatBar.js';
import Narration from '../objects/Narration.js';
import { controls } from '../systems/controls.js';
import { beep } from '../systems/sound.js';
import { MENU, FOODS, SETTINGS } from '../data/items.js';
import { COLORS, textStyle, unit, fit } from '../ui.js';

// Runs on top of the Room: need meters along the top, narration, the 3x3 menu,
// food picker, stats card, the Gift Catch counter, and toasts.
// Tells the Room what was chosen through events:
//   'opened' (name)  'menu' | 'food' | 'stats'
//   'closed' (name)  an overlay was closed
//   'choose' (id)    a menu item was picked
//   'food'   (food)  a food was picked
export default class HUD extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  create() {
    this.bars = {
      hunger: new StatBar(this, 'Hunger', 'icon-food_icon', 'crop'),
      hygiene: new StatBar(this, 'Hygiene', 'tile-shower'),
      happy: new StatBar(this, 'Happy', 'tile-heart'),
    };
    this.statsVisible = false;
    this.overlay = null;
    this.counterBox = this.add.graphics().setDepth(450).setVisible(false);
    this.counterText = this.add.text(0, 0, '', textStyle(this, 20)).setOrigin(0.5).setDepth(451).setVisible(false);
    this.narration = new Narration(this, { position: 'top', depth: 400 });
    this.toastText = this.add.text(0, 0, '', textStyle(this, 16, {
      color: COLORS.creamHex,
      backgroundColor: '#4b2e14',
      padding: { x: 14, y: 6 },
    })).setOrigin(0.5, 0).setDepth(500).setVisible(false);

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));
  }

  layout() {
    const u = unit(this);
    Object.values(this.bars).forEach((bar, i) => {
      bar.setVisible(this.statsVisible);
      bar.place(10 * u + i * 246 * u, 10 * u);
    });
    this.narration.top = this.statsVisible ? 40 * u : 0;
    if (this.narration.visible) this.narration.layout();
    if (this.overlay) this.overlay.rebuild();
    if (this.counterText.visible) this.showCounter(this.counterText.text);
  }

  // ---------- need meters along the top ----------

  setStatsVisible(v) {
    this.statsVisible = v;
    this.layout();
  }

  setNeeds(state) {
    for (const [k, bar] of Object.entries(this.bars)) bar.setValue(state[k]);
  }

  flash(key) {
    this.bars[key]?.flash();
  }

  // space taken by the meters at the top of the screen
  topSpace() {
    return this.statsVisible ? 44 * unit(this) : 0;
  }

  // ---------- Gift Catch counter ----------

  showCounter(text) {
    const u = unit(this);
    const t = this.counterText;
    t.setStyle(textStyle(this, 20)).setText(text).setPosition(this.scale.width / 2, this.topSpace() + 22 * u).setVisible(true);
    const w = t.width + 36 * u;
    const h = t.height + 14 * u;
    this.counterBox.clear().setVisible(true);
    this.counterBox.fillStyle(0x000000, 0.25).fillRoundedRect(t.x - w / 2, t.y - h / 2 + 4 * u, w, h, h / 2);
    this.counterBox.fillStyle(COLORS.cream, 1).fillRoundedRect(t.x - w / 2, t.y - h / 2, w, h, h / 2);
    this.counterBox.lineStyle(Math.max(2, 3 * u), COLORS.brown, 1).strokeRoundedRect(t.x - w / 2, t.y - h / 2, w, h, h / 2);
  }

  hideCounter() {
    this.counterText.setVisible(false);
    this.counterBox.setVisible(false);
  }

  toast(text, ms = 1800) {
    const u = unit(this);
    this.toastText.setStyle(textStyle(this, 16, { color: COLORS.creamHex, backgroundColor: '#4b2e14', padding: { x: 14, y: 6 } }));
    this.toastText.setText(text).setPosition(this.scale.width / 2, this.topSpace() + (this.counterText.visible ? 44 : 6) * u).setVisible(true);
    if (this.toastTimer) this.toastTimer.remove(false);
    this.toastTimer = this.time.delayedCall(ms, () => this.toastText.setVisible(false));
  }

  // ---------- overlays ----------

  isOpen() {
    return !!this.overlay;
  }

  openOverlay(build, onAction, name) {
    this.closeOverlay();
    const overlay = {
      name,
      container: null,
      rebuild: () => {
        overlay.container?.destroy();
        overlay.container = this.add.container(0, 0).setDepth(200);
        build(overlay.container);
      },
    };
    this.overlay = overlay;
    overlay.rebuild();
    overlay.off = controls.push((a) => {
      onAction(a);
      return true; // menus use every button while open
    });
    this.events.emit('opened', name);
  }

  closeOverlay() {
    if (!this.overlay) return;
    const { name } = this.overlay;
    this.overlay.off();
    this.overlay.container.destroy();
    this.overlay = null;
    this.events.emit('closed', name);
  }

  // area below the narration box (so tutorial text stays readable)
  freeArea() {
    const { height } = this.scale;
    const u = unit(this);
    const top = Math.max(this.narration.bottom, this.topSpace()) + 8 * u;
    return { top, height: height - top - 8 * u };
  }

  backdrop(c) {
    const { width, height } = this.scale;
    c.add(this.add.rectangle(width / 2, height / 2, width, height, 0x1e1218, 0.45));
  }

  panel(c, x, y, w, h) {
    const u = unit(this);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x, y + 6 * u, w, h, 18 * u);
    g.fillStyle(0xfde5c9, 1).fillRoundedRect(x, y, w, h, 18 * u);
    // diagonal stripes like the mockup
    g.lineStyle(10 * u, 0xfbd6ae, 1);
    for (let d = -h; d < w; d += 28 * u) {
      const x0 = Math.max(x, x + d);
      const y0 = y + Math.max(0, -d);
      const len = Math.min(w - (x0 - x), h - (y0 - y));
      if (len < 30 * u) continue; // too short: would stick out of the rounded corner
      g.lineBetween(x0 + 6 * u, y0 + 6 * u, x0 + len - 6 * u, y0 + len - 6 * u);
    }
    g.lineStyle(Math.max(2, 4 * u), 0xe9b98a, 1).strokeRoundedRect(x, y, w, h, 18 * u);
    c.add(g);
  }

  hintText(c, x, y, text) {
    c.add(this.add.text(x, y, text, textStyle(this, 14, { color: '#ffffff', stroke: COLORS.brownHex, strokeThickness: 4 })).setOrigin(0.5, 0));
  }

  // ---------- 3x3 menu ----------

  openMenu({ lock = null, asleep = false, inside = false } = {}) {
    const startOn = lock || (asleep ? 'sleep' : null); // asleep: start on Wake Up
    const menu = { idx: startOn ? MENU.findIndex((m) => m?.id === startOn) : this.lastMenuIdx ?? 0 };
    // move to the next real icon (skips the empty spots in the grid)
    const step = (from, by) => {
      let i = from;
      do i = (i + by + MENU.length) % MENU.length;
      while (!MENU[i]);
      return i;
    };
    beep(880, 0.05, 2);

    const build = (c) => {
      const { width } = this.scale;
      const u = unit(this);
      const area = this.freeArea();
      const rows = Math.ceil(MENU.length / 3);
      const T = Math.min(72 * u, (area.height - 90 * u) / (rows * 1.25 + 0.6));
      const gap = T * 0.22;
      const pad = T * 0.28;
      const pw = 3 * T + 2 * gap + pad * 2;
      const ph = rows * T + (rows - 1) * gap + pad * 2;
      const total = ph + 56 * u;
      const px = width / 2 - pw / 2;
      const py = area.top + Math.max(0, (area.height - total) / 2);

      this.backdrop(c);
      this.panel(c, px, py, pw, ph);

      menu.frame = this.add.graphics();
      c.add(menu.frame);
      menu.tiles = MENU.map((item, i) => {
        if (!item) return null; // empty spot
        const x = px + pad + (i % 3) * (T + gap) + T / 2;
        const y = py + pad + Math.floor(i / 3) * (T + gap) + T / 2;
        const img = fit(this.add.image(x, y, item.texture, item.frame), T, T);
        img.baseScale = img.scale;
        if (lock && item.id !== lock) img.setAlpha(0.3);
        if (asleep && !['sleep', 'settings'].includes(item.id)) img.setAlpha(0.3); // wake Bibi up first
        c.add(img);
        return img;
      });
      menu.label = this.add.text(width / 2, py + ph + 8 * u, '', textStyle(this, 24, {
        color: '#ffffff', stroke: COLORS.brownHex, strokeThickness: Math.max(3, 6 * u),
      })).setOrigin(0.5, 0);
      c.add(menu.label);
      this.hintText(c, width / 2, py + ph + 38 * u, lock ? 'Q Select' : 'A/D Move   W Row   Q Select   E Close');
      menu.T = T;
      draw();
    };

    const draw = () => {
      const u = unit(this);
      menu.tiles.forEach((img, i) => {
        if (!img) return;
        this.tweens.killTweensOf(img);
        img.setScale(img.baseScale);
        if (i === menu.idx) {
          this.tweens.add({ targets: img, scale: img.baseScale * 1.05, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      });
      const sel = menu.tiles[menu.idx];
      const s = menu.T * 1.1; // selection outline size (1 = touching the icon)
      menu.frame.clear();
      menu.frame.lineStyle(Math.max(3, 6 * u), 0xffffff, 1).strokeRoundedRect(sel.x - s / 2, sel.y - s / 2, s, s, s * 0.24);
      menu.frame.lineStyle(Math.max(2, 3 * u), COLORS.brown, 1)
        .strokeRoundedRect(sel.x - s / 2 - 3 * u, sel.y - s / 2 - 3 * u, s + 6 * u, s + 6 * u, s * 0.24 + 3 * u);
      const item = MENU[menu.idx];
      const labels = {
        home: inside ? 'Leave House' : 'Enter House',
        sleep: asleep ? 'Wake Up' : 'Sleep',
      };
      menu.label.setText(labels[item.id] ?? item.label);
    };

    const deny = () => {
      beep(200, 0.06);
      const sel = menu.tiles[menu.idx];
      this.tweens.add({ targets: sel, angle: { from: -8, to: 8 }, duration: 60, yoyo: true, repeat: 1, onComplete: () => sel.setAngle(0) });
    };

    const onAction = (a) => {
      if (a === 'select') {
        const item = MENU[menu.idx];
        this.lastMenuIdx = menu.idx;
        beep(990, 0.05, 2);
        this.closeOverlay();
        this.events.emit('choose', item.id);
        return;
      }
      if (lock) return deny();
      if (a === 'settings') {
        this.lastMenuIdx = menu.idx;
        beep(500, 0.04);
        this.closeOverlay();
        return;
      }
      if (a === 'left') menu.idx = step(menu.idx, -1);
      if (a === 'right') menu.idx = step(menu.idx, 1);
      if (a === 'jump') {
        // next row (wraps); if that spot is empty, the nearest icon in that row
        const row = (Math.floor(menu.idx / 3) + 1) % Math.ceil(MENU.length / 3);
        const col = menu.idx % 3;
        const candidates = [col, 1, 0, 2].map((c) => row * 3 + c).filter((i) => MENU[i]);
        if (candidates.length) menu.idx = candidates[0];
      }
      beep(700, 0.03);
      draw();
    };

    this.openOverlay(build, onAction, 'menu');
  }

  // ---------- settings ----------

  // a small list of choices: A/D (or W) move, Q picks, E goes back
  openChoices({ title, message = '', options, start = 0, name, onPick, onBack }) {
    const state = { idx: start };
    const build = (c) => {
      const { width } = this.scale;
      const u = unit(this);
      const area = this.freeArea();
      const w = 360 * u;
      const bh = 40 * u;
      const msgH = message ? 50 * u : 0;
      const h = 60 * u + msgH + options.length * (bh + 10 * u) + 8 * u;
      const x = width / 2 - w / 2;
      const y = area.top + Math.max(0, (area.height - h - 26 * u) / 2);
      this.backdrop(c);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25).fillRoundedRect(x, y + 6 * u, w, h, 18 * u);
      g.fillStyle(COLORS.cream, 1).fillRoundedRect(x, y, w, h, 18 * u);
      g.lineStyle(Math.max(2, 4 * u), COLORS.brown, 1).strokeRoundedRect(x, y, w, h, 18 * u);
      c.add(g);
      c.add(this.add.text(width / 2, y + 14 * u, title, textStyle(this, 24)).setOrigin(0.5, 0));
      if (message) {
        c.add(this.add.text(width / 2, y + 50 * u, message, textStyle(this, 14, {
          align: 'center', wordWrap: { width: w - 40 * u },
        })).setOrigin(0.5, 0));
      }
      state.buttons = options.map((opt, i) => {
        const by = y + 56 * u + msgH + i * (bh + 10 * u);
        const bg = this.add.graphics();
        const label = this.add.text(width / 2, by + bh / 2, opt.label, textStyle(this, 18)).setOrigin(0.5);
        c.add([bg, label]);
        return { bg, label, x: x + 24 * u, y: by, w: w - 48 * u, h: bh, danger: opt.danger };
      });
      this.hintText(c, width / 2, y + h + 10 * u, 'A/D Choose   Q Select   E Back');
      draw();
    };
    const draw = () => {
      const u = unit(this);
      state.buttons.forEach((b, i) => {
        const sel = i === state.idx;
        b.bg.clear();
        const fill = sel ? (b.danger ? 0xe65b4f : COLORS.gold) : 0xfff7ec;
        b.bg.fillStyle(fill, 1).fillRoundedRect(b.x, b.y, b.w, b.h, b.h / 2);
        b.bg.lineStyle(Math.max(2, (sel ? 4 : 2) * u), sel ? COLORS.brown : 0xd7b48f, 1).strokeRoundedRect(b.x, b.y, b.w, b.h, b.h / 2);
        b.label.setColor(sel && b.danger ? '#ffffff' : COLORS.brownHex);
      });
    };
    const onAction = (a) => {
      if (a === 'left' || a === 'jump') state.idx = (state.idx + options.length - 1) % options.length;
      if (a === 'right') state.idx = (state.idx + 1) % options.length;
      if (a === 'left' || a === 'right' || a === 'jump') {
        beep(700, 0.03);
        draw();
      } else if (a === 'select') {
        beep(990, 0.05, 2);
        this.closeOverlay();
        onPick(options[state.idx].id);
      } else if (a === 'settings') {
        beep(500, 0.04);
        this.closeOverlay();
        onBack?.();
      }
    };
    this.openOverlay(build, onAction, name);
  }

  openSettings() {
    this.openChoices({
      title: 'Settings',
      name: 'settings',
      options: SETTINGS,
      onPick: (id) => (id === 'reset' ? this.confirmReset() : this.events.emit('settings', id)),
      onBack: () => this.openMenu(),
    });
  }

  confirmReset() {
    this.openChoices({
      title: 'Reset the game?',
      message: 'Bibi and all progress will be erased. This cannot be undone.',
      name: 'confirmReset',
      start: 0, // "No" is picked first, so a quick double press can't erase everything
      options: [
        { id: 'no', label: 'No, keep Bibi' },
        { id: 'yes', label: 'Yes, reset', danger: true },
      ],
      // Yes: reset. No: leave Settings completely, back to playing
      onPick: (id) => { if (id === 'yes') this.events.emit('settings', 'reset'); },
      onBack: () => this.openSettings(),
    });
  }

  // ---------- food picker ----------

  openFood({ lock = false } = {}) {
    const pick = { idx: 0 };

    const build = (c) => {
      const { width } = this.scale;
      const u = unit(this);
      const area = this.freeArea();
      const cw = Math.min(150 * u, (width - 60 * u) / 3);
      const ch = Math.min(170 * u, area.height - 90 * u);
      const gap = 18 * u;
      const rowW = cw * 3 + gap * 2;
      const total = 40 * u + ch + 40 * u;
      const top = area.top + Math.max(0, (area.height - total) / 2);

      this.backdrop(c);
      c.add(this.add.text(width / 2, top, 'What should Bibi eat?', textStyle(this, 26, {
        color: '#ffffff', stroke: COLORS.brownHex, strokeThickness: Math.max(3, 6 * u),
      })).setOrigin(0.5, 0));

      pick.cards = FOODS.map((food, i) => {
        const x = width / 2 - rowW / 2 + i * (cw + gap);
        const y = top + 40 * u;
        const card = this.add.container(x + cw / 2, y + ch / 2);
        const g = this.add.graphics();
        const img = fit(this.add.image(0, -ch * 0.12, food.key, 'crop'), cw * 0.7, ch * 0.5);
        const name = this.add.text(0, ch * 0.24, food.name, textStyle(this, 17)).setOrigin(0.5);
        const note = this.add.text(0, ch * 0.37, food.note, textStyle(this, 11)).setOrigin(0.5);
        card.add([g, img, name, note]);
        card.g = g;
        c.add(card);
        return card;
      });
      pick.cw = cw;
      pick.ch = ch;
      this.hintText(c, width / 2, top + 40 * u + ch + 12 * u, lock ? 'A/D Choose   Q Feed' : 'A/D Choose   Q Feed   E Leave kitchen');
      draw();
    };

    const draw = () => {
      const u = unit(this);
      const { cw, ch } = pick;
      pick.cards.forEach((card, i) => {
        const sel = i === pick.idx;
        card.g.clear();
        if (sel) card.g.fillStyle(COLORS.gold, 1).fillRoundedRect(-cw / 2 - 6 * u, -ch / 2 - 6 * u, cw + 12 * u, ch + 12 * u, 20 * u);
        card.g.fillStyle(sel ? 0xffffff : 0xfff7ec, 1).fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 16 * u);
        card.g.lineStyle(Math.max(2, 4 * u), sel ? COLORS.brown : 0xd7b48f, 1).strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 16 * u);
        card.setScale(sel ? 1.06 : 1);
      });
    };

    const onAction = (a) => {
      if (a === 'left' || a === 'right') {
        pick.idx = (pick.idx + (a === 'right' ? 1 : FOODS.length - 1)) % FOODS.length;
        beep(700, 0.03);
        draw();
      } else if (a === 'select') {
        beep(990, 0.05, 2);
        this.closeOverlay();
        this.events.emit('food', FOODS[pick.idx]);
      } else if (a === 'settings') {
        if (lock) return beep(200, 0.06);
        beep(500, 0.04);
        this.closeOverlay();
        this.events.emit('foodBack'); // the Room takes Bibi out of the kitchen
      }
    };

    this.openOverlay(build, onAction, 'food');
  }

  // ---------- stats card ----------
  // Bibi's needs as bars, plus a few extra lines ([label, value]).

  openStats(state, lines = []) {
    const build = (c) => {
      const { width } = this.scale;
      const u = unit(this);
      const area = this.freeArea();
      const w = 300 * u;
      const lh = 26 * u;
      const barH = 40 * u;
      const h = 54 * u + 3 * barH + lines.length * lh + 16 * u;
      const x = width / 2 - w / 2;
      const y = area.top + Math.max(0, (area.height - h - 26 * u) / 2);
      this.backdrop(c);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.25).fillRoundedRect(x, y + 6 * u, w, h, 18 * u);
      g.fillStyle(COLORS.cream, 1).fillRoundedRect(x, y, w, h, 18 * u);
      g.lineStyle(Math.max(2, 4 * u), COLORS.brown, 1).strokeRoundedRect(x, y, w, h, 18 * u);
      c.add(g);
      c.add(this.add.text(width / 2, y + 12 * u, "Bibi's Stats", textStyle(this, 24)).setOrigin(0.5, 0));

      const bars = [
        ['hunger', 'Hunger', 'icon-food_icon', 'crop'],
        ['hygiene', 'Hygiene', 'tile-shower'],
        ['happy', 'Happy', 'tile-heart'],
      ];
      bars.forEach(([key, label, tex, frame], i) => {
        const bar = new StatBar(this, label, tex, frame);
        bar.parts.forEach((p) => c.add(p));
        bar.place(x + (w - 236 * u) / 2, y + 50 * u + i * barH);
        bar.setValue(state[key]);
      });

      lines.forEach(([k, v], i) => {
        const ly = y + 54 * u + 3 * barH + i * lh;
        c.add(this.add.text(x + 24 * u, ly, k, textStyle(this, 16)));
        c.add(this.add.text(x + w - 24 * u, ly, v, textStyle(this, 16)).setOrigin(1, 0));
      });
      this.hintText(c, width / 2, y + h + 10 * u, 'Q or E Close');
    };
    const onAction = (a) => {
      if (a === 'select' || a === 'settings') {
        beep(500, 0.04);
        this.closeOverlay();
      }
    };
    this.openOverlay(build, onAction, 'stats');
  }
}
