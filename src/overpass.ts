import { EngineObject, tile, Vector2 } from "littlejsengine";

export class Overpass extends EngineObject {
  constructor(position: Vector2, tileIndex: number) {
    super(position);
    this.renderOrder = 1;
    this.tileInfo = tile(tileIndex, 16, 0);
  }
}
