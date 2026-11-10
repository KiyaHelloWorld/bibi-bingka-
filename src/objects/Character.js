import Phaser from 'phaser';
import { STAGES, WALK_SPEED, EDGE_PADDING } from '../constants.js';

export default class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stage) {
    super(scene, x, y);

    this.mood = 'idle';
    this.facing = 'front';
    this.lastSide = 'right';
    this.isPlayerMoving = false;
    this.currentFace = null;

    this.bodySprite = scene.add.image(0, 0, 'body-kid_right');
    this.headSprite = scene.add.sprite(0, 0, 'head-idle_front_1');
    this.add([this.bodySprite, this.headSprite]); // body first, head on top

    scene.add.existing(this);

    this.setStage(stage);
    this.updateHead();
  }

  // ---------- growth ----------

  setStage(stage) {
    this.stage = stage;

    if (stage === 'egg') {
      this.bodySprite.setTexture('item-egg');
      this.headSprite.setVisible(false);
      return;
    }

    const { headOffsetY, headScale } = STAGES[stage];
    this.headSprite.setVisible(true);
    this.headSprite.setY(headOffsetY);
    this.headSprite.setScale(headScale);
    this.updateBody();
  }

  canMove() {
    return this.stage !== 'egg' && this.mood !== 'sleep';
  }

  wiggle() {
    this.scene.tweens.add({
      targets: this,
      angle: { from: -6, to: 6 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => this.setAngle(0),
    });
  }

  // ---------- look ----------

  setMood(mood) {
    this.mood = mood;
    this.updateHead();
  }

  setFacing(dir) {
    this.facing = dir;
    this.updateHead();
    this.updateBody();
  }

  updateHead() {
    // try "idle_left" first, then fall back to "sad", "sleep", etc.
    const directional = `head-${this.mood}_${this.facing}`;
    const face = this.scene.anims.exists(directional)
      ? directional
      : `head-${this.mood}`;

    if (face !== this.currentFace) {
      this.currentFace = face;
      this.headSprite.play(face);
    }
  }

  updateBody() {
    if (this.stage === 'egg') return;

    // no front body exists, so facing front keeps the last side
    const side = this.facing === 'front' ? this.lastSide : this.facing;
    this.lastSide = side;
    this.bodySprite.setTexture(`body-${this.stage}_${side}`);
  }

  // ---------- movement ----------

  walkTo(targetX) {
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    this.setFacing(targetX < this.x ? 'left' : 'right');

    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: Math.abs(targetX - this.x) * WALK_SPEED,
      onComplete: () => this.setFacing('front'),
    });
  }

  moveBy(dx) {
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
    this.isPlayerMoving = true;
    this.setFacing(dx < 0 ? 'left' : 'right');

    const maxX = this.scene.scale.width - EDGE_PADDING;
    this.x = Phaser.Math.Clamp(this.x + dx, EDGE_PADDING, maxX);
  }

  stopMoving() {
    this.isPlayerMoving = false;
    this.setFacing('front');
  }
}