import { Particle, rand, randVector, rgb, vec2, Vector2 } from "littlejsengine";

export class ShellCasings extends Particle {
  static pool = new Set<ShellCasings>();
  private _active: boolean = true;
  private constructor(position: Vector2) {
    super(position, undefined, undefined, rgb(0, 0, 0), rgb(0, 0, 0), 60 * 2, 0.1, 0.1);    
    this.damping = 0.95;
  }

  static create(position: Vector2, flyOffDirection: Vector2) {
    const particle = [...ShellCasings.pool].find((p) => !p._active) ?? new ShellCasings(position);
    particle._active = true;
    particle.velocity = flyOffDirection.add(randVector(0.3)).normalize().scale(rand(0.1, 0.3));
    ShellCasings.pool.add(particle);
    return particle;
  }

  render() {
    if (!this._active) return;

    this.renderOrder = -this.pos.y + this.size.y / 2;
    super.render();
  }

  destroy() {
    if (ShellCasings.pool.size > 1000) {
      ShellCasings.pool.delete(this);
      super.destroy();
      return;
    }

    this._active = false;
    this.velocity = vec2();
    this.angleVelocity = 0;
    this.pos = vec2(-1000);
  }
}
