import { COLORS, textStyle, unit, fit } from '../ui.js';

// size of each need meter (the HUD spaces everything else from these)
export const STAT_BAR_WIDTH = 250;   // 3 meters + gaps must fit in 800 (so 250 at most)
export const STAT_BAR_HEIGHT = 47;
// everything inside a meter is sized from its height, so it always fits:
const ICON = 0.72;   // icon size
const TEXT = 0.36;   // label text size
const BAR = 0.32;    // thickness of the coloured bar

// One need meter: icon, label, and a bar that turns orange/red when low.
export default class StatBar {
  constructor(scene, label, texture, frame) {
    this.scene = scene;
    this.value = 100;
    this.g = scene.add.graphics();
    this.icon = scene.add.image(0, 0, texture, frame);
    this.label = scene.add.text(0, 0, label, textStyle(scene, STAT_BAR_HEIGHT * TEXT)).setOrigin(0, 0.5);
    this.parts = [this.g, this.icon, this.label];
  }

  setVisible(v) {
    this.parts.forEach((p) => p.setVisible(v));
  }

  setValue(v) {
    this.value = v;
    this.draw();
  }

  flash() {
    this.scene.tweens.add({ targets: this.icon, scale: this.icon.scale * 1.4, duration: 160, yoyo: true, repeat: 3 });
  }

  place(x, y) {
    this.x = x;
    this.y = y;
    this.draw();
  }

  draw() {
    if (this.x === undefined) return;
    const u = unit(this.scene);
    const w = STAT_BAR_WIDTH * u;
    const h = STAT_BAR_HEIGHT * u;
    const { x, y } = this;
    const low = this.value < 45;
    const crit = this.value < 20;
    const pad = h * 0.16;

    // the pill
    this.g.clear();
    this.g.fillStyle(COLORS.cream, 0.95);
    this.g.fillRoundedRect(x, y, w, h, h / 2);
    this.g.lineStyle(Math.max(2, h * 0.07), crit ? 0xe65b4f : COLORS.brown, 1);
    this.g.strokeRoundedRect(x, y, w, h, h / 2);

    // icon on the left, then the label
    const iconSize = h * ICON;
    fit(this.icon, iconSize, iconSize).setPosition(x + pad + iconSize / 2, y + h / 2);
    this.label.setStyle(textStyle(this.scene, STAT_BAR_HEIGHT * TEXT)).setPosition(x + pad + iconSize + h * 0.14, y + h / 2);

    // the bar fills the rest of the pill
    const bx = this.label.x + this.label.width + h * 0.22;
    const bw = Math.max(h, x + w - h * 0.38 - bx);
    const bh = h * BAR;
    const by = y + (h - bh) / 2;
    this.g.fillStyle(0xe8d6c2, 1);
    this.g.fillRoundedRect(bx, by, bw, bh, bh / 2);
    const fw = Math.max(0, (bw * this.value) / 100);
    if (fw > 1) {
      this.g.fillStyle(crit ? 0xe65b4f : low ? 0xf0a43a : 0x6cc070, 1);
      this.g.fillRoundedRect(bx, by, fw, bh, Math.min(bh / 2, fw / 2));
    }
  }
}
