import { Timer } from "littlejsengine";
import { subscribe } from "./event-bus";

const researchPointsGoal = 500;
const researchRatePerSecs = 1;
const researchTimer = new Timer(1);
let researchPointsAccumulated = 0;
let researchMaterial = 0;


subscribe("RESEARCH_MATERIAL_COLLECTED", ({amount}) => {
  researchMaterial += amount;
  console.log("Research material collected: ", amount);
});

function update() {
  if (researchMaterial > 0 && researchTimer.elapsed()) {
    researchMaterial -= researchRatePerSecs;
    researchPointsAccumulated += researchRatePerSecs;
  }
}

export const Researcher = {
  update
}