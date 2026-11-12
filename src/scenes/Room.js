import Phaser from 'phaser';
import Character from '../objects/Character.js';
import SpeechBubble from '../objects/SpeechBubble.js';
import Tutorial from '../objects/Tutorial.js';
import GiftCatch from '../objects/GiftCatch.js';
import Kitchen from '../objects/Kitchen.js';
import Bedroom from '../objects/Bedroom.js';
import { inSleepWindow, nightKey } from '../systems/clock.js';
import { controls } from '../systems/controls.js';
import { beep } from '../systems/sound.js';
import { decay, moodFor, clamp, NEEDS } from '../systems/needs.js';
import { gameState, save, resetSave } from '../gameState.js';
import { BUBBLES, IDLE_LINES, IDLE_CHAT_MIN_S, IDLE_CHAT_MAX_S } from '../data/dialogue.js';
import { cover, fit, unit } from '../ui.js';
import {
  ASSET_WIDTH,
  ASSET_HEIGHT,
  CHARACTER_SCREEN_HEIGHT,
  CHARACTER_MAX_SCREEN_WIDTH,
  GROUND_Y,
  JUMP_HEIGHT,
  STAGES,
  WANDER_DELAY,
  MOVE_SPEED,
  EARLY_MORNING,
  DAYTIME,
  NIGHTTIME,
  LOW_NEED,
  MAX_AWAY_MINUTES,
} from '../constants.js';

const STAGE_NAMES = { baby: 'Baby', kid: 'Kid', adult: 'Adult' };

export default class Room extends Phaser.Scene {
  constructor() {
    super('Room');
  }

  create() {
    const { width, height } = this.scale;

    if (gameState.stage === 'egg') gameState.stage = 'baby'; // safety: the Room never shows the egg

    // background
    this.bg = this.add.image(width / 2, height / 2, 'bg-morning_2');

    // character
    this.character = new Character(this, width / 2, height * GROUND_Y, gameState.stage).setDepth(10);
    this.bubble = new SpeechBubble(this, this.character);
    this.stink = [0, 1, 2].map(() => this.add.image(0, 0, 'fx-stink').setDepth(13).setVisible(false));

    this.busy = false;          // eating / showering
    this.minigame = new GiftCatch(this);
    this.kitchen = new Kitchen(this);
    this.bedroom = new Bedroom(this);
    this.lastInputAt = Date.now();
    this.menuAllowed = true;    // the tutorial turns the menu off and on
    this.menuLock = null;       // the tutorial highlights one menu item
    this.hudReady = false;
    this.signals = new Phaser.Events.EventEmitter();

    // fit everything to the screen, and again whenever the window resizes
    this.layout();
    this.scale.on('resize', this.layout, this);

    // buttons
    const off = controls.push((a) => this.onAction(a));
    this.events.once('shutdown', () => {
      off();
      this.scale.off('resize', this.layout, this);
      // the HUD scene is reused next time, so drop the listeners this Room added
      ['opened', 'closed', 'choose', 'food', 'foodBack', 'settings'].forEach((e) => this.hud?.events.off(e));
    });
    // R = reset save, only while running `npm run dev`
    if (import.meta.env.DEV) {
      this.input.keyboard.on('keydown-R', () => resetSave());
    }

    // random wandering
    this.time.addEvent({
      delay: WANDER_DELAY,
      loop: true,
      callback: () => {
        if (!this.canMove() || this.character.isPlayerMoving || this.minigame.active) return;
        if (Math.random() < 0.4) return; // sometimes just stand there
        const pad = this.character.edge();
        const x = Phaser.Math.Between(pad, this.scale.width - pad);
        this.character.walkTo(x);
      },
    });

    this.cameras.main.fadeIn(400);

    // HUD runs on top of the room
    this.scene.launch('HUD');
    this.hud = this.scene.get('HUD');
    this.hud.events.once('create', () => this.start());
  }

