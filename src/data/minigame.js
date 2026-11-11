// Gift Catch minigame patterns.
// Each gift is [x, level]:
//   x     = 0 (left edge of the play area) to 1 (right edge)
//   level = 0 -> on the ground, Bibi just walks into it
//           1 -> in the air, Bibi has to jump (W) to catch it
// One pattern is picked at random every time the minigame starts
// (never the same one twice in a row). Add as many as you like.
export const PATTERNS = [
  {
    name: 'Gift Line',
    gifts: [[0, 0], [0.14, 0], [0.28, 0], [0.42, 0], [0.58, 0], [0.72, 0], [0.86, 0], [1, 0]],
  },
  {
    name: 'Up High',
    gifts: [[0, 1], [0.14, 1], [0.28, 1], [0.42, 1], [0.58, 1], [0.72, 1], [0.86, 1], [1, 1]],
  },
  {
    name: 'Zigzag',
    gifts: [[0, 0], [0.14, 1], [0.28, 0], [0.42, 1], [0.58, 0], [0.72, 1], [0.86, 0], [1, 1]],
  },
  {
    name: 'Rainbow',
    gifts: [[0, 0], [0.12, 0], [0.26, 1], [0.42, 1], [0.58, 1], [0.74, 1], [0.88, 0], [1, 0]],
  },
  {
    name: 'Valley',
    gifts: [[0, 1], [0.12, 1], [0.26, 1], [0.42, 0], [0.58, 0], [0.74, 1], [0.88, 1], [1, 1]],
  },
  {
    name: 'Twin Towers',
    gifts: [[0, 0], [0.08, 1], [0.16, 0], [0.84, 0], [0.92, 1], [1, 0], [0.5, 0], [0.5, 1]],
  },
];

export const MINIGAME_SECONDS = 30;        // time limit (0 = no limit)
export const HAPPY_PER_GIFT = 3;           // happiness for each gift caught
export const HAPPY_ALL_GIFTS_BONUS = 20;   // extra happiness for catching every gift
