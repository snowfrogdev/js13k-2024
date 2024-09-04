import {
  EngineObject,
  Vector2,
  drawRect,
  rgb,
  Timer,
  Sound,
  engineObjectsCallback,
  vec2,
  min,
  Particle,
  randVector,
  ParticleEmitter,
  PI,
  tile,
} from "littlejsengine";
import { Player } from "./player";
import { Projectile } from "./projectile";
import { DamageTaker } from "./damage-taker";
import { Base } from "./base";
import { publish } from "./event-bus";
import { ResearchMaterial } from "./research-material";

export class Enemy extends EngineObject implements DamageTaker {
  static all = new Set<Enemy>();
  private _path: Vector2[] = [];
  private health = 100;
  private deathTimer = new Timer();
  private deathSound = new Sound(
    [1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3],
    100,
    0
  );
  private firingTimer = new Timer();

  private knockbackFromHit = new Vector2();

  set path(value: Vector2[]) {
    this._path = value;
  }

  constructor(position: Vector2) {
    super(position);
    this.drawSize = this.size.scale(0.8);
    this.color = rgb(1, 0, 0);
    Enemy.all.add(this);
  }

  update() {
    if (this.deathTimer.elapsed()) {
      for (let i = 0; i < 5; i++) {
        ResearchMaterial.create(this.pos);
      }

      // smoke
      const emitter = new ParticleEmitter(
        this.pos,
        0,
        1,
        2,
        5,
        PI,
        tile(1, 16, 1),
        undefined,
        undefined,
        undefined,
        undefined,
        20, // particleTime
        0.7, // sizeStart
        0.05, // sizeEnd
        0.005, // speed
        0.01, // angleSpeed
        0.999, // damping
        0.999, // angle damping
        0,
        undefined,
        0.1,
        0.2,
        false,
        false,
        true,
        500
      );

      this.destroy();
    }

    if (this._path.length === 0) return;

    // find index of nearest waypoint on the path
    let nearestWaypointIndex = 0;
    let minDist = Infinity;
    for (let i = 0; i < this._path.length; i++) {
      const dist = this.pos.distance(this._path[i]);
      if (dist < minDist) {
        minDist = dist;
        nearestWaypointIndex = i;
      }
    }

    const maxSpeed = 0.025;

    if (nearestWaypointIndex === this._path.length - 1 && minDist < maxSpeed) return;

    // target the next waypoint
    const target = this._path[nearestWaypointIndex + 1] ?? this._path[nearestWaypointIndex];

    // move towards the target
    const dir = target.subtract(this.pos).normalize();
    this.velocity = dir.scale(maxSpeed);

    engineObjectsCallback(this.pos, 15, (obj: EngineObject) => {
      if (obj instanceof Enemy && obj !== this) {
        const dist = this.pos.distance(obj.pos);

        // Basic collision avoidance
        if (dist < this.size.x * 1.5) {
          const coneAngle = 120; // degrees
          const directionAB = obj.pos.subtract(this.pos).normalize();
          const directionA = this.velocity.normalize();
          const dotProduct = directionA.dot(directionAB);
          const cosHalfConeAngle = Math.cos((coneAngle / 2) * (Math.PI / 180));
          if (dotProduct > cosHalfConeAngle) {
            const speedAttenuation = min(1, (dist - this.size.x * 1.1) / (this.size.x * 1.5 - this.size.x * 1.1));
            this.velocity = this.velocity.scale(speedAttenuation);
          }
        }
      }

      if (obj instanceof Player || obj instanceof Base) {
        if (this.firingTimer.active()) return;
        const projectileSpeed = 0.5;
        const firingSolution = this.calculateInterceptVector(this.pos, obj.pos, obj.velocity, projectileSpeed);
        if (!firingSolution) return;
        // Calculate angle offset so that `accuracy` percentage of the time the angleOffset will be 0 and the shot will hit
        // the player. Otherwise, the shot will miss slightly.
        const accuracy = 0.1;
        const angleOffset = Math.random() < accuracy ? 0 : Math.random() * 0.5 - 0.25;

        const firingDirection = firingSolution.rotate(angleOffset);

        const position = this.pos.add(firingDirection!.scale(0.5));
        const rateOfFire = 1;
        Projectile.create(position, firingDirection!, rgb(1, 0.48, 0.09), projectileSpeed, vec2(0.45), [Player, Base]);
        // muzzle flash
        new Particle(position, undefined, undefined, rgb(1), rgb(1), 0.007, 0.65, 0.65);
        Projectile.sound.play(position);
        this.firingTimer.set(rateOfFire);

        // knockback enemy when firing
        const knockback = 0.05;
        this.velocity = this.velocity.add(firingSolution!.scale(-knockback));
      }

      // apply knockback from hit, will be 0 if we have not been hit
      this.velocity = this.velocity.add(this.knockbackFromHit);
      this.knockbackFromHit = vec2();
    });

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

    this.renderOrder = -this.pos.y + this.size.y / 2;
    //drawTile(this.pos, vec2(1), tile(0, 16, 0), this.color);
    drawRect(this.pos, this.drawSize, this.color || rgb(1, 0, 0));
  }

  takeDamage(projectile: Projectile) {
    if (this.deathTimer.active()) return;

    // flash color
    this.color = rgb(1);
    setTimeout(() => (this.color = undefined!), 70);

    this.health -= 5;
    // knockback
    const knockback = 0.05;
    this.knockbackFromHit = projectile.velocity.normalize().scale(knockback);

    if (this.health <= 0) {
      publish("ENEMY_KILLED");
      this.deathTimer.set(0.15);
      this.deathSound.play(this.pos);
    }
  }

  calculateInterceptVector(
    origin: Vector2,
    targetPos: Vector2,
    targetVelocity: Vector2,
    projectileSpeed: number
  ): Vector2 | null {
    const deltaX = origin.x - targetPos.x;
    const deltaY = origin.y - targetPos.y;

    const a =
      targetVelocity.x * targetVelocity.x + targetVelocity.y * targetVelocity.y - projectileSpeed * projectileSpeed;
    const b = 2 * (deltaX * targetVelocity.x + deltaY * targetVelocity.y);
    const c = deltaX * deltaX + deltaY * deltaY;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;

    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

    const t = Math.min(t1, t2);

    const dx = (deltaX + targetVelocity.x * t) / (projectileSpeed * t);
    const dy = (deltaY + targetVelocity.y * t) / (projectileSpeed * t);

    return vec2(dx, dy).normalize();
  }

  destroy() {
    super.destroy();
    Enemy.all.delete(this);
  }
}
