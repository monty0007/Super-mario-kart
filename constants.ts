export const GRAVITY = 0.6;
export const JUMP_FORCE = -13; 
export const GAME_SPEED_INITIAL = 6;
export const GROUND_HEIGHT = 80;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const THEMES = {
  OVERWORLD: {
    SKY: '#5c94fc',
    GROUND: '#c84c0c',
    GROUND_DETAIL: '#dba463', // Light orange/brown for NES look
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
    GROUND: '#0055aa', // Blueish ground
    GROUND_DETAIL: '#4499ea',
    PIPE: '#22cc22', // Lighter pipe
    PIPE_HIGHLIGHT: '#88ff88',
    BLOCK: '#0055aa', // Blue bricks
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
