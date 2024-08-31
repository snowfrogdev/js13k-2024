import { EngineObject, Sound, Vector2, vec2, engineObjectsCallback, drawRect, Color } from "littlejsengine";
import { DamageTaker } from "./damage-taker";

// Define a generic type for the constructor of a class
type Constructor<T = {}> = new (...args: any[]) => T;

export class Projectile extends EngineObject {
  static sound = new Sound([4.5, , 82.40689, , , , , , 0.8, 1.5, , 0.2, , 1.1, 5, , 0.08, , , 0.16, 29], 100, 0);
  static pool = new Set<Projectile>();
  private _active: boolean = true;
  private _targetTypes: Constructor<DamageTaker>[] = [];

  /**
   * Constructs a new instance of the Projectile class.
   * @param position - The position of the instance.
   * @param direction - The direction of the instance. Must be a unit vector.
   */
  private constructor(position: Vector2) {
    super(position);
  }

  static create(
    position: Vector2,
    direction: Vector2,
    color: Color,
    speed: number,
    size: Vector2,
    targetTypes: Constructor<DamageTaker>[]
  ) {
    const projectile = [...Projectile.pool].find((p) => !p._active) ?? new Projectile(position);
    projectile._active = true;
    projectile.pos = position;
    projectile.velocity = direction.scale(speed);
    projectile.color = color;
    projectile.size = size;
    projectile.drawSize = size;
    projectile._targetTypes = targetTypes;
    Projectile.pool.add(projectile);
    return projectile;
  }

  update() {
    engineObjectsCallback(this.pos, this.size, (obj: EngineObject) => {
      if (this._targetTypes.some((t) => obj instanceof t)) {
        (<DamageTaker & EngineObject>obj).takeDamage();
        this.destroy();
      }
    });

    super.update();
  }

  render() {
    if (!this._active) return;
    drawRect(this.pos, this.drawSize, this.color);
  }

  destroy() {
    if (Projectile.pool.size > 500) {
      Projectile.pool.delete(this);
      super.destroy();
      return;
    }

    this._active = false;
    this.velocity = vec2();
    this.pos = vec2(-1000);
  }
}
