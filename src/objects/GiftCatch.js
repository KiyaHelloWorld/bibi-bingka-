import Phaser from 'phaser';
import { PATTERNS, MINIGAME_SECONDS, HAPPY_PER_GIFT, HAPPY_ALL_GIFTS_BONUS, GIFT_SIZE } from '../data/minigame.js';
import { MINIGAME } from '../data/dialogue.js';
import { JUMP_HEIGHT } from '../constants.js';
import { gameState } from '../gameState.js';
import { clamp } from '../systems/needs.js';
import { beep } from '../systems/sound.js';
import { fit, unit } from '../ui.js';
import { GIFT_DESIGNS } from '../data/items.js';

// Gift Catch: gifts are spread across the screen in a random pattern.
// Walk (A/D) into the low ones, jump (W) for the high ones. Catch them all for extra happiness.
let lastPattern = -1;

export default class GiftCatch {
  constructor(room) {
    this.room = room;
    this.active = false;
  }

  start() {
    const room = this.room;
    const c = room.character;

    // random pattern, never the same one twice in a row
    let i;
    do i = Phaser.Math.Between(0, PATTERNS.length - 1);
    while (i === lastPattern && PATTERNS.length > 1);
    lastPattern = i;
    this.pattern = PATTERNS[i];

    this.active = true;
    this.caught = 0;
    this.total = this.pattern.gifts.length;
    this.timeLeft = MINIGAME_SECONDS;

    c.stopWalking();
    c.setFacing('front');
    room.bubble.hide();

    // mix the gift designs that are available (gift.png, gift_2.png, ...)
    // (an even share of each, shuffled so they don't line up with the pattern)
    const designs = GIFT_DESIGNS.filter((key) => room.textures.exists(key));
    const looks = Phaser.Utils.Array.Shuffle(this.pattern.gifts.map((_, n) => designs[n % designs.length]));

    this.gifts = this.pattern.gifts.map(([fx, level], n) => {
      const img = room.add.image(0, 0, looks[n], 'crop').setDepth(14);
      img.fx = fx;
      img.level = level;
      img.caught = false;
      img.setScale(0);
      room.tweens.add({ targets: img, scale: 1, duration: 300, delay: n * 70, ease: 'Back.easeOut', onComplete: () => this.place(img) });
      return img;
    });
    this.layout();

    room.hud.showCounter(this.counterText());
    room.hud.toast(MINIGAME.start, 3000);
    beep(660, 0.08, 4);

    if (MINIGAME_SECONDS > 0) {
      this.clock = room.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
          this.timeLeft--;
          room.hud.showCounter(this.counterText());
          if (this.timeLeft <= 5 && this.timeLeft > 0) beep(440, 0.05);
          if (this.timeLeft <= 0) this.end('time');
        },
      });
    }
  }

  counterText() {
    const time = MINIGAME_SECONDS > 0 ? `   0:${String(Math.max(0, this.timeLeft)).padStart(2, '0')}` : '';
    return `Gifts ${this.caught}/${this.total}${time}`;
  }

  // gift size and positions follow the screen and Bibi's size
  layout() {
    if (!this.active) return;
    const room = this.room;
    const c = room.character;
    const { width, height } = room.scale;
    const pad = c.edge();
    const restTop = room.groundY + (c.getTopY() - c.y);       // Bibi's head when standing
    const restBottom = room.groundY + (c.getBottomY() - c.y); // Bibi's feet
    this.size = height * GIFT_SIZE;

    this.gifts.forEach((g) => {
      g.homeX = pad + g.fx * (width - pad * 2);
      g.homeY = g.level === 0
        ? (restTop + restBottom) / 2                          // body height: walk into it
        : restTop - this.size * 0.62;                       // just above the head: jump for it
      this.place(g);
    });
  }

  place(g) {
    if (g.caught) return;
    g.setPosition(g.homeX, g.homeY);
    const base = fit(g, this.size, this.size).scale;
    g.baseScale = base;
    this.room.tweens.killTweensOf(g);
    g.setScale(base);
    this.room.tweens.add({ targets: g, y: g.homeY - this.size * 0.12, duration: 600 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // called every frame by the Room
  update() {
    if (!this.active) return;
    const c = this.room.character;
    const halfW = 600 * c.scaleX;
    const top = c.getTopY();
    const bottom = c.getBottomY();
    const r = this.size / 2;

    for (const g of this.gifts) {
      if (g.caught) continue;
      const hit = Math.abs(g.x - c.x) < halfW + r * 0.6 && g.y + r > top && g.y - r < bottom;
      if (hit) this.collect(g);
    }
  }

  collect(g) {
    const room = this.room;
    g.caught = true;
    this.caught++;
    beep(700 + this.caught * 60, 0.06, 2);
    room.tweens.killTweensOf(g);
    room.tweens.add({ targets: g, y: g.y - this.size, scale: g.baseScale * 1.4, alpha: 0, duration: 300, onComplete: () => g.destroy() });
    room.burstAt(g.x, g.y, 'fx-sparkle', 3);
    room.hud.showCounter(this.counterText());
    if (this.caught >= this.total) this.end('win');
  }

  // reason: 'win' | 'time' | 'quit'
  end(reason) {
    if (!this.active) return;
    const room = this.room;
    this.active = false;
    this.clock?.remove(false);
    this.gifts.forEach((g) => {
      if (g.caught) return;
      room.tweens.killTweensOf(g);
      room.tweens.add({ targets: g, scale: 0, duration: 200, onComplete: () => g.destroy() });
    });
    room.hud.hideCounter();

    if (reason === 'quit') {
      room.hud.toast(MINIGAME.quit);
      room.endMinigame(0);
      return;
    }

    const all = this.caught >= this.total;
    const happy = this.caught * HAPPY_PER_GIFT + (all ? HAPPY_ALL_GIFTS_BONUS : 0);
    gameState.happy = clamp(gameState.happy + happy);

    room.hud.toast(`${all ? MINIGAME.win : MINIGAME.timeUp} ${this.caught}/${this.total} gifts, +${happy} Happy`, 3200);
    if (this.caught > 0) {
      room.bubble.show(all ? MINIGAME.winBubble : MINIGAME.someBubble, 2600);
      room.burst('fx-heart', all ? 8 : 4);
      beep(all ? 1047 : 660, 0.08, all ? 5 : 2);
    }
    room.endMinigame(this.caught);
  }
}
