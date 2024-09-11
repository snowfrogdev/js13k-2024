import { tileSizeDefault, vec2, Vector2 } from "littlejsengine";
import { tilemapData } from "./tilemap-rle";

export function convertCoord(x: number, y: number): Vector2 {
  const newX = x / tileSizeDefault.x;
  const newY = tilemapData.height - y / tileSizeDefault.y;

  return vec2(newX, newY);
}