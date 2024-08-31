import { Projectile } from "./projectile";

export interface DamageTaker {
  takeDamage(projectile: Projectile): void;
}