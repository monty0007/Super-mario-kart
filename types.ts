export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  GENERATING = 'GENERATING'
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
}

export enum ObstacleType {
  PIPE = 'PIPE',
  GOOMBA = 'GOOMBA',
  BLOCK = 'BLOCK',
  QUESTION_BLOCK = 'QUESTION_BLOCK',
  GAP = 'GAP',
  COIN = 'COIN',
  SHELL = 'SHELL'
}

export interface Obstacle extends Entity {
  type: ObstacleType;
  id: string;
  passed?: boolean;
}

export type LevelTheme = 'OVERWORLD' | 'UNDERGROUND' | 'CASTLE';

export interface LevelConfig {
  id: string;
  name: string;
  obstacles: ObstacleType[];
  difficulty: string;
  description: string;
  theme?: LevelTheme;
}
