export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  GENERATING = 'GENERATING',
  VICTORY = 'VICTORY'
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  vy: number;
  isGrounded: boolean;
  rotation: number;
  hasFirePower: boolean;
}

export enum ObstacleType {
  PIPE = 'PIPE',
  GOOMBA = 'GOOMBA',
  BLOCK = 'BLOCK',
  QUESTION_BLOCK = 'QUESTION_BLOCK',
  GAP = 'GAP',
  COIN = 'COIN',
  SHELL = 'SHELL',
  FIRE_FLOWER = 'FIRE_FLOWER',
  PIRANHA = 'PIRANHA'
}

export interface Obstacle extends Entity {
  type: ObstacleType;
  id: string;
  passed?: boolean;
  isUsed?: boolean;
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  id: string;
}

export interface Boss extends Entity {
  hp: number;
  maxHp: number;
  active: boolean;
  defeated: boolean;
  vy: number;
  shootTimer: number;
}

export type LevelTheme = 'OVERWORLD' | 'UNDERGROUND' | 'CASTLE';

export interface LevelConfig {
  id: string;
  name: string;
  obstacles: ObstacleType[];
  difficulty: string;
  description: string;
  theme?: LevelTheme;
  isCustom?: boolean;
}

export type InputAction = 'JUMP' | 'SHOOT' | 'LEFT' | 'RIGHT' | 'DOWN';
export type KeyMapping = Record<InputAction, string[]>;
