import Phaser from 'phaser';
import Character from '../objects/Character.js';
import Tutorial from '../objects/Tutorial.js';
import { gameState, save, resetSave } from '../gameState.js';
import {
  ASSET_WIDTH,
  ASSET_HEIGHT,
  CHARACTER_SCREEN_HEIGHT,
  CHARACTER_MAX_SCREEN_WIDTH,
  GROUND_Y,
  STAGES,
  WANDER_DELAY,
  MOVE_SPEED,
  EDGE_PADDING,
  EARLY_MORNING,
  DAYTIME,
  NIGHTTIME,
} from '../constants.js';

export default class Room extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    const { width, height } = this.scale;

    // background
    this.bg = this.add.image(width / 2, height / 2, 'bg-morning_1');

    // character
    this.character = new Character(this, width / 2, height * GROUND_Y, gameState.stage);

    // tap the character to take care of it
    this.character.bodySprite
      .setInteractive({ pixelPerfect: true, useHandCursor: true })
      .on('pointerdown', () => this.giveCare(1));

    // tutorial (does nothing if already finished)
    this.tutorial = new Tutorial(this, this.character);
    this.events.on('tutorialDone', () => this.updateTimeOfDay());

    // debug text, only shown while running `npm run dev` (hidden in the real build)
    this.debugText = this.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 6, y: 4 },
    }).setDepth(200).setVisible(import.meta.env.DEV);
    this.updateDebugText();

    // fit everything to the screen, and again whenever the window resizes
    this.layout();
    this.scale.on('resize', this.layout, this);

    // time of day
    this.updateTimeOfDay();
    this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: () => this.updateTimeOfDay(),
    });

    // controls (R = reset save, only while running `npm run dev`)
    this.keys = this.input.keyboard.addKeys('A,D');
    if (import.meta.env.DEV) {
      this.input.keyboard.on('keydown-R', () => resetSave());
    }

    // random wandering
    this.time.addEvent({
      delay: WANDER_DELAY,
      loop: true,
      callback: () => {
        if (!this.character.canMove()) return;
        if (this.character.isPlayerMoving) return;
        const x = Phaser.Math.Between(EDGE_PADDING, this.scale.width - EDGE_PADDING);
        this.character.walkTo(x);
      },
    });
  }

  // ---------- screen fitting ----------

  layout() {
    const { width, height } = this.scale;

    // background covers the whole screen (edges may crop, never stretches)
    this.bg.setPosition(width / 2, height / 2);
    this.bg.setScale(Math.max(width / this.bg.width, height / this.bg.height));

    // character size follows the screen size
    const charScale = Math.min(
      (height * CHARACTER_SCREEN_HEIGHT) / ASSET_HEIGHT,
      (width * CHARACTER_MAX_SCREEN_WIDTH) / ASSET_WIDTH,
    );
    this.character.setScale(charScale);
    this.character.y = height * GROUND_Y;
    this.character.x = Phaser.Math.Clamp(this.character.x, EDGE_PADDING, width - EDGE_PADDING);

    if (this.tutorial) this.tutorial.layout();
  }

  // ---------- growth ----------

  giveCare(amount) {
    gameState.care += amount;
    this.character.wiggle();
    this.tutorial.handle('cared');

    const stageInfo = STAGES[gameState.stage];
    if (stageInfo.next && gameState.care >= stageInfo.careToGrow) {
      gameState.stage = stageInfo.next;
      gameState.care = 0;
      this.character.setStage(gameState.stage);
      this.cameras.main.flash(300, 255, 255, 255); // little "it grew!" flash
      this.tutorial.handle('grew');
    }

    save();
    this.updateDebugText();
  }

  updateDebugText() {
    const stageInfo = STAGES[gameState.stage];
    const goal = stageInfo.careToGrow ?? 'max';
    this.debugText.setText(`stage: ${gameState.stage}  care: ${gameState.care}/${goal}`);
  }

  // ---------- time of day ----------

  updateTimeOfDay() {
    const hour = new Date().getHours();
    let bgKey;

    if (hour >= NIGHTTIME || hour < EARLY_MORNING) bgKey = 'bg-night';
    else if (hour < DAYTIME) bgKey = 'bg-morning_1';
    else bgKey = 'bg-morning_2';

    this.bg.setTexture(bgKey);
    this.layout();

    // no sleeping during the tutorial, so the player never gets stuck
    const shouldSleep = bgKey === 'bg-night' && !this.tutorial.active;

    if (shouldSleep && this.character.mood !== 'sleep') {
      this.tweens.killTweensOf(this.character);
      this.character.setAngle(0);
      this.character.isPlayerMoving = false;
      this.character.setFacing('front'); // don't fall asleep mid-step facing sideways
      this.character.setMood('sleep');
    }
    if (!shouldSleep && this.character.mood === 'sleep') {
      this.character.setMood('idle');
    }
  }

  // ---------- every frame ----------

  update(time, delta) {
    this.tutorial.update(time);

    if (!this.character.canMove()) return;

    const step = MOVE_SPEED * delta;

    if (this.keys.A.isDown) {
      this.character.moveBy(-step);
      this.tutorial.handle('moved');
    } else if (this.keys.D.isDown) {
      this.character.moveBy(step);
      this.tutorial.handle('moved');
    } else if (this.character.isPlayerMoving) {
      this.character.stopMoving();
    }
  }
}