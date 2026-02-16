import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Player, Obstacle, ObstacleType, LevelConfig } from '../types';
import { GRAVITY, JUMP_FORCE, GROUND_HEIGHT, THEMES, ASSETS, GAME_SPEED_INITIAL } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  levelData: LevelConfig | null;
  onScoreUpdate: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, levelData, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const playerRef = useRef<Player>({
    x: 100,
    y: 0,
    width: 50,
    height: 30,
    vy: 0,
    isGrounded: true,
    rotation: 0
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const gameSpeedRef = useRef(GAME_SPEED_INITIAL);
  const distanceRef = useRef(0);
  const nextObstacleIndexRef = useRef(0);
  const themeRef = useRef(THEMES.OVERWORLD);
  const keysRef = useRef<Set<string>>(new Set());
  const scoreRef = useRef(0);

  // Initialize/Reset Game
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playerRef.current = {
      x: 100,
      y: canvas.height - GROUND_HEIGHT - 30,
      width: 50,
      height: 30,
      vy: 0,
      isGrounded: true,
      rotation: 0
    };

    obstaclesRef.current = [];
    gameSpeedRef.current = GAME_SPEED_INITIAL;
    distanceRef.current = 0;
    nextObstacleIndexRef.current = 0;
    scoreRef.current = 0;
    onScoreUpdate(0);
    keysRef.current.clear();
    
    if (levelData && levelData.theme && THEMES[levelData.theme]) {
        themeRef.current = THEMES[levelData.theme];
    } else {
        themeRef.current = THEMES.OVERWORLD;
    }
  }, [levelData, onScoreUpdate]);

  // Jump Handler
  const handleJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    
    if (playerRef.current.isGrounded) {
      playerRef.current.vy = JUMP_FORCE;
      playerRef.current.isGrounded = false;
      playerRef.current.rotation = -25;
    }
  }, [gameState]);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        handleJump();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
        keysRef.current.delete(e.code);
    };

    const handleTouchStart = () => {
        handleJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleJump]);

  // Spawn Obstacles Logic
  const spawnObstacle = useCallback((canvasWidth: number) => {
    if (!levelData) return 200;
    
    const obstacleType = levelData.obstacles[nextObstacleIndexRef.current % levelData.obstacles.length];
    nextObstacleIndexRef.current++;

    let newObs: Obstacle | null = null;
    const spawnX = canvasWidth + 100; 

    // Variable spacing based on obstacle type to make it playable
    let spacingMultiplier = 1;

    switch (obstacleType) {
      case ObstacleType.PIPE:
        newObs = {
          type: ObstacleType.PIPE,
          x: spawnX,
          y: 0, 
          width: 50,
          height: 60 + Math.random() * 50,
          id: Date.now().toString() + Math.random()
        };
        break;
      case ObstacleType.BLOCK:
      case ObstacleType.QUESTION_BLOCK:
        newObs = {
          type: obstacleType,
          x: spawnX,
          y: Math.random() > 0.6 ? 110 : 170,
          width: 40,
          height: 40,
          id: Date.now().toString() + Math.random()
        };
        break;
      case ObstacleType.GOOMBA:
        newObs = {
          type: ObstacleType.GOOMBA,
          x: spawnX,
          y: 0,
          width: 32,
          height: 32,
          id: Date.now().toString() + Math.random()
        };
        break;
      case ObstacleType.SHELL:
        newObs = {
          type: ObstacleType.SHELL,
          x: spawnX,
          y: 0,
          width: 30,
          height: 25,
          id: Date.now().toString() + Math.random()
        };
        spacingMultiplier = 1.2; // Shells are dangerous
        break;
      case ObstacleType.COIN:
        newObs = {
            type: ObstacleType.COIN,
            x: spawnX,
            y: 120 + Math.random() * 80,
            width: 20,
            height: 28,
            id: Date.now().toString() + Math.random()
        };
        spacingMultiplier = 0.5;
        break;
      case ObstacleType.GAP:
         return 250; // Return gap width
    }

    if (newObs) {
        const canvas = canvasRef.current;
        if(canvas) {
            if (newObs.type === ObstacleType.PIPE || newObs.type === ObstacleType.GOOMBA || newObs.type === ObstacleType.SHELL) {
                newObs.y = canvas.height - GROUND_HEIGHT - newObs.height;
            } else if (newObs.type === ObstacleType.BLOCK || newObs.type === ObstacleType.QUESTION_BLOCK) {
                newObs.y = canvas.height - GROUND_HEIGHT - newObs.y; 
            } else if (newObs.type === ObstacleType.COIN) {
                newObs.y = canvas.height - GROUND_HEIGHT - newObs.y;
            }
            obstaclesRef.current.push(newObs);
        }
    }
    return 200 * spacingMultiplier;
  }, [levelData]);


  // Helper drawing functions (omitted repetition where possible, but keeping context)
  const drawBrickPattern = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, lines: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = lines;
    const bw = width / 2;
    const bh = height / 2;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.strokeRect(x, y, bw, bh);
    ctx.strokeRect(x+bw, y, bw, bh);
    ctx.strokeRect(x, y+bh, bw, bh);
    ctx.strokeRect(x+bw, y+bh, bw, bh);
  };

  const drawQuestionBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = '#F8931D'; 
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#C45709';
    const dotSize = 4;
    ctx.fillRect(x + 2, y + 2, dotSize, dotSize);
    ctx.fillRect(x + width - 6, y + 2, dotSize, dotSize);
    ctx.fillRect(x + 2, y + height - 6, dotSize, dotSize);
    ctx.fillRect(x + width - 6, y + height - 6, dotSize, dotSize);
    ctx.fillStyle = '#5A2E03';
    ctx.font = 'bold 24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const offset = Math.sin(Date.now() / 150) * 2;
    ctx.fillText('?', x + width/2, y + height/2 + 2 + offset);
    ctx.fillStyle = '#FFE4B5';
    ctx.fillText('?', x + width/2 + 2, y + height/2 + offset);
  };

  const drawHill = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + width/2, y + height, width/2, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(x + width/2 - 10, y + height - 40, 10, 10);
    ctx.fillRect(x + width/2 + 15, y + height - 25, 10, 10);
  };

  const drawBush = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) => {
    ctx.fillStyle = color;
    const r = width / 3;
    ctx.beginPath();
    ctx.arc(x + r/2, y, r/2, 0, Math.PI * 2);
    ctx.arc(x + 1.5*r, y - 5, r/2 + 5, 0, Math.PI * 2);
    ctx.arc(x + 2.5*r, y, r/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawKoopaShell = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
      // Green shell
      ctx.fillStyle = '#00aa00';
      ctx.beginPath();
      ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, Math.PI, 0);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'white';
      ctx.stroke();
      
      // Pattern
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2 - 5, 5, 0, Math.PI * 2);
      ctx.fill();
  };


  // Main Game Loop
  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      if (gameState === GameState.MENU) {
          initGame();
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (levelData && levelData.theme && THEMES[levelData.theme]) {
        themeRef.current = THEMES[levelData.theme];
    }

    let animationFrameId: number;
    let spawnCounter = 0;

    const loop = () => {
      const theme = themeRef.current;
      const player = playerRef.current;
      
      // --- PLAYER PHYSICS & CONTROLS ---

      // WASD / Arrow Controls
      if (keysRef.current.has('KeyA') || keysRef.current.has('ArrowLeft')) {
          player.x -= 6;
      }
      if (keysRef.current.has('KeyD') || keysRef.current.has('ArrowRight')) {
          player.x += 6;
      }
      // Fast fall
      if ((keysRef.current.has('KeyS') || keysRef.current.has('ArrowDown')) && !player.isGrounded) {
          player.vy += 1;
      }

      // Clamp Player Position
      player.x = Math.max(0, Math.min(player.x, canvas.width - player.width));

      // Gravity
      player.vy += GRAVITY;
      player.y += player.vy;

      // Ground Collision
      const groundY = canvas.height - GROUND_HEIGHT - player.height;
      if (player.y > groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
        player.rotation = 0;
      } else {
        player.isGrounded = false;
        if (player.rotation < 20) player.rotation += 2;
      }

      // Game Speed
      gameSpeedRef.current = Math.min(gameSpeedRef.current + 0.0005, 12);
      distanceRef.current += gameSpeedRef.current;

      // --- SPAWNING ---
      spawnCounter -= gameSpeedRef.current;
      if (spawnCounter <= 0) {
          const waitDistance = spawnObstacle(canvas.width);
          spawnCounter = waitDistance || 200;
      }

      // Update Obstacles
      obstaclesRef.current.forEach(obs => {
        obs.x -= gameSpeedRef.current;
        
        // Moving enemies logic
        if (obs.type === ObstacleType.GOOMBA) {
             obs.x -= 2; // Walks left
        } else if (obs.type === ObstacleType.SHELL) {
             obs.x -= 5; // Fast projectile
        }
      });

      obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > -200);

      // Collision Detection
      for (const obs of obstaclesRef.current) {
         const padding = 8;
         const collision = 
            player.x < obs.x + obs.width - padding &&
            player.x + player.width > obs.x + padding &&
            player.y < obs.y + obs.height - padding &&
            player.y + player.height > obs.y + padding;
         
         if (collision) {
             if (obs.type === ObstacleType.COIN) {
                 if (!obs.passed) {
                    scoreRef.current += 50;
                    onScoreUpdate(scoreRef.current);
                    obs.passed = true;
                    obs.y = -1000;
                 }
             } else {
                 setGameState(GameState.GAME_OVER);
                 return;
             }
         } else if (!obs.passed && obs.x + obs.width < player.x && obs.type !== ObstacleType.COIN) {
             obs.passed = true;
             scoreRef.current += 10;
             onScoreUpdate(scoreRef.current);
         }
      }

      // --- RENDER ---
      
      // Sky
      ctx.fillStyle = theme.SKY;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scenery
      const sceneryOffset = (distanceRef.current * 0.3);
      if (theme.HILL) {
        for(let i=0; i<3; i++) {
           const hillX = (i * 1200 - (sceneryOffset % 1200)) - 200;
           drawHill(ctx, hillX, canvas.height - GROUND_HEIGHT - 100, 200, 100, theme.HILL);
           drawHill(ctx, hillX + 600, canvas.height - GROUND_HEIGHT - 60, 120, 60, theme.HILL);
        }
      }

      if (theme.CLOUD) {
          const cloudOffset = (distanceRef.current * 0.1);
          ctx.fillStyle = theme.CLOUD;
          for(let i=0; i<4; i++) {
             const cx = (i * 500 - (cloudOffset % 2000)) + 100;
             const cy = 80 + (i%2)*40;
             ctx.globalAlpha = 0.8;
             ctx.beginPath();
             ctx.arc(cx, cy, 30, 0, Math.PI * 2);
             ctx.arc(cx+30, cy-10, 35, 0, Math.PI * 2);
             ctx.arc(cx+60, cy, 30, 0, Math.PI * 2);
             ctx.fill();
             ctx.globalAlpha = 1.0;
          }
      }

      if (theme.BUSH) {
          const bushOffset = (distanceRef.current * 0.5); 
          for(let i=0; i<4; i++) {
             const bx = (i * 800 - (bushOffset % 3200)) + 400;
             drawBush(ctx, bx, canvas.height - GROUND_HEIGHT - 15, 60, theme.BUSH);
          }
      }

      // Ground
      ctx.fillStyle = theme.GROUND;
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
      ctx.fillStyle = theme.GROUND_DETAIL;
      const groundDist = distanceRef.current % 40;
      for (let i = -1; i < canvas.width / 40 + 1; i++) {
        const gx = (i * 40) - groundDist;
        const gy = canvas.height - GROUND_HEIGHT;
        ctx.fillRect(gx, gy, 38, 38);
        ctx.fillRect(gx, gy + 40, 38, 38);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(gx + 5, gy + 5, 5, 5);
        ctx.fillRect(gx + 15, gy + 15, 5, 5);
        ctx.fillStyle = theme.GROUND_DETAIL;
      }
      if (theme === THEMES.OVERWORLD) {
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 5);
      }

      // Obstacles
      obstaclesRef.current.forEach(obs => {
        if (obs.passed && obs.type === ObstacleType.COIN) return; 

        if (obs.type === ObstacleType.PIPE) {
            ctx.fillStyle = theme.PIPE;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000';
            ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            ctx.fillStyle = theme.PIPE;
            ctx.fillRect(obs.x - 4, obs.y, obs.width + 8, 30);
            ctx.strokeRect(obs.x - 4, obs.y, obs.width + 8, 30);
            ctx.fillStyle = theme.PIPE_HIGHLIGHT;
            ctx.fillRect(obs.x + 8, obs.y + 2, 6, obs.height-4);
            ctx.fillRect(obs.x + 18, obs.y + 2, 2, obs.height-4);
        } else if (obs.type === ObstacleType.BLOCK) {
            drawBrickPattern(ctx, obs.x, obs.y, obs.width, obs.height, theme.BLOCK, theme.BRICK_LINES);
        } else if (obs.type === ObstacleType.QUESTION_BLOCK) {
            drawQuestionBlock(ctx, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === ObstacleType.SHELL) {
            drawKoopaShell(ctx, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === ObstacleType.GOOMBA) {
             const wobble = Math.sin(Date.now() / 100) * 2;
             ctx.fillStyle = '#8B4513';
             ctx.beginPath();
             ctx.moveTo(obs.x, obs.y + 20);
             ctx.bezierCurveTo(obs.x, obs.y, obs.x + obs.width, obs.y, obs.x + obs.width, obs.y + 20);
             ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
             ctx.lineTo(obs.x, obs.y + obs.height);
             ctx.fill();
             ctx.fillStyle = '#000';
             ctx.fillRect(obs.x + 2, obs.y + obs.height - 5 + wobble, 10, 8);
             ctx.fillRect(obs.x + obs.width - 12, obs.y + obs.height - 5 - wobble, 10, 8);
             ctx.fillStyle = 'white';
             ctx.beginPath();
             ctx.ellipse(obs.x + 10, obs.y + 15, 5, 7, 0, 0, Math.PI*2);
             ctx.ellipse(obs.x + 22, obs.y + 15, 5, 7, 0, 0, Math.PI*2);
             ctx.fill();
             ctx.fillStyle = 'black';
             ctx.beginPath();
             ctx.ellipse(obs.x + 11, obs.y + 15, 2, 3, 0, 0, Math.PI*2);
             ctx.ellipse(obs.x + 21, obs.y + 15, 2, 3, 0, 0, Math.PI*2);
             ctx.fill();
        } else if (obs.type === ObstacleType.COIN) {
            const time = Date.now() / 200;
            const scaleX = Math.abs(Math.sin(time));
            ctx.save();
            ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
            ctx.scale(scaleX, 1);
            ctx.fillStyle = '#FFD700'; 
            ctx.beginPath();
            ctx.ellipse(0, 0, obs.width/2, obs.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-2, -8, 4, 16);
            ctx.restore();
        }
      });

      // Player
      ctx.save();
      ctx.translate(player.x + player.width/2, player.y + player.height/2);
      ctx.rotate(player.rotation * Math.PI / 180);
      
      // Kart
      ctx.fillStyle = ASSETS.CAR_BODY;
      ctx.beginPath();
      ctx.roundRect(-25, 0, 50, 15, 5);
      ctx.fill();
      ctx.fillStyle = '#888';
      ctx.fillRect(-25, -10, 10, 20);
      ctx.fillStyle = '#444';
      ctx.fillRect(-10, -5, 20, 10);
      // Hat
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(0, -10, 8, 0, Math.PI*2);
      ctx.fill();
      ctx.fillRect(0, -12, 12, 3);
      // Wheels
      ctx.fillStyle = ASSETS.CAR_WHEEL;
      ctx.beginPath(); ctx.arc(-20, 15, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(-20, 15, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = ASSETS.CAR_WHEEL;
      ctx.beginPath(); ctx.arc(20, 15, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(20, 15, 3, 0, Math.PI * 2); ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, levelData, spawnObstacle, onScoreUpdate]);

  useEffect(() => {
    if (gameState === GameState.MENU) {
        initGame();
    }
  }, [gameState, initGame]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={600} 
      className="w-full h-full object-contain bg-sky-300"
    />
  );
};

export default GameCanvas;