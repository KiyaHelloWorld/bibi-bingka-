import Phaser from 'phaser';
import Narration from '../objects/Narration.js';
import { controls } from '../systems/controls.js';
import { beep } from '../systems/sound.js';
import { gameState, save } from '../gameState.js';
import { STORY, HATCH } from '../data/dialogue.js';
import { HATCH_PRESSES } from '../constants.js';
import { COLORS, cover, fit, unit } from '../ui.js';

// egg.png: middle of the cropped picture vs. middle of the round egg body (art pixels)
const EGG_CROP_CENTER_X = 1977;
const EGG_BODY_CENTER_X = 1680;

// The opening story, then the egg hatches.
export default class Story extends Phaser.Scene {
  constructor() {
    super('Story');
  }

  create() {
    const { width, height } = this.scale;
    this.bgBack = this.add.image(0, 0, 'bg-night').setAlpha(0);
    this.bgFront = this.add.image(0, 0, 'bg-night');
    this.bgKey = 'night';
    this.fxLayer = this.add.container(0, 0).setDepth(5);

    this.eggBox = this.add.container(width / 2, height * 0.42).setDepth(10).setVisible(false);
    this.egg = this.add.image(0, 0, 'item-egg', 'crop');
    this.cracks = this.add.graphics();
    this.eggBox.add([this.egg, this.cracks]);
    this.dots = this.add.graphics().setDepth(10);

    this.narration = new Narration(this, { position: 'bottom' });
    this.hatching = false;
    this.presses = 0;

    this.layout();
    this.scale.on('resize', this.layout, this);
    const off = controls.push((a) => this.onAction(a));
    this.events.once('shutdown', () => {
      off();
      this.scale.off('resize', this.layout, this);
    });

    this.cameras.main.fadeIn(500);
    this.run();
  }

  layout() {
    const { width, height } = this.scale;
    cover(this.bgFront, width, height);
    cover(this.bgBack, width, height);
    this.eggSize = height * 0.42;
    fit(this.egg, this.eggSize, this.eggSize);
    // the hat's tail sticks out to the right, so centre the round egg body instead of the picture
    this.egg.x = (EGG_CROP_CENTER_X - EGG_BODY_CENTER_X) * this.egg.scaleX;
    this.eggBox.setPosition(width / 2, height * 0.4);
    this.drawCracks();
    this.drawDots();
    if (this.narration.visible) this.narration.layout();
  }

  onAction(a) {
    if (this.hatching) this.hatchPress();
    else this.narration.handle(a);
    return true;
  }

  async run() {
    for (const beat of STORY) {
      this.setBg(beat.bg);
      if (beat.fx) this.playFx(beat.fx);
      if (beat.egg) this.showEgg();
      await this.narration.say(beat.text, { advance: 'any', dark: beat.bg === 'night' });
    }
    this.narration.say(HATCH.start, { advance: 'none' });
    this.hatching = true;
  }

  // ---------- backgrounds and effects ----------

  setBg(key) {
    if (key === this.bgKey) return;
    this.bgKey = key;
    this.bgBack.setTexture(`bg-${key}`).setAlpha(0);
    cover(this.bgBack, this.scale.width, this.scale.height);
    // new background fades in on top of the old one
    const incoming = this.bgBack;
    const outgoing = this.bgFront;
    this.children.sendToBack(outgoing);
    this.tweens.add({ targets: incoming, alpha: 1, duration: 1200, onComplete: () => outgoing.setAlpha(0) });
    this.children.sendToBack(incoming);
    this.children.sendToBack(outgoing);
    [this.bgFront, this.bgBack] = [incoming, outgoing];
    if (key !== 'night') this.fxLayer.removeAll(true);
  }

