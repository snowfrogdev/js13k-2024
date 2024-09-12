import { ASSERT, TextureInfo, textureInfos } from "littlejsengine";
import { Scene } from "./scene";

const scenes = new Map<string, Scene>();
let currentScene: Scene | null = null;

/**
 * Register a scene with the scene manager.
 * If a scene with the same name is already registered, it will be replaced.
 * @param scene
 */
function registerScene(scene: Scene) {
  scenes.set(scene.name, scene);
}

/**
 * Switch to a scene by name.
 * @param name
 */
async function switchScene(name: string) {
  if (currentScene) {
    currentScene.onExit();
  }

  const scene = scenes.get(name);
  ASSERT(Boolean(scene), `Scene not found: ${name}`);

  // Preload images for the scene
  const promises = scene!.imageSources.map(loadImage);
  await Promise.all(promises);

  scene!.onEnter();
  currentScene = scene!;
}

async function loadImage(src: string, idx: number): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      textureInfos[idx] = new TextureInfo(img);
      resolve();
    };
    img.src = src;
  });
}

/**
 * Called every frame at 60 frames per second, handle input and update the game state.
 */
function gameUpdate(): void {
  currentScene?.gameUpdate();
}

/**
 * Called after physics and objects are updated, setup camera and prepare for rendering.
 */
function gameUpdatePost(): void {
  currentScene?.gameUpdatePost();
}

/**
 * Called before objects are rendered, draw any background effects that appear behind objects.
 */
function gameRender(): void {
  currentScene?.gameRender();
}

/**
 * Called after objects are rendered, draw effects or hud that appear above all objects.
 */
function gameRenderPost(): void {
  currentScene?.gameRenderPost();
}

export const SceneManager = {
  registerScene,
  switchScene,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
} as const;
