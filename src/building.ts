import { drawTile, EngineObject, tile, tileSizeDefault, vec2 } from "littlejsengine";
import * as SpriteSheetData from "./sprite-sheet.json";
import { SpriteData } from "./sprite-data";
import { convertCoord } from "./convert-coord";

export type TiledBuildingData = {
  gid: number;
  height: number;
  id: number;
  name: string;
  rotation: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
};

export class Building extends EngineObject {
  constructor(tiledData: TiledBuildingData) {
    super();
    const sprite: SpriteData = SpriteSheetData.frames[tiledData.name as keyof typeof SpriteSheetData.frames];
    const spritePos = vec2(sprite.frame.x, sprite.frame.y);
    const spriteSize = vec2(sprite.frame.w, sprite.frame.h);
    this.tileInfo = tile(spritePos, spriteSize, 1);
    const x = tiledData.x + (spriteSize.x + sprite.spriteSourceSize.x) / 2;
    const y = tiledData.y - (spriteSize.y + sprite.spriteSourceSize.y) / 2;
    this.pos = convertCoord(x, y);
    this.size = vec2(spriteSize.x / tileSizeDefault.x, spriteSize.y / tileSizeDefault.y);
  }

  render(): void {
    // draw the hospital
    this.renderOrder = -this.pos.y + this.size.y / 2;
    drawTile(this.pos, this.size, this.tileInfo);
  }
}
