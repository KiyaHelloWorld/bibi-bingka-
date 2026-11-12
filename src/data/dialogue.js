// ---------- opening story (any button moves it along) ----------
export const STORY = [
  { bg: 'night', text: 'Christmas Eve. Midnight. The whole town is asleep.', fx: 'twinkle' },
  { bg: 'night', text: 'Then the sky tears open. A burning star falls, straight toward your yard.', fx: 'meteor' },
  { bg: 'night', text: 'BOOM!', fx: 'boom' },
  { bg: 'night', text: 'Silence. Out by the old tree, something is glowing.', fx: 'glow' },
  { bg: 'morning_1', text: 'At first light, you run outside, heart pounding.' },
  { bg: 'morning_2', text: 'Under the Christmas tree sits an egg. Warm. Humming. Alive.', egg: true },
  { bg: 'morning_2', text: 'It has been waiting for you.' },
];

export const HATCH = {
  start: 'The egg is shaking! Press any button again and again to help it hatch!',
  done: 'Bibi has hatched!',
};

// ---------- tutorial ----------
export const TUTORIAL = {
  intro1: 'This is Bibi, your baby Tomodachi!',
  intro2: 'Your mission is to take care of them. Keep Bibi fed, clean, and happy so they grow up big and strong!',
  move: 'Press A and D to walk, and W to jump. Try all three!',
  moveDone: 'Nice moves!',
  needs: "These are Bibi's needs: Hunger, Hygiene, and Happy. You can also check them in Stats!",
  pressE_stats: 'Press E to open the menu.',
  menuStats: 'The Stats icon is highlighted. Press Q to open it.',
  closeStats: "Here are Bibi's needs. Press Q or E to close it.",
  statsDone: "Keep an eye on the meters at the top. Don't let them run out!",

  hungry: 'Oh, look at that! Bibi is hungry!',
  pressE_food: 'Feed them by pressing E.',
  menuFood: 'The Food icon is highlighted. Press Q to open it.',
  pickFood: 'Bibi is at the table! Choose a food with A and D, then press Q to serve it.',
  fed: 'Yum! Bibi loved that!',

  stinky: "I'm so stinky :(",
  wantsShower: 'Bibi wants to shower!',
  pressE_shower: 'Make them shower by pressing E.',
  menuShower: 'The Shower icon is highlighted. Press Q to start the shower.',
  showered: 'Squeaky clean! Bibi feels so much better.',

  bored: 'Uh oh, Bibi is bored! Playing Gift Catch is the best way to make Bibi happy.',
  pressE_game: 'Press E to open the menu.',
  menuGame: 'The Gift Catch icon is highlighted. Press Q to play!',
  gameHow: 'Catch every gift! Walk into the low ones with A and D, and jump with W for the high ones.',
  gameDone: 'Great playing! The more gifts you catch, the happier Bibi gets.',
  menuHelp: 'Press E any time to open the menu. A and D move, W jumps a row, Q chooses, and E closes it.',
  homeHelp: 'Choose Enter House to go inside, and Sleep to put Bibi to bed. From 10 PM to 4 AM Bibi sleeps, so wake them up before playing!',
  bye: 'That is everything. Take good care of Bibi!',
};

// ---------- things Bibi says ----------
export const BUBBLES = {
  hi: 'Hello beautiful human! :)',
  wheee: 'Wheee!',
  hungry: 'My tummy is rumbling...',
  stinky: "I'm so stinky :(",
  bored: 'Play with me!',
  yum: 'Yummy!',
  clean: 'So fresh!',
  gift: 'A present! Thank you!',
  night: 'Good night...',
  morning: 'Good morning!',
  grew: 'I grew!',
  moreFood: 'More food pls!',
  inside: 'Home sweet home!',
  outside: 'Fresh air!',
  full: "I'm full! Thank you!",
  sleepy: 'Zzz... so sleepy...',
  wakeFirst: 'Bibi is sleeping. Press E and choose Wake Up first!',
};

// ---------- kitchen ----------
export const KITCHEN_TEXT = {
  more: 'Bibi is still hungry! Press Q to pick more food, or E to leave the kitchen.',
  moreLocked: 'Bibi is still hungry! Press Q to pick more food.',
};

// ---------- Gift Catch minigame ----------
export const MINIGAME = {
  start: 'Catch all the gifts! A/D to move, W to jump. E to stop.',
  win: 'You caught every gift!',
  timeUp: "Time's up!",
  quit: 'Game stopped.',
  winBubble: 'Best Christmas ever!',
  someBubble: 'That was fun!',
};

// ---------- random things Bibi says when idle ----------
export const IDLE_LINES = [
  "Have an Animo Christmas!",
  "Animo La Salle!",
  "Merry Christmas!",
  "Is it Nocha Buena already?",
  "Live Jesus in our hearts! Forever!",
  "Can we play Gift Catch?",
  "I want to eat Bibingka so bad!",
  "Let's go caroling!",
  //"Simbang Gabi tonight, G?"
];
export const IDLE_CHAT_MIN_S = 15;   // Bibi waits this long (at least) between idle lines
export const IDLE_CHAT_MAX_S = 30;   // ...and at most this long
