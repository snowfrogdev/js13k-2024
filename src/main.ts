import {
  cameraPos,
  cameraScale,
  clamp,
  drawLine,
  drawRect,
  engineInit,
  engineObjectsDestroy,
  initTileCollision,
  isOverlapping,
  mainCanvasSize,
  mousePos,
  mouseWheel,
  rgb,
  setCameraPos,
  setCameraScale,
  tile,
  TileLayer,
  TileLayerData,
  tileSizeDefault,
  vec2,
  Vector2,
  worldToScreen,
} from "littlejsengine";
import * as tileMapData from "./tilemap.json";
import { Base } from "./base";
import { Player } from "./player";
import { Enemy } from "./enemy";
import { Projectile } from "./projectile";
import { findPath, fromKey } from "./findPath";
import { navGraph, toKey } from "./findPath";

let player: Player;
let path: Vector2[] = [];

function gameInit() {
  const levelSize = vec2(tileMapData.width, tileMapData.height);
  initTileCollision(levelSize);
  engineObjectsDestroy();

  const groundLayer = new TileLayer(vec2(), levelSize, tile(0, 16, 0));
  for (let x = levelSize.x; x--; ) {
    for (let y = levelSize.y; y--; ) {
      const pos = vec2(x, levelSize.y - 1 - y);
      const tile = tileMapData.layers[0].data![y * levelSize.x + x];

      const data = new TileLayerData(tile - 1);
      groundLayer.setData(pos, data);
    }
  }

  const roadLayer = new TileLayer(vec2(), levelSize, tile(0, 16, 0));

  for (let x = levelSize.x; x--; ) {
    for (let y = levelSize.y; y--; ) {
      const pos = vec2(x, levelSize.y - 1 - y);
      const tile = tileMapData.layers[1].data![y * levelSize.x + x];

      if (tile === 0) continue;

      const data = new TileLayerData(tile - 1);
      roadLayer.setData(pos, data);

      // Build the graph by adding adjacent walkable tiles with costs
      const neighbors: { pos: Vector2; cost: number }[] = [];
      const possibleMoves = [
        { move: vec2(1, 0), cost: 1 }, // right
        { move: vec2(-1, 0), cost: 1 }, // left
        { move: vec2(0, 1), cost: 1 }, // up
        { move: vec2(0, -1), cost: 1 }, // down
        { move: vec2(1, 1), cost: 1.4 }, // top-right diagonal
        { move: vec2(-1, 1), cost: 1.4 }, // top-left diagonal
        { move: vec2(1, -1), cost: 1.4 }, // bottom-right diagonal
        { move: vec2(-1, -1), cost: 1.4 }, // bottom-left diagonal
      ];

      for (const { move, cost } of possibleMoves) {
        const neighborPos = pos.add(move);
        const isInbounds =
          neighborPos.x >= 0 && neighborPos.x < levelSize.x && neighborPos.y >= 0 && neighborPos.y < levelSize.y;
        if (isInbounds) {
          const neighborTile =
            tileMapData.layers[1].data![(levelSize.y - 1 - neighborPos.y) * levelSize.x + neighborPos.x];
          if (neighborTile !== 0) {
            neighbors.push({ pos: neighborPos, cost });
          }
        }
      }
      navGraph.set(toKey(pos), neighbors);
    }
  }

  groundLayer.redraw();
  roadLayer.redraw();

  const spawns = tileMapData.layers.find((x) => x.name === "Spawns");

  const enemySpawn = spawns?.objects?.find((x) => x.type === "EnemySpawn");
  const enemySpawnPosition = convertCoord(enemySpawn!.x, enemySpawn!.y, tileSizeDefault.x, levelSize.y);
  const enemyCount: number = (<any>enemySpawn).properties.find((x: any) => x.name === "Count")?.value ?? 1;

  const baseSpawn = spawns?.objects?.find((x) => x.type === "BaseSpawn");
  const baseSpawnPosition = convertCoord(baseSpawn!.x, baseSpawn!.y, tileSizeDefault.x, levelSize.y);

  // Find the nearest valid position on the navGraph to the baseSpawnPosition
  let minDistance = Infinity;
  let nearestValidPos = baseSpawnPosition;

  for (const key of navGraph.keys()) {
    const pos = fromKey(key);
    const distance = baseSpawnPosition.distance(pos);
    if (distance < minDistance) {
      minDistance = distance;
      nearestValidPos = pos;
    }
  }

  new Base(baseSpawnPosition);

  path = findPath(enemySpawnPosition, nearestValidPos)!;

  const enemySpawnInterval = 1000; // in milliseconds

  let count = enemyCount;
  const intervalID = setInterval(() => {
    if (count <= 0) {
      clearInterval(intervalID);
      return;
    }

    const enemy = new Enemy(enemySpawnPosition);
    enemy.path = path;
    count--;
  }, enemySpawnInterval);

  player = new Player(vec2(levelSize.x / 2, levelSize.y / 2));
  setCameraPos(player.pos);
  setCameraScale(48);
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  // destroy projectiles that are out of bounds
  Projectile.pool.forEach((p) => {
    if (p.pos.x < 0 || p.pos.x > tileMapData.width || p.pos.y < 0 || p.pos.y > tileMapData.height) {
      p.destroy();
    }
  });
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render

  // for debug only
  if (mouseWheel) {
    const zoomSpeed = 2;
    setCameraScale(cameraScale + mouseWheel * -zoomSpeed);
  }

  const levelSize = vec2(tileMapData.width, tileMapData.height);
  const cameraSize = mainCanvasSize.scale(1 / cameraScale);
  const halfCameraSize = cameraSize.scale(0.5);

  const lerpFactor = 0.025;

  let newCameraPos: Vector2 = cameraPos.lerp(player.pos, lerpFactor);

  // Adjust the camera position to move towards a point between the mouse position
  // and the player position
  newCameraPos = cameraPos.lerp(mousePos.subtract(player.pos).scale(0.3).add(player.pos), lerpFactor);

  // Clamp the camera position to prevent it from going outside the tilemap
  let clampedCameraPos = vec2(
    clamp(newCameraPos.x, halfCameraSize.x + 1, levelSize.x - halfCameraSize.x - 1),
    clamp(newCameraPos.y, halfCameraSize.y + 1, levelSize.y - halfCameraSize.y - 1)
  );

  if (player.isFiring) {
    // shake the camera when firing
    const shakeAmount = 0.1;
    const shake = player.firingDirection.scale(-1).scale(shakeAmount);
    clampedCameraPos = clampedCameraPos.add(shake);
  }

  setCameraPos(clampedCameraPos);
}

