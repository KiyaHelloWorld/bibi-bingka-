import Phaser from 'phaser';
import Preload from './scenes/Preload.js';
import Room from './scenes/Room.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE, // game = full window size
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [Preload, Room],
});