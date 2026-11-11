import { COLORS, textStyle, unit } from '../ui.js';
import { beep } from '../systems/sound.js';

// Story / tutorial text box with a typewriter effect.
// say(text, { advance }) returns a promise:
//   advance 'any'    -> any button continues
//   advance 'select' -> only Q continues (so A/D/W can still move Bibi)
//   advance 'none'   -> resolves as soon as the text is shown (the game waits for an action instead)
export default class Narration {
  constructor(scene, { position = 'bottom', depth = 300 } = {}) {
    this.scene = scene;
    this.position = position;
    this.top = 0; // extra space above the box when it sits at the top
    this.current = null;

    this.box = scene.add.graphics().setDepth(depth);
    this.text = scene.add.text(0, 0, '', textStyle(scene, 21)).setDepth(depth + 1);
    this.tagBox = scene.add.graphics().setDepth(depth + 2);
    this.tag = scene.add.text(0, 0, '', textStyle(scene, 16, { color: '#ffffff' })).setDepth(depth + 3);
    this.hint = scene.add.text(0, 0, '', textStyle(scene, 13)).setOrigin(1, 1).setDepth(depth + 1);
    scene.tweens.add({ targets: this.hint, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });

    this.setVisible(false);
  }

  get visible() {
    return this.box.visible;
  }

  setVisible(v) {
    [this.box, this.text, this.tagBox, this.tag, this.hint].forEach((o) => o.setVisible(v));
    if (v && !this.speaker) {
      this.tagBox.setVisible(false);
      this.tag.setVisible(false);
    }
  }

  say(text, { advance = 'any', speaker = null, dark = false } = {}) {
    return new Promise((resolve) => {
      if (this.timer) this.timer.remove(false);
      this.current = { text, advance, resolve, typing: true };
      this.speaker = speaker;
      this.dark = dark;
      this.text.setText('');
      this.hint.setText('');
      this.tag.setText(speaker || '');
      this.setVisible(true);
      this.layout();

      let i = 0;
      this.timer = this.scene.time.addEvent({
        delay: 24,
        repeat: Math.max(0, text.length - 1),
        callback: () => {
          i++;
          this.text.setText(text.slice(0, i));
          if (i % 3 === 0) beep(520, 0.02);
          if (i >= text.length) this.finishTyping();
        },
      });
      if (!text.length) this.finishTyping();
    });
  }

  finishTyping() {
    const c = this.current;
    if (!c || !c.typing) return;
    c.typing = false;
    if (this.timer) this.timer.remove(false);
    this.text.setText(c.text);
    this.hint.setText(c.advance === 'any' ? 'press any button' : c.advance === 'select' ? '[Q] next' : '');
    if (c.advance === 'none') c.resolve();
  }

  // returns true if the button press was used by the text box
  handle(action) {
    const c = this.current;
    if (!c || c.advance === 'none') return false;
    if (c.advance === 'select' && action !== 'select') return false;
    if (c.typing) {
      this.finishTyping();
      return true;
    }
    this.current = null;
    beep(780, 0.04);
    c.resolve();
    return true;
  }

  hide() {
    if (this.timer) this.timer.remove(false);
    this.current = null;
    this.setVisible(false);
  }

  // bottom edge of the box (for placing menus underneath it)
  get bottom() {
    return this.visible ? this.boxY + this.boxH : 0;
  }

  layout() {
    const { width, height } = this.scene.scale;
    const u = unit(this.scene);
    const m = Math.round(14 * u);
    const pad = Math.round(16 * u);
    const boxW = Math.min(width - m * 2, 760 * u);
    const boxX = (width - boxW) / 2;

    this.text.setStyle(textStyle(this.scene, 21, { color: this.dark ? COLORS.creamHex : COLORS.brownHex }));
    this.hint.setStyle(textStyle(this.scene, 13, { color: this.dark ? COLORS.creamHex : COLORS.brownHex }));
    this.tag.setStyle(textStyle(this.scene, 16, { color: '#ffffff' }));
    this.text.setWordWrapWidth(boxW - pad * 2);

    // measure with the full sentence so the box doesn't grow while typing
    const shown = this.text.text;
    this.text.setText(this.current ? this.current.text : shown);
    const textH = Math.max(this.text.height, 24 * u);
    this.text.setText(shown);

    const tagSpace = this.speaker ? 8 * u : 0;
    const boxH = textH + pad * 2 + 10 * u + tagSpace;
    const boxY = this.position === 'top' ? m + this.top + tagSpace : height - m - boxH;
    this.boxY = boxY;
    this.boxH = boxH;

    this.box.clear();
    this.box.fillStyle(0x000000, 0.25);
    this.box.fillRoundedRect(boxX, boxY + 5 * u, boxW, boxH, 14 * u);
    this.box.fillStyle(this.dark ? COLORS.night : COLORS.cream, 0.97);
    this.box.fillRoundedRect(boxX, boxY, boxW, boxH, 14 * u);
    this.box.lineStyle(Math.max(2, 4 * u), this.dark ? COLORS.cream : COLORS.brown, 1);
    this.box.strokeRoundedRect(boxX, boxY, boxW, boxH, 14 * u);

    this.text.setPosition(boxX + pad, boxY + pad + tagSpace);
    this.hint.setPosition(boxX + boxW - pad * 0.7, boxY + boxH - pad * 0.4);

    this.tagBox.clear();
    if (this.speaker) {
      const tw = this.tag.width + 20 * u;
      const th = this.tag.height + 6 * u;
      const tx = boxX + pad;
      const ty = boxY - th / 2;
      this.tagBox.fillStyle(0xf07f5e, 1);
      this.tagBox.fillRoundedRect(tx, ty, tw, th, th / 2);
      this.tagBox.lineStyle(Math.max(2, 3 * u), COLORS.brown, 1);
      this.tagBox.strokeRoundedRect(tx, ty, tw, th, th / 2);
      this.tag.setPosition(tx + 10 * u, ty + 3 * u);
    }
  }

  destroy() {
    if (this.timer) this.timer.remove(false);
    [this.box, this.text, this.tagBox, this.tag, this.hint].forEach((o) => o.destroy());
  }
}
