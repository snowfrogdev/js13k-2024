import {
  EngineObject,
  Vector2,
  vec2,
  keyIsDown,
  clamp,
  drawRect,
  rgb,
  Timer,
  Sound,
  mouseIsDown,
  mousePos,
  Particle,
  randVector,
  rand,
} from "littlejsengine";
import * as tileMapData from "./tilemap.json";
import { DamageTaker } from "./damage-taker";
import { Enemy } from "./enemy";
import { Projectile } from "./projectile";

export class Player extends EngineObject implements DamageTaker {
  private health = 500;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3]);
  public isFiring = false;
  public firingDirection: Vector2 = vec2();
  private lastFireTime = 0;
  private knockbackFromHit = new Vector2();

  constructor(position: Vector2) {
    super(position);
    this.drawSize = vec2(1);
  }

  update() {
    if (this.deathTimer.elapsed()) {
      this.destroy();
    }

    this.isFiring = false;
    const currentTime = performance.now();
    const rateOfFire = 0.08; // configurable rate of fire
    if (mouseIsDown(0) && currentTime - this.lastFireTime > rateOfFire * 1000) {
      // Calculate angle offset so that `accuracy` percentage of the time the angleOffset will be 0 and the shot will hit
      // the player. Otherwise, the shot will miss slightly.
      const accuracy = 0.5;
      const angleOffset = Math.random() < accuracy ? 0 : Math.random() * 0.5 - 0.25;

      this.firingDirection = mousePos.subtract(this.pos).normalize().rotate(angleOffset);
      const positionLeft = this.pos.add(this.velocity).add(this.firingDirection.rotate(-0.5).scale(0.5));
      const positionRight = this.pos.add(this.velocity).add(this.firingDirection.rotate(0.5).scale(0.5));

      Projectile.create(positionLeft, this.firingDirection, rgb(255, 255, 0), 0.7, vec2(0.35), [Enemy]);
      Projectile.create(positionRight, this.firingDirection, rgb(255, 255, 0), 0.7, vec2(0.35), [Enemy]);

      // Muzzle flash
      new Particle(positionLeft, undefined, undefined, rgb(1), rgb(1), 0.005, 0.5, 0.5);
      new Particle(positionRight, undefined, undefined, rgb(1), rgb(1), 0.005, 0.5, 0.5);

      // Shell casings
      const leftCasing = new Particle(positionLeft, undefined, undefined, rgb(0, 0, 0), rgb(0, 0, 0), 60 * 5, 0.1, 0.1);
      const rightCasing = new Particle(positionRight, undefined, undefined, rgb(0, 0, 0), rgb(0, 0, 0), 60 * 5, 0.1, 0.1);
      // set a random velocity for the casings that is roughly at a perpendicular angle to the firing direction
      leftCasing.velocity = this.firingDirection.rotate(90).add(randVector(0.3)).normalize().scale(rand(0.1, 0.3));  
      rightCasing.velocity = this.firingDirection.rotate(-90).add(randVector(0.3)).normalize().scale(rand(0.1, 0.3));    
      leftCasing.damping = 0.95;
      rightCasing.damping = 0.95;
      leftCasing.renderOrder = this.renderOrder - 0.1;
      rightCasing.renderOrder = this.renderOrder - 0.1;


      Projectile.sound.play();
      Projectile.sound.play();
      this.lastFireTime = currentTime;
      this.isFiring = true;

      // knockback player when firing
      const knockback = 0.1;
      this.velocity = this.velocity.add(this.firingDirection.scale(-knockback));
    }

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

    // apply knockback from hit, will be 0 if we have not been hit
    this.velocity = this.velocity.add(this.knockbackFromHit);
    this.knockbackFromHit = vec2();

    // Clamp player position to prevent it from going outside the tilemap
    const levelSize = vec2(tileMapData.width, tileMapData.height);
    this.pos.x = clamp(this.pos.x, 1, levelSize.x - 1);
    this.pos.y = clamp(this.pos.y, 1, levelSize.y - 1);

    super.update();
  }

  render() {
    if (this.health <= 0) {
      if (this.deathTimer.getPercent() < 0.35) {
        drawRect(this.pos, this.drawSize.scale(3.5), rgb(0, 0, 0));
      } else {
        drawRect(this.pos, this.drawSize.scale(3.5), rgb(1));
      }

      return;
    }

    //drawTile(this.pos, vec2(1), tile(0, 16));
    drawRect(this.pos, this.drawSize, this.color || rgb(0, 255, 0));
  }

  takeDamage(projectile: Projectile) {
    if (this.deathTimer.active()) return;
    // flash color
    this.color = rgb(255, 255, 255, 1);
    setTimeout(() => (this.color = undefined!), 70);

    this.health -= 5;
    // knockback
    const knockback = 0.07;
    this.knockbackFromHit = projectile.velocity.normalize().scale(knockback);

    if (this.health <= 0) {
      this.deathTimer.set(0.15);
      this.deathSound.play();
    }
  }
}