  start() {
    this.hudReady = true;
    this.hud.events.on('opened', (name) => this.signal(name));
    this.hud.events.on('closed', (name) => this.signal(`closed:${name}`));
    this.hud.events.on('choose', (id) => this.onMenu(id));
    this.hud.events.on('food', (food) => this.kitchen.eat(food));
    this.hud.events.on('foodBack', () => this.kitchen.leave());
    this.hud.events.on('settings', (id) => {
      if (id === 'title') this.returnToTitle();
      if (id === 'reset') resetSave(); // clears the save and restarts from the title screen
    });

    // time of day
    this.updateTimeOfDay();
    this.time.addEvent({ delay: 60000, loop: true, callback: () => this.updateTimeOfDay() });

    // bedtime: Bibi is already in bed (or was left asleep last time)
    if (gameState.tutorialDone) {
      const bedtime = inSleepWindow() && gameState.wokeNight !== nightKey();
      if (bedtime) gameState.asleep = true;
      if (gameState.asleep) {
        this.bedroom.enter({ animate: false });
        this.time.delayedCall(800, () => this.hud.toast(BUBBLES.wakeFirst, 3500));
      }
    }
    this.wasInSleepWindow = inSleepWindow();
    this.time.addEvent({ delay: 30000, loop: true, callback: () => this.checkBedtime() });

    if (!gameState.tutorialDone) {
      this.tutorial = new Tutorial(this);
      this.tutorial.run().then(() => this.startLife());
    } else {
      // count some of the time the game was closed
      const away = Math.min((Date.now() - gameState.lastSeen) / 60000, MAX_AWAY_MINUTES);
      if (away > 1) decay(gameState, away);
      this.startLife();
    }
    this.refreshMood();
  }

