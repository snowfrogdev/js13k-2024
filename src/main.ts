import {
  cameraPos,
  cameraScale,
  clamp,
  drawRect,
  drawTile,
  engineInit,
  EngineObject,
  engineObjectsCallback,
  engineObjectsDestroy,
  initTileCollision,
  keyIsDown,
  mainCanvasSize,
  mouseIsDown,
  mousePos,
  rgb,
  setCameraPos,
  Sound,
  tile,
  TileLayer,
  TileLayerData,
  vec2,
  Vector2,
} from "littlejsengine";
import { tileMapData } from "./tiled-map";

class Player extends EngineObject {
  constructor(position: Vector2) {
    super(position);
  }

  update() {
    // wasd input for movement

    const direction = vec2(0, 0);
    if (keyIsDown("KeyW")) direction.y += 1;
    if (keyIsDown("KeyS")) direction.y -= 1;
    if (keyIsDown("KeyA")) direction.x -= 1;
    if (keyIsDown("KeyD")) direction.x += 1;

    if (direction.lengthSquared() > 0) {
      direction.normalize();
      const acceleration = 0.07;
      this.velocity = this.velocity.add(direction.scale(acceleration));
      const maxSpeed = 0.25;
      if (this.velocity.length() > maxSpeed) {
        this.velocity = this.velocity.normalize().scale(maxSpeed);
      }
    }

    const deceleration = 0.1;
    this.velocity = this.velocity.scale(1 - deceleration);

    // Clamp player position to prevent it from going outside the tilemap
    const levelSize = vec2(tileMapData.width, tileMapData.height);
    this.pos.x = clamp(this.pos.x, 1, levelSize.x - 1);
    this.pos.y = clamp(this.pos.y, 1, levelSize.y - 1);

    super.update();
  }

  render() {
    drawTile(this.pos, vec2(1), tile(0, 16));
  }
}

class Enemy extends EngineObject {
  constructor(position: Vector2) {
    super(position);
  }

  update() {
    // move towards the player
    const direction = player.pos.subtract(this.pos).normalize();
    const speed = 0.05;
    this.velocity = direction.scale(speed);

    super.update();
  }

  render() {
    drawTile(this.pos, vec2(1), tile(0, 16, 2), this.color);
  }

  takeDamage() {
    // flash color
    this.color = rgb(255, 255, 255, 0.5);
    setTimeout(() => (this.color = undefined!), 50);
  }
}

let player: Player;

class Projectile extends EngineObject {
  static sound = new Sound([
    4.5,
    ,
    82.40689,
    ,
    ,
    ,
    ,
    ,
    0.8,
    1.5,
    ,
    0.2,
    ,
    1.1,
    5,
    ,
    0.08,
    ,
    ,
    0.16,
    29,
  ]);
  /**
   * Constructs a new instance of the Projectile class.
   * @param position - The position of the instance.
   * @param direction - The direction of the instance. Must be a unit vector.
   */
  constructor(position: Vector2, private direction: Vector2) {
    super(position);
    const speed = 0.7;
    this.velocity = this.direction.scale(speed);
    this.drawSize = vec2(0.25);
    this.size = vec2(0.25);
  }

  update() {
    engineObjectsCallback(this.pos, this.size, (obj: EngineObject) => {
      if (obj instanceof Enemy) {
        obj.takeDamage();
        this.destroy();
      }
    });

    super.update();
  }

  render() {
    drawRect(this.pos, this.drawSize, rgb(255, 255, 0));
  }
}

function gameInit() {
  const levelSize = vec2(tileMapData.width, tileMapData.height);
  initTileCollision(levelSize);
  engineObjectsDestroy();

  const tileLayer = new TileLayer(vec2(), levelSize, tile(0, 16, 1));
  for (let x = levelSize.x; x--; ) {
    for (let y = levelSize.y; y--; ) {
      const pos = vec2(x, levelSize.y - 1 - y);
      const tile = tileMapData.layers[0].data[y * levelSize.x + x];

      const data = new TileLayerData(tile - 1);
      tileLayer.setData(pos, data);
    }
  }

  tileLayer.redraw();

  player = new Player(vec2(levelSize.x / 2, levelSize.y / 2));
  new Enemy(vec2(levelSize.x / 2 + 5, levelSize.y / 2));

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
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
}

// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, [
  "./assets/img/player.png",
  "./assets/img/tileset.png",
  "./assets/img/enemy.png",
]);
