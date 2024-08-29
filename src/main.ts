import {
  cameraPos,
  cameraScale,
  clamp,
  drawLine,
  engineInit,
  engineObjectsDestroy,
  initTileCollision,
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
import { tileMapData } from "./tiled-map";
import { Base } from "./base";
import { Player } from "./player";
import { Enemy } from "./enemy";
import { Projectile } from "./projectile";

let player: Player;
let path: Vector2[] = [];

// Define the graph as an adjacency list with movement costs
const navGraph = new Map<string, { pos: Vector2; cost: number }[]>();

// Helper function to convert coordinates to a string key for the graph
const toKey = (pos: Vector2) => `${pos.x},${pos.y}`;

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
  /* for (let x = levelSize.x; x--; ) {
    for (let y = levelSize.y; y--; ) {
      const pos = vec2(x, levelSize.y - 1 - y);
      const tile = tileMapData.layers[1].data![y * levelSize.x + x];

      if (tile === 0) continue;
      const data = new TileLayerData(tile - 1);
      roadLayer.setData(pos, data);
    }
  } */

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

  new Enemy(enemySpawnPosition);

  const baseSpawn = spawns?.objects?.find((x) => x.type === "BaseSpawn");
  const baseSpawnPosition = convertCoord(baseSpawn!.x, baseSpawn!.y, tileSizeDefault.x, levelSize.y);

  new Base(baseSpawnPosition);

  path = findPath(enemySpawnPosition, baseSpawnPosition)!;

  player = new Player(vec2(levelSize.x / 2, levelSize.y / 2));
  setCameraPos(player.pos);
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
      new Projectile(positionLeft, firingDirection);
      new Projectile(positionRight, firingDirection);
      lastFireTime = currentTime;
      isFiring = true;
    }
  }
}

function gameUpdatePost() {
  // for debug only
  if (mouseWheel) {
    const zoomSpeed = 2;
    setCameraScale(cameraScale + mouseWheel * -zoomSpeed);
  }
  // called after physics and objects are updated
  // setup camera and prepare for render
  let newCameraPos = cameraPos.lerp(player.pos, 0.1);

  // Clamp the camera position to prevent it from going outside the tilemap
  const levelSize = vec2(tileMapData.width, tileMapData.height);
  const cameraSize = mainCanvasSize.scale(1 / cameraScale);
  const halfCameraSize = cameraSize.scale(0.5);
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
    drawLine(start, end, 1, rgb(0, 255, 0));
  }
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
}

// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ["./assets/img/Tilemap.png"]);

function convertCoord(x: number, y: number, tileSize: number, mapHeight: number): Vector2 {
  const newX = x / tileSize;
  const newY = mapHeight - y / tileSize;

  return vec2(newX, newY);
}

// Pathfinding function using A* algorithm
function findPath(start: Vector2, goal: Vector2): Vector2[] | null {
  start = vec2(Math.floor(start.x), Math.floor(start.y));
  goal = vec2(Math.floor(goal.x), Math.floor(goal.y));

  const openSet: Vector2[] = [start];
  const cameFrom = new Map<string, Vector2 | null>();
  const gScore = new Map<string, number>();
  gScore.set(toKey(start), 0);
  const fScore = new Map<string, number>();
  fScore.set(toKey(start), heuristic(start, goal));

  while (openSet.length > 0) {
    const current = openSet.reduce((a, b) =>
      fScore.get(toKey(a)) ?? Infinity < (fScore.get(toKey(b)) ?? Infinity) ? a : b
    );
    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(openSet.indexOf(current), 1);
    for (const neighbor of navGraph.get(toKey(current))!) {
      const tentativegScore = gScore.get(toKey(current))! + neighbor.cost;
      if (tentativegScore < (gScore.get(toKey(neighbor.pos)) ?? Infinity)) {
        cameFrom.set(toKey(neighbor.pos), current);
        gScore.set(toKey(neighbor.pos), tentativegScore);
        fScore.set(toKey(neighbor.pos), tentativegScore + heuristic(neighbor.pos, goal));
        if (!openSet.find(({ x, y }) => x === neighbor.pos.x && y === neighbor.pos.y)) {
          openSet.push(neighbor.pos);
        }
      }
    }
  }

  // Return null if no path is found
  return null;
}

// Heuristic function for A* (using Chebyshev distance)
function heuristic(a: Vector2, b: Vector2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// Function to reconstruct the path from start to goal
function reconstructPath(cameFrom: Map<string, Vector2 | null>, current: Vector2): Vector2[] {
  const totalPath = [current];
  while (cameFrom.has(toKey(current))) {
    current = cameFrom.get(toKey(current))!;
    totalPath.unshift(current);
  }
  return totalPath;
}
