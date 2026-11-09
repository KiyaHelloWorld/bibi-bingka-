import Phaser from 'phaser';

const HEADS = ['idle_left', 'idle_front', 'idle_right'];

export default class Preload extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    this.load.image('body', 'assets/bodies/body.png');
    HEADS.forEach(h => this.load.image(`head-${h}`, `assets/heads/${h}.png`));
  }

  create() {
    this.scene.start('Room');
  }
}