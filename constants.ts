export const GRAVITY = 1.5;
export const MOON_GRAVITY = 1.0; // Increased from 0.6 (less floaty)
export const JUMP_FORCE = -22;
export const MOON_JUMP_FORCE = -25; // Decreased from -30 (less extreme)
export const GAME_SPEED_INITIAL = 6;
export const MAX_GAME_SPEED = 11; // Reduced from 14
export const SPEED_INCREMENT = 0.0005; // Slower acceleration
export const GROUND_HEIGHT = 80;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const CAR_COLORS = [
  { name: 'Mario Red', value: '#e70000', wheel: '#000000' },
  { name: 'Luigi Green', value: '#00aa00', wheel: '#000000' },
  { name: 'Peach Pink', value: '#ff69b4', wheel: '#550000' },
  { name: 'Toad Blue', value: '#0000ff', wheel: '#000000' },
  { name: 'Wario Yellow', value: '#ffd700', wheel: '#550055' },
  { name: 'Waluigi Purple', value: '#800080', wheel: '#aaaa00' },
  { name: 'Metal', value: '#808080', wheel: '#333333' },
  { name: 'Rainbow', value: 'RAINBOW', wheel: '#ffffff' },
];

export const DIFFICULTY_SETTINGS: Record<string, { speedMult: number, gapMult: number, maxSpeed: number, spawnRate: number }> = {
  Easy: { speedMult: 0.6, gapMult: 1.5, maxSpeed: 10, spawnRate: 1.2 },
  Medium: { speedMult: 0.85, gapMult: 1.1, maxSpeed: 12, spawnRate: 1.1 }, // Reduced speed from 1.0 to 0.85
  Hard: { speedMult: 1.2, gapMult: 0.9, maxSpeed: 15, spawnRate: 0.9 }, // Reduced speed from 1.4 to 1.2
};

export const ENTITY_CONFIG = {
  PLAYER: { WIDTH: 50, HEIGHT: 30, X_OFFSET: 100 },
  OBSTACLE: {
    PIPE: { WIDTH: 60, BASE_HEIGHT: 60, VARIANCE: 60 },
    BLOCK: { WIDTH: 45, HEIGHT: 45 },
    CAT: { WIDTH: 40, HEIGHT: 35 },
    TURTLE: { WIDTH: 40, HEIGHT: 30 },
    COIN: { WIDTH: 25, HEIGHT: 30 },
    FLOWER: { WIDTH: 30, HEIGHT: 30 },
  },
  BOSS: {
    WIDTH: 180,
    HEIGHT: 150,
    SPAWN_DISTANCE: 2500,
    HP: 15,
    SHOOT_INTERVAL: 80
  },
  PROJECTILE: { WIDTH: 18, HEIGHT: 18, SPEED: 12 }
};

export const CONTROLS = {
  DEFAULT_MAPPING: {
    JUMP: ['ArrowUp', 'KeyW', 'KeyZ'], // KeyZ for AZERTY support
    SHOOT: ['Space', 'ShiftLeft', 'ShiftRight', 'KeyF'],
    LEFT: ['ArrowLeft', 'KeyA', 'KeyQ'], // KeyQ for AZERTY support
    RIGHT: ['ArrowRight', 'KeyD'],
    DOWN: ['ArrowDown', 'KeyS']
  }
};

export const THEMES = {
  OVERWORLD: {
    SKY: '#63adff',
    GROUND: '#5c9e2b',
    GROUND_DETAIL: '#7ac24a',
    PIPE: '#00c200',
    PIPE_HIGHLIGHT: '#55ff55',
    BLOCK: '#c97726',
    BRICK_LINES: '#5c3208',
    HILL_DARK: '#00852d',
    HILL_LIGHT: '#1cb050',
    CLOUD: '#ffffff'
  },
  UNDERGROUND: {
    SKY: '#1a1a2e',
    GROUND: '#7a5a4a',
    GROUND_DETAIL: '#8f6c5b',
    PIPE: '#22cc22',
    PIPE_HIGHLIGHT: '#88ff88',
    BLOCK: '#4a5a7a',
    BRICK_LINES: '#1a1a2e',
    HILL_DARK: '#3a2a4a',
    HILL_LIGHT: '#5a4a6a',
    CLOUD: '#2a2a3e'
  },
  CASTLE: {
    SKY: '#2e0a0a',
    GROUND: '#555555',
    GROUND_DETAIL: '#777777',
    PIPE: '#444444',
    PIPE_HIGHLIGHT: '#666666',
    BLOCK: '#8f3c3c',
    BRICK_LINES: '#000000',
    HILL_DARK: '#440000',
    HILL_LIGHT: '#660000',
    CLOUD: '#442222'
  }
};

export const ASSETS = {
  CAR_BODY: '#e70000',
  CAR_WHEEL: '#000000'
};

export const PHYSICS = {
  GRAVITY: 1.5,
  JUMP_FORCE: -22,
  FAST_FALL: 2.5,
  ROTATION_SPEED: 3,
  MAX_ROTATION: 25,
  MIN_ROTATION: -35,
  GROUND_HEIGHT: 80,
  COLLISION_PADDING: 4
};

export const GAME_RULES = {
  MAX_PROJECTILES: 5,
  PROJECTILE_COOLDOWN: 150,
  PROJECTILE_LIFETIME_X: 100, // Distance beyond screen
  BOSS_SPAWN_OFFSET: 100,
  BOSS_Y_LIMIT_LOW: 50,
  BOSS_Y_LIMIT_HIGH: 350,
  BOSS_ATTACK_SPEED: 9,
  BOSS_ATTACK_SIZE: 30,
  SCORE_COIN: 50,
  SCORE_POWERUP: 1000,
  SCORE_ENEMY: 100,
  SCORE_BOSS: 5000,
  SPAWN_BUFFER: 200, // cleanup buffer
};
