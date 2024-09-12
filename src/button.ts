import { Color, EngineObject, isOverlapping, mousePos, mouseWasPressed, TileInfo, Vector2 } from "littlejsengine";
import { EVENTS, publish } from "./event-bus";

export class Button extends EngineObject {
  constructor(
    public readonly id: string,
    pos: Vector2,
    size: Vector2,
    tileInfo?: TileInfo,
    angle?: number,
    color?: Color,
    renderOrder?: number
  ) {
    super(pos, size, tileInfo, angle, color, renderOrder);
  }

  update() {
    if (mouseWasPressed(0)) {
      // Check if the mouse is over the button
      if (isOverlapping(this.pos, this.size, mousePos)) {
        publish(EVENTS.BUTTON_CLICKED, { buttonId: this.id });
      }
    }
  }
}
