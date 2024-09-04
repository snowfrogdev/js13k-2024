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
  min,
  keyWasReleased,
  engineObjectsCallback,
} from "littlejsengine";
import * as tileMapData from "./tilemap.json";
import { DamageTaker } from "./damage-taker";
import { Enemy } from "./enemy";
import { Projectile } from "./projectile";
import { publish } from "./event-bus";
import { ShellCasings } from "./shell-casings";
import { ResearchMaterial } from "./research-material";

export class Player extends EngineObject implements DamageTaker {
  static readonly maxHealth = 500;
  private health = Player.maxHealth;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3]);
  private vacuumSound = new Sound([.1,.02,,.1,.9,.8,,.5,,,,,,.1,,.3,,.7,.6]); 
  public isFiring = false;
  public firingDirection: Vector2 = vec2();
  private lastFireTime = 0;
  private knockbackFromHit = new Vector2();
  private healingTimer = new Timer(3);
  private vacuumMode = false;
  private materialBeingVacuumed = new Set<ResearchMaterial>();

  constructor(position: Vector2) {
    super(position);
    this.drawSize = vec2(1);
    this.renderOrder = Infinity;
  }

  update() {
    if (this.deathTimer.elapsed()) {
      this.destroy();
    }

    if (keyWasReleased("ShiftLeft")) {
      this.vacuumMode = !this.vacuumMode;
      this.stopVacuum();
    }

    this.isFiring = false;
    const currentTime = performance.now();
    const rateOfFire = 0.08; // configurable rate of fire
    let knockbackFactor = 0.1;

    if (!this.vacuumMode && mouseIsDown(0) && currentTime - this.lastFireTime > rateOfFire * 1000) {
      this.fire(currentTime);
    }

    if (this.vacuumMode && mouseIsDown(0)) {
      this.vacuum();
    }

    if (this.vacuumMode && !mouseIsDown(0)) {
      this.stopVacuum();
    }

    // wasd input for movement
    const direction = vec2(0, 0);
    if (keyIsDown("KeyW")) direction.y += 1;
    if (keyIsDown("KeyS")) direction.y -= 1;
    if (keyIsDown("KeyA")) direction.x -= 1;
    if (keyIsDown("KeyD")) direction.x += 1;

    if (direction.lengthSquared() > 0) {
      // increase knockback factor when moving
      knockbackFactor = 0.2;

      direction.normalize();
      const acceleration = 0.07;
      this.velocity = this.velocity.add(direction.scale(acceleration));
      const maxSpeed = 0.25;
      if (this.velocity.length() > maxSpeed) {
        this.velocity = this.velocity.normalize().scale(maxSpeed);
      }
    }

    // knockback player when firing
    if (this.isFiring) {
      this.velocity = this.velocity.add(this.firingDirection.scale(-knockbackFactor));
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

    if (this.healingTimer.elapsed()) {
      if (this.isFiring) {
        this.health = min(this.health + 1, Player.maxHealth);
      }
      this.health = min(this.health + 3, Player.maxHealth);
      this.healingTimer.set(1);
    }

    for (const material of this.materialBeingVacuumed) {
      material.vacuum(this.pos);
      if (this.pos.distance(material.pos) < 0.1) {
        material.destroy();
        publish("RESEARCH_MATERIAL_COLLECTED", { amount: 1 });
      }
    }

    super.update();
  }

  private fire(currentTime: number) {
    // Calculate angle offset so that `accuracy` percentage of the time the angleOffset will be 0 and the shot will be
    // accurate. Otherwise, the shot will miss slightly.
    const accuracy = 0.5;
    const angleOffset = Math.random() < accuracy ? 0 : Math.random() * 0.5 - 0.25;

    this.firingDirection = mousePos.subtract(this.pos).normalize().rotate(angleOffset);
    const firingPositionLeft = this.pos.add(this.velocity).add(this.firingDirection.rotate(-0.5).scale(0.5));
    const firingPositionRight = this.pos.add(this.velocity).add(this.firingDirection.rotate(0.5).scale(0.5));

    Projectile.create(firingPositionLeft, this.firingDirection, rgb(255, 255, 0), 0.7, vec2(0.35), [Enemy]);
    Projectile.create(firingPositionRight, this.firingDirection, rgb(255, 255, 0), 0.7, vec2(0.35), [Enemy]);

    // Muzzle flash
    new Particle(firingPositionLeft, undefined, undefined, rgb(1), rgb(1), 0.005, 0.5, 0.5);
    new Particle(firingPositionRight, undefined, undefined, rgb(1), rgb(1), 0.005, 0.5, 0.5);

    ShellCasings.create(firingPositionLeft, this.firingDirection.rotate(90));
    ShellCasings.create(firingPositionRight, this.firingDirection.rotate(-90));

    Projectile.sound.play();
    Projectile.sound.play();
    this.lastFireTime = currentTime;
    this.isFiring = true;
  }

  private vacuum() {
      this.vacuumSound.play();
    
    engineObjectsCallback(mousePos, 2, (obj: EngineObject) => {
      if (obj instanceof ResearchMaterial) {
        this.materialBeingVacuumed.add(obj);
      }
    });
  }

  private stopVacuum() {
    this.vacuumSound.stop();
    for (const material of this.materialBeingVacuumed) {
      material.stopVacuum();
    }
    this.materialBeingVacuumed.clear();
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

    const color = this.color ?? this.vacuumMode ? rgb(0.2, 0.7, 0.2) : rgb(0, 1, 0);

    //drawTile(this.pos, vec2(1), tile(0, 16));
    drawRect(this.pos, this.drawSize, color);

    // draw health bar
    const healthBarWidth = this.drawSize.x;
    const healthBarHeight = 0.2;
    const healthBarPos = this.pos.add(vec2(0, -this.size.y / 2 - 0.2));
    drawRect(healthBarPos, vec2(healthBarWidth, healthBarHeight), rgb(0, 0, 0));
    drawRect(healthBarPos, vec2(healthBarWidth * (this.health / 500), healthBarHeight), rgb(1, 0, 0));
  }

  takeDamage(projectile: Projectile) {
    if (this.deathTimer.active()) return;

    publish("PLAYER_DAMAGED", { damage: 5 });

    // flash color
    this.color = rgb(255, 255, 255, 1);
    setTimeout(() => (this.color = undefined!), 70);

    this.health -= 5;
    // knockback
    const knockback = 0.07;
    this.knockbackFromHit = projectile.velocity.normalize().scale(knockback);

    if (this.health <= 0) {
      publish("PLAYER_INCAPACITATED");
      this.deathTimer.set(0.15);
      this.deathSound.play();
    }
  }
}
