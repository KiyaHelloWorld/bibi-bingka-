import { ASSET_HEIGHT, BEDROOM } from '../constants.js';
import { beep } from '../systems/sound.js';
import { cover } from '../ui.js';

// Bedtime: Bibi teleports to the bedroom (bedroom.png), walks from the door to the bed,
// hops on and sleeps. Waking up hops off and teleports back.
export default class Bedroom {
  constructor(room) {
    this.room = room;
    this.active = false;
    this.state = null; // 'arriving' | 'inBed' | 'leaving'
    this.bg = room.add.image(0, 0, 'bg-bedroom').setDepth(1).setVisible(false);
  }

  // screen positions from the bedroom art (3267 x 2362)
  measure() {
    const { width, height } = this.room.scale;
    const s = Math.max(width / this.bg.width, height / this.bg.height);
    const left = width / 2 - (this.bg.width * s) / 2;
    const top = height / 2 - (this.bg.height * s) / 2;
    return { s, x: (a) => left + a * s, y: (a) => top + a * s };
  }

  // the container y that puts Bibi's feet at screen y `feet`
  yForFeet(feet) {
    const c = this.room.character;
    const bottomArt = c.artBounds()[1];
    return feet - (bottomArt - ASSET_HEIGHT / 2) * c.scaleY;
  }

  layout() {
    if (!this.active) return;
    const { width, height } = this.room.scale;
    cover(this.bg, width, height);
    const c = this.room.character;
    const m = this.measure();
    c.setScale(m.s * BEDROOM.bibiScale);
    if (this.state === 'inBed') c.setPosition(m.x(BEDROOM.bedX), this.yForFeet(m.y(BEDROOM.bedY)));
  }

  show() {
    this.active = true;
    this.bg.setVisible(true);
    this.room.bg.setVisible(false);
    this.layout();
  }

  // animate = false: Bibi is simply already in bed (e.g. opening the game at night)
  async enter({ animate = true } = {}) {
    const room = this.room;
    const c = room.character;
    room.busy = true;
    c.stopWalking();
    room.bubble.hide();

    if (!animate) {
      this.state = 'inBed';
      this.show();
      c.setFacing('front');
      room.busy = false;
      room.refreshMood();
      return;
    }

    this.state = 'arriving';
    beep(660, 0.05, 4);
    room.burst('fx-sparkle', 5);
    await room.fade(250, true);
    this.show();
    const m = this.measure();
    const floor = this.yForFeet(m.y(BEDROOM.floorY));
    c.setPosition(m.x(BEDROOM.doorX), floor);
    c.setMood('idle');
    c.setFacing('left');
    await room.fade(250, false);

    // walk from the door to the foot of the bed, then hop on
    await room.tween({ targets: c, x: m.x(BEDROOM.bedFootX), duration: 1400 });
    const bedY = this.yForFeet(m.y(BEDROOM.bedY));
    await room.tween({ targets: c, x: m.x(BEDROOM.bedX), y: Math.min(bedY, floor) - 60 * m.s, duration: 260, ease: 'Quad.easeOut' });
    await room.tween({ targets: c, y: bedY, duration: 200, ease: 'Quad.easeIn' });
    beep(400, 0.06);
    c.setFacing('front');
    this.state = 'inBed';
    room.busy = false;
    room.refreshMood(); // sleep face
  }

  async leave({ animate = true } = {}) {
    const room = this.room;
    const c = room.character;
    room.busy = true;
    this.state = 'leaving';
    if (animate) {
      c.setMood('idle');
      const m = this.measure();
      // stretch, hop off the bed, then back to where Bibi was
      c.wiggle();
      await room.wait(400);
      const floor = this.yForFeet(m.y(BEDROOM.floorY));
      await room.tween({ targets: c, x: m.x(BEDROOM.bedFootX), y: floor, duration: 350, ease: 'Quad.easeIn' });
      beep(880, 0.05, 4);
      await room.fade(250, true);
    }
    this.bg.setVisible(false);
    room.bg.setVisible(true);
    this.active = false;
    this.state = null;
    c.x = room.scale.width / 2;
    room.layout();
    room.updateTimeOfDay();
    c.setFacing('front');
    if (animate) await room.fade(250, false);
    room.busy = false;
    room.refreshMood();
  }
}
