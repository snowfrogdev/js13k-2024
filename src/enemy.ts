import { EngineObject, Vector2, drawRect, rgb, Timer, Sound, engineObjectsCallback, vec2 } from "littlejsengine";
import { Player } from "./player";
import { Projectile } from "./projectile";
import { DamageTaker } from "./damage-taker";

export class Enemy extends EngineObject implements DamageTaker {
  private _path: Vector2[] = [];
  private health = 100;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5, , 47, 0.08, 0.15, 0.66, 4, 0.4, 2, -4, , , , 0.7, , 0.9, 0.06, 0.34, 0.3]);
  private firingTimer = new Timer();

  set path(value: Vector2[]) {
    this._path = value;
  }

  constructor(position: Vector2) {
    super(position);
    this.drawSize = this.size.scale(0.8);
  }

  update() {
    if (this.deathTimer.elapsed()) {
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
      if (obj instanceof Player) {
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
        Projectile.create(position, firingDirection!, rgb(1, 0.48, 0.09), projectileSpeed, vec2(0.4), [Player]);
        Projectile.sound.play();
        this.firingTimer.set(rateOfFire);

        // knockback enemy when firing
        const knockback = 0.05;
        this.velocity = this.velocity.add(firingSolution!.scale(-knockback));
      }
    });

    super.update();
  }

  render() {
    if (this.health <= 0) {
      if (this.deathTimer.getPercent() < 0.35) {
        drawRect(this.pos, this.drawSize.scale(3), rgb(0, 0, 0));
      } else {
        drawRect(this.pos, this.drawSize.scale(3), rgb(255));
      }

      return;
    }

    //drawTile(this.pos, vec2(1), tile(0, 16, 0), this.color);
    drawRect(this.pos, this.drawSize, this.color || rgb(255, 0, 0));
  }

  takeDamage() {
    if (this.deathTimer.active()) return;
    // flash color
    this.color = rgb(255, 255, 255, 0.5);
    setTimeout(() => (this.color = undefined!), 50);

    this.health -= 5;

    if (this.health <= 0) {
      this.deathTimer.set(0.15);
      this.deathSound.play();
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
}
