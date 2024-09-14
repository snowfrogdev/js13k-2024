import {
  cameraPos,
  drawText,
  drawTile,
  keyIsDown,
  lerp,
  mouseIsDown,
  setCameraPos,
  speak,
  tile,
  tileSizeDefault,
  Timer,
  vec2,
  Vector2,
} from "littlejsengine";
import { SpriteData } from "./sprite-data";
import { spriteSheetData } from "./sprite-sheet";
import { Constants } from "./constants";

let teachMovement = true;
let spokeTeachMovement = false;
let teachFiring = false;
let spokeTeachFiring = false;
let teachBase = false;
let spokeBase = false;

let animationTimer = new Timer(1);

let ticksMovementKeysPressed = [0, 0, 0, 0];
let ticksFirePressed = 0;
let ticksSpentNearBase = 0;

function gameUpdate(basePos: Vector2) {
  if (teachMovement) {
    if (keyIsDown("KeyW")) ticksMovementKeysPressed[0] += 1;
    if (keyIsDown("KeyS")) ticksMovementKeysPressed[1] += 1;
    if (keyIsDown("KeyA")) ticksMovementKeysPressed[2] += 1;
    if (keyIsDown("KeyD")) ticksMovementKeysPressed[3] += 1;

    const eachKeyPressedOnce = ticksMovementKeysPressed.every((key) => key > 0);
    // 10 seconds in milliseconds divided by 17ms per frame
    if (eachKeyPressedOnce && ticksMovementKeysPressed.reduce((a, b) => a + b) > (10 * 1000) / 17) {
      teachMovement = false;
      ticksMovementKeysPressed = [0, 0, 0, 0];
      teachFiring = true;
    }

    if (spokeTeachMovement === false) {
      speak("Use the WASD keys to move your flying vehicle around.", "en");
      spokeTeachMovement = true;
    }
  }

  if (teachFiring) {
    if (mouseIsDown(0)) {
      ticksFirePressed += 1;
    }

    // 5 seconds in milliseconds divided by 17ms per frame
    if (ticksFirePressed > (5 * 1000) / 17) {
      teachFiring = false;
      ticksFirePressed = 0;
      teachBase = true;
    }

    if (spokeTeachFiring === false) {
      speak("Use the left mouse button to fire your weapon. brap! brap!", "en");
      spokeTeachFiring = true;
    }
  }

  if (teachBase) {
    if (basePos.distance(cameraPos) < 10) {
      ticksSpentNearBase += 1;
    }

    // 7 seconds in milliseconds divided by 17ms per frame
    if (ticksSpentNearBase > (10 * 1000) / 17) {
      teachBase = false;
      ticksSpentNearBase = 0;
    }


    if (spokeBase === false) {
      speak("This is your base. Defend it at all cost. If your base gets destroyed, the mission is lost.", "en");
      spokeBase = true;
    }
  }
}

function gameUpdatePost(basePos: Vector2) {
  if (teachBase) {
    setCameraPos(cameraPos.lerp(basePos, 0.05));
  }
}

function gameRenderPost(playerPos: Vector2, basePos: Vector2) {
  if (teachMovement) {
    drawAWSD(playerPos);
  }

  if (teachFiring) {
    drawLeftMouseButton(playerPos);
  }

  if (teachBase) {
    drawBaseHint(basePos);
  }

  if (animationTimer.elapsed()) {
    animationTimer.set(1);
  }
}

function drawAWSD(playerPos: Vector2) {
  const sprite: SpriteData = spriteSheetData.frames["awsd.png"];
  const spritePos = vec2(sprite.frame.x, sprite.frame.y);
  const spriteSize = vec2(sprite.frame.w, sprite.frame.h);
  const tileInfo = tile(spritePos, spriteSize, 1);
  const size = vec2(spriteSize.x / tileSizeDefault.x, spriteSize.y / tileSizeDefault.y).scale(0.5);
  drawTile(playerPos.add(vec2(-3, 3)), size, tileInfo);
}

function drawLeftMouseButton(playerPos: Vector2) {
  const sprite: SpriteData = spriteSheetData.frames["left-mouse.png"];
  const spritePos = vec2(sprite.frame.x, sprite.frame.y);
  const spriteSize = vec2(sprite.frame.w, sprite.frame.h);
  const tileInfo = tile(spritePos, spriteSize, 1);
  const size = vec2(spriteSize.x / tileSizeDefault.x, spriteSize.y / tileSizeDefault.y).scale(0.5);
  drawTile(playerPos.add(vec2(-3, 3)), size, tileInfo);
}

function drawBaseHint(basePos: Vector2) {
  const sprite: SpriteData = spriteSheetData.frames["arrow.png"];
  const spritePos = vec2(sprite.frame.x, sprite.frame.y);
  const spriteSize = vec2(sprite.frame.w, sprite.frame.h);
  const tileInfo = tile(spritePos, spriteSize, 1);
  const size = vec2(spriteSize.x / tileSizeDefault.x, spriteSize.y / tileSizeDefault.y);

  drawTile(basePos.add(vec2(0, lerp(animationTimer.getPercent(), -8, -5))), size, tileInfo);
  drawTile(basePos.add(vec2(lerp(animationTimer.getPercent(), -8, -5), 0)), size, tileInfo, undefined, Math.PI / 2);
  drawTile(basePos.add(vec2(0, lerp(animationTimer.getPercent(), 8, 5))), size, tileInfo, undefined, Math.PI);
  drawTile(basePos.add(vec2(lerp(animationTimer.getPercent(), 8, 5), 0)), size, tileInfo, undefined, -Math.PI / 2);

  drawText(
    "Defend your base at all costs!",
    basePos.add(vec2(10, 4)),
    1,
    Constants.PALETTE.BROWN,
    0.5,
    Constants.PALETTE.BEIGE
  );
}

export const Tutorial = {
  gameUpdate,
  gameUpdatePost,
  gameRenderPost,
} as const;
