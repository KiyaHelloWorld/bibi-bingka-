import Phaser from 'phaser';
import Preload from './scenes/Preload.js';
import Room from './scenes/Room.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#fff4d6',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Preload, Room],
});