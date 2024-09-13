import { drawRect, drawText, engineObjectsDestroy, mainCanvasSize, setCameraPos, vec2 } from "littlejsengine";
import { Scene } from "../scene";
import { Constants } from "../constants";
import { State } from "../state";

export class MissionEndScene extends Scene {
  constructor() {
    super("mission-end", []);
  }

  override onEnter(): void {
    setCameraPos(vec2(0));
  }

  override gameRender() {
    drawRect(vec2(0), mainCanvasSize, Constants.PALETTE.BEIGE);

    const text = State.lastMissionWon ? "Mission Complete!" : "Mission Failed!";
    drawText(text, vec2(0, 0), 4, Constants.PALETTE.BROWN);
  }

  override onExit(): void {
    engineObjectsDestroy();
  }
}