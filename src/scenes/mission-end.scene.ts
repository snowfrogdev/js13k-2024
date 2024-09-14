import { drawRect, drawText, engineObjectsDestroy, mainCanvasSize, setCameraPos, vec2 } from "littlejsengine";
import { Scene } from "../scene";
import { Constants } from "../constants";
import { State } from "../state";
import { Button } from "../button";
import { drawMousePointer } from "../drawMousePointer";
import { subscribe, Unsubscribe } from "../event-bus";
import { SceneManager } from "../scene-manager";

export class MissionEndScene extends Scene {
  private subscriptions: Unsubscribe[] = [];
  constructor() {
    super("mission-end", []);
  }

  override onEnter(): void {
    setCameraPos(vec2(0));
    this.subscriptions.push(
      subscribe("BUTTON_CLICKED", (payload) => {
        if (payload.buttonId === "retry-button") {
          SceneManager.switchScene("level-01");
        }
      })
    );
  }

  override gameRender() {
    drawRect(vec2(0), mainCanvasSize, Constants.PALETTE.BEIGE);

    const text = State.lastMissionWon ? "Mission Complete!" : "Mission Failed!";
    drawText(text, vec2(0, 0), 4, Constants.PALETTE.BROWN);

    new Button("retry-button", vec2(0, -3), vec2(6, 1.5), "RETRY", undefined, undefined, undefined);
  }

  override gameRenderPost(): void {
    drawMousePointer();
  }

  override onExit(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    engineObjectsDestroy();
  }
}
