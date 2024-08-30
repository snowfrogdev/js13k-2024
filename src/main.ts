import {
  cameraPos,
  cameraScale,
  clamp,
  drawLine,
  engineInit,
  engineObjectsDestroy,
  initTileCollision,
  isOverlapping,
  lerp,
  mainCanvasSize,
  mouseIsDown,
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
  const enemyCount: number = (<any> enemySpawn).properties.find((x: any) => x.name === "Count")?.value ?? 1;

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

let lastFireTime = 0;
let isFiring = false;
let firingDirection: Vector2 = vec2();

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state
  isFiring = false;
  if (mouseIsDown(0)) {
    Projectile.sound.play();
    firingDirection = mousePos.subtract(player.pos).normalize();
    const positionLeft = player.pos.add(firingDirection.rotate(-0.5).scale(0.5));
    const positionRight = player.pos.add(firingDirection.rotate(0.5).scale(0.5));
    const rateOfFire = 0.1; // configurable rate of fire
    const currentTime = performance.now();
    if (currentTime - lastFireTime > rateOfFire * 1000) {
      Projectile.create(positionLeft, firingDirection, rgb(255, 255, 0), 0.7, vec2(0.25), [Enemy]);
      Projectile.create(positionRight, firingDirection, rgb(255, 255, 0), 0.7, vec2(0.25), [Enemy]);
      lastFireTime = currentTime;
      isFiring = true;

      // knockback player when firing
      const knockback = 0.1;
      player.velocity = player.velocity.add(firingDirection.scale(-knockback));
    }
  }

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

  // Calculate the average position of all enemies
  let averageEnemyPos = vec2(0, 0);
  let newCameraPos: Vector2 = cameraPos.lerp(player.pos, lerpFactor);
  
  const enemies = Enemy.all;
  if (enemies.size > 0) {
    for (const enemy of enemies) {
      averageEnemyPos = averageEnemyPos.add(enemy.pos);
    }
    averageEnemyPos = averageEnemyPos.scale(1 / enemies.size);
    // Adjust the camera position to give headroom towards the average enemy position
    const headroomFactor = 8; // Adjust this factor to control the amount of headroom
    const directionToEnemies = averageEnemyPos.subtract(player.pos).normalize();
    newCameraPos = cameraPos.lerp(player.pos.add(directionToEnemies.scale(headroomFactor)), lerpFactor);
  }

  // Clamp the camera position to prevent it from going outside the tilemap
  let clampedCameraPos = vec2(
    clamp(newCameraPos.x, halfCameraSize.x + 1, levelSize.x - halfCameraSize.x - 1),
    clamp(newCameraPos.y, halfCameraSize.y + 1, levelSize.y - halfCameraSize.y - 1)
  );  

  if (isFiring) {
    // shake the camera when firing
    const shakeAmount = 0.1;
    const shake = firingDirection.scale(-1).scale(shakeAmount);
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
}

// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ["./assets/img/Tilemap.png"]);

function convertCoord(x: number, y: number, tileSize: number, mapHeight: number): Vector2 {
  const newX = x / tileSize;
  const newY = mapHeight - y / tileSize;

  return vec2(newX, newY);
}
