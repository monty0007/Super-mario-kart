export const GRAVITY = 0.6;
export const JUMP_FORCE = -13; 
export const GAME_SPEED_INITIAL = 6;
export const MAX_GAME_SPEED = 12;
export const SPEED_INCREMENT = 0.0005;
export const GROUND_HEIGHT = 80;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const ENTITY_CONFIG = {
  PLAYER: { WIDTH: 50, HEIGHT: 30, X_OFFSET: 100 },
  OBSTACLE: {
    PIPE: { WIDTH: 50, BASE_HEIGHT: 60, VARIANCE: 50 },
    BLOCK: { WIDTH: 40, HEIGHT: 40 },
    CAT: { WIDTH: 35, HEIGHT: 30 },
    TURTLE: { WIDTH: 35, HEIGHT: 40 },
    COIN: { WIDTH: 20, HEIGHT: 28 },
    FLOWER: { WIDTH: 30, HEIGHT: 30 },
  },
  BOSS: {
    WIDTH: 150, 
    HEIGHT: 120, 
    SPAWN_DISTANCE: 2000, 
    HP: 10,
    SHOOT_INTERVAL: 100
  },
  PROJECTILE: { WIDTH: 15, HEIGHT: 15, SPEED: 10 }
};

export const CONTROLS = {
  DEFAULT_MAPPING: {
    JUMP: ['ArrowUp', 'KeyW'],
    SHOOT: ['Space', 'ShiftLeft', 'ShiftRight', 'KeyF'],
    LEFT: ['ArrowLeft', 'KeyA'],
    RIGHT: ['ArrowRight', 'KeyD'],
    DOWN: ['ArrowDown', 'KeyS']
  }
};

export const THEMES = {
  OVERWORLD: {
    SKY: '#5c94fc',
    GROUND: '#c84c0c',
    GROUND_DETAIL: '#dba463', 
    PIPE: '#00aa00',
    PIPE_HIGHLIGHT: '#55ff55',
    BLOCK: '#b84e00',
    BRICK_LINES: '#000000',
    HILL: '#009900',
    BUSH: '#00cc00',
    CLOUD: '#ffffff'
  },
  UNDERGROUND: {
    SKY: '#000000',
    GROUND: '#0055aa',
    GROUND_DETAIL: '#4499ea',
    PIPE: '#22cc22',
    PIPE_HIGHLIGHT: '#88ff88',
    BLOCK: '#0055aa',
    BRICK_LINES: '#ffffff',
    HILL: '#004400',
    BUSH: '#006600',
    CLOUD: '#444444'
  },
  CASTLE: {
    SKY: '#000000',
    GROUND: '#888888',
    GROUND_DETAIL: '#aaaaaa',
    PIPE: '#555555',
    PIPE_HIGHLIGHT: '#777777',
    BLOCK: '#884400',
    BRICK_LINES: '#000000',
    HILL: '#330000',
    BUSH: '#550000',
    CLOUD: '#333333'
  }
};

export const ASSETS = {
  CAR_BODY: '#e70000',
  CAR_WHEEL: '#000000'
};
