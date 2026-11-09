import Phaser from 'phaser';
import { CHARACTER_SCALE, HEAD_OFFSET_Y, WALK_SPEED } from '../constants.js';

export default class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.mood = 'idle';
    this.facing = 'front';

    this.bodySprite = scene.add.image(0, 0, 'body');
    this.headSprite = scene.add.image(0, HEAD_OFFSET_Y, 'head-idle_front');
    this.add([this.bodySprite, this.headSprite]);

    this.setScale(CHARACTER_SCALE);
    scene.add.existing(this);
  }

  setMood(mood) {
    this.mood = mood;
    this.updateHead();
  }

  setFacing(dir) {
    this.facing = dir;
    this.updateHead();
  }

  updateHead() {
    const directional = `head-${this.mood}_${this.facing}`;
    const key = this.scene.textures.exists(directional)
      ? directional
      : `head-${this.mood}`;

    if (this.headSprite.texture.key !== key) {
      this.headSprite.setTexture(key);
    }
  }

  walkTo(targetX) {
    this.scene.tweens.killTweensOf(this); // stop any walk already happening
    this.setFacing(targetX < this.x ? 'left' : 'right');

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: Math.abs(targetX - this.x) * WALK_SPEED,
      onComplete: () => this.setFacing('front'),
    });
  }
}