// Every image is drawn on the same 3267 x 2362 canvas, so each one gets a
// "crop" frame around its visible pixels: [x, y, width, height].
export const CROPS = {
  'item-egg': [1038, 184, 1878, 1920],
  'item-gift': [982, 284, 1291, 1663],
  'item-food_1': [1151, 825, 818, 818],
  'item-food_2': [1185, 1095, 784, 548],
  'item-food_3': [948, 723, 1021, 920],
  'icon-food_icon': [800, 1639, 514, 547],
  'icon-house_icon': [1996, 1631, 514, 547],
};

export const FOODS = [
  { key: 'item-food_1', name: 'Bibingka', note: 'Warm and filling', hunger: 40, happy: 5 },
  { key: 'item-food_2', name: 'Lumpia', note: 'Crunchy snack', hunger: 25, happy: 10 },
  { key: 'item-food_3', name: 'Fried Rice', note: 'Big meal', hunger: 55, happy: 5 },
];

// The 3 x 3 menu, left to right, top to bottom (same order as the UI mockup).
// `texture` is either one of your icons (cropped) or a pixel tile made in ui/textures.js.
export const MENU = [
  { id: 'stats',    label: 'Stats',      texture: 'tile-stats' },
  { id: 'food',     label: 'Food',       texture: 'icon-food_icon', frame: 'crop' },
  { id: 'shower',   label: 'Shower',     texture: 'tile-shower' },
  { id: 'home',     label: 'Bedtime',    texture: 'icon-house_icon', frame: 'crop' },
  { id: 'door',     label: 'Go Outside', texture: 'tile-door' },
  { id: 'gift',     label: 'Gifts',      texture: 'tile-gift' },
  { id: 'phone',    label: 'Phone',      texture: 'tile-phone' },
  { id: 'settings', label: 'Settings',   texture: 'tile-settings' },
  { id: 'back',     label: 'Back',       texture: 'tile-back' },
];
