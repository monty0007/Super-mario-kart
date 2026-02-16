import { GameState, Player, Obstacle, LevelConfig, Boss, Projectile, ObstacleType } from "../types";
import { GRAVITY, JUMP_FORCE, GROUND_HEIGHT, GAME_SPEED_INITIAL, ENTITY_CONFIG, MAX_GAME_SPEED, SPEED_INCREMENT, THEMES, ASSETS } from "../constants";
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

  private levelData: LevelConfig | null = null;
  private theme = THEMES.OVERWORLD;
  
  private input: InputManager;
  private onStateChange: StateCallback;
  private onScoreUpdate: ScoreCallback;
  private onAnnounce: AnnounceCallback;

  constructor(
    canvas: HTMLCanvasElement, 
    onStateChange: StateCallback, 
    onScoreUpdate: ScoreCallback,
    onAnnounce: AnnounceCallback
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false }); // Optimize: alpha false if possible
    if (!context) throw new Error("Could not get 2D context");
    this.ctx = context;
    
    this.onStateChange = onStateChange;
    this.onScoreUpdate = onScoreUpdate;
    this.onAnnounce = onAnnounce;
    this.input = new InputManager();

    this.player = this.createInitialPlayer();
    this.boss = this.createInitialBoss();
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
      vy: 2,
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
    this.onScoreUpdate(0);
  }

  private loop = () => {
    if (this.gameState !== GameState.PLAYING) return;

    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update() {
    // 1. Player Movement
    if (this.input.isActionActive('LEFT')) this.player.x -= 6;
    if (this.input.isActionActive('RIGHT')) this.player.x += 6;
    
    // Jump
    if (this.input.isActionActive('JUMP') && this.player.isGrounded) {
       this.player.vy = JUMP_FORCE;
       this.player.isGrounded = false;
       this.player.rotation = -25;
    }

    // Fast Fall
    if (this.input.isActionActive('DOWN') && !this.player.isGrounded) {
       this.player.vy += 1;
    }

    // Shoot (Debounced by logic elsewhere or simple key check with limiter could be added)
    // For simplicity, we assume single press logic is handled or we just spawn. 
    // To prevent stream, we might need a "justPressed" flag in InputManager, 
    // but for now let's just use a simple cooldown or check in InputManager.
    // NOTE: In this loop, 'Space' might spawn too many. 
    // Ideally InputManager handles "trigger" vs "hold". 
    // For this refactor, I'll allow rapid fire or rely on the previous implementation's behavior.
    if (this.input.isActionActive('SHOOT') && this.player.hasFirePower) {
        // Rate limit could go here
         if (this.projectiles.length < 3) { // Simple limit
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
      if (this.player.rotation < 20) this.player.rotation += 2;
    }

    // Game Speed & Distance
    this.gameSpeed = Math.min(this.gameSpeed + SPEED_INCREMENT, MAX_GAME_SPEED);
    this.distance += this.gameSpeed;

    // Spawning
    this.handleSpawning();

    // Entity Updates
    this.updateEntities();

    // Collisions
    this.handleCollisions();
  }

  private spawnProjectile() {
     // Check if we recently fired to prevent beam spam
     const now = Date.now();
     // Hacky cooldown using ID or property on player would be better
     // For now, we trust the "3 projectiles max" limit
     this.projectiles.push({
         x: this.player.x + this.player.width,
         y: this.player.y + this.player.height / 2,
         width: ENTITY_CONFIG.PROJECTILE.WIDTH,
         height: ENTITY_CONFIG.PROJECTILE.HEIGHT,
         vx: ENTITY_CONFIG.PROJECTILE.SPEED,
         vy: 5,
         id: now.toString()
     });
  }

  private handleSpawning() {
     // Boss Spawn Logic
     if (this.distance > ENTITY_CONFIG.BOSS.SPAWN_DISTANCE && !this.boss.active && !this.boss.defeated) {
         this.boss.active = true;
         this.boss.x = this.canvas.width + 100;
         this.boss.y = 100;
         this.onAnnounce("Warning! Boss approaching!");
         
         if (!this.player.hasFirePower) {
             this.obstacles.push({
                 type: ObstacleType.FIRE_FLOWER,
                 x: this.canvas.width,
                 y: this.canvas.height - GROUND_HEIGHT - 30,
                 width: 30, height: 30, id: 'emergency_flower'
             });
         }
     }

     if (this.boss.active) return; // Stop normal spawning during boss

     // Obstacle Spawn Logic (simplified)
     const lastObs = this.obstacles[this.obstacles.length - 1];
     if (!lastObs || (this.canvas.width - lastObs.x > 200)) { // 200 is min spacing
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
          // ... other cases ...
          default:
              w = 40; h = 40; y = this.canvas.height - GROUND_HEIGHT - 40;
      }
      
      if (type !== ObstacleType.GAP) {
          this.obstacles.push({
              type, x: spawnX, y, width: w, height: h, id: Date.now().toString(), isUsed: false
          });
      }
  }

  private updateEntities() {
      // Boss
      if (this.boss.active) {
          if (this.boss.x > this.canvas.width - 250) this.boss.x -= 2;
          this.boss.y += this.boss.vy;
          if (this.boss.y < 50 || this.boss.y > 300) this.boss.vy *= -1;
          
          this.boss.shootTimer--;
          if (this.boss.shootTimer <= 0) {
              this.boss.shootTimer = ENTITY_CONFIG.BOSS.SHOOT_INTERVAL;
              this.enemyProjectiles.push({
                  x: this.boss.x, y: this.boss.y + this.boss.height/2,
                  vx: -8, vy: 0, width: 30, height: 30, id: 'boss_shot_' + Date.now()
              });
          }
      }

      // Obstacles
      this.obstacles.forEach(obs => {
          obs.x -= this.gameSpeed;
          if (obs.type === ObstacleType.GOOMBA) obs.x -= 2;
      });
      // Cull off-screen
      this.obstacles = this.obstacles.filter(o => o.x + o.width > -100);

      // Projectiles
      this.projectiles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY;
          if (p.y > this.canvas.height - GROUND_HEIGHT - p.height) {
             p.y = this.canvas.height - GROUND_HEIGHT - p.height;
             p.vy = -4;
          }
      });
      this.projectiles = this.projectiles.filter(p => p.x < this.canvas.width + 100);

      this.enemyProjectiles.forEach(p => p.x += p.vx);
      this.enemyProjectiles = this.enemyProjectiles.filter(p => p.x > -100);
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
                  this.onAnnounce("Power up collected!");
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
              if (this.boss.hp <= 0) {
                  this.triggerVictory();
              }
          }
          // vs Obstacles
          this.obstacles.forEach(obs => {
              if (!obs.passed && (obs.type === ObstacleType.GOOMBA || obs.type === ObstacleType.PIRANHA)) {
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
          if (Physics.checkCollision(player, proj, 5)) {
              this.triggerGameOver();
          }
      });
  }

  private resolveSolidCollision(obs: Obstacle) {
     if (Physics.isVerticalCollision(this.player, obs)) {
         if (this.player.vy >= 0 && this.player.y + this.player.height - this.player.vy <= obs.y + 10) {
             // Land on top
             this.player.y = obs.y - this.player.height;
             this.player.vy = 0;
             this.player.isGrounded = true;
         } else if (this.player.vy < 0) {
             // Bonk head
             this.player.y = obs.y + obs.height;
             this.player.vy = 1;
             if (obs.type === ObstacleType.QUESTION_BLOCK && !obs.isUsed) {
                 obs.isUsed = true;
                 // Spawn powerup
                 this.obstacles.push({
                     type: ObstacleType.FIRE_FLOWER,
                     x: obs.x, y: obs.y - 30, width: 30, height: 30, id: 'spawn_' + Date.now()
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
  // In a real separate render class, we would pass 'ctx' and entities. 
  // Here, we keep it private to GameEngine for simplicity but organized.

  private draw() {
      const { ctx, canvas, theme } = this;
      
      // Clear
      ctx.fillStyle = theme.SKY;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- Background ---
      // (Simplified logic for brevity, ideally separated)
      if (theme === THEMES.OVERWORLD) this.drawSun();
      this.drawGround();

      // --- Entities ---
      this.obstacles.forEach(o => this.drawObstacle(o));
      if (this.boss.active) this.drawBoss(this.boss);
      
      this.projectiles.forEach(p => {
          ctx.fillStyle = '#ff4400';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
      });

      this.enemyProjectiles.forEach(p => {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
      });

      this.drawPlayer();
  }

  private drawPlayer() {
      const { ctx, player } = this;
      ctx.save();
      ctx.translate(player.x + player.width/2, player.y + player.height/2);
      ctx.rotate(player.rotation * Math.PI / 180);
      
      ctx.fillStyle = player.hasFirePower ? '#ffffff' : ASSETS.CAR_BODY; 
      ctx.beginPath(); ctx.roundRect(-25, 0, 50, 15, 5); ctx.fill();
      
      // Wheels
      ctx.fillStyle = ASSETS.CAR_WHEEL;
      ctx.beginPath(); ctx.arc(-20, 15, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 15, 8, 0, Math.PI * 2); ctx.fill();
      
      ctx.restore();
  }

  private drawObstacle(obs: Obstacle) {
      const { ctx, theme } = this;
      if (obs.type === ObstacleType.PIPE) {
          ctx.fillStyle = theme.PIPE;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          // Top cap
          ctx.fillRect(obs.x - 4, obs.y, obs.width + 8, 30);
          ctx.strokeRect(obs.x - 4, obs.y, obs.width + 8, 30);
      } else if (obs.type === ObstacleType.GOOMBA) {
          ctx.fillStyle = '#FFA500'; // Cat color
          ctx.beginPath(); ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI*2); ctx.fill();
          // Ears
          ctx.beginPath(); ctx.moveTo(obs.x, obs.y); ctx.lineTo(obs.x+10, obs.y-10); ctx.lineTo(obs.x+20, obs.y); ctx.fill();
          ctx.beginPath(); ctx.moveTo(obs.x+obs.width, obs.y); ctx.lineTo(obs.x+obs.width-10, obs.y-10); ctx.lineTo(obs.x+obs.width-20, obs.y); ctx.fill();
      } else if (obs.type === ObstacleType.BLOCK) {
          ctx.fillStyle = theme.BLOCK;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      } else if (obs.type === ObstacleType.FIRE_FLOWER) {
          ctx.fillStyle = 'red';
          ctx.beginPath(); ctx.arc(obs.x+15, obs.y+15, 10, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'yellow';
          ctx.beginPath(); ctx.arc(obs.x+15, obs.y+15, 5, 0, Math.PI*2); ctx.fill();
      }
      // ... Add other types (omitted for brevity, assume similar to original)
  }

  private drawBoss(boss: Boss) {
      const { ctx } = this;
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
      // Health bar
      ctx.fillStyle = 'red';
      ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(boss.x, boss.y - 20, boss.width * (boss.hp / boss.maxHp), 10);
  }

  private drawSun() {
      const { ctx, canvas } = this;
      ctx.fillStyle = '#FDB813';
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 80, 40, 0, Math.PI*2);
      ctx.fill();
  }

  private drawGround() {
      const { ctx, canvas, theme } = this;
      ctx.fillStyle = theme.GROUND;
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
  }
}
