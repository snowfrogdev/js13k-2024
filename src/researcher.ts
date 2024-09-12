import { drawRect, mainCanvasSize, min, rgb, Timer, vec2 } from "littlejsengine";
import { EVENTS, subscribe } from "./event-bus";
import { Constants } from "./constants";

const researchPointsGoal = 500;
const researchRatePerSecs = 1;
const researchTimer = new Timer(1);
const researchPointCost = 2;
let researchPointsAccumulated = 0;
let researchMaterial = 0;

subscribe(EVENTS.RESEARCH_MATERIAL_COLLECTED, ({ amount }) => {
  researchMaterial += amount;
});

function update() {
  if (researchMaterial > researchPointCost && researchTimer.elapsed()) {
    researchMaterial -= researchPointCost;
    researchPointsAccumulated += researchRatePerSecs;
    researchTimer.set(1);
  }
}

function render() {
  // Make two bars, one for research material and one for research points
  // Draw the bars in the bottom letft and right corners of the screen

  const screenWidth = mainCanvasSize.x;
  const screenHeight = mainCanvasSize.y;

  const barWidth = 500;
  const barHeight = 50;

  const darkColor = Constants.PALETTE.BROWN.multiply(rgb(1, 1, 1, 0.5));
  const lightColor = Constants.PALETTE.BEIGE.multiply(rgb(1, 1, 1, 0.5));

  // Draw the research points bar in the lower right corner
  drawRect(
    vec2(screenWidth - barWidth / 2, screenHeight - barHeight / 2),
    vec2(barWidth, barHeight),
    darkColor,
    0,
    true,
    true
  );

  const researchPointsBarWidth =
    (barWidth * min(researchPointsGoal, researchPointsAccumulated)) / researchPointsGoal - 6;
  drawRect(
    vec2(screenWidth - researchPointsBarWidth / 2 - 3, screenHeight - barHeight / 2),
    vec2(researchPointsBarWidth, barHeight - 6),
    lightColor,
    0,
    true,
    true
  );

  // Draw the research material bar in the lower left corner
  drawRect(vec2(barWidth / 2, screenHeight - barHeight / 2), vec2(barWidth, barHeight), darkColor, 0, true, true);

  const researchMaterialBarWidth = (barWidth * min(researchPointsGoal, researchMaterial)) / researchPointsGoal - 6;
  drawRect(
    vec2(researchMaterialBarWidth / 2 + 3, screenHeight - barHeight / 2),
    vec2(researchMaterialBarWidth, barHeight - 6),
    lightColor,
    0,
    true,
    true
  );
}

export const Researcher = {
  update,
  render,
};
