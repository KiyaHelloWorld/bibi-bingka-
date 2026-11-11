import Phaser from 'phaser';
import { controls } from '../systems/controls.js';
import { beep } from '../systems/sound.js';
import { gameState } from '../gameState.js';
import { COLORS, cover, textStyle, unit } from '../ui.js';

export default class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    const u = unit(this);

    cover(this.add.image(0, 0, 'bg-morning_2'), width, height);
    this.add.rectangle(width / 2, height / 2, width, height, COLORS.cream, 0.25);

    this.add.text(width / 2, height * 0.16, 'BIBI BINGKA', textStyle(this, 56, {
      color: '#ffcf57',
      stroke: COLORS.brownHex,
      strokeThickness: Math.max(4, 9 * u),
    })).setOrigin(0.5);

    // Bibi, bouncing
    const bibi = this.add.sprite(width / 2, height * 0.5, 'baby-baby_sad_1', undefined);
    bibi.setScale((height * 0.42) / 2362);
    this.tweens.add({ targets: bibi, y: bibi.y - 12 * u, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // PLAY button
    const bw = 200 * u;
    const bh = 54 * u;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-bw / 2, -bh / 2 + 5 * u, bw, bh, bh / 2);
    g.fillStyle(COLORS.gold, 1).fillRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    g.lineStyle(Math.max(2, 4 * u), COLORS.brown, 1).strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    const label = this.add.text(0, 0, 'PLAY', textStyle(this, 30)).setOrigin(0.5);
    this.play = this.add.container(width / 2, height * 0.8, [g, label]);
    this.tweens.add({ targets: this.play, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.8 + 44 * u, 'Press Q', textStyle(this, 15, { color: COLORS.brownHex })).setOrigin(0.5);
    this.add.text(width / 2, height - 14 * u, 'W Jump   A Left   D Right   E Menu   Q Select', textStyle(this, 13, {
      color: COLORS.creamHex,
      backgroundColor: '#4b2e14',
      padding: { x: 10, y: 4 },
    })).setOrigin(0.5, 1);

    this.started = false;
    const off = controls.push((a) => this.onAction(a));
    this.events.once('shutdown', off);
    this.scale.once('resize', () => this.scene.restart());
  }

  onAction(a) {
    if (this.started) return true;
    if (a !== 'select') {
      beep(220, 0.05);
      this.tweens.add({ targets: this.play, angle: { from: -5, to: 5 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => this.play.setAngle(0) });
      return true;
    }
    this.started = true;
    beep(880, 0.08, 3);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(450, () => {
      // first time: the story; afterwards straight to Bibi
      this.scene.start(gameState.stage === 'egg' ? 'Story' : 'Room');
    });
    return true;
  }
}
