import { drawRect, vec2, drawLine, isOverlapping, mainCanvasSize, mousePosScreen } from "littlejsengine";
import { Constants } from "./constants";

export function drawMousePointer() {
  if (!isOverlapping(mainCanvasSize.scale(0.5), mainCanvasSize, mousePosScreen)) {
    return;
  }  

  drawRect(mousePosScreen, vec2(30), Constants.PALETTE.BEIGE, 0, true, true);
  drawLine(mousePosScreen.add(vec2(-15, 0)), mousePosScreen.add(vec2(15, 0)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(mousePosScreen.add(vec2(0, -15)), mousePosScreen.add(vec2(0, 15)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(mousePosScreen.add(vec2(-15, 15)), mousePosScreen.add(vec2(15, 15)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(mousePosScreen.add(vec2(15, 15)), mousePosScreen.add(vec2(15, -15)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(
    mousePosScreen.add(vec2(15, -15)),
    mousePosScreen.add(vec2(-15, -15)),
    3,
    Constants.PALETTE.BROWN,
    true,
    true
  );
  drawLine(
    mousePosScreen.add(vec2(-15, -15)),
    mousePosScreen.add(vec2(-15, 15)),
    3,
    Constants.PALETTE.BROWN,
    true,
    true
  );
}
