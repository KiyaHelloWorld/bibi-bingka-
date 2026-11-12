import { ASSET_HEIGHT, SHOWER_ROOM } from '../constants.js';
import { beep } from '../systems/sound.js';
import { cover } from '../ui.js';

// Shower time: Bibi teleports to the shower room (shower.png), walks over to stand
// under the showerhead, showers, then teleports back.
export default class ShowerRoom {
  constructor(room) {
    this.room = room;
    this.active = false;
    this.bg = room.add.image(0, 0, 'bg-shower').setDepth(1).setVisible(false);
  }

  // screen positions from the shower art (3267 x 2362)
  measure() {
    const { width, height } = this.room.scale;
    const s = Math.max(width / this.bg.width, height / this.bg.height);
    const left = width / 2 - (this.bg.width * s) / 2;
    const top = height / 2 - (this.bg.height * s) / 2;
    return { x: (a) => left + a * s, y: (a) => top + a * s };
  }

  yForFeet(feet) {
    const c = this.room.character;
    return feet - (c.artBounds()[1] - ASSET_HEIGHT / 2) * c.scaleY;
  }

  layout() {
    if (!this.active) return;
    const { width, height } = this.room.scale;
    cover(this.bg, width, height);
    const c = this.room.character;
    c.setScale(this.room.characterScale()); // same size as everywhere else
    c.y = this.yForFeet(this.measure().y(SHOWER_ROOM.floorY));
  }

  async enter() {
    const room = this.room;
    const c = room.character;
    this.homeX = c.x;
    beep(1000, 0.05, 4);
    room.burst('fx-sparkle', 5);
    await room.fade(250, true);
    this.active = true;
    // hide the meters so the showerhead isn't covered
    this.hadStats = room.hud.statsVisible;
    room.hud.setStatsVisible(false);
    this.bg.setVisible(true);
    room.bg.setVisible(false);
    this.layout();
    const m = this.measure();
    c.x = m.x(SHOWER_ROOM.enterX);
    c.setFacing('left');
    await room.fade(250, false);
    // walk over and stand under the showerhead
    await room.tween({ targets: c, x: m.x(SHOWER_ROOM.showerX), duration: 1200 });
    c.setFacing('front');
  }

  // where the water comes out (screen coordinates)
  nozzle() {
    const m = this.measure();
    return { x: m.x(SHOWER_ROOM.showerX), y: m.y(SHOWER_ROOM.waterY) };
  }

  async leave() {
    const room = this.room;
    beep(880, 0.05, 4);
    await room.fade(250, true);
    this.bg.setVisible(false);
    room.bg.setVisible(true);
    this.active = false;
    room.hud.setStatsVisible(this.hadStats);
    room.character.x = this.homeX;
    room.layout();
    room.updateTimeOfDay();
    await room.fade(250, false);
  }
}
