import { engineInit } from "littlejsengine";
import { SceneManager } from "./scene-manager";
import { Level01Scene } from "./scenes/level-01.scene";
import { MainMenuScene } from "./scenes/main-menu.scene";

SceneManager.registerScene(new MainMenuScene());
SceneManager.registerScene(new Level01Scene());

engineInit(
  () => SceneManager.switchScene("main-menu"),
  SceneManager.gameUpdate,
  SceneManager.gameUpdatePost,
  SceneManager.gameRender,
  SceneManager.gameRenderPost
);
