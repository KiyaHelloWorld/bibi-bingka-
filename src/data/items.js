// Every image is drawn on the same 3267 x 2362 canvas, so each one gets a
// "crop" frame around its visible pixels: [x, y, width, height].
export const CROPS = {
  'item-egg': [1038, 184, 1878, 1920],
  'item-gift': [982, 284, 1291, 1663],
  'item-gift_2': [982, 284, 1291, 1663],
  'item-food_1': [1151, 825, 818, 818],
  'item-food_2': [1185, 1095, 784, 548],
  'item-food_3': [948, 723, 1021, 920],
  'icon-food_icon': [800, 1639, 514, 547],
  'icon-house_icon': [1996, 1631, 514, 547],
};

// Gift designs used in Gift Catch (files in public/assets/items/).
// Add more here, e.g. 'item-gift_3'. Files that don't exist yet are skipped.
export const GIFT_DESIGNS = ['item-gift', 'item-gift_2'];

export const FOODS = [
  { key: 'item-food_1', name: 'Bibingka', note: 'Warm and filling', hunger: 40, happy: 5 },
  { key: 'item-food_2', name: 'Lechon', note: 'Hearty meal', hunger: 25, happy: 10 },
  { key: 'item-food_3', name: 'Macaroni Salad', note: 'Big meal', hunger: 55, happy: 5 },
];

// The menu, 3 per row, left to right, top to bottom.
// The icons are drawn in src/menuIcons.js.
export const MENU = [
  { id: 'stats',    label: 'Stats',      texture: 'tile-stats' },
  { id: 'food',     label: 'Eat',        texture: 'tile-food' },
  { id: 'shower',   label: 'Shower',     texture: 'tile-shower' },
  { id: 'home',     label: 'Enter Home', texture: 'tile-home' },  // label switches to "Leave Home" inside
  { id: 'gift',     label: 'Gift Catch', texture: 'tile-game' },
  { id: 'settings', label: 'Settings',   texture: 'tile-settings' },
];

// Settings options (shown after choosing Settings)
export const SETTINGS = [
  { id: 'title', label: 'Return to Title' },
  { id: 'reset', label: 'Reset Game' },
];
