import { gameState } from '../gameState.js';

// Simple chiptune beeps. Swap these for files in public/assets/audio/ later.
let ctx = null;

export function unlockAudio() {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
}

export function beep(freq = 660, dur = 0.07, count = 1, type = 'square') {
  if (!gameState.sound || !ctx) return;
  try {
    for (let i = 0; i < count; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq * (1 + i * 0.25);
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * (dur + 0.03);
      o.start(t);
      o.stop(t + dur);
    }
  } catch {}
}
