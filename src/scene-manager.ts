import { ASSERT, drawRect, rgb, TextureInfo, textureInfos, Timer, vec2 } from "littlejsengine";
import { Scene } from "./scene";
import { Constants } from "./constants";

const scenes = new Map<string, Scene>();
let currentScene: Scene | null = null;

const fadingInTimer = new Timer();
const fadingOutTimer = new Timer();
const fadingDurationInSecs = 0.5;

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
    await fadeOut();
  }

  const scene = scenes.get(name);
  ASSERT(Boolean(scene), `Scene not found: ${name}`);

  // Preload images for the scene
  const promises = scene!.imageSources.map(loadImage);
  await Promise.all(promises);

  scene!.onEnter();
  currentScene = scene!;
  await fadeIn();
}

async function fadeOut() {
  fadingOutTimer.set(fadingDurationInSecs);

  return new Promise<void>((resolve) => {
    const intervalId = setInterval(() => {
      if (fadingOutTimer.elapsed()) {
        clearInterval(intervalId);
        resolve();
      }
    }, 15);
  });
}

async function fadeIn() {
  fadingOutTimer.unset();
  fadingInTimer.set(fadingDurationInSecs);

  return new Promise<void>((resolve) => {
    const intervalId = setInterval(() => {
      if (fadingInTimer.elapsed()) {
        clearInterval(intervalId);
        resolve();
      }
    }, 15);
  });
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
  if (!currentScene) {
    return;
  }

  currentScene.gameUpdate();
}

/**
 * Called after physics and objects are updated, setup camera and prepare for rendering.
 */
function gameUpdatePost(): void {
  if (!currentScene) {
    return;
  }

  currentScene.gameUpdatePost();
}

/**
 * Called before objects are rendered, draw any background effects that appear behind objects.
 */
function gameRender(): void {
  if (!currentScene) {
    return;
  }

  currentScene.gameRender();
}

/**
 * Called after objects are rendered, draw effects or hud that appear above all objects.
 */
function gameRenderPost(): void {
  currentScene?.gameRenderPost();

  if (fadingOutTimer.active()) {
    const endColor = Constants.PALETTE.BROWN;
    const startColor = endColor.multiply(rgb(1, 1, 1, 0));
    drawRect(vec2(0), vec2(500), startColor.lerp(endColor, fadingOutTimer.getPercent()));
  }

  if (fadingOutTimer.elapsed()) {
    drawRect(vec2(0), vec2(500), Constants.PALETTE.BROWN);
  }

  if (fadingInTimer.active()) {
    const startColor = Constants.PALETTE.BROWN;
    const endColor = startColor.multiply(rgb(1, 1, 1, 0));
    drawRect(vec2(0), vec2(500), startColor.lerp(endColor, fadingInTimer.getPercent()));
  }  
}

export const SceneManager = {
  registerScene,
  switchScene,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
} as const;
