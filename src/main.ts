import { engineInit } from "littlejsengine";
import { SceneManager } from "./scene-manager";
import { Level01Scene } from "./scenes/level-01.scene";
import { MainMenuScene } from "./scenes/main-menu.scene";
import { MissionEndScene } from "./scenes/mission-end.scene";

SceneManager.registerScene(new MainMenuScene());
SceneManager.registerScene(new Level01Scene());
SceneManager.registerScene(new MissionEndScene());

engineInit(
  () => SceneManager.switchScene("main-menu"),
  SceneManager.gameUpdate,
  SceneManager.gameUpdatePost,
  SceneManager.gameRender,
  SceneManager.gameRenderPost
);
