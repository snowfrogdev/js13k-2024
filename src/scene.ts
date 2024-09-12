export abstract class Scene {
  /**
   * 
   * @param name 
   * @param imageSources An array of image sources to preload for the scene.
   * These images will replace the current images in `Draw.textureInfos` 
   */
  constructor(public readonly name: string, public readonly imageSources: string[]) {}

  /** 
   * Called when the scene is entered. It is the first method called when the scene is switched to. 
   */
  onEnter(): void { }

  /**
   * Called every frame at 60 frames per second, handle input and update the game state.
   */
  gameUpdate(): void { }

  /**
   * Called after physics and objects are updated, setup camera and prepare for rendering.
   */
  gameUpdatePost(): void { }

  /**
   * Called before objects are rendered, draw any background effects that appear behind objects.
   */
  gameRender(): void { }

  /**
   * Called after objects are rendered, draw effects or hud that appear above all objects.
   */
  gameRenderPost(): void { }

  /**
   * Called when the scene is exited. It is the last method called when the scene is switched from.
   */
  onExit(): void { }
}