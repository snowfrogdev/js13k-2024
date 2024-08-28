import {
  EngineObject,
  Sound,
  Vector2,
  vec2,
  engineObjectsCallback,
  drawRect,
  rgb,
} from "littlejsengine";
import { Enemy } from "./enemy";

export class Projectile extends EngineObject {
  static sound = new Sound([
    4.5,
    ,
    82.40689,
    ,
    ,
    ,
    ,
    ,
    0.8,
    1.5,
    ,
    0.2,
    ,
    1.1,
    5,
    ,
    0.08,
    ,
    ,
    0.16,
    29,
  ]);
  /**
   * Constructs a new instance of the Projectile class.
   * @param position - The position of the instance.
   * @param direction - The direction of the instance. Must be a unit vector.
   */
  constructor(position: Vector2, private direction: Vector2) {
    super(position);
    const speed = 0.7;
    this.velocity = this.direction.scale(speed);
    this.drawSize = vec2(0.25);
    this.size = vec2(0.25);
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
    drawRect(this.pos, this.drawSize, rgb(255, 255, 0));
  }
}
