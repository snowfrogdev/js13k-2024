import { Color, drawRect, drawText, EngineObject, isOverlapping, mousePos, mouseWasPressed, TileInfo, vec2, Vector2 } from "littlejsengine";
import { EVENTS, publish } from "./event-bus";
import { Constants } from "./constants";

export class Button extends EngineObject {
  constructor(
    public readonly id: string,
    pos: Vector2,
    size: Vector2,
    public text?: string,
    public textColor?: Color,
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

  render() {
    if (this.text) {
      drawRect(this.pos, this.size.scale(1.05), Constants.PALETTE.BEIGE);
      drawRect(this.pos, this.size, this.color ?? Constants.PALETTE.BROWN);
      drawText(this.text, this.pos.add(vec2(0, -0.1)), 1, this.textColor ?? Constants.PALETTE.BEIGE);
      return;
    }

    super.render();
  }
}
