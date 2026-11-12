// all your art is drawn on this canvas size
export const ASSET_WIDTH = 3267;
export const ASSET_HEIGHT = 2362;

// ---------- hardware buttons ----------
// Keyboard key -> game action. Change the keys here when the real buttons are wired up.
// (Hardware can also call window.bibi.press('select') etc. directly.)
export const BUTTONS = {
  W: 'jump',
  A: 'left',
  D: 'right',
  E: 'settings', // opens the menu
  Q: 'select',
};

// character size and position (as a fraction of the screen)
export const CHARACTER_SCREEN_HEIGHT = 0.58; // bigger = bigger character
export const CHARACTER_MAX_SCREEN_WIDTH = 0.9;
export const GROUND_Y = 0.77;                // 0 = top, 1 = bottom
export const JUMP_HEIGHT = 0.12;             // fraction of the screen height
export const FACE_FPS = 2;                   // how fast 2-frame faces flip

// growth stages
// careToGrow: care actions (feeding, showering, gifts) needed to grow to `next`
// headOffsetX / headOffsetY / headScale: where the big heads/ faces sit on the body
//   (the baby uses its own heads/baby/ faces, and borrows these for moods it has no art for)
export const STAGES = {
  egg:   { next: 'baby',  careToGrow: null },
  baby:  { next: 'kid',   careToGrow: 8,  headOffsetX: 36, headOffsetY: 420, headScale: 0.74 },
  kid:   { next: 'adult', careToGrow: 20, headOffsetX: 36, headOffsetY: 420, headScale: 0.74 },
  adult: { next: null,    careToGrow: null, headOffsetX: 0, headOffsetY: 0, headScale: 1.1 },
};

// movement
export const MOVE_SPEED = 0.3;     // keyboard speed
export const WALK_SPEED = 3;       // wander speed (higher = slower)
export const WANDER_DELAY = 2000;  // ms between random walks
export const EDGE_PADDING = 80;    // how close to the edge it can go

// needs (0-100), how much they drop per real minute after the tutorial
export const NEEDS_DECAY_PER_MIN = { hunger: 2, hygiene: 1.5, happy: 1.8 };
export const LOW_NEED = 25;              // below this Bibi gets sad and complains
export const VERY_LOW_NEED = 20;         // when ALL needs are below this, Bibi is super sad (crying)
export const MAX_AWAY_MINUTES = 180;     // most "time away" counted when the game is reopened

// kitchen (mealtime). Numbers are on the 3267 x 2362 kitchen art.
export const KITCHEN = {
  tableTopY: 1715,          // y of the table's top edge in kitchen_table.png
  bibiScale: 0.55,          // Bibi's size in the chair (bigger = bigger Bibi)
  // the table's edge lines up just under Bibi's mouth (y on Bibi's art, per stage).
  // bigger number = Bibi sits higher above the table
  chinY: { baby: 2090, kid: 2010, adult: 1780 },
  foodSize: 1000,           // size of the food on the table
  fullAt: 80,               // Bibi asks for more food until Hunger reaches this
};

// hatching
export const HATCH_PRESSES = 12;

// time of day (real clock, 24h)
export const EARLY_MORNING = 5;    // morning_1 starts at 5:00
export const DAYTIME = 9;          // morning_2 starts at 9:00
export const NIGHTTIME = 18;       // night sky starts at 18:00

// bedtime (real clock): Bibi is asleep in the bedroom from 22:00 to 4:00.
// Playing during these hours, the player has to wake Bibi up first.
export const SLEEP_START_HOUR = 22;
export const SLEEP_END_HOUR = 4;

// bedroom positions, on the 3267 x 2362 bedroom art
export const BEDROOM = {
  bibiScale: 0.55,  // Bibi's size in the bedroom
  doorX: 2950,      // where Bibi appears (by the door)
  floorY: 2290,     // Bibi's feet when standing on the floor
  bedFootX: 1650,   // where Bibi stops before hopping onto the bed
  bedX: 760,        // middle of the bed
  bedY: 1760,       // Bibi's feet when in bed (smaller = higher)
  darkness: 0.6,    // how dark the room gets with the light off (0 = no change, 1 = black)
  darkColor: 0x0b0f2e, // night-blue
};