function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects

  // draw path
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i];
    const end = path[i + 1];
    drawLine(start, end, 0.2, rgb(0, 255, 0));
  }
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  // Print the camera scale to the screen
  /* const scaleText = `Camera Scale: ${cameraScale.toFixed(2)}`;
  const scaleTextSize = 30 / cameraScale;
  const scaleTextPos = screenToWorld(vec2(160, 40));
  drawText(scaleText, scaleTextPos, scaleTextSize, rgb(255, 255, 255)); */

  // Draw enemy indicator on the edge of the screen
  for (const enemy of Enemy.all) {
    const enemyScreenPos = worldToScreen(enemy.pos);
    const cameraScreenPos = worldToScreen(cameraPos);
    const screenSize = vec2(mainCanvasSize.x, mainCanvasSize.y);
    if (!isOverlapping(vec2(mainCanvasSize.x / 2, mainCanvasSize.y / 2), screenSize, enemyScreenPos)) {
      // Calculate the direction from the center of the screen to to the enemy
      const dir = enemyScreenPos.subtract(cameraScreenPos).normalize();
      // Calculate the position along that direction where we reach the edge of the screen

      let tMin = Infinity;
      let intersection: Vector2 = cameraScreenPos;

      // Check intersection with left edge (x = 0)
      if (dir.x !== 0) {
        const t = -cameraScreenPos.x / dir.x;
        const y = cameraScreenPos.y + t * dir.y;
        if (t > 0 && y >= 0 && y <= screenSize.y && t < tMin) {
          tMin = t;
          intersection = vec2(0, y);
        }
      }

      // Check intersection with right edge (x = screenSize.x)
      if (dir.x !== 0) {
        const t = (screenSize.x - cameraScreenPos.x) / dir.x;
        const y = cameraScreenPos.y + t * dir.y;
        if (t > 0 && y >= 0 && y <= screenSize.y && t < tMin) {
          tMin = t;
          intersection = vec2(screenSize.x, y);
        }
      }

      // Check intersection with top edge (y = 0)
      if (dir.y !== 0) {
        const t = -cameraScreenPos.y / dir.y;
        const x = cameraScreenPos.x + t * dir.x;
        if (t > 0 && x >= 0 && x <= screenSize.x && t < tMin) {
          tMin = t;
          intersection = vec2(x, 0);
        }
      }

      // Check intersection with bottom edge (y = screenSize.y)
      if (dir.y !== 0) {
        const t = (screenSize.y - cameraScreenPos.y) / dir.y;
        const x = cameraScreenPos.x + t * dir.x;
        if (t > 0 && x >= 0 && x <= screenSize.x && t < tMin) {
          tMin = t;
          intersection = vec2(x, screenSize.y);
        }
      }

      drawRect(intersection, vec2(10), rgb(255, 0, 0), 0, true, true);


      
    }

  }

  
}

// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "./assets/img/Tilemap.png",
  "./assets/img/Smoke.png",
]);

function convertCoord(x: number, y: number, tileSize: number, mapHeight: number): Vector2 {
  const newX = x / tileSize;
  const newY = mapHeight - y / tileSize;

  return vec2(newX, newY);
}
