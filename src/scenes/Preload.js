import Phaser from 'phaser';
import { FACE_FPS } from '../constants.js';

// face name -> number of frames
const FACES = {
  idle_front: 1,
  idle_left: 1,
  idle_right: 1,
  angry: 2,
  sad: 2,
  sleep: 2,
  sneeze: 2,
};

const BODIES = ['kid_left', 'kid_right', 'adult_left', 'adult_right'];
const BACKGROUNDS = ['morning_1', 'morning_2', 'night'];
const ITEMS = ['egg', 'gift'];

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    BODIES.forEach(b => this.load.image(`body-${b}`, `assets/bodies/body_${b}.png`));

    for (const [face, count] of Object.entries(FACES)) {
      for (let i = 1; i <= count; i++) {
        // 1-frame faces have no number (idle_front.png),
        // 2-frame faces do (sad_1.png, sad_2.png)
        const file = count === 1 ? face : `${face}_${i}`;
        this.load.image(`head-${face}_${i}`, `assets/heads/${file}.png`);
      }
    }

    BACKGROUNDS.forEach(b => this.load.image(`bg-${b}`, `assets/backgrounds/${b}.png`));
    ITEMS.forEach(it => this.load.image(`item-${it}`, `assets/items/${it}.png`));
  }

  create() {
    for (const [face, count] of Object.entries(FACES)) {
      const frames = [];
      for (let i = 1; i <= count; i++) frames.push({ key: `head-${face}_${i}` });

      this.anims.create({
        key: `head-${face}`,
        frames,
        frameRate: FACE_FPS,
        repeat: -1,
      });
    }

    this.scene.start('Room');
  }
}