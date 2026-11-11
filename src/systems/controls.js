import { BUTTONS } from '../constants.js';
import { unlockAudio } from './sound.js';

// The five buttons, as actions: 'jump' | 'left' | 'right' | 'settings' | 'select'.
// Whoever is on top of the stack (a menu, a story, the room) gets each press first.
// A handler returns true when it used the press; otherwise the press falls through.

const held = new Set();
const stack = [];

export const controls = {
  push(handler) {
    stack.push(handler);
    return () => this.remove(handler);
  },
  remove(handler) {
    const i = stack.lastIndexOf(handler);
    if (i >= 0) stack.splice(i, 1);
  },
  isDown(action) {
    return held.has(action);
  },
  press(action) {
    unlockAudio();
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i](action)) return;
    }
  },
  // for hardware that reports "button held" / "button released"
  hold(action) {
    if (held.has(action)) return;
    held.add(action);
    this.press(action);
  },
  release(action) {
    held.delete(action);
  },
};

window.addEventListener('keydown', (e) => {
  const action = BUTTONS[e.key.toUpperCase()];
  if (!action) return;
  e.preventDefault();
  if (e.repeat) return;
  controls.hold(action);
});
window.addEventListener('keyup', (e) => {
  const action = BUTTONS[e.key.toUpperCase()];
  if (action) controls.release(action);
});
window.addEventListener('blur', () => held.clear());

// Hardware bridge: window.bibi.press('select'), window.bibi.hold('left'), window.bibi.release('left')
window.bibi = {
  press: (a) => controls.press(a),
  hold: (a) => controls.hold(a),
  release: (a) => controls.release(a),
};
