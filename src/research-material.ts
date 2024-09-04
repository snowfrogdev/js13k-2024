import { Particle, randVector, rgb, vec2, Vector2 } from "littlejsengine";

export class ResearchMaterial extends Particle {
  static pool = new Set<ResearchMaterial>();
  private _active: boolean = true;

  private isBeingVacuumed = false;

  private constructor(position: Vector2) {
    super(position, undefined, undefined, rgb(1, 0.3, 0.3), rgb(1, 0.3, 0.3), 60 * 3, 0.25, 0.1, 0.001);
    this.damping = 0.9;
  }

  static create(position: Vector2) {
    const particle = [...ResearchMaterial.pool].find((p) => !p._active) ?? new ResearchMaterial(position);
    particle._active = true;
    particle.pos = position.copy();
    particle.velocity = randVector(0.1);

    ResearchMaterial.pool.add(particle);
    return particle;
  }

  vacuum(playerPos: Vector2) {
    if (!this.isBeingVacuumed) {
      this.isBeingVacuumed = true;
    }

    this.velocity = playerPos.subtract(this.pos).normalize().scale(0.12);
  }

  stopVacuum() {
    this.isBeingVacuumed = false;
  }

  render() {
    if (!this._active) return;

    this.renderOrder = -this.pos.y + this.size.y / 2;
    super.render();
  }

  destroy() {
    if (ResearchMaterial.pool.size > 1000) {
      ResearchMaterial.pool.delete(this);
      super.destroy();
      return;
    }

    this._active = false;
    this.isBeingVacuumed = false;
    this.velocity = vec2();
    this.angleVelocity = 0;
    this.pos = vec2(-1000);
  }
}
