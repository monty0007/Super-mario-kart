import { GameState, Player, Obstacle, LevelConfig, Boss, Projectile, ObstacleType, LevelTheme } from "../types";
import { GRAVITY, JUMP_FORCE, GROUND_HEIGHT, GAME_SPEED_INITIAL, ENTITY_CONFIG, SPEED_INCREMENT, THEMES, ASSETS, DIFFICULTY_SETTINGS } from "../constants";
import { Physics } from "./Physics";
import { InputManager } from "./InputManager";
import { GameRenderer } from "./Renderer";

type StateCallback = (state: GameState) => void;
type ScoreCallback = (score: number) => void;
type AnnounceCallback = (message: string) => void;

export class GameEngine {
  private canvas: HTMLCanvasElement;
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
  private renderer: GameRenderer;
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
    
    this.renderer = new GameRenderer(canvas, context);
    this.onStateChange = onStateChange;
    this.onScoreUpdate = onScoreUpdate;
    this.onAnnounce = onAnnounce;
    this.input = new InputManager();

    // Mouse Listener for clicking blocks
    this.canvas.addEventListener('mousedown', this.handleMouseClick);

    this.player = this.createInitialPlayer();
    this.boss = this.createInitialBoss();
  }

  private handleMouseClick = (e: MouseEvent) => {
     if (this.gameState !== GameState.PLAYING) return;
     
     const rect = this.canvas.getBoundingClientRect();
     const scaleX = this.canvas.width / rect.width;
     const scaleY = this.canvas.height / rect.height;
     const x = (e.clientX - rect.left) * scaleX;
     const y = (e.clientY - rect.top) * scaleY;
     
     // Check for clicks on Question Blocks
     for (const obs of this.obstacles) {
         if (obs.type === ObstacleType.QUESTION_BLOCK && !obs.isUsed) {
             if (x >= obs.x && x <= obs.x + obs.width && y >= obs.y && y <= obs.y + obs.height) {
                 this.activateBlock(obs);
             }
         }
     }
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
    this.canvas.removeEventListener('mousedown', this.handleMouseClick);
  }

  private reset() {
    this.player = this.createInitialPlayer();
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
    
    // Determine current theme name key
    let themeKey: LevelTheme = 'OVERWORLD';
    if (this.levelData?.theme) themeKey = this.levelData.theme;

    this.renderer.draw(
        themeKey,
        this.distance,
        this.player,
        this.obstacles,
        this.boss,
        this.projectiles,
        this.enemyProjectiles,
        this.carColor,
        this.frameCount
    );

    this.frameCount++;
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    const settings = this.getDifficultySettings();

    // 1. Input & Physics
    this.handlePlayerMovement();

    // 2. Game Speed
    const maxSpeed = settings.maxSpeed;
    const accel = SPEED_INCREMENT * settings.speedMult;
    this.gameSpeed = Math.min(this.gameSpeed + accel, maxSpeed);
    this.distance += this.gameSpeed;

    // 3. Spawning
    this.handleSpawning(settings);

    // 4. Entity Updates
    this.updateEntities();

    // 5. Collisions
    this.handleCollisions();
  }

  private handlePlayerMovement() {
      // Horizontal
      if (this.input.isActionActive('LEFT')) this.player.x -= 9; 
      if (this.input.isActionActive('RIGHT')) this.player.x += 9;
      this.player.x = Math.max(0, Math.min(this.player.x, this.canvas.width - this.player.width));

      // Jump
      if (this.input.isActionActive('JUMP') && this.player.isGrounded) {
         this.player.vy = JUMP_FORCE;
         this.player.isGrounded = false;
         this.player.rotation = -35;
      }
  
      // Fast Fall
      if (this.input.isActionActive('DOWN') && !this.player.isGrounded) {
         this.player.vy += 2.5;
      }
      
      // Gravity
      this.player.vy += GRAVITY;
      this.player.y += this.player.vy;
  
      // Ground Collision
      const groundY = this.canvas.height - GROUND_HEIGHT - this.player.height;
      if (this.player.y > groundY) {
        this.player.y = groundY;
        this.player.vy = 0;
        this.player.isGrounded = true;
        this.player.rotation = 0;
      } else {
        this.player.isGrounded = false;
        if (this.player.vy > 0 && this.player.rotation < 25) {
            this.player.rotation += 3;
        }
      }

      // Shoot
      if (this.input.isActionActive('SHOOT') && this.player.hasFirePower) {
        if (this.projectiles.length < 5) {
            this.spawnProjectile();
        }
   }
  }

  private spawnProjectile() {
     const now = Date.now();
     const lastP = this.projectiles[this.projectiles.length-1];
     if (lastP && (now - parseInt(lastP.id) < 150)) return;

     this.projectiles.push({
         x: this.player.x + this.player.width,
         y: this.player.y + this.player.height / 2,
         width: ENTITY_CONFIG.PROJECTILE.WIDTH,
         height: ENTITY_CONFIG.PROJECTILE.HEIGHT,
         vx: ENTITY_CONFIG.PROJECTILE.SPEED,
         vy: -10, 
         id: now.toString()
     });
  }

  private handleSpawning(settings: { spawnRate: number, gapMult: number }) {
     if (this.distance > ENTITY_CONFIG.BOSS.SPAWN_DISTANCE && !this.boss.active && !this.boss.defeated) {
         this.boss.active = true;
         this.boss.x = this.canvas.width + 100;
         this.boss.y = 100;
         this.onAnnounce("Warning! Meowser approaching!");
         
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

     if (this.boss.active) return;

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

      if (this.boss.active) {
          if (this.boss.x > this.canvas.width - 250) this.boss.x -= 2;
          this.boss.y += this.boss.vy;
          if (this.boss.y < 50) this.boss.vy = Math.abs(this.boss.vy);
          if (this.boss.y > 350) this.boss.vy = -Math.abs(this.boss.vy);
          
          this.boss.shootTimer--;
          if (this.boss.shootTimer <= 0) {
              this.boss.shootTimer = ENTITY_CONFIG.BOSS.SHOOT_INTERVAL;
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

      this.obstacles.forEach(obs => {
          obs.x -= this.gameSpeed;
          if (obs.type === ObstacleType.GOOMBA) obs.x -= 2;
          if (obs.type === ObstacleType.SHELL) obs.x -= 4;

          // Powerup Physics
          if (obs.type === ObstacleType.FIRE_FLOWER && obs.vx !== undefined && obs.vx !== 0) {
             obs.vy = (obs.vy || 0) + GRAVITY;
             obs.y += obs.vy;
             if (obs.y + obs.height > groundY) {
                 obs.y = groundY - obs.height;
                 obs.vy = 0; 
             }
             for (const other of this.obstacles) {
                 if (other === obs || !this.isSolid(other.type)) continue;
                 if (Physics.checkCollision(obs, other)) {
                      if (obs.vy! >= 0 && obs.y + obs.height - obs.vy! <= other.y + 20) {
                          obs.y = other.y - obs.height;
                          obs.vy = 0;
                      }
                 }
             }
             obs.x += obs.vx;
             for (const other of this.obstacles) {
                 if (other === obs || !this.isSolid(other.type)) continue;
                 if (Physics.checkCollision(obs, other)) {
                     obs.vx = -obs.vx; 
                     if (obs.vx > 0) obs.x = other.x + other.width + 1;
                     else obs.x = other.x - obs.width - 1;
                 }
             }
          }
      });
      this.obstacles = this.obstacles.filter(o => o.x + o.width > -200);

      this.projectiles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY; 
          if (p.y > groundY - p.height) {
             p.y = groundY - p.height;
             p.vy = -8; 
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

      for (const obs of this.obstacles) {
          if (obs.passed) continue;
          if (Physics.checkCollision(player, obs, 4)) {
              if (obs.type === ObstacleType.COIN) {
                  this.score += 50;
                  this.onScoreUpdate(this.score);
                  obs.passed = true;
                  obs.y = -1000;
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
                  this.triggerGameOver();
                  return;
              }
          }
      }

      this.projectiles.forEach(proj => {
          if (this.boss.active && Physics.checkCollision(proj, this.boss)) {
              this.boss.hp--;
              proj.y = 1000; 
              this.boss.x += 15; 
              if (this.boss.hp <= 0) {
                  this.triggerVictory();
              }
          }
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

      this.enemyProjectiles.forEach(proj => {
          if (Physics.checkCollision(player, proj, 8)) {
              this.triggerGameOver();
          }
      });
  }

  private resolveSolidCollision(obs: Obstacle) {
     if (Physics.isVerticalCollision(this.player, obs)) {
         if (this.player.vy >= 0 && this.player.y + this.player.height - this.player.vy <= obs.y + 20) {
             this.player.y = obs.y - this.player.height;
             this.player.vy = 0;
             this.player.isGrounded = true;
         } else if (this.player.vy < 0) {
             this.player.y = obs.y + obs.height;
             this.player.vy = 2; 
             this.activateBlock(obs);
         }
     } else {
         if (this.player.x < obs.x) this.player.x = obs.x - this.player.width;
         else this.player.x = obs.x + obs.width;
     }
  }

  private activateBlock(obs: Obstacle) {
      if (obs.type === ObstacleType.QUESTION_BLOCK && !obs.isUsed) {
          obs.isUsed = true;
          this.obstacles.push({
              type: ObstacleType.FIRE_FLOWER,
              x: obs.x + 8,
              y: obs.y - 32,
              width: 30, 
              height: 30, 
              id: 'spawn_' + Date.now(),
              vx: 2.5, 
              vy: -6   
          });
          this.score += 50;
          this.onScoreUpdate(this.score);
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
}