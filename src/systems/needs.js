import { NEEDS_DECAY_PER_MIN, LOW_NEED, VERY_LOW_NEED } from '../constants.js';

export const NEEDS = ['hunger', 'hygiene', 'happy'];

export const clamp = (v) => Math.max(0, Math.min(100, v));

// lower Bibi's needs by `minutes` worth of time (slower while asleep)
export function decay(state, minutes) {
  const f = state.asleep ? 0.4 : 1;
  state.hunger = clamp(state.hunger - NEEDS_DECAY_PER_MIN.hunger * minutes * f);
  state.hygiene = clamp(state.hygiene - NEEDS_DECAY_PER_MIN.hygiene * minutes * f);
  state.happy = state.asleep
    ? clamp(state.happy + 0.5 * minutes)
    : clamp(state.happy - NEEDS_DECAY_PER_MIN.happy * minutes);
}

export function moodFor(state) {
  if (state.asleep) return 'sleep';
  if (NEEDS.every((k) => state[k] < VERY_LOW_NEED)) return 'superSad'; // everything very low: crying
  if (state.happy < 10) return 'angry';
  if (NEEDS.some((k) => state[k] < LOW_NEED)) return 'sad';
  return 'idle';
}
