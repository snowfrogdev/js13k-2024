import { Color, Particle, rand, randVector, tile, time, vec2, Vector2 } from "littlejsengine";
import { SpriteData } from "./sprite-data";
import { spriteSheetData } from "./sprite-sheet";

export class ShellCasings extends Particle {
  static pool = new Set<ShellCasings>();
  private _active: boolean = true;
  private constructor(position: Vector2) {
    const sprite: SpriteData = spriteSheetData.frames["shell-casing.png"];
    const spritePos = vec2(sprite.frame.x, sprite.frame.y);
    const spriteSize = vec2(sprite.frame.w, sprite.frame.h);
    const tileInfo = tile(spritePos, spriteSize, 1);
    super(position, tileInfo, undefined, new Color, new Color, 60 * 2, 0.3, 0.3);    
    this.damping = 0.95;
  }

  static create(position: Vector2, flyOffDirection: Vector2) {
    const particle = [...ShellCasings.pool].find((p) => !p._active) ?? new ShellCasings(position);
    particle._active = true;
    particle.pos = position.copy();
    particle.velocity = flyOffDirection.add(randVector(0.3)).normalize().scale(rand(0.1, 0.3));
    particle.spawnTime = time;
    
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
