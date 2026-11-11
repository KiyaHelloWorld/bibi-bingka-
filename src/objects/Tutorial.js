import { gameState, save } from '../gameState.js';
import { TUTORIAL as T, BUBBLES } from '../data/dialogue.js';
import { beep } from '../systems/sound.js';

// Button-only tutorial. Runs once, right after Bibi hatches.
export default class Tutorial {
  constructor(room) {
    this.room = room;
    this.active = !gameState.tutorialDone;
  }

  async run() {
    if (!this.active) return;
    const room = this.room;
    const { hud, character } = room;
    const say = (text, opts = {}) => hud.narration.say(text, { advance: 'select', ...opts });

    room.menuAllowed = false;
    gameState.hunger = 70;
    gameState.hygiene = 70;
    gameState.happy = 80;
    room.refreshMood();

    // ----- meet Bibi -----
    room.bubble.show(BUBBLES.hi, 2000);
    await say(T.intro1);
    await say(T.intro2);

    // ----- moving -----
    say(T.move, { advance: 'none' });
    await room.waitForAll(['left', 'right', 'jump']);
    room.bubble.show(BUBBLES.wheee, 1500);
    await say(T.moveDone);

    // ----- needs: the Stats button -----
    await say(T.needs);
    room.menuLock = 'stats';
    room.menuAllowed = true;
    say(T.pressE_stats, { advance: 'none' });
    await room.waitFor('menu');
    say(T.menuStats, { advance: 'none' });
    await room.waitFor('stats');
    say(T.closeStats, { advance: 'none' });
    await room.waitFor('closed:stats');
    room.menuAllowed = false;
    await say(T.statsDone);

    // ----- hunger -----
    gameState.hunger = 12;
    room.refreshMood();
    room.bubble.show(BUBBLES.hungry, 3000);
    beep(330, 0.08, 2);
    await say(T.hungry);

    room.menuLock = 'food';
    room.menuAllowed = true;
    say(T.pressE_food, { advance: 'none' });
    await room.waitFor('menu');
    say(T.menuFood, { advance: 'none' });
    await room.waitFor('food');
    say(T.pickFood, { advance: 'none' });
    await room.waitFor('fed');
    room.menuAllowed = false;
    await say(T.fed);

    // ----- shower -----
    gameState.hygiene = 10;
    room.refreshMood();
    await room.sneeze();
    room.bubble.show(BUBBLES.stinky, 3500);
    await say(T.stinky, { speaker: 'Bibi' });
    await say(T.wantsShower);

    room.menuLock = 'shower';
    room.menuAllowed = true;
    say(T.pressE_shower, { advance: 'none' });
    await room.waitFor('menu');
    say(T.menuShower, { advance: 'none' });
    await room.waitFor('showered');
    await say(T.showered);

    // ----- wrap up -----
    room.menuLock = null;
    await say(T.menuHelp);
    await say(T.giftCatch);
    await say(T.bye);
    hud.narration.hide();
    character && room.bubble.show('Let\'s be best friends!', 3000);

    this.active = false;
    gameState.tutorialDone = true;
    save();
  }
}
