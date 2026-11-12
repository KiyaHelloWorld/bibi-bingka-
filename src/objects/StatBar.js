import { COLORS, textStyle, unit, fit } from '../ui.js';

// One need meter: icon, label, and a bar that turns orange/red when low.
export default class StatBar {
  constructor(scene, label, texture, frame) {
    this.scene = scene;
    this.value = 100;
    this.g = scene.add.graphics();
    this.icon = scene.add.image(0, 0, texture, frame);
    this.label = scene.add.text(0, 0, label, textStyle(scene, 13)).setOrigin(0, 0.5);
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
    const w = 236 * u;
    const h = 47 * u;
    const { x, y } = this;
    const low = this.value < 45;
    const crit = this.value < 20;

    this.g.clear();
    this.g.fillStyle(COLORS.cream, 0.95);
    this.g.fillRoundedRect(x, y, w, h, h / 2);
    this.g.lineStyle(Math.max(2, 3 * u), crit ? 0xe65b4f : COLORS.brown, 1);
    this.g.strokeRoundedRect(x, y, w, h, h / 2);

    fit(this.icon, 24 * u, 24 * u).setPosition(x + 18 * u, y + h / 2);
    this.label.setStyle(textStyle(this.scene, 13)).setPosition(x + 34 * u, y + h / 2);

    const bx = x + 112 * u;
    const bw = w - 124 * u;
    const bh = 12 * u;
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
