import { EngineObject, Vector2, vec2, drawRect, rgb } from "littlejsengine";

export class Enemy extends EngineObject {
  constructor(position: Vector2) {
    super(position);
    this.drawSize = vec2(1).scale(0.8);
  }

  update() {
    // move towards the player
    /* const direction = player.pos.subtract(this.pos).normalize();
    const speed = 0.05;
    this.velocity = direction.scale(speed); */
    super.update();
  }

  render() {
    //drawTile(this.pos, vec2(1), tile(0, 16, 0), this.color);
    drawRect(this.pos, this.drawSize, this.color || rgb(255, 0, 0));
  }

  takeDamage() {
    // flash color
    this.color = rgb(255, 255, 255, 0.5);
    setTimeout(() => (this.color = undefined!), 50);
  }
}
