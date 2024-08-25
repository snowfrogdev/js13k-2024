import {
  Color,
  drawRect,
  drawText,
  drawTile,
  engineInit,
  EngineObject,
  keyIsDown,
  mouseIsDown,
  mousePos,
  rgb,
  tile,
  vec2,
  Vector2,
} from "littlejsengine";



class Player extends EngineObject {
  constructor() {
    super();
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
    


    super.update();
  }

  render() {
    drawTile(this.pos, vec2(1), tile(0, 16));
  }
}

let player: Player;

class Projectile extends EngineObject {
  /**
   * Constructs a new instance of the Projectile class.
   * @param position - The position of the instance.
   * @param direction - The direction of the instance. Must be a unit vector.
   */
  constructor(position: Vector2, private direction: Vector2) {
    super(position);
    const speed = 0.5;
    this.velocity = this.direction.scale(speed);
  }

  render() {
    drawRect(this.pos, vec2(0.2), rgb(255, 255, 0));
  }
}

function gameInit() {
  player = new Player();
}

let lastFireTime = 0;

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  if (mouseIsDown(0)) {
    const direction = mousePos.subtract(player.pos).normalize();
    const position = player.pos.add(direction.scale(0.5));
    const rateOfFire = 0.1; // configurable rate of fire
    const currentTime = performance.now();
    if (currentTime - lastFireTime > rateOfFire * 1000) {
      new Projectile(position, direction);
      lastFireTime = currentTime;
    }
  }
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
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
]);
