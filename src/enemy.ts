import { EngineObject, Vector2, vec2, drawRect, rgb, Timer, Sound } from "littlejsengine";

export class Enemy extends EngineObject {
  private _path: Vector2[] = [];
  private health = 100;
  private deathTimer = new Timer();
  private deathSound = new Sound([1.5,,47,.08,.15,.66,4,.4,2,-4,,,,.7,,.9,.06,.34,.3]);

  set path(value: Vector2[]) {
    this._path = value;
  }

  constructor(position: Vector2) {
    super(position);
    this.drawSize = vec2(1).scale(0.8);
  }

  update() {
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

    if (this.deathTimer.elapsed()) {
      this.destroy();
    }

    super.update();
  }

  render() {
    if (this.health <= 0) {
      if (this.deathTimer.getPercent() < 0.35) {
        drawRect(this.pos, this.drawSize.scale(3), rgb(0,0,0));
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
}
