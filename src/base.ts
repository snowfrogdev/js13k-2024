import { drawRect, rgb, Sound, Timer, vec2, Vector2 } from "littlejsengine";
import { publish } from "./event-bus";
import { Building, TiledBuildingData } from "./building";

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
    drawRect(healthBarPos, vec2(healthBarWidth, healthBarHeight), rgb(0, 0, 0));
    drawRect(healthBarPos, vec2(healthBarWidth * (this.health / 7500), healthBarHeight), rgb(1, 0, 0));

    super.render();
  }

  takeDamage() {
    if (this.deathTimer.active()) return;

    const damage = 10;
    const basePos = this.pos;

    publish("BASE_DAMAGED", { damage });

    // flash color
    this.color = rgb(1, 1, 1, 1);
    setTimeout(() => (this.color = undefined!), 70);

    this.health -= damage;

    if (this.health <= 0) {
      this.deathTimer.set(0.15);
      this.deathSound.play(this.pos);
    }
  }
}
