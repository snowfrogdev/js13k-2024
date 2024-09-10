import { tileSizeDefault, vec2, Vector2 } from "littlejsengine";
import * as tileMapData from "./tilemap.json";

export function convertCoord(x: number, y: number): Vector2 {
  const newX = x / tileSizeDefault.x;
  const newY = tileMapData.height - y / tileSizeDefault.y;

  return vec2(newX, newY);
}