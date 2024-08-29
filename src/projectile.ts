import { EngineObject, Sound, Vector2, vec2, engineObjectsCallback, drawRect, rgb } from "littlejsengine";
import { Enemy } from "./enemy";

export class Projectile extends EngineObject {
  static sound = new Sound([4.5, , 82.40689, , , , , , 0.8, 1.5, , 0.2, , 1.1, 5, , 0.08, , , 0.16, 29]);
  static pool = new Set<Projectile>();
  private active: boolean = true;

  /**
   * Constructs a new instance of the Projectile class.
   * @param position - The position of the instance.
   * @param direction - The direction of the instance. Must be a unit vector.
   */
  private constructor(position: Vector2) {
    super(position);
    this.drawSize = vec2(0.25);
    this.size = vec2(0.25);
  }

  static create(position: Vector2, direction: Vector2) {
    const speed = 0.7;
    const projectile = [...Projectile.pool].find((p) => !p.active) ?? new Projectile(position);
    projectile.active = true;
    projectile.pos = position;
    projectile.velocity = direction.scale(speed);
    Projectile.pool.add(projectile);
    return projectile;    
  }

  update() {
    engineObjectsCallback(this.pos, this.size, (obj: EngineObject) => {
      if (obj instanceof Enemy) {
        obj.takeDamage();
        this.destroy();
      }
    });   

    super.update();
  }

  render() {
    if (!this.active) return;
    drawRect(this.pos, this.drawSize, rgb(255, 255, 0));
  }

  destroy() {
    if (Projectile.pool.size > 500) {
      Projectile.pool.delete(this);
      super.destroy();
      return;
    }

    this.active = false;
    this.velocity = vec2();
    this.pos = vec2(-1000);
  }
}
