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
    gifts: [[0, 0], [0.2, 0], [0.4, 0], [0.6, 0], [0.8, 0], [1, 0]],
  },
  {
    name: 'Up High',
    gifts: [[0, 1], [0.2, 1], [0.4, 1], [0.6, 1], [0.8, 1], [1, 1]],
  },
  {
    name: 'Zigzag',
    gifts: [[0, 0], [0.2, 1], [0.4, 0], [0.6, 1], [0.8, 0], [1, 1]],
  },
  {
    name: 'Rainbow',
    gifts: [[0, 0], [0.18, 1], [0.38, 1], [0.62, 1], [0.82, 1], [1, 0]],
  },
  {
    name: 'Valley',
    gifts: [[0, 1], [0.2, 1], [0.4, 0], [0.6, 0], [0.8, 1], [1, 1]],
  },
  {
    name: 'Twin Towers',
    gifts: [[0, 0], [0.12, 1], [0.5, 0], [0.5, 1], [0.88, 1], [1, 0]],
  },
];

export const GIFT_SIZE = 0.17;             // gift size, as a fraction of the screen height
export const MINIGAME_SECONDS = 30;        // time limit (0 = no limit)
export const HAPPY_PER_GIFT = 4;           // happiness for each gift caught
export const HAPPY_ALL_GIFTS_BONUS = 20;   // extra happiness for catching every gift
