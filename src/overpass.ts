import { EngineObject, tile, Vector2 } from "littlejsengine";

export class Overpass extends EngineObject {
  constructor(position: Vector2) {
    super(position);
    this.renderOrder = 1;
    this.tileInfo = tile(0, 16, 0)
  }
}