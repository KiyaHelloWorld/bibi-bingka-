import Phaser from 'phaser';
import { FACE_FPS } from '../constants.js';
import { CROPS, GIFT_DESIGNS } from '../data/items.js';
import { addCrop, autoCrop, makeUiTextures, COLORS, textStyle } from '../ui.js';

// big heads/: face name -> number of frames
const FACES = {
  idle_front: 1,
  idle_left: 1,
  idle_right: 1,
  shower_front: 1,
  shower_left: 1,
  shower_right: 1,
  angry: 2,
  sad: 2,
  sleep: 2,
  sneeze: 2,
};

// heads/baby/: animation -> files (the file names are mapped by how each face looks)
const BABY_ANIMS = {
  front_idle: ['baby_sad_1'],                 // front, calm (body included)
  front_sad: ['baby_sad_1', 'baby_sad_2'],    // front, crying (body included)
  left_idle: ['baby_left_sad_2'],
  left_sad: ['baby_left_super_sad_1'],
  right_idle: ['baby_right_sad_1'],
  right_sad: ['baby_right_super_sad_2'],
  eating: ['baby_eating'],                    // sits inside the kid body, like the side faces
};
const BABY_FILES = [...new Set(Object.values(BABY_ANIMS).flat())];

const BODIES = ['kid_left', 'kid_right', 'adult_left', 'adult_right'];
const BACKGROUNDS = ['morning_1', 'morning_2', 'night', 'kitchen', 'kitchen_table', 'living_room'];
const ITEMS = ['egg', 'gift', 'food_1', 'food_2', 'food_3'];
const ICONS = ['food_icon', 'house_icon'];

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // loading bar
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    this.add.text(width / 2, height / 2 - 30, 'Loading Bibi...', textStyle(this, 22, { color: COLORS.creamHex })).setOrigin(0.5);
    this.load.on('progress', (p) => {
      bar.clear();
      bar.fillStyle(0x333333, 1).fillRect(width * 0.2, height / 2, width * 0.6, 14);
      bar.fillStyle(COLORS.gold, 1).fillRect(width * 0.2, height / 2, width * 0.6 * p, 14);
    });

    BODIES.forEach((b) => this.load.image(`body-${b}`, `assets/bodies/body_${b}.png`));

    for (const [face, count] of Object.entries(FACES)) {
      for (let i = 1; i <= count; i++) {
        // 1-frame faces have no number (idle_front.png),
        // 2-frame faces do (sad_1.png, sad_2.png)
        const file = count === 1 ? face : `${face}_${i}`;
        this.load.image(`head-${face}_${i}`, `assets/heads/${file}.png`);
      }
    }
    BABY_FILES.forEach((f) => this.load.image(`baby-${f}`, `assets/heads/baby/${f}.png`));
    this.load.image('head-eating_1', 'assets/heads/eating.png');
    // baby shower face: used automatically once one of these files is added
    this.load.image('baby-shower_baby', 'assets/heads/baby/shower_baby.png');
    this.load.image('baby-baby_shower', 'assets/heads/baby/baby_shower.png');

    BACKGROUNDS.forEach((b) => this.load.image(`bg-${b}`, `assets/backgrounds/${b}.png`));
    ITEMS.forEach((it) => this.load.image(`item-${it}`, `assets/items/${it}.png`));

    // extra gift designs for Gift Catch: any that are missing are simply skipped
    GIFT_DESIGNS.forEach((key) => this.load.image(key, `assets/items/${key.replace('item-', '')}.png`));
    // bedroom for sleeping: used automatically once backgrounds/bedroom.png is added
    this.load.image('bg-bedroom', 'assets/backgrounds/bedroom.png');
    this.load.on('loaderror', (file) => console.warn(`Missing asset (skipped): ${file.src}`));
    ICONS.forEach((ic) => this.load.image(`icon-${ic}`, `assets/icon/${ic}.png`));
  }

  create() {
    for (const [face, count] of Object.entries(FACES)) {
      const frames = [];
      for (let i = 1; i <= count; i++) frames.push({ key: `head-${face}_${i}` });
      this.anims.create({ key: `head-${face}`, frames, frameRate: FACE_FPS, repeat: -1 });
    }
    // chewing: eating.png and idle_front.png take turns
    this.anims.create({
      key: 'head-eating',
      frames: [{ key: 'head-eating_1' }, { key: 'head-idle_front_1' }],
      frameRate: 4,
      repeat: -1,
    });

    // baby shower face (if the file exists). It may be just the face (sits in the kid body,
    // like baby_eating.png) or the whole baby (like baby_sad_1.png): measured to find out.
    const babyShower = ['baby-shower_baby', 'baby-baby_shower'].find((k) => this.textures.exists(k));
    if (babyShower) {
      this.anims.create({ key: 'baby-shower', frames: [{ key: babyShower }], frameRate: FACE_FPS, repeat: -1 });
      const [, top] = autoCrop(this, babyShower);
      this.registry.set('babyShowerWholeBody', top < 1000); // whole-baby art starts near the hat (y ~520)
    }

    for (const [name, files] of Object.entries(BABY_ANIMS)) {
      this.anims.create({
        key: `baby-${name}`,
        frames: files.map((f) => ({ key: `baby-${f}` })),
        frameRate: FACE_FPS,
        repeat: -1,
      });
    }

    for (const [key, box] of Object.entries(CROPS)) addCrop(this, key, box);
    // gift designs with no crop listed in CROPS get one measured automatically
    GIFT_DESIGNS.forEach((key) => {
      if (this.textures.exists(key) && !this.textures.get(key).has('crop')) addCrop(this, key, autoCrop(this, key));
    });
    makeUiTextures(this);

    this.scene.start('Title');
  }
}
