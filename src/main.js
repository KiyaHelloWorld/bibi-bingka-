import Phaser from 'phaser';
import Preload from './scenes/Preload.js';
import Title from './scenes/Title.js';
import Story from './scenes/Story.js';
import Room from './scenes/Room.js';
import HUD from './scenes/HUD.js';

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
  scene: [Preload, Title, Story, Room, HUD],
});
