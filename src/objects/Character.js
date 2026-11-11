import Phaser from 'phaser';
import { ASSET_HEIGHT, STAGES, WALK_SPEED, EDGE_PADDING } from '../constants.js';

// Top and bottom of the visible pixels on the 3267 x 2362 art canvas, per stage.
const BOUNDS = {
  egg: [184, 2104],
  baby: [520, 2252],
  kid: [520, 2252],
  adult: [81, 2217],
};

// The baby has its own faces (heads/baby/). Facing front it uses baby_sad_1/2,
// which already include the body. Facing sideways, a small baby face sits in the kid body.
// Moods with no baby art (shower, sleep, sneeze, angry) borrow the big heads/ faces.
// Eating uses heads/eating.png (kid/adult) and heads/baby/baby_eating.png (baby).
const BABY_FACES = {
  idle: { front: 'baby-front_idle', left: 'baby-left_idle', right: 'baby-right_idle' },
  sad: { front: 'baby-front_sad', left: 'baby-left_sad', right: 'baby-right_sad' },
  // baby_eating.png is a small face, so even facing front it sits in the kid body
  eating: { front: 'baby-eating', left: 'baby-eating', right: 'baby-eating', inBody: true },
};

export default class Character extends Phaser.GameObjects.Container {
  constructor(scene, x, y, stage) {
    super(scene, x, y);

    this.mood = 'idle';
    this.facing = 'front';
    this.lastSide = 'right';
    this.isPlayerMoving = false;
    this.jumpState = { h: 0 }; // 0..1, tweened by jump()

    this.bodySprite = scene.add.image(0, 0, 'body-kid_right');
    this.headSprite = scene.add.sprite(0, 0, 'head-idle_front_1');
    this.fullSprite = scene.add.sprite(0, 0, 'baby-baby_sad_1').setVisible(false);
    this.add([this.bodySprite, this.headSprite, this.fullSprite]); // body first, head on top

    scene.add.existing(this);
    this.setStage(stage);
  }

  // ---------- growth ----------

  setStage(stage) {
    this.stage = stage;

    if (stage === 'egg') {
      this.bodySprite.setTexture('item-egg').setVisible(true);
      this.headSprite.setVisible(false);
      this.fullSprite.setVisible(false);
      return;
    }
    this.updateBody();
    this.updateHead();
  }

  canMove() {
    return this.stage !== 'egg' && this.mood !== 'sleep' && this.mood !== 'shower';
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

  jump() {
    if (this.jumpTween) return false;
    this.jumpTween = this.scene.tweens.add({
      targets: this.jumpState,
      h: 1,
      duration: 260,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.jumpTween = null;
        this.jumpState.h = 0;
      },
    });
    return true;
  }

  // [top, bottom] of the visible art on the 3267 x 2362 canvas
  artBounds() {
    return BOUNDS[this.stage];
  }

  // screen y of the top / bottom of the visible art
  getTopY() {
    return this.y + (BOUNDS[this.stage][0] - ASSET_HEIGHT / 2) * this.scaleY;
  }

  getBottomY() {
    return this.y + (BOUNDS[this.stage][1] - ASSET_HEIGHT / 2) * this.scaleY;
  }

  // ---------- look ----------

  setMood(mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.updateHead();
  }

  setFacing(dir) {
    if (dir === this.facing) return;
    this.facing = dir;
    this.updateBody();
    this.updateHead();
  }

  play(sprite, key) {
    if (sprite.anims.currentAnim?.key !== key || !sprite.anims.isPlaying) sprite.play(key);
  }

  // the baby's own faces for the current mood (null = borrow the big heads/ faces)
  babyFaces() {
    if (this.mood === 'shower' && this.scene.anims.exists('baby-shower')) {
      const wholeBody = !!this.scene.registry.get('babyShowerWholeBody');
      return { front: 'baby-shower', left: 'baby-shower', right: 'baby-shower', inBody: !wholeBody, wholeBody };
    }
    return BABY_FACES[this.mood] ?? null;
  }

  updateHead() {
    if (this.stage === 'egg') return;

    const baby = this.stage === 'baby' && this.babyFaces();
    if (baby) {
      const faces = this.babyFaces();
      const key = faces[this.facing];
      if ((this.facing === 'front' || faces.wholeBody) && !faces.inBody) {
        this.fullSprite.setVisible(true);
        this.bodySprite.setVisible(false);
        this.headSprite.setVisible(false);
        this.play(this.fullSprite, key);
      } else {
        this.fullSprite.setVisible(false);
        this.bodySprite.setVisible(true);
        this.headSprite.setVisible(true).setPosition(0, 0).setScale(1);
        this.play(this.headSprite, key);
      }
      return;
    }

    const { headOffsetX = 0, headOffsetY = 0, headScale = 1 } = STAGES[this.stage];
    this.fullSprite.setVisible(false);
    this.bodySprite.setVisible(true);
    this.headSprite.setVisible(true).setPosition(headOffsetX, headOffsetY).setScale(headScale);

    // try "shower_left" first, then fall back to "sad", "sleep", etc.
    const directional = `head-${this.mood}_${this.facing}`;
    const face = this.scene.anims.exists(directional) ? directional : `head-${this.mood}`;
    this.play(this.headSprite, face);
  }

  updateBody() {
    if (this.stage === 'egg') return;

    // no front body exists, so facing front keeps the last side
    const side = this.facing === 'front' ? this.lastSide : this.facing;
    this.lastSide = side;
    const bodyStage = this.stage === 'baby' ? 'kid' : this.stage; // the baby wears the kid body
    this.bodySprite.setTexture(`body-${bodyStage}_${side}`);
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

  stopWalking() {
    this.scene.tweens.killTweensOf(this);
    this.setAngle(0);
  }

  // how close to the screen edge Bibi may go without being cut off
  edge() {
    return Math.max(EDGE_PADDING, 820 * this.scaleX);
  }

  moveBy(dx) {
    this.stopWalking();
    this.isPlayerMoving = true;
    this.setFacing(dx < 0 ? 'left' : 'right');

    const pad = this.edge();
    this.x = Phaser.Math.Clamp(this.x + dx, pad, this.scene.scale.width - pad);
  }

  stopMoving() {
    this.isPlayerMoving = false;
    this.setFacing('front');
  }
}
