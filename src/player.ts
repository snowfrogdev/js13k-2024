import {
  EngineObject,
  Vector2,
  vec2,
  keyIsDown,
  clamp,
  drawRect,
  rgb,
  Timer,
  Sound,
} from "littlejsengine";
import * as tileMapData from "./tilemap.json";
import { DamageTaker } from "./damage-taker";

export class Player extends EngineObject implements DamageTaker {
  private health = 500;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3]);
  
  constructor(position: Vector2) {
    super(position);
    this.drawSize = vec2(1);
  }

  update() {
    if (this.deathTimer.elapsed()) {
      this.destroy();
    }

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
    if (this.health <= 0) {
      if (this.deathTimer.getPercent() < 0.35) {
        drawRect(this.pos, this.drawSize.scale(3), rgb(0, 0, 0));
      } else {
        drawRect(this.pos, this.drawSize.scale(3), rgb(255));
      }

      return;
    }

    //drawTile(this.pos, vec2(1), tile(0, 16));
    drawRect(this.pos, this.drawSize, this.color || rgb(0, 255, 0));
  }

  takeDamage() {
    if (this.deathTimer.active()) return;
    // flash color
    this.color = rgb(255, 255, 255, 0.5);
    setTimeout(() => (this.color = undefined!), 50);

    this.health -= 5;

    if (this.health <= 0) {
      this.deathTimer.set(0.15);
      this.deathSound.play();
    }
  }
}
