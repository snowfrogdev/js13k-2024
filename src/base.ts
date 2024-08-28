import { drawRect, EngineObject, rgb, vec2, Vector2 } from "littlejsengine";

export class Base extends EngineObject {
  constructor(position: Vector2) {
    super(position);
    this.size = vec2(2);
    this.drawSize = vec2(2);
  }

  update() {
    super.update();
  }

  render() {
    drawRect(this.pos, this.drawSize, rgb(255, 255, 0));
  }
}
