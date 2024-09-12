import { worldToScreen, mousePos, drawRect, vec2, drawLine } from "littlejsengine";
import { Constants } from "./constants";

export function drawMousePointer() {
  const screenMousePos = worldToScreen(mousePos);

  drawRect(screenMousePos, vec2(30), Constants.PALETTE.BEIGE, 0, true, true);
  drawLine(screenMousePos.add(vec2(-15, 0)), screenMousePos.add(vec2(15, 0)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(screenMousePos.add(vec2(0, -15)), screenMousePos.add(vec2(0, 15)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(screenMousePos.add(vec2(-15, 15)), screenMousePos.add(vec2(15, 15)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(screenMousePos.add(vec2(15, 15)), screenMousePos.add(vec2(15, -15)), 3, Constants.PALETTE.BROWN, true, true);
  drawLine(
    screenMousePos.add(vec2(15, -15)),
    screenMousePos.add(vec2(-15, -15)),
    3,
    Constants.PALETTE.BROWN,
    true,
    true
  );
  drawLine(
    screenMousePos.add(vec2(-15, -15)),
    screenMousePos.add(vec2(-15, 15)),
    3,
    Constants.PALETTE.BROWN,
    true,
    true
  );
}
