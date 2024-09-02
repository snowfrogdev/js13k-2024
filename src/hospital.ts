import { drawTile, EngineObject, tile, vec2, Vector2 } from "littlejsengine";

export class Hospital extends EngineObject {
  constructor(position: Vector2) {
    super();
    this.tileInfo = tile(0, 64, 2);
    this.pos = position;
  }

  render(): void {
    // draw the hospital
    this.renderOrder = -this.pos.y + this.size.y / 2;
    drawTile(this.pos, vec2(4, 4), this.tileInfo);
  }
}
