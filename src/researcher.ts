import { drawRect, mainCanvasSize, rgb, Timer, vec2 } from "littlejsengine";
import { subscribe } from "./event-bus";

const researchPointsGoal = 500;
const researchRatePerSecs = 1;
const researchTimer = new Timer(1);
let researchPointsAccumulated = 0;
let researchMaterial = 0;

subscribe("RESEARCH_MATERIAL_COLLECTED", ({ amount }) => {
  researchMaterial += amount;
});

function update() {
  if (researchMaterial > 0 && researchTimer.elapsed()) {
    researchMaterial -= researchRatePerSecs;
    researchPointsAccumulated += researchRatePerSecs;
  }
}

function render() {
  // Make two bars, one for research material and one for research points
  // Draw the bars in the bottom letft and right corners of the screen

  const screenWidth = mainCanvasSize.x;
  const screenHeight = mainCanvasSize.y;

  const barWidth = 500;
  const barHeight = 50;

  const darkColor = rgb(112 / 255, 66 / 255, 20 / 255, 0.5);
  const lightColor = rgb(245 / 255, 222 / 255, 179 / 255, 0.5);

  // Draw the research points bar in the lower right corner
  drawRect(
    vec2(screenWidth - barWidth / 2, screenHeight - barHeight / 2),
    vec2(barWidth, barHeight),
    darkColor,
    0,
    true,
    true
  );

  const researchPointsBarWidth = barWidth * (researchPointsAccumulated / researchPointsGoal) - 5;
  drawRect(
    vec2(screenWidth - researchPointsBarWidth / 2, screenHeight - barHeight / 2),
    vec2(researchPointsBarWidth, barHeight - 5),
    lightColor,
    0,
    true,
    true
  );
  
  // Draw the research material bar in the lower left corner
  drawRect(
    vec2(barWidth / 2, screenHeight - barHeight / 2),
    vec2(barWidth, barHeight),
    darkColor,
    0,
    true,
    true
  );

  const researchMaterialBarWidth = barWidth * (researchMaterial / researchPointsGoal) - 5;
  drawRect(
    vec2(researchMaterialBarWidth / 2, screenHeight - barHeight / 2),
    vec2(researchMaterialBarWidth, barHeight - 5),
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
