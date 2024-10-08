import { drawRect, rgb, Sound, Timer, vec2 } from "littlejsengine";
import { EVENTS, publish } from "./event-bus";
import { Building, TiledBuildingData } from "./building";
import { Constants } from "./constants";

export class Base extends Building {
  private health = 7500;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3], 100, 0);

  constructor(tiledData: TiledBuildingData) {
    super(tiledData);
  }

  update() {
    if (this.deathTimer.elapsed()) {
      this.destroy();
    }
    
    super.update();
  }

  render() {
    if (this.health <= 0) {
      if (this.deathTimer.getPercent() < 0.35) {
        //drawRect(this.pos, this.drawSize.scale(3.5), rgb(0, 0, 0));
      } else {
        //drawRect(this.pos, this.drawSize.scale(3.5), rgb(1));
      }
    }

    // draw health bar
    const healthBarWidth = this.size.x;
    const healthBarHeight = 0.2;
    const healthBarPos = this.pos.add(vec2(0, -this.size.y / 2 - 0.2));
    drawRect(healthBarPos, vec2(healthBarWidth + 0.15, healthBarHeight + 0.15), Constants.PALETTE.BROWN);
    drawRect(healthBarPos, vec2(healthBarWidth * (this.health / 7500), healthBarHeight), Constants.PALETTE.BEIGE);

    super.render();
  }

  takeDamage() {
    if (this.deathTimer.active()) return;

    const damage = 10;

    publish(EVENTS.BASE_DAMAGED, { damage });

    // flash color
    this.color = rgb(1, 1, 1, 1);
    setTimeout(() => (this.color = undefined!), 70);

    this.health -= damage;

    if (this.health <= 0) {
      this.deathTimer.set(0.15);
      this.deathSound.play(this.pos);
      publish(EVENTS.BASE_DESTROYED);
    }
  }
}
