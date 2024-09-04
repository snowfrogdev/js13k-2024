import { Particle, rand, randVector, rgb, Vector2 } from "littlejsengine";

export class ShellCasings extends Particle {
  constructor(position: Vector2, flyOffDirection: Vector2) {
    super(position, undefined, undefined, rgb(0, 0, 0), rgb(0, 0, 0), 60 * 5, 0.1, 0.1);
    this.velocity = flyOffDirection.add(randVector(0.3)).normalize().scale(rand(0.1, 0.3));
    this.damping = 0.95;
  }

  render() {
    this.renderOrder = -this.pos.y + this.size.y / 2;
    super.render();
  }
}
