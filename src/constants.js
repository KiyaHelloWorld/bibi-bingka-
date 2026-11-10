// all your art is drawn on this canvas size
export const ASSET_WIDTH = 3267;
export const ASSET_HEIGHT = 2362;

// character size and position (as a fraction of the screen)
export const CHARACTER_SCREEN_HEIGHT = 0.55; // bigger = bigger character
export const CHARACTER_MAX_SCREEN_WIDTH = 0.9;
export const GROUND_Y = 0.72;                // 0 = top, 1 = bottom
export const FACE_FPS = 2;                   // how fast 2-frame faces flip

// growth stages
// headOffsetY: negative = up, positive = down
// headScale: 1 = original size
export const STAGES = {
  egg:   { next: 'kid',   careToGrow: 5 },
  kid:   { next: 'adult', careToGrow: 20, headOffsetY: 260, headScale: 0.8 },
  adult: { next: null,    careToGrow: null, headOffsetY: 0, headScale: 1.1 },
};

// movement
export const MOVE_SPEED = 0.3;     // keyboard speed
export const WALK_SPEED = 3;       // wander speed (higher = slower)
export const WANDER_DELAY = 2000;  // ms between random walks
export const EDGE_PADDING = 80;    // how close to the edge it can go

// time of day (real clock, 24h)
export const EARLY_MORNING = 5;    // morning_1 starts at 5:00
export const DAYTIME = 9;          // morning_2 starts at 9:00
export const NIGHTTIME = 18;       // night starts at 18:00