  // needs go down over time once the tutorial is done
  startLife() {
    this.menuAllowed = true; // (also after the tutorial)
    this.menuLock = null;
    this.hud.setStatsVisible(true);
    this.hud.setNeeds(gameState);
    this.warned = {};
    this.scheduleIdleChat();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        decay(gameState, 1 / 60);
        this.hud.setNeeds(gameState);
        if (!this.busy) this.refreshMood();
        if (this.minigame.active) return; // no chatter while playing
        this.idleChat();
        this.nag('hunger', gameState.hunger < LOW_NEED, BUBBLES.hungry);
        this.nag('hygiene', gameState.hygiene < LOW_NEED, BUBBLES.stinky);
        this.nag('happy', gameState.happy < LOW_NEED, BUBBLES.bored);
        if (gameState.hygiene < LOW_NEED && !this.busy && !gameState.asleep && Math.random() < 0.03) this.sneeze();
      },
    });
    this.time.addEvent({ delay: 10000, loop: true, callback: () => save() });
  }

  nag(key, low, line) {
    if (low && !this.warned[key] && !this.busy && !gameState.asleep) {
      this.warned[key] = true;
      this.bubble.show(line, 3000);
      beep(330, 0.08, 2);
    }
    if (!low) this.warned[key] = false;
  }

  // ---------- idle chatter ----------

  scheduleIdleChat() {
    this.nextChatAt = Date.now() + Phaser.Math.Between(IDLE_CHAT_MIN_S, IDLE_CHAT_MAX_S) * 1000;
  }

  // Bibi says something random when nothing is going on
  idleChat() {
    const idle = !this.busy && !gameState.asleep && !this.hud.isOpen() && !this.hud.narration.visible
      && !this.bubble.visible && !this.character.isPlayerMoving && NEEDS.every((k) => gameState[k] >= LOW_NEED);
    if (!idle) return;
    if (Date.now() - this.lastInputAt < 5000) return; // wait until the player stops pressing buttons
    if (Date.now() < this.nextChatAt) return;

    let line;
    do line = Phaser.Utils.Array.GetRandom(IDLE_LINES);
    while (line === this.lastChat && IDLE_LINES.length > 1);
    this.lastChat = line;
    this.bubble.show(line, 3200);
    beep(880, 0.04, 2);
    this.scheduleIdleChat();
  }

  // ---------- events for the tutorial ----------

  signal(name) {
    this.signals.emit(name);
  }

  waitFor(name) {
    return new Promise((r) => this.signals.once(name, r));
  }

  waitForAll(names) {
    const left = new Set(names);
    return new Promise((resolve) => {
      const handlers = names.map((n) => {
        const h = () => {
          left.delete(n);
          if (!left.size) {
            names.forEach((m, i) => this.signals.off(m, handlers[i]));
            resolve();
          }
        };
        this.signals.on(n, h);
        return h;
      });
    });
  }

  // ---------- buttons ----------

  canMove() {
    return this.character.canMove() && !this.busy && !gameState.asleep && !(this.hudReady && this.hud.isOpen());
  }

  onAction(a) {
    this.lastInputAt = Date.now();
    if (this.hudReady && this.hud.narration.handle(a)) return true;
    if (this.kitchen.handle(a)) return true;

    // during Gift Catch, E stops the game; everything else is moving and jumping
    if (this.minigame.active && a === 'settings') {
      this.minigame.end('quit');
      return true;
    }

    if (gameState.asleep && ['jump', 'left', 'right', 'select'].includes(a) && !(this.hudReady && this.hud.isOpen())) {
      if (!this.nagAt || Date.now() - this.nagAt > 2500) this.hud.toast(BUBBLES.wakeFirst, 2500);
      this.nagAt = Date.now();
      return true;
    }

    if (a === 'jump') {
      if (this.canMove() && this.character.jump()) {
        beep(500, 0.06, 2);
        if (gameState.tutorialDone) gameState.happy = clamp(gameState.happy + 0.5);
      }
      this.signal('jump');
    }
    if (a === 'left' || a === 'right') this.signal(a);
    // asleep: E wakes Bibi up straight away (no menu)
    if (a === 'settings' && gameState.asleep && this.hudReady && !this.hud.isOpen()) {
      if (this.bedroom.state === 'inBed' && !this.busy) this.setAsleep(false);
      return true;
    }

    if (a === 'settings' && !this.minigame.active) {
      if (this.menuAllowed && this.hudReady && !this.busy) {
        this.character.stopWalking();
        this.hud.openMenu({ lock: this.menuLock, asleep: gameState.asleep, inside: gameState.inside });
      } else {
        beep(200, 0.05);
      }
    }
    return true;
  }

  onMenu(id) {
    // while asleep, wake Bibi up before doing anything else
    if (gameState.asleep && !['sleep', 'settings'].includes(id)) {
      this.hud.toast(BUBBLES.wakeFirst, 2500);
      return;
    }
    switch (id) {
      case 'food':
        this.kitchen.enter({ lock: !!this.menuLock });
        break;
      case 'shower':
        this.shower();
        break;
      case 'stats':
        this.hud.openStats(gameState, [
          ['Stage', STAGE_NAMES[gameState.stage]],
          ['Growing', STAGES[gameState.stage].careToGrow ? `${gameState.care}/${STAGES[gameState.stage].careToGrow}` : 'All grown up!'],
        ]);
        break;
      case 'home':
        this.setInside(!gameState.inside);
        break;
      case 'sleep':
        this.setAsleep(!gameState.asleep);
        break;
      case 'gift':
        this.minigame.start();
        break;
      case 'settings':
        this.hud.openSettings();
        break;
      default:
        this.hud.toast('Coming soon!');
    }
  }

  // ---------- care actions ----------

  async shower() {
    this.busy = true;
    const c = this.character;
    const u = unit(this);
    c.stopWalking();
    c.setFacing('front');
    c.setMood('shower');
    beep(1200, 0.05, 3);

    const top = c.getTopY();
    const head = this.add.image(c.x, top - 45 * u, 'fx-showerhead').setScale(9 * u).setDepth(12);
    const spread = 520 * c.scaleX;
    const drops = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        const d = this.add.image(c.x + Phaser.Math.Between(-spread, spread), top - 10 * u, 'fx-drop').setScale(4 * u).setDepth(13);
        this.tweens.add({ targets: d, y: c.getBottomY(), alpha: 0.3, duration: 600, onComplete: () => d.destroy() });
      },
    });
    const bubbles = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        const b = this.add.image(c.x + Phaser.Math.Between(-spread, spread), Phaser.Math.Between(top + 40 * u, c.getBottomY()), 'fx-bubble')
          .setScale(5 * u).setDepth(13);
        this.tweens.add({ targets: b, y: b.y - 60 * u, alpha: 0, scale: 7 * u, duration: 900, onComplete: () => b.destroy() });
        beep(1300 + Math.random() * 400, 0.03);
      },
    });

    // scrub scrub: Bibi turns while showering (shower_front / shower_left / shower_right)
    const turns = ['front', 'left', 'front', 'right'];
    for (let i = 0; i < 8; i++) {
      c.setFacing(turns[i % 4]);
      await this.wait(450);
    }
    drops.remove(false);
    bubbles.remove(false);
    head.destroy();

    c.setFacing('front');
    gameState.hygiene = 100;
    gameState.happy = clamp(gameState.happy + 5);
    this.hud.setNeeds(gameState);
    this.hud.flash('hygiene');
    this.burst('fx-sparkle', 7);
    beep(1320, 0.06, 3);
    this.bubble.show(BUBBLES.clean, 2200);
    this.busy = false;
    this.refreshMood();
    this.giveCare(1);
    this.signal('showered');
  }

  // called by GiftCatch when the game is over
  endMinigame(caught) {
    this.signal('minigame:end');
    this.hud.setNeeds(gameState);
    if (caught > 0) this.hud.flash('happy');
    this.refreshMood();
    if (caught > 0) this.giveCare(1);
    save();
    this.scheduleIdleChat();
  }

  async sneeze() {
    if (this.busy) return;
    const c = this.character;
    c.setMood('sneeze');
    beep(900, 0.05, 2);
    c.wiggle();
    await this.wait(1200);
    this.refreshMood();
  }

  // Enter House: Bibi goes inside (living room). Leave House: back out to the yard.
  async setInside(inside) {
    this.busy = true;
    this.character.stopWalking();
    beep(inside ? 660 : 880, 0.05, 3);
    await this.fade(250, true);
    gameState.inside = inside;
    save();
    this.updateTimeOfDay();
    this.character.setFacing('front');
    await this.fade(250, false);
    this.busy = false;
    this.bubble.show(inside ? BUBBLES.inside : BUBBLES.outside, 2000);
  }

  // Sleep: teleport to the bedroom, walk to the bed and sleep. Wake Up: hop off, back to where Bibi was.
  async setAsleep(asleep) {
    if (asleep === gameState.asleep) return;
    gameState.asleep = asleep;
    // waking up during bedtime hours keeps Bibi awake for the rest of that night
    if (!asleep && inSleepWindow()) gameState.wokeNight = nightKey();
    if (!asleep) this.hud.hideToast(); // drop the "Bibi is sleeping" reminder
    save();
    if (asleep) {
      await this.bedroom.enter();
      this.bubble.show(BUBBLES.night, 2200);
    } else {
      await this.bedroom.leave();
      this.bubble.show(BUBBLES.morning, 2200);
    }
  }

  // every 30s: at 22:00 Bibi goes to bed by themselves; at 4:00 they wake up
  checkBedtime() {
    if (!gameState.tutorialDone) return;
    const inWindow = inSleepWindow();
    const free = !this.busy && !this.minigame.active && !this.kitchen.active && !this.hud.isOpen();
    if (inWindow && !this.wasInSleepWindow) {
      if (!free) return; // try again in a moment
      if (!gameState.asleep && gameState.wokeNight !== nightKey()) this.setAsleep(true);
    }
    if (!inWindow && this.wasInSleepWindow && gameState.asleep) {
      if (!free) return;
      this.setAsleep(false);
    }
    this.wasInSleepWindow = inWindow;
  }

  refreshMood() {
    if (this.busy) return;
    this.character.setMood(moodFor(gameState));
    const stinky = gameState.hygiene < 30;
    this.stink.forEach((s) => s.setVisible(stinky));
  }

  // little particles at any spot (used by Gift Catch)
  burstAt(x, y, texture, n) {
    const u = unit(this);
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x + Phaser.Math.Between(-30, 30) * u, y + Phaser.Math.Between(-20, 20) * u, texture)
        .setScale(5 * u).setDepth(15);
      this.tweens.add({ targets: p, y: p.y - 50 * u, alpha: 0, duration: 700, delay: i * 80, onComplete: () => p.destroy() });
    }
  }

  burst(texture, n) {
    const c = this.character;
    const u = unit(this);
    for (let i = 0; i < n; i++) {
      const p = this.add.image(
        c.x + Phaser.Math.Between(-140, 140) * u,
        Phaser.Math.Between(c.getTopY() + 30 * u, c.getBottomY() - 40 * u),
        texture,
      ).setScale(5 * u).setDepth(13);
      this.tweens.add({ targets: p, y: p.y - 70 * u, alpha: 0, duration: 1100, delay: i * 110, onComplete: () => p.destroy() });
    }
  }

  // ---------- growth ----------

  giveCare(amount) {
    gameState.care += amount;

    const stageInfo = STAGES[gameState.stage];
    if (stageInfo.next && stageInfo.careToGrow && gameState.care >= stageInfo.careToGrow) {
      gameState.stage = stageInfo.next;
      gameState.care = 0;
      this.character.setStage(gameState.stage);
      this.layout();
      this.cameras.main.flash(300, 255, 255, 255); // little "it grew!" flash
      beep(523, 0.1, 5);
      this.bubble.show(BUBBLES.grew, 2500);
      this.hud.toast(gameState.stage === 'kid' ? 'Bibi grew into a kid!' : 'Bibi is all grown up!', 3000);
    }

    save();
  }

  // ---------- screen fitting ----------

  // Bibi's normal size (CHARACTER_SCREEN_HEIGHT / CHARACTER_MAX_SCREEN_WIDTH): yard, house and bedroom
  characterScale() {
    const { width, height } = this.scale;
    return Math.min(
      (height * CHARACTER_SCREEN_HEIGHT) / ASSET_HEIGHT,
      (width * CHARACTER_MAX_SCREEN_WIDTH) / ASSET_WIDTH,
    );
  }

  layout() {
    const { width, height } = this.scale;
    cover(this.bg, width, height);

    // character size follows the screen size
    this.character.setScale(this.characterScale());
    this.groundY = height * GROUND_Y;
    this.character.y = this.groundY;
    const pad = this.character.edge();
    this.character.x = Phaser.Math.Clamp(this.character.x, pad, width - pad);
    this.stink.forEach((s) => s.setScale(6 * unit(this)));
    this.minigame?.layout();
    this.kitchen?.layout(); // in the kitchen, Bibi sits in the chair instead
    this.bedroom?.layout(); // in the bedroom, Bibi is by the door or in bed
  }

  // ---------- time of day ----------

  updateTimeOfDay() {
    if (this.kitchen?.active) return; // check again after mealtime
    const hour = new Date().getHours();
    const night = hour >= NIGHTTIME || hour < EARLY_MORNING;

    let bgKey; // (the bedroom is drawn by Bedroom while Bibi sleeps)
    if (gameState.inside) bgKey = 'bg-living_room';
    else if (night) bgKey = 'bg-night';
    else if (hour < DAYTIME) bgKey = 'bg-morning_1';
    else bgKey = 'bg-morning_2';
    this.bg.setTexture(bgKey);
    cover(this.bg, this.scale.width, this.scale.height);
  }

  // ---------- every frame ----------

  update(time, delta) {
    const c = this.character;
    if (this.canMove()) {
      const step = MOVE_SPEED * delta * (this.scale.width / 800);
      if (controls.isDown('left')) c.moveBy(-step);
      else if (controls.isDown('right')) c.moveBy(step);
      else if (c.isPlayerMoving) c.stopMoving();
    } else if (c.isPlayerMoving) {
      c.isPlayerMoving = false;
    }

    if (!this.kitchen.active && !this.bedroom.active) c.y = this.groundY - c.jumpState.h * this.scale.height * JUMP_HEIGHT;
    this.bubble.update();
    this.minigame.update();

    // stink lines rise off Bibi when dirty
    if (this.stink[0].visible) {
      const u = unit(this);
      const top = c.getTopY();
      this.stink.forEach((s, i) => {
        const t = ((time / 1400 + i / 3) % 1);
        s.setPosition(c.x + (i - 1) * 110 * u + Math.sin(time / 300 + i) * 8 * u, top + 70 * u - t * 60 * u);
        s.setAlpha(1 - t);
      });
    }
  }

  // ---------- helpers ----------

  wait(ms) {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  // Settings > Return to Title: save, close the room, show the title screen
  async returnToTitle() {
    save();
    this.busy = true;
    await this.fade(300, true);
    this.scene.stop('HUD');
    this.scene.start('Title');
  }

  // fade the room camera out (true) or back in (false)
  fade(ms, out) {
    return new Promise((r) => {
      if (out) this.cameras.main.fadeOut(ms, 255, 255, 255);
      else this.cameras.main.fadeIn(ms, 255, 255, 255);
      this.time.delayedCall(ms + 20, r);
    });
  }

  tween(config) {
    return new Promise((r) => this.tweens.add({ ...config, onComplete: r }));
  }
}
