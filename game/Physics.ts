import { Entity } from "../types";

export class Physics {
  /**
   * Check for AABB (Axis-Aligned Bounding Box) collision between two entities.
   */
  static checkCollision(a: Entity, b: Entity, padding: number = 0): boolean {
    return (
      a.x < b.x + b.width - padding &&
      a.x + a.width > b.x + padding &&
      a.y < b.y + b.height - padding &&
      a.y + a.height > b.y + padding
    );
  }

  /**
   * Determines collision side.
   * Returns true if 'a' is colliding vertically (landing on or hitting head) relative to 'b'.
   */
  static isVerticalCollision(a: Entity, b: Entity): boolean {
    const aCenterY = a.y + a.height / 2;
    const bCenterY = b.y + b.height / 2;
    const aCenterX = a.x + a.width / 2;
    const bCenterX = b.x + b.width / 2;

    const overlapY = (a.height + b.height) / 2 - Math.abs(aCenterY - bCenterY);
    const overlapX = (a.width + b.width) / 2 - Math.abs(aCenterX - bCenterX);

    return overlapY < overlapX;
  }
}
