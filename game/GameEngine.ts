import { GameState, Player, Obstacle, LevelConfig, Boss, Projectile, ObstacleType } from "../types";
import { GRAVITY, JUMP_FORCE, GROUND_HEIGHT, GAME_SPEED_INITIAL, ENTITY_CONFIG, MAX_GAME_SPEED, SPEED_INCREMENT, THEMES, ASSETS, DIFFICULTY_SETTINGS, CAR_COLORS } from "../constants";
import { Physics } from "./Physics";
import { InputManager } from "./InputManager";

type StateCallback = (state: GameState) => void;
type ScoreCallback = (score: number) => void;
type AnnounceCallback = (message: string) => void;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  public gameState: GameState = GameState.MENU;
  private animationFrameId: number = 0;
  
  private player: Player;
  private boss: Boss;
  private obstacles: Obstacle[] = [];
  private projectiles: Projectile[] = [];
  private enemyProjectiles: Projectile[] = [];
  
  private gameSpeed: number = GAME_SPEED_INITIAL;
  private distance: number = 0;
  private nextObstacleIndex: number = 0;
  private score: number = 0;
  private carColor: string = ASSETS.CAR_BODY;

  private levelData: LevelConfig | null = null;
  private theme = THEMES.OVERWORLD;
  
  private input: InputManager;
  private onStateChange: StateCallback;
  private onScoreUpdate: ScoreCallback;
  private onAnnounce: AnnounceCallback;
  private frameCount: number = 0;

  constructor(
    canvas: HTMLCanvasElement, 
    onStateChange: StateCallback, 
    onScoreUpdate: ScoreCallback,
    onAnnounce: AnnounceCallback
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    
    this.onStateChange = onStateChange;
    this.onScoreUpdate = onScoreUpdate;
    this.onAnnounce = onAnnounce;
    this.input = new InputManager();

    this.player = this.createInitialPlayer();
    this.boss = this.createInitialBoss();
  }

  public setCarColor(color: string) {
      this.carColor = color;
  }

  private createInitialPlayer(): Player {
    return {
      x: ENTITY_CONFIG.PLAYER.X_OFFSET,
      y: 0, 
      width: ENTITY_CONFIG.PLAYER.WIDTH, 
      height: ENTITY_CONFIG.PLAYER.HEIGHT,
      vy: 0,
      isGrounded: true,
      rotation: 0,
      hasFirePower: false
    };
  }

  private createInitialBoss(): Boss {
    return {
      x: this.canvas.width + 200,
      y: 100,
      width: ENTITY_CONFIG.BOSS.WIDTH,
      height: ENTITY_CONFIG.BOSS.HEIGHT,
      hp: ENTITY_CONFIG.BOSS.HP,
      maxHp: ENTITY_CONFIG.BOSS.HP,
      active: false,
      defeated: false,
      vy: 3,
      shootTimer: ENTITY_CONFIG.BOSS.SHOOT_INTERVAL
    };
  }

  public setLevel(level: LevelConfig) {
    this.levelData = level;
    if (level.theme && THEMES[level.theme]) {
      this.theme = THEMES[level.theme];
    }
  }

  public start() {
    this.reset();
    this.gameState = GameState.PLAYING;
    this.onStateChange(GameState.PLAYING);
    this.onAnnounce("Game Started. Good luck!");
    this.loop();
  }

  public stop() {
    this.gameState = GameState.MENU;
    cancelAnimationFrame(this.animationFrameId);
  }

  public cleanup() {
    this.stop();
    this.input.cleanup();
  }

  private reset() {
    this.player = this.createInitialPlayer();
    // Adjust Y to ground
    this.player.y = this.canvas.height - GROUND_HEIGHT - this.player.height;
    
    this.boss = this.createInitialBoss();
    this.obstacles = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.gameSpeed = GAME_SPEED_INITIAL;
    this.distance = 0;
    this.nextObstacleIndex = 0;
    this.score = 0;
    this.frameCount = 0;
    this.onScoreUpdate(0);
  }

  private getDifficultySettings() {
      const difficulty = this.levelData?.difficulty || 'Medium';
      return DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.Medium;
  }

  private loop = () => {
    if (this.gameState !== GameState.PLAYING) return;

    this.update();
    this.draw();
    this.frameCount++;
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    const settings = this.getDifficultySettings();

    // 1. Player Movement
    if (this.input.isActionActive('LEFT')) this.player.x -= 7;
    if (this.input.isActionActive('RIGHT')) this.player.x += 7;
    
    // Jump
    if (this.input.isActionActive('JUMP') && this.player.isGrounded) {
       this.player.vy = JUMP_FORCE;
       this.player.isGrounded = false;
       this.player.rotation = -35;
    }

    // Fast Fall (Ground Pound)
    if (this.input.isActionActive('DOWN') && !this.player.isGrounded) {
       this.player.vy += 2.5;
    }

    // Shoot 
    if (this.input.isActionActive('SHOOT') && this.player.hasFirePower) {
         if (this.projectiles.length < 5) {
             this.spawnProjectile();
         }
    }

    // Physics
    this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));
    this.player.vy += GRAVITY;
    this.player.y += this.player.vy;

    const groundY = this.canvas.height - GROUND_HEIGHT - this.player.height;
    if (this.player.y > groundY) {
      this.player.y = groundY;
      this.player.vy = 0;
      this.player.isGrounded = true;
      this.player.rotation = 0;
    } else {
      this.player.isGrounded = false;
      // Rotation logic
      if (this.player.vy > 0 && this.player.rotation < 25) {
          this.player.rotation += 3;
      }
    }

    // Game Speed & Distance
    const maxSpeed = settings.maxSpeed;
    const accel = SPEED_INCREMENT * settings.speedMult;
    this.gameSpeed = Math.min(this.gameSpeed + accel, maxSpeed);
    this.distance += this.gameSpeed;

    // Spawning
    this.handleSpawning(settings);

    // Entity Updates
    this.updateEntities();

    // Collisions
    this.handleCollisions();
  }

  private spawnProjectile() {
     const now = Date.now();
     // Simple debounce
     const lastP = this.projectiles[this.projectiles.length-1];
     if (lastP && (now - parseInt(lastP.id) < 150)) return;

     this.projectiles.push({
         x: this.player.x + this.player.width,
         y: this.player.y + this.player.height / 2,
         width: ENTITY_CONFIG.PROJECTILE.WIDTH,
         height: ENTITY_CONFIG.PROJECTILE.HEIGHT,
         vx: ENTITY_CONFIG.PROJECTILE.SPEED,
         // Shoot upwards so it arcs down
         vy: -10, 
         id: now.toString()
     });
  }

  private handleSpawning(settings: { spawnRate: number, gapMult: number }) {
     // Boss Spawn Logic
     if (this.distance > ENTITY_CONFIG.BOSS.SPAWN_DISTANCE && !this.boss.active && !this.boss.defeated) {
         this.boss.active = true;
         this.boss.x = this.canvas.width + 100;
         this.boss.y = 100;
         this.onAnnounce("Warning! Meowser approaching!");
         
         // Give pity flower if needed
         if (!this.player.hasFirePower) {
             this.obstacles.push({
                 type: ObstacleType.FIRE_FLOWER,
                 x: this.canvas.width,
                 y: this.canvas.height - GROUND_HEIGHT - 30,
                 width: 30, height: 30, 
                 id: 'emergency_flower',
                 vx: 0, vy: 0
             });
         }
     }

     if (this.boss.active) return; // Stop normal spawning during boss

     // Obstacle Spawn Logic
     const lastObs = this.obstacles[this.obstacles.length - 1];
     const minGap = 220 * settings.gapMult * (10 / (this.gameSpeed + 4)); 
     
     if (!lastObs || (this.canvas.width - lastObs.x > minGap)) {
         this.spawnNextObstacle();
     }
  }

  private spawnNextObstacle() {
      if (!this.levelData) return;
      const type = this.levelData.obstacles[this.nextObstacleIndex % this.levelData.obstacles.length];
      this.nextObstacleIndex++;
      
      const spawnX = this.canvas.width + 50;
      let y = 0;
      let w = 0; 
      let h = 0;

      // Map types to dimensions
      switch(type) {
          case ObstacleType.PIPE:
              w = ENTITY_CONFIG.OBSTACLE.PIPE.WIDTH;
              h = ENTITY_CONFIG.OBSTACLE.PIPE.BASE_HEIGHT + Math.random() * ENTITY_CONFIG.OBSTACLE.PIPE.VARIANCE;
              y = this.canvas.height - GROUND_HEIGHT - h;
              break;
          case ObstacleType.BLOCK:
          case ObstacleType.QUESTION_BLOCK:
              w = ENTITY_CONFIG.OBSTACLE.BLOCK.WIDTH;
              h = ENTITY_CONFIG.OBSTACLE.BLOCK.HEIGHT;
              y = this.canvas.height - GROUND_HEIGHT - (Math.random() > 0.6 ? 110 : 170);
              break;
          case ObstacleType.GOOMBA:
              w = ENTITY_CONFIG.OBSTACLE.CAT.WIDTH;
              h = ENTITY_CONFIG.OBSTACLE.CAT.HEIGHT;
              y = this.canvas.height - GROUND_HEIGHT - h;
              break;
          case ObstacleType.SHELL:
              w = ENTITY_CONFIG.OBSTACLE.TURTLE.WIDTH;
              h = ENTITY_CONFIG.OBSTACLE.TURTLE.HEIGHT;
              y = this.canvas.height - GROUND_HEIGHT - h;
              break;
          case ObstacleType.COIN:
              w = ENTITY_CONFIG.OBSTACLE.COIN.WIDTH;
              h = ENTITY_CONFIG.OBSTACLE.COIN.HEIGHT;
              y = this.canvas.height - GROUND_HEIGHT - (120 + Math.random() * 80);
              break;
          case ObstacleType.PIRANHA:
              w = 50; h = 70;
              y = this.canvas.height - GROUND_HEIGHT - h;
              break;
          case ObstacleType.FIRE_FLOWER:
              w = ENTITY_CONFIG.OBSTACLE.FLOWER.WIDTH;
              h = ENTITY_CONFIG.OBSTACLE.FLOWER.HEIGHT;
              y = this.canvas.height - GROUND_HEIGHT - 150;
              break;
          default:
              w = 40; h = 40; y = this.canvas.height - GROUND_HEIGHT - 40;
      }
      
      if (type !== ObstacleType.GAP) {
          this.obstacles.push({
              type, x: spawnX, y, width: w, height: h, id: Date.now().toString(), isUsed: false, vx: 0, vy: 0
          });
      }
  }

  private updateEntities() {
      const groundY = this.canvas.height - GROUND_HEIGHT;

      // Boss
      if (this.boss.active) {
          if (this.boss.x > this.canvas.width - 250) this.boss.x -= 2;
          
          // Swooping movement
          this.boss.y += this.boss.vy;
          if (this.boss.y < 50) this.boss.vy = Math.abs(this.boss.vy);
          if (this.boss.y > 350) this.boss.vy = -Math.abs(this.boss.vy);
          
          this.boss.shootTimer--;
          if (this.boss.shootTimer <= 0) {
              this.boss.shootTimer = ENTITY_CONFIG.BOSS.SHOOT_INTERVAL;
              // Aim at player
              const dx = (this.player.x + this.player.width/2) - this.boss.x;
              const dy = (this.player.y + this.player.height/2) - (this.boss.y + this.boss.height/2);
              const angle = Math.atan2(dy, dx);
              
              const speed = 9;
              this.enemyProjectiles.push({
                  x: this.boss.x, y: this.boss.y + this.boss.height/2,
                  vx: Math.cos(angle) * speed, 
                  vy: Math.sin(angle) * speed, 
                  width: 30, height: 30, id: 'boss_shot_' + Date.now()
              });
          }
      }

      // Obstacles
      this.obstacles.forEach(obs => {
          obs.x -= this.gameSpeed;
          
          // Moving Enemies (Goombas, Shells)
          if (obs.type === ObstacleType.GOOMBA) obs.x -= 2;
          if (obs.type === ObstacleType.SHELL) obs.x -= 4;

          // Power-up Movement Logic
          if (obs.type === ObstacleType.FIRE_FLOWER && obs.vx !== undefined && obs.vx !== 0) {
             // Move relative to game world (gameSpeed is already subtracted above for camera)
             // We add vx to simulate movement across the ground
             obs.x += obs.vx;
             
             // Gravity
             obs.vy = (obs.vy || 0) + GRAVITY;
             obs.y += obs.vy;

             // Ground Collision
             if (obs.y + obs.height > groundY) {
                 obs.y = groundY - obs.height;
                 obs.vy = 0;
             }

             // Wall/Block Collision for Powerup (Turn around)
             this.obstacles.forEach(other => {
                 if (other === obs) return;
                 // Very simple check: if hitting a pipe or block
                 if (this.isSolid(other.type)) {
                     if (Physics.checkCollision(obs, other)) {
                         obs.vx = -obs.vx!; // Flip direction
                         // Push out slightly
                         if (obs.vx > 0) obs.x = other.x + other.width + 1;
                         else obs.x = other.x - obs.width - 1;
                     }
                 }
             });
          }
      });
      // Cull off-screen
      this.obstacles = this.obstacles.filter(o => o.x + o.width > -200);

      // Projectiles
      this.projectiles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY; // Arc
          if (p.y > groundY - p.height) {
             p.y = groundY - p.height;
             p.vy = -8; // Bouncier
          }
      });
      this.projectiles = this.projectiles.filter(p => p.x < this.canvas.width + 100);

      this.enemyProjectiles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
      });
      this.enemyProjectiles = this.enemyProjectiles.filter(p => p.x > -100 && p.x < this.canvas.width + 100);
  }

  private handleCollisions() {
      const { player } = this;

      // 1. Player vs Obstacles
      for (const obs of this.obstacles) {
          if (obs.passed) continue;
          if (Physics.checkCollision(player, obs, 4)) {
              if (obs.type === ObstacleType.COIN) {
                  this.score += 50;
                  this.onScoreUpdate(this.score);
                  obs.passed = true;
                  obs.y = -1000; // Hide
              } else if (obs.type === ObstacleType.FIRE_FLOWER) {
                  this.player.hasFirePower = true;
                  this.score += 1000;
                  this.onScoreUpdate(this.score);
                  this.onAnnounce("Super Power!");
                  obs.passed = true;
                  obs.y = -1000;
              } else if (this.isSolid(obs.type)) {
                  this.resolveSolidCollision(obs);
              } else {
                  // Lethal
                  this.triggerGameOver();
                  return;
              }
          }
      }

      // 2. Projectiles vs Enemies/Boss
      this.projectiles.forEach(proj => {
          // vs Boss
          if (this.boss.active && Physics.checkCollision(proj, this.boss)) {
              this.boss.hp--;
              proj.y = 1000; // Remove
              this.boss.x += 15; // Knockback
              if (this.boss.hp <= 0) {
                  this.triggerVictory();
              }
          }
          // vs Obstacles
          this.obstacles.forEach(obs => {
              if (!obs.passed && (obs.type === ObstacleType.GOOMBA || obs.type === ObstacleType.PIRANHA || obs.type === ObstacleType.SHELL)) {
                  if (Physics.checkCollision(proj, obs)) {
                      obs.y = 1000;
                      obs.passed = true;
                      this.score += 100;
                      this.onScoreUpdate(this.score);
                      proj.y = 1000;
                  }
              }
          });
      });

      // 3. Enemy Projectiles vs Player
      this.enemyProjectiles.forEach(proj => {
          if (Physics.checkCollision(player, proj, 8)) {
              this.triggerGameOver();
          }
      });
  }

  private resolveSolidCollision(obs: Obstacle) {
     if (Physics.isVerticalCollision(this.player, obs)) {
         if (this.player.vy >= 0 && this.player.y + this.player.height - this.player.vy <= obs.y + 20) {
             // Land on top
             this.player.y = obs.y - this.player.height;
             this.player.vy = 0;
             this.player.isGrounded = true;
         } else if (this.player.vy < 0) {
             // Bonk head
             this.player.y = obs.y + obs.height;
             this.player.vy = 2; // Bounce down
             
             if (obs.type === ObstacleType.QUESTION_BLOCK && !obs.isUsed) {
                 obs.isUsed = true;
                 // Spawn powerup that moves!
                 this.obstacles.push({
                     type: ObstacleType.FIRE_FLOWER,
                     x: obs.x, 
                     y: obs.y - 30, 
                     width: 30, 
                     height: 30, 
                     id: 'spawn_' + Date.now(),
                     vx: 2.5, // Moves forward initially
                     vy: -5   // Pops up
                 });
             }
         }
     } else {
         // Horizontal Hit
         if (this.player.x < obs.x) this.player.x = obs.x - this.player.width;
         else this.player.x = obs.x + obs.width;
     }
  }

  private isSolid(type: ObstacleType) {
      return type === ObstacleType.PIPE || type === ObstacleType.BLOCK || type === ObstacleType.QUESTION_BLOCK;
  }

  private triggerGameOver() {
      this.gameState = GameState.GAME_OVER;
      this.onStateChange(GameState.GAME_OVER);
      this.onAnnounce("Game Over. Your score was " + this.score);
      cancelAnimationFrame(this.animationFrameId);
  }

  private triggerVictory() {
      this.boss.active = false;
      this.boss.defeated = true;
      this.score += 5000;
      this.gameState = GameState.VICTORY;
      this.onStateChange(GameState.VICTORY);
      this.onAnnounce("Victory! Boss defeated.");
      cancelAnimationFrame(this.animationFrameId);
  }

  // --- RENDERING ---

  private draw() {
      const { ctx, canvas, theme } = this;
      
      // Sky
      ctx.fillStyle = theme.SKY;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scenery
      if (theme === THEMES.OVERWORLD) {
          this.drawClouds();
          this.drawHills();
      } else if (theme === THEMES.UNDERGROUND) {
          this.drawCaveBackground();
      } else {
          this.drawCastleBackground();
      }

      this.drawGround();

      // --- Entities ---
      // Draw static first, then dynamic
      this.obstacles.forEach(o => this.drawObstacle(o));
      if (this.boss.active) this.drawBoss(this.boss);
      
      // Player Projectiles
      this.projectiles.forEach(p => {
          ctx.fillStyle = '#ff4400';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#ffff00';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/3, 0, Math.PI*2); ctx.fill();
      });

      // Enemy Projectiles
      this.enemyProjectiles.forEach(p => {
          ctx.fillStyle = '#ff00aa';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/4, 0, Math.PI*2); ctx.fill();
      });

      this.drawPlayer();
  }

  private drawPlayer() {
      const { ctx, player, carColor } = this;
      ctx.save();
      ctx.translate(player.x + player.width/2, player.y + player.height/2);
      ctx.rotate(player.rotation * Math.PI / 180);
      
      let primaryColor = carColor;
      if (carColor === 'RAINBOW') {
          const hue = (Date.now() / 5) % 360;
          primaryColor = `hsl(${hue}, 100%, 50%)`;
      }
      
      // Kart Body
      ctx.fillStyle = player.hasFirePower ? '#ffffff' : primaryColor; 
      // Main Chassis
      ctx.beginPath(); 
      ctx.moveTo(-25, 5);
      ctx.lineTo(-25, -5);
      ctx.lineTo(10, -5);
      ctx.lineTo(25, 10);
      ctx.lineTo(25, 15);
      ctx.lineTo(-20, 15);
      ctx.fill();

      // Stripe/Decal
      if (player.hasFirePower) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(-20, 0, 30, 4);
      } 

      // Engine Pipe
      ctx.fillStyle = '#555';
      ctx.fillRect(-28, 5, 5, 5);

      // Character Head
      ctx.fillStyle = player.hasFirePower ? '#ffffff' : primaryColor;
      ctx.beginPath(); ctx.arc(-5, -12, 10, 0, Math.PI*2); ctx.fill();
      // Face
      ctx.fillStyle = '#ffccaa'; // Skin
      ctx.beginPath(); ctx.arc(-2, -12, 7, 0, Math.PI*2); ctx.fill();
      // Cap Visor
      ctx.fillStyle = player.hasFirePower ? '#ffffff' : primaryColor;
      ctx.fillRect(0, -18, 10, 4);

      // Animated Wheels
      const wheelOffset = (Date.now() / 50) % Math.PI*2;
      const drawWheel = (wx: number, wy: number) => {
          ctx.save();
          ctx.translate(wx, wy);
          ctx.rotate(wheelOffset);
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 2;
          ctx.beginPath(); 
          ctx.moveTo(-9, 0); ctx.lineTo(9, 0);
          ctx.moveTo(0, -9); ctx.lineTo(0, 9);
          ctx.stroke();
          ctx.restore();
      };

      drawWheel(-18, 15);
      drawWheel(18, 15);
      
      ctx.restore();
  }

  private drawObstacle(obs: Obstacle) {
      const { ctx, theme } = this;
      if (obs.type === ObstacleType.PIPE) {
          ctx.fillStyle = theme.PIPE;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          // Top cap
          ctx.fillStyle = theme.PIPE;
          ctx.fillRect(obs.x - 6, obs.y, obs.width + 12, 35);
          ctx.strokeRect(obs.x - 6, obs.y, obs.width + 12, 35);
          // Highlight
          ctx.fillStyle = theme.PIPE_HIGHLIGHT;
          ctx.fillRect(obs.x + 8, obs.y + 4, 6, 25); // Cap highlight
          ctx.fillRect(obs.x + 8, obs.y + 40, 6, obs.height - 40); // Body highlight
      } else if (obs.type === ObstacleType.GOOMBA) {
          // Mushroom Shape
          const cx = obs.x + obs.width/2;
          const cy = obs.y + obs.height/2;
          
          // Feet (walking animation)
          const walk = Math.sin(Date.now() / 100) * 5;
          ctx.fillStyle = 'black';
          ctx.beginPath(); ctx.ellipse(cx - 10, obs.y + obs.height - 2 + walk, 8, 5, 0, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + 10, obs.y + obs.height - 2 - walk, 8, 5, 0, 0, Math.PI*2); ctx.fill();

          // Head
          ctx.fillStyle = '#8B4513'; // Brown
          ctx.beginPath();
          ctx.moveTo(cx - 15, obs.y + obs.height - 5);
          ctx.bezierCurveTo(obs.x - 5, obs.y - 10, obs.x + obs.width + 5, obs.y - 10, cx + 15, obs.y + obs.height - 5);
          ctx.fill();

          // Stem
          ctx.fillStyle = '#CD853F';
          ctx.fillRect(cx - 8, obs.y + obs.height/2, 16, 15);

          // Face
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.arc(cx - 6, cy + 5, 4, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + 6, cy + 5, 4, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'black';
          ctx.beginPath(); ctx.arc(cx - 5, cy + 5, 1.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx + 5, cy + 5, 1.5, 0, Math.PI*2); ctx.fill();
          
          // Eyebrows
          ctx.strokeStyle = 'black'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 2, cy + 3); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 2, cy + 3); ctx.stroke();

      } else if (obs.type === ObstacleType.BLOCK) {
          ctx.fillStyle = theme.BLOCK;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.lineWidth = 2; ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          // Brick pattern
          ctx.fillStyle = theme.BRICK_LINES;
          ctx.fillRect(obs.x, obs.y+10, obs.width, 2);
          ctx.fillRect(obs.x, obs.y+30, obs.width, 2);
          ctx.fillRect(obs.x+20, obs.y, 2, 10);
          ctx.fillRect(obs.x+10, obs.y+10, 2, 20);
          ctx.fillRect(obs.x+30, obs.y+30, 2, 15);
      } else if (obs.type === ObstacleType.QUESTION_BLOCK) {
          ctx.fillStyle = obs.isUsed ? '#8B4513' : '#F8931D';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fillRect(obs.x + 36, obs.y, 4, 40);
          ctx.fillRect(obs.x, obs.y + 36, 40, 4);

          if (!obs.isUsed) {
             ctx.fillStyle = '#5A2E03';
             ctx.font = 'bold 24px "Courier New"';
             ctx.fillText('?', obs.x + 13, obs.y + 32);
             // Blinking dots
             if (Math.floor(Date.now() / 200) % 2 === 0) {
                 ctx.fillStyle = '#FFD700';
                 ctx.fillRect(obs.x+2, obs.y+2, 4, 4);
                 ctx.fillRect(obs.x+34, obs.y+2, 4, 4);
                 ctx.fillRect(obs.x+2, obs.y+34, 4, 4);
                 ctx.fillRect(obs.x+34, obs.y+34, 4, 4);
             }
          }
      } else if (obs.type === ObstacleType.FIRE_FLOWER) {
          // Dynamic bouncing item
          const cx = obs.x + 15;
          const cy = obs.y + 15;
          
          ctx.fillStyle = '#00aa00'; // Leaves
          ctx.beginPath(); ctx.ellipse(cx-8, cy+8, 6, 3, -0.5, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx+8, cy+8, 6, 3, 0.5, 0, Math.PI*2); ctx.fill();

          ctx.fillStyle = '#FF4500'; // Flower outer
          ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#FFFF00'; // Flower inner
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill();
          
          // Eyes
          ctx.fillStyle = 'black';
          ctx.fillRect(cx-3, cy-2, 2, 4);
          ctx.fillRect(cx+1, cy-2, 2, 4);

      } else if (obs.type === ObstacleType.SHELL) {
          ctx.fillStyle = '#00aa00'; // Green Shell
          ctx.beginPath(); ctx.arc(obs.x+20, obs.y+20, 15, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#ffffff'; // Rim
          ctx.fillRect(obs.x+5, obs.y+20, 30, 8);
          // Boots
          ctx.fillStyle = 'yellow';
          const walk = Math.sin(Date.now() / 80) * 3;
          ctx.beginPath(); ctx.arc(obs.x+10 + walk, obs.y+30, 6, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(obs.x+30 - walk, obs.y+30, 6, 0, Math.PI*2); ctx.fill();

      } else if (obs.type === ObstacleType.PIRANHA) {
          // Pipe base
          ctx.fillStyle = theme.PIPE;
          ctx.fillRect(obs.x + 10, obs.y + 30, 30, 50);
          ctx.strokeRect(obs.x + 10, obs.y + 30, 30, 50);
          
          // Head
          const bite = Math.sin(Date.now() / 150) * 5;
          ctx.fillStyle = '#ff0000';
          ctx.beginPath(); ctx.arc(obs.x+25, obs.y+20, 18, 0, Math.PI*2); ctx.fill();
          // Mouth
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.moveTo(obs.x+25, obs.y+20); ctx.lineTo(obs.x+40, obs.y+10 - bite); ctx.lineTo(obs.x+40, obs.y+30 + bite); ctx.fill();
          // Spots
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.arc(obs.x+18, obs.y+15, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(obs.x+20, obs.y+28, 3, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(obs.x+30, obs.y+12, 3, 0, Math.PI*2); ctx.fill();
      } else if (obs.type === ObstacleType.COIN) {
          const time = Date.now() / 150;
          const widthScale = Math.abs(Math.cos(time));
          const cx = obs.x + obs.width/2;
          const cy = obs.y + obs.height/2;
          
          ctx.fillStyle = '#FFD700';
          ctx.beginPath(); ctx.ellipse(cx, cy, (obs.width/2) * widthScale, obs.height/2, 0, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = '#DAA520';
          ctx.stroke();
          ctx.fillStyle = '#DAA520';
          ctx.fillRect(cx - 2 * widthScale, cy - 8, 4 * widthScale, 16);
      }
  }

  private drawBoss(boss: Boss) {
      const { ctx } = this;
      const x = boss.x;
      const y = boss.y;
      const w = boss.width;
      const h = boss.height;
      const cx = x + w/2;
      const cy = y + h/2;

      // Float animation
      const hover = Math.sin(Date.now() / 300) * 15;
      const drawY = y + hover;

      // Shell (Koopa style)
      ctx.fillStyle = '#006400';
      ctx.beginPath(); ctx.arc(cx, drawY + h/2, 50, 0, Math.PI*2); ctx.fill();
      // Spikes
      ctx.fillStyle = '#dddddd';
      ctx.beginPath(); ctx.moveTo(cx, drawY+h/2 - 50); ctx.lineTo(cx-10, drawY+h/2-70); ctx.lineTo(cx+10, drawY+h/2-70); ctx.fill();
      
      // Body (Cat + Bowser)
      ctx.fillStyle = '#FFA500'; // Orange
      ctx.beginPath(); ctx.ellipse(cx, drawY + h/2, 40, 50, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFF5E1'; // Belly
      ctx.beginPath(); ctx.ellipse(cx, drawY + h/2 + 10, 25, 35, 0, 0, Math.PI*2); ctx.fill();

      // Head
      ctx.fillStyle = '#FFA500';
      ctx.beginPath(); ctx.arc(cx, drawY + 40, 35, 0, Math.PI*2); ctx.fill();

      // Hair/Mane
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.moveTo(cx-10, drawY+10); ctx.lineTo(cx, drawY-20); ctx.lineTo(cx+10, drawY+10); ctx.fill();

      // Ears (Cat)
      ctx.fillStyle = '#FFA500';
      ctx.beginPath(); ctx.moveTo(cx-25, drawY+20); ctx.lineTo(cx-35, drawY-10); ctx.lineTo(cx-10, drawY+15); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+25, drawY+20); ctx.lineTo(cx+35, drawY-10); ctx.lineTo(cx+10, drawY+15); ctx.fill();

      // Horns (Bowser)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(cx-15, drawY+20); ctx.lineTo(cx-20, drawY+5); ctx.lineTo(cx-5, drawY+20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+15, drawY+20); ctx.lineTo(cx+20, drawY+5); ctx.lineTo(cx+5, drawY+20); ctx.fill();

      // Face
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.ellipse(cx-10, drawY+35, 8, 10, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+10, drawY+35, 8, 10, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'red';
      ctx.beginPath(); ctx.arc(cx-10, drawY+35, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+10, drawY+35, 3, 0, Math.PI*2); ctx.fill();

      // Snout
      ctx.fillStyle = '#FFE4B5';
      ctx.beginPath(); ctx.ellipse(cx, drawY+50, 15, 12, 0, 0, Math.PI*2); ctx.fill();
      // Teeth
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.moveTo(cx-8, drawY+50); ctx.lineTo(cx-5, drawY+58); ctx.lineTo(cx-2, drawY+50); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+8, drawY+50); ctx.lineTo(cx+5, drawY+58); ctx.lineTo(cx+2, drawY+50); ctx.fill();

      // Health Bar
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 20, drawY - 20, 140, 10);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 22, drawY - 18, 136 * (boss.hp / boss.maxHp), 6);
  }

  private drawClouds() {
      const { ctx, canvas, frameCount, theme } = this;
      const speed = 0.5;
      const offset = (frameCount * speed) % canvas.width;
      
      ctx.fillStyle = theme.CLOUD;
      const drawCloud = (x: number, y: number, s: number) => {
          ctx.beginPath();
          ctx.arc(x, y, 30*s, 0, Math.PI*2);
          ctx.arc(x+25*s, y-10*s, 35*s, 0, Math.PI*2);
          ctx.arc(x+50*s, y, 30*s, 0, Math.PI*2);
          ctx.fill();
      };

      drawCloud(100 - offset, 100, 1);
      drawCloud(400 - offset, 150, 0.8);
      drawCloud(700 - offset, 80, 1.2);
      drawCloud(100 - offset + canvas.width, 100, 1); // Loop
  }

  private drawHills() {
       const { ctx, canvas, frameCount, theme } = this;
       const offset = (this.distance * 0.2) % canvas.width;
       
       // Back Hills
       ctx.fillStyle = theme.HILL_DARK;
       for(let i = -1; i < 3; i++) {
           const x = i * 400 - offset;
           ctx.beginPath();
           ctx.ellipse(x + 200, canvas.height - GROUND_HEIGHT, 250, 200, 0, Math.PI, 0);
           ctx.fill();
       }

       // Front Hills with eyes
       ctx.fillStyle = theme.HILL_LIGHT;
       for(let i = -1; i < 3; i++) {
           const x = i * 600 - (this.distance * 0.5) % 600;
           ctx.beginPath();
           ctx.ellipse(x + 300, canvas.height - GROUND_HEIGHT, 200, 100, 0, Math.PI, 0);
           ctx.fill();
           
           // Hill Eyes
           ctx.fillStyle = '#0d401a';
           ctx.fillRect(x+280, canvas.height - GROUND_HEIGHT - 60, 10, 20);
           ctx.fillRect(x+310, canvas.height - GROUND_HEIGHT - 60, 10, 20);
           ctx.fillStyle = theme.HILL_LIGHT;
       }
  }

  private drawCaveBackground() {
      const { ctx, canvas, theme } = this;
      // Roof stalactites
      ctx.fillStyle = theme.GROUND;
      for (let i = 0; i < canvas.width; i+=40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i+20, Math.random() * 50 + 20);
          ctx.lineTo(i+40, 0);
          ctx.fill();
      }
      // Background Rocks
      ctx.fillStyle = '#2a2a3e';
      ctx.beginPath(); ctx.arc(200, 300, 100, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(600, 200, 150, 0, Math.PI*2); ctx.fill();
  }

  private drawCastleBackground() {
      const { ctx, canvas, theme } = this;
      // Pillars
      ctx.fillStyle = '#1a0505';
      const offset = (this.distance * 0.2) % 300;
      for(let i = 0; i < 4; i++) {
          ctx.fillRect(i * 300 - offset, 100, 60, canvas.height);
      }
      // Lava glow
      const glow = Math.sin(Date.now()/500) * 0.2 + 0.5;
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - 150);
      gradient.addColorStop(0, `rgba(255, 69, 0, ${glow})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
  }

  private drawGround() {
      const { ctx, canvas, theme } = this;
      // Ground Top
      ctx.fillStyle = theme.GROUND;
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
      
      // Grass/Detail line
      ctx.fillStyle = theme.GROUND_DETAIL;
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 15);

      // Checkered Dirt Pattern
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      const patternSize = 20;
      const move = (this.distance) % patternSize;
      
      for (let x = -move; x < canvas.width; x += patternSize) {
          for (let y = canvas.height - GROUND_HEIGHT + 15; y < canvas.height; y += patternSize) {
              if ((Math.floor(x/patternSize) + Math.floor(y/patternSize)) % 2 === 0) {
                  ctx.fillRect(x, y, patternSize/2, patternSize/2);
              }
          }
      }
  }
}
