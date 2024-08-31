import { drawRect, EngineObject, rgb, Sound, Timer, vec2, Vector2 } from "littlejsengine";

export class Base extends EngineObject {
  private health = 1000;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3], 100, 0);

  constructor(position: Vector2) {
    super(position);
    this.size = vec2(2);
    this.drawSize = vec2(2);
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
        drawRect(this.pos, this.drawSize.scale(3), rgb(0, 0, 0));
      } else {
        drawRect(this.pos, this.drawSize.scale(3), rgb(1));
      }

      return;
    }

    //drawTile(this.pos, vec2(1), tile(0, 16, 0), this.color);
    drawRect(this.pos, this.drawSize, this.color || rgb(1, 1, 0));
  }

  takeDamage() {
    if (this.deathTimer.active()) return;
    // flash color
    this.color = rgb(1, 1, 1, 0.5);
    setTimeout(() => (this.color = undefined!), 50);

    this.health -= 5;

    if (this.health <= 0) {
      this.deathTimer.set(0.15);
      this.deathSound.play(this.pos);
    }
  }
}
