import {
  EngineObject,
  Vector2,
  vec2,
  keyIsDown,
  clamp,
  drawRect,
  rgb,
} from "littlejsengine";
import { tileMapData } from "./tiled-map";

export class Player extends EngineObject {
  constructor(position: Vector2) {
    super(position);
  }

  update() {
    // wasd input for movement
    const direction = vec2(0, 0);
    if (keyIsDown("KeyW")) direction.y += 1;
    if (keyIsDown("KeyS")) direction.y -= 1;
    if (keyIsDown("KeyA")) direction.x -= 1;
    if (keyIsDown("KeyD")) direction.x += 1;

    if (direction.lengthSquared() > 0) {
      direction.normalize();
      const acceleration = 0.07;
      this.velocity = this.velocity.add(direction.scale(acceleration));
      const maxSpeed = 0.25;
      if (this.velocity.length() > maxSpeed) {
        this.velocity = this.velocity.normalize().scale(maxSpeed);
      }
    }

    const deceleration = 0.1;
    this.velocity = this.velocity.scale(1 - deceleration);

    // Clamp player position to prevent it from going outside the tilemap
    const levelSize = vec2(tileMapData.width, tileMapData.height);
    this.pos.x = clamp(this.pos.x, 1, levelSize.x - 1);
    this.pos.y = clamp(this.pos.y, 1, levelSize.y - 1);

    super.update();
  }

  render() {
    //drawTile(this.pos, vec2(1), tile(0, 16));
    drawRect(this.pos, vec2(1), rgb(0, 255, 0));
  }
}
