import {
  cameraPos,
  cameraScale,
  clamp,
  engineInit,
  engineObjectsDestroy,
  initTileCollision,
  mainCanvasSize,
  mouseIsDown,
  mousePos,
  mouseWheel,
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
    }
  }

  groundLayer.redraw();
  roadLayer.redraw();

  const spawns = tileMapData.layers.find((x) => x.name === "Spawns");

  const enemySpawn = spawns?.objects?.find((x) => x.type === "EnemySpawn");
  const enemySpawnPosition = convertCoord(
    enemySpawn!.x,
    enemySpawn!.y,
    tileSizeDefault.x,
    levelSize.y
  );

  new Enemy(enemySpawnPosition);

  const baseSpawn = spawns?.objects?.find((x) => x.type === "BaseSpawn");
  const baseSpawnPosition = convertCoord(
    baseSpawn!.x,
    baseSpawn!.y,
    tileSizeDefault.x,
    levelSize.y
  );

  new Base(baseSpawnPosition);

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
    const positionLeft = player.pos.add(
      firingDirection.rotate(-0.5).scale(0.5)
    );
    const positionRight = player.pos.add(
      firingDirection.rotate(0.5).scale(0.5)
    );
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
    clamp(
      newCameraPos.x,
      halfCameraSize.x + 1,
      levelSize.x - halfCameraSize.x - 1
    ),
    clamp(
      newCameraPos.y,
      halfCameraSize.y + 1,
      levelSize.y - halfCameraSize.y - 1
    )
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
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
}

// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "./assets/img/Tilemap.png",
]);

function convertCoord(
  x: number,
  y: number,
  tileSize: number,
  mapHeight: number
): Vector2 {
  const newX = x / tileSize;
  const newY = mapHeight - y / tileSize;

  return vec2(newX, newY);
}
