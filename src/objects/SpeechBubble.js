import { COLORS, textStyle, unit } from '../ui.js';

// A speech bubble that follows Bibi's head.
export default class SpeechBubble {
  constructor(scene, character) {
    this.scene = scene;
    this.character = character;
    this.g = scene.add.graphics().setDepth(120);
    this.t = scene.add.text(0, 0, '', textStyle(scene, 18)).setOrigin(0.5).setDepth(121);
    this.hide();
  }

  show(text, ms = 2600) {
    this.t.setStyle(textStyle(this.scene, 18));
    this.t.setText(text);
    this.g.setVisible(true);
    this.t.setVisible(true);
    this.update();
    if (this.timer) this.timer.remove(false);
    this.timer = ms ? this.scene.time.delayedCall(ms, () => this.hide()) : null;
  }

  hide() {
    this.g.setVisible(false);
    this.t.setVisible(false);
  }

  update() {
    if (!this.t.visible) return;
    const u = unit(this.scene);
    const { width } = this.scene.scale;
    const w = this.t.width + 28 * u;
    const h = this.t.height + 16 * u;
    const tail = 12 * u;
    const tipX = this.character.x;
    const tipY = this.character.getTopY() + 10 * u;
    const x = Math.min(Math.max(tipX - w / 2, 8 * u), width - w - 8 * u);
    const y = tipY - tail - h;

    this.g.clear();
    this.g.fillStyle(COLORS.white, 1);
    this.g.lineStyle(Math.max(2, 3 * u), COLORS.brown, 1);
    this.g.fillRoundedRect(x, y, w, h, 12 * u);
    this.g.strokeRoundedRect(x, y, w, h, 12 * u);
    this.g.fillStyle(COLORS.brown, 1);
    this.g.fillTriangle(tipX - 9 * u, y + h - 1, tipX + 9 * u, y + h - 1, tipX, tipY);
    this.g.fillStyle(COLORS.white, 1);
    this.g.fillTriangle(tipX - 5 * u, y + h - 3 * u, tipX + 5 * u, y + h - 3 * u, tipX, tipY - 5 * u);
    this.t.setPosition(x + w / 2, y + h / 2);
  }
}
