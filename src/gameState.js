const SAVE_KEY = 'bibi-bingka-save';

const DEFAULT_STATE = {
  stage: 'egg',
  care: 0,
  tutorialDone: false,
  hunger: 80,
  hygiene: 80,
  happy: 80,
  asleep: false,
  inside: false, // in the house (living room)
  wokeNight: null, // the night the player woke Bibi up (so Bibi stays awake that night)
  sound: true,
  lastSeen: Date.now(),
};

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export const gameState = load();

export function save() {
  gameState.lastSeen = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  } catch {
    // saving failed (e.g. private browsing), the game still works
  }
}

export function resetSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
  location.reload();
}
