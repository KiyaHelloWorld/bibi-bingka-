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

// ---------- Jingle Bells (public domain, 1857) ----------
// "Jingle bells, jingle bells, jingle all the way!" as a little chiptune with sleigh bells.
// Returns how long it plays, in seconds (0 if sound is off).
const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, C4: 261.63, G3: 196.0 };
const JINGLE_BELLS = [ // [note, beats]
  ['E5', 1], ['E5', 1], ['E5', 2],
  ['E5', 1], ['E5', 1], ['E5', 2],
  ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', 0.5],
  ['E5', 4],
];
const BEAT = 0.24; // seconds per beat (tempo)

let noiseBuffer = null;
function noise() {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function tone(freq, start, length, type, volume) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + length);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(start);
  o.stop(start + length + 0.05);
}

function sleighBell(start) {
  const src = ctx.createBufferSource();
  src.buffer = noise();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 7000;
  filter.Q.value = 1.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
  src.connect(filter);
  filter.connect(g);
  g.connect(ctx.destination);
  src.start(start);
  src.stop(start + 0.15);
}

export function playJingleBells() {
  if (!gameState.sound || !ctx) return 0;
  try {
    let t = ctx.currentTime + 0.05;
    const start = t;
    for (const [note, beats] of JINGLE_BELLS) {
      const len = beats * BEAT;
      tone(NOTE[note], t, len * 0.9, 'square', 0.035);      // melody
      tone(NOTE[note] * 2, t, len * 0.5, 'sine', 0.02);     // a little bell shimmer
      t += len;
    }
    const total = t - start;
    // bass on the beat (C - G) and sleigh bells on every half beat
    for (let b = 0; b * BEAT < total; b++) {
      tone(b % 2 ? NOTE.G3 : NOTE.C4, start + b * BEAT, BEAT * 0.8, 'triangle', 0.05);
      sleighBell(start + b * BEAT);
      sleighBell(start + (b + 0.5) * BEAT);
    }
    return total;
  } catch {
    return 0;
  }
}
