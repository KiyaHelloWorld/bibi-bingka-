import Phaser from 'phaser';
import Character from '../objects/Character.js';
import { WANDER_DELAY } from '../constants.js';

export default class Room extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    const { width, height } = this.scale;

    this.character = new Character(this, width / 2, height / 2);

    // wander to a random spot every few seconds
    this.time.addEvent({
      delay: WANDER_DELAY,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(80, width - 80);
        this.character.walkTo(x);
      },
    });
  }
}