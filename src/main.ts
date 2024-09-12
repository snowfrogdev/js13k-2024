import { engineInit } from "littlejsengine";
import { SceneManager } from "./scene-manager";
import { Level01 } from "./scenes/level-01";

SceneManager.registerScene(new Level01());

engineInit(
  () => SceneManager.switchScene("Level01"),
  SceneManager.gameUpdate,
  SceneManager.gameUpdatePost,
  SceneManager.gameRender,
  SceneManager.gameRenderPost
);
