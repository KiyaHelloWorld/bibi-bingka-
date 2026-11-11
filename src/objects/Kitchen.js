import { ASSET_HEIGHT, KITCHEN } from '../constants.js';
import { gameState, save } from '../gameState.js';
import { BUBBLES, KITCHEN_TEXT } from '../data/dialogue.js';
import { clamp, moodFor } from '../systems/needs.js';
import { beep } from '../systems/sound.js';
import { cover, fit } from '../ui.js';

// Mealtime: choosing Food teleports Bibi to the kitchen. Bibi walks to the chair in the
// middle and sits; the table (kitchen_table.png) is drawn in front of Bibi, and the food
// is served on it. While Bibi is still hungry they ask for more.
export default class Kitchen {
  constructor(room) {
    this.room = room;
    this.active = false;
    this.state = null; // 'arriving' | 'choosing' | 'eating' | 'asking' | 'leaving'

    this.bg = room.add.image(0, 0, 'bg-kitchen').setDepth(1).setVisible(false);
    this.table = room.add.image(0, 0, 'bg-kitchen_table').setDepth(11).setVisible(false); // in front of Bibi
  }

  // ---------- screen fitting ----------

  // where things go, from the kitchen art (both images use the same 3267 x 2362 canvas)
  measure() {
    const { width, height } = this.room.scale;
    const s = Math.max(width / this.bg.width, height / this.bg.height);
    const top = height / 2 - (this.bg.height * s) / 2;
    return {
      s,
      centerX: width / 2,
      tableTop: top + KITCHEN.tableTopY * s, // screen y of the table's top edge
    };
  }

  layout() {
    if (!this.active) return;
    const { width, height } = this.room.scale;
    cover(this.bg, width, height);
    cover(this.table, width, height);

    const c = this.room.character;
    const m = this.measure();
    c.setScale(m.s * KITCHEN.bibiScale);
    // Bibi's chin sits on the table's edge: face above the table, body hidden behind it
    const chin = KITCHEN.chinY[c.stage] ?? KITCHEN.chinY.kid;
    this.seatY = m.tableTop - (chin - ASSET_HEIGHT / 2) * c.scaleY;
    if (this.state !== 'arriving') c.setPosition(m.centerX, this.seatY);
  }

  // ---------- going in and out ----------

  async enter({ lock = false } = {}) {
    if (this.active) return;
    const room = this.room;
    const c = room.character;
    this.lock = lock;
    this.active = true;
    this.state = 'arriving';
    room.busy = true;
    c.stopWalking();
    room.bubble.hide();
    this.homeX = c.x;

    // teleport!
    beep(880, 0.05, 4);
    room.burst('fx-sparkle', 5);
    await room.fade(250, true);
    this.bg.setVisible(true);
    this.table.setVisible(true);
    room.bg.setVisible(false);
    this.layout();
    const m = this.measure();
    c.setPosition(m.centerX - room.scale.width * 0.3, this.seatY - c.scaleY * 120);
    c.setFacing('right');
    await room.fade(250, false);

    // walk to the chair in the middle and sit down
    await room.tween({ targets: c, x: m.centerX, duration: 900 });
    c.setFacing('front');
    await room.tween({ targets: c, y: this.seatY, duration: 200, ease: 'Quad.easeIn' });
    c.wiggle();
    beep(500, 0.05);
    this.state = 'choosing';
    this.openPicker();
  }

  async leave() {
    if (!this.active || this.state === 'leaving') return;
    const room = this.room;
    this.state = 'leaving';
    this.hidePrompt();
    beep(880, 0.05, 4);
    await room.fade(250, true);
    this.bg.setVisible(false);
    this.table.setVisible(false);
    room.bg.setVisible(true);
    this.active = false;
    this.state = null;
    room.character.x = this.homeX;
    room.layout();
    room.updateTimeOfDay();
    room.character.setFacing('front');
    await room.fade(250, false);
    room.busy = false;
    room.refreshMood();
    room.signal('kitchen:left');
  }

  // ---------- eating ----------

  hidePrompt() {
    this.room.hud.narration.hide();
    this.room.hud.narration.position = 'top';
  }

  openPicker() {
    this.state = 'choosing';
    this.hidePrompt();
    this.room.hud.openFood({ lock: this.lock });
  }

  async eat(food) {
    if (!this.active) return;
    const room = this.room;
    const c = room.character;
    this.state = 'eating';
    const m = this.measure();

    // the food is served on the table, in front of Bibi
    const size = KITCHEN.foodSize * m.s;
    const item = fit(room.add.image(m.centerX, m.tableTop + size * 0.32, food.key, 'crop'), size, size).setDepth(12);
    const base = item.scale;
    item.setScale(0);
    beep(660, 0.05, 2);
    await room.tween({ targets: item, scale: base, duration: 350, ease: 'Back.easeOut' });

    room.bubble.show(BUBBLES.yum, 2000);
    c.setFacing('front');
    c.setMood('eating');
    for (let bite = 1; bite <= 3; bite++) {
      await room.wait(380);
      beep(300 + bite * 80, 0.06);
      c.wiggle();
      await room.tween({ targets: item, scale: base * (1 - bite * 0.3), duration: 120 });
    }
    item.destroy();

    gameState.hunger = clamp(gameState.hunger + food.hunger);
    gameState.happy = clamp(gameState.happy + food.happy);
    room.hud.setNeeds(gameState);
    room.hud.flash('hunger');
    room.burst('fx-heart', 5);
    c.setMood(moodFor(gameState));
    room.giveCare(1);
    save();
    room.signal('fed');

    if (gameState.hunger < KITCHEN.fullAt) {
      // still hungry: ask for more
      this.state = 'asking';
      room.bubble.show(BUBBLES.moreFood, 0);
      beep(520, 0.06, 2);
      // text box at the bottom here, so it doesn't cover Bibi's speech bubble
      room.hud.narration.position = 'bottom';
      room.hud.narration.say(this.lock ? KITCHEN_TEXT.moreLocked : KITCHEN_TEXT.more, { advance: 'none' });
    } else {
      room.bubble.show(BUBBLES.full, 1800);
      await room.wait(1600);
      this.leave();
    }
  }

  // buttons while in the kitchen (returns true if used)
  handle(action) {
    if (!this.active) return false;
    if (this.state === 'asking') {
      if (action === 'select') {
        this.room.bubble.hide();
        this.openPicker();
      } else if (action === 'settings' && !this.lock) {
        this.room.bubble.hide();
        this.leave();
      }
    }
    return true; // no walking, jumping or menu while at the table
  }
}