  playFx(kind) {
    const { width, height } = this.scale;
    const u = unit(this);
    if (kind === 'twinkle') {
      for (let i = 0; i < 26; i++) {
        const s = this.add.rectangle(Math.random() * width, Math.random() * height * 0.55, 3 * u, 3 * u, 0xffffff);
        this.tweens.add({ targets: s, alpha: 0.15, duration: 600 + Math.random() * 900, yoyo: true, repeat: -1 });
        this.fxLayer.add(s);
      }
    }
    if (kind === 'meteor') {
      const m = this.add.container(width * 0.95, -20);
      const tail = this.add.rectangle(0, 0, 160 * u, 6 * u, 0xffd27a).setOrigin(0, 0.5);
      const head = this.add.rectangle(0, 0, 14 * u, 14 * u, 0xffffff);
      m.add([tail, head]);
      const tx = width * 0.45;
      const ty = height * 0.75;
      m.setAngle(Phaser.Math.RadToDeg(Math.atan2(ty + 20, tx - width * 0.95)) + 180); // tail trails behind
      this.fxLayer.add(m);
      this.tweens.add({ targets: m, x: tx, y: ty, duration: 1400, ease: 'Quad.easeIn', onComplete: () => m.setVisible(false) });
      beep(1000, 0.6, 1, 'sawtooth');
    }
    if (kind === 'boom') {
      this.cameras.main.shake(500, 0.02);
      this.cameras.main.flash(300, 255, 240, 200);
      beep(60, 0.5, 1, 'sawtooth');
    }
    if (kind === 'glow') {
      const g = this.add.ellipse(width * 0.5, height * 0.8, 180 * u, 60 * u, 0xffe7a3, 0.8);
      this.tweens.add({ targets: g, scale: 1.25, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
      this.fxLayer.add(g);
    }
  }

  // ---------- egg ----------

  showEgg() {
    this.eggBox.setVisible(true).setScale(0);
    this.tweens.add({ targets: this.eggBox, scale: 1, duration: 600, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.egg, y: -8 * unit(this), duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    beep(440, 0.1, 3);
  }

  hatchPress() {
    if (this.presses >= HATCH_PRESSES) return;
    this.presses++;
    beep(300 + this.presses * 45, 0.07);

    this.tweens.killTweensOf(this.eggBox);
    this.eggBox.setAngle(0);
    this.tweens.add({ targets: this.eggBox, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 1, onComplete: () => this.eggBox.setAngle(0) });

    // little shell bits fly off
    const u = unit(this);
    for (let i = 0; i < 3; i++) {
      const s = this.add.image(this.eggBox.x, this.eggBox.y, 'fx-shard').setScale(5 * u).setDepth(11);
      this.tweens.add({
        targets: s,
        x: s.x + Phaser.Math.Between(-120, 120) * u,
        y: s.y + Phaser.Math.Between(-140, 20) * u,
        angle: 180,
        alpha: 0,
        duration: 600,
        onComplete: () => s.destroy(),
      });
    }
    this.drawCracks();
    this.drawDots();
    if (this.presses >= HATCH_PRESSES) this.hatch();
  }

  drawCracks() {
    const g = this.cracks;
    g.clear();
    const level = Math.floor((this.presses / HATCH_PRESSES) * 4);
    if (!level || !this.eggSize) return;
    const s = this.eggSize / 100;
    const lines = [
      [[-4, -30], [4, -22], [-3, -14], [5, -6]],
      [[-26, -4], [-16, 2], [-22, 10], [-10, 14]],
      [[24, -10], [14, -2], [22, 6], [10, 12]],
      [[-20, 24], [-8, 18], [0, 28], [10, 18], [22, 26]],
    ];
    g.lineStyle(Math.max(2, 1.6 * s), COLORS.brown, 1);
    lines.slice(0, level).forEach((pts) => {
      g.beginPath();
      g.moveTo(pts[0][0] * s, pts[0][1] * s);
      pts.slice(1).forEach(([x, y]) => g.lineTo(x * s, y * s));
      g.strokePath();
    });
  }

  drawDots() {
    const g = this.dots;
    g.clear();
    if (!this.eggBox.visible || !this.hatching) return;
    const u = unit(this);
    const r = 6 * u;
    const gap = 18 * u;
    const total = (HATCH_PRESSES - 1) * gap;
    const y = this.eggBox.y + this.eggSize / 2 + 16 * u;
    for (let i = 0; i < HATCH_PRESSES; i++) {
      const x = this.scale.width / 2 - total / 2 + i * gap;
      g.fillStyle(i < this.presses ? COLORS.gold : COLORS.white, i < this.presses ? 1 : 0.5);
      g.fillCircle(x, y, r);
      g.lineStyle(Math.max(1, 2 * u), COLORS.brown, 1);
      g.strokeCircle(x, y, r);
    }
  }

  async hatch() {
    this.hatching = false;
    this.dots.clear();
    this.narration.hide();
    await this.wait(250);
    this.cameras.main.flash(500, 255, 255, 255);
    beep(523, 0.1, 5);
    this.tweens.killTweensOf(this.egg);
    this.eggBox.setVisible(false);

    // baby Bibi pops out
    const { height } = this.scale;
    const baby = this.add.sprite(this.eggBox.x, this.eggBox.y, 'baby-baby_sad_1').setDepth(10);
    const target = (height * 0.62) / 2362;
    baby.setScale(0);
    this.tweens.add({ targets: baby, scale: target, duration: 700, ease: 'Back.easeOut' });
    for (let i = 0; i < 6; i++) {
      const h = this.add.image(baby.x + Phaser.Math.Between(-120, 120), baby.y + Phaser.Math.Between(-40, 60), 'fx-heart')
        .setScale(5 * unit(this)).setDepth(11);
      this.tweens.add({ targets: h, y: h.y - 90, alpha: 0, duration: 1300, delay: i * 120, onComplete: () => h.destroy() });
    }

    gameState.stage = 'baby';
    gameState.care = 0;
    gameState.tutorialDone = false;
    gameState.hunger = 80;
    gameState.hygiene = 80;
    gameState.happy = 80;
    save();

    await this.wait(800);
    await this.narration.say(HATCH.done, { advance: 'any' });
    this.cameras.main.fadeOut(400, 0, 0, 0);
    await this.wait(450);
    this.scene.start('Room');
  }

  wait(ms) {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }
}
