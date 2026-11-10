import { gameState, save } from '../gameState.js';
import { ASSET_HEIGHT } from '../constants.js';

// Each step: the message, what the player must do, and whether to point at Bibi.
// waitFor can be: 'cared' (tap Bibi), 'grew' (Bibi grows), 'moved' (A/D), 'button' (Got it!)
const STEPS = [
  { text: 'This is your egg! Tap it to take care of it.', waitFor: 'cared', arrow: true },
  { text: "Keep tapping to keep it warm. It's almost ready to hatch!", waitFor: 'grew', arrow: true },
  { text: 'Your Bibi hatched! Press A or D to walk around.', waitFor: 'moved' },
  { text: 'Take care of Bibi so it grows into an adult. Tap Bibi to care for it!', waitFor: 'cared', arrow: true },
  { text: 'At night, Bibi goes to sleep. Let it rest!', waitFor: 'button' },
];

const COLORS = {
  box: 0xfff4d6,
  outline: 0x4b2e14,
  text: '#4b2e14',
};

export default class Tutorial {
  constructor(scene, character) {
    this.scene = scene;
    this.character = character;
    this.active = !gameState.tutorialDone;
    if (!this.active) return;

    // if Bibi already hatched (old save), skip the egg steps
    if (gameState.stage !== 'egg' && gameState.tutorialStep < 2) {
      gameState.tutorialStep = 2;
    }

    this.box = scene.add.graphics().setDepth(100);

    this.text = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: COLORS.text,
      align: 'center',
      wordWrap: { width: 300 },
    }).setOrigin(0.5).setDepth(101);

    this.button = scene.add.text(0, 0, 'Got it!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#4b2e14',
      padding: { x: 14, y: 6 },
    })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.handle('button'));

    // downward-pointing arrow
    this.arrow = scene.add.triangle(0, 0, 0, 0, 28, 0, 14, 22, COLORS.box)
      .setStrokeStyle(4, COLORS.outline)
      .setDepth(101);

    this.showStep();
  }

  get step() {
    return STEPS[gameState.tutorialStep];
  }

  // called by Room whenever the player does something
  handle(eventName) {
    if (!this.active || !this.step) return;
    if (this.step.waitFor !== eventName) return;

    gameState.tutorialStep += 1;
    save();

    if (gameState.tutorialStep >= STEPS.length) {
      this.finish();
    } else {
      this.showStep();
    }
  }

  showStep() {
    this.text.setText(this.step.text);
    this.button.setVisible(this.step.waitFor === 'button');
    this.arrow.setVisible(!!this.step.arrow);
    this.layout();
  }

  finish() {
    this.active = false;
    gameState.tutorialDone = true;
    save();
    [this.box, this.text, this.button, this.arrow].forEach(obj => obj.destroy());
    this.scene.events.emit('tutorialDone');
  }

  // position the box, called on start and whenever the screen resizes
  layout() {
    if (!this.active) return;

    const { width } = this.scene.scale;
    const boxW = Math.min(width - 40, 460);
    const boxX = (width - boxW) / 2;
    const boxY = 50;

    this.text.setWordWrapWidth(boxW - 40);
    const buttonSpace = this.button.visible ? 50 : 0;
    const boxH = this.text.height + 40 + buttonSpace;

    this.box.clear();
    this.box.fillStyle(COLORS.box, 1);
    this.box.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
    this.box.lineStyle(4, COLORS.outline, 1);
    this.box.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);

    this.text.setPosition(width / 2, boxY + 20 + this.text.height / 2);
    this.button.setPosition(width / 2, boxY + boxH - 30);
  }

  // called every frame by Room, makes the arrow follow Bibi and bounce
  update(time) {
    if (!this.active || !this.arrow.visible) return;

    const c = this.character;
    const top = c.y - (c.scale * ASSET_HEIGHT) / 2;
    this.arrow.setPosition(c.x, top + Math.sin(time / 200) * 8);
  }
}