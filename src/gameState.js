const SAVE_KEY = 'bibi-bingka-save';

const DEFAULT_STATE = {
  stage: 'egg',
  care: 0,
  tutorialDone: false,
  tutorialStep: 0,
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