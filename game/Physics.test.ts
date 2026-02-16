import { Physics } from './Physics';
import { Entity } from '../types';

// Declaration for Jest globals to avoid compilation errors
declare var describe: any;
declare var test: any;
declare var expect: any;

// NOTE: Ensure 'jest' or 'vitest' and associated types are installed in your environment to run these tests.
describe('Physics Engine', () => {
  
  describe('checkCollision (AABB)', () => {
    const player: Entity = { x: 0, y: 0, width: 50, height: 50 };

    test('should detect overlap', () => {
      const obstacle: Entity = { x: 20, y: 20, width: 50, height: 50 };
      expect(Physics.checkCollision(player, obstacle)).toBe(true);
    });

    test('should return false for non-overlap', () => {
      const obstacle: Entity = { x: 100, y: 100, width: 50, height: 50 };
      expect(Physics.checkCollision(player, obstacle)).toBe(false);
    });

    test('should respect padding', () => {
      // Touching edge-to-edge
      const overlapObstacle: Entity = { x: 40, y: 0, width: 50, height: 50 };
      // Padding of 15 means effective player width is smaller for collision calc
      expect(Physics.checkCollision(player, overlapObstacle, 0)).toBe(true);
      expect(Physics.checkCollision(player, overlapObstacle, 15)).toBe(false);
    });
  });

  describe('isVerticalCollision', () => {
    const player: Entity = { x: 100, y: 0, width: 50, height: 50 };
    
    test('should return true when landing on top', () => {
      const platform: Entity = { x: 100, y: 50, width: 50, height: 50 };
      // Center Y distance = 50. Center X distance = 0.
      // Overlap Y = 50 - 50 = 0. Overlap X = 50 - 0 = 50.
      // overlapY < overlapX is true.
      expect(Physics.isVerticalCollision(player, platform)).toBe(true);
    });

    test('should return false when hitting from side', () => {
      const wall: Entity = { x: 140, y: 0, width: 50, height: 50 };
      // Center Y distance = 0. Center X distance = 40.
      // Overlap Y = 50. Overlap X = 10.
      // overlapY (50) < overlapX (10) is FALSE.
      expect(Physics.isVerticalCollision(player, wall)).toBe(false);
    });
  });
});