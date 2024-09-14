import { drawTile, engineObjectsDestroy, mainCanvasSize, rgb, tile, TileInfo, vec2 } from "littlejsengine";
import { Scene } from "../scene";
import { drawMousePointer } from "../drawMousePointer";
import { SceneManager } from "../scene-manager";
import { Button } from "../button";
import { subscribe, Unsubscribe } from "../event-bus";

export class MainMenuScene extends Scene {
  private backgroundTileInfo!: TileInfo;
  private subscriptions: Unsubscribe[] = [];
  constructor() {
    super("main-menu", ["./Menu.png"]);
  }

  override onEnter() {
    this.backgroundTileInfo = tile(0, vec2(480, 270), 0);
    new Button(
      "start-button",
      vec2(0, -11.4),
      vec2(12, 2.7),
      undefined,
      undefined,
      undefined,
      undefined,
      rgb(0, 0, 0, 0)
    );

    this.subscriptions.push(
      subscribe("BUTTON_CLICKED", (payload) => {
        if (payload.buttonId === "start-button") {
          SceneManager.switchScene("level-01");
        }
      })
    );
  }

  override gameRender(): void {
    // Draw the main menu image
    drawTile(
      vec2(mainCanvasSize.x / 2, mainCanvasSize.y / 2),
      mainCanvasSize,
      this.backgroundTileInfo,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );
  }

  override gameRenderPost(): void {
    drawMousePointer();
  }

  override onExit(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    engineObjectsDestroy();
  }
}
