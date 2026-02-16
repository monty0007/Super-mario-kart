import { Boss, Obstacle, Player, Projectile, LevelTheme, ObstacleType } from "../types";
import { GROUND_HEIGHT, ENTITY_CONFIG, THEMES, CAR_COLORS } from "../constants";

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public draw(
    themeName: LevelTheme,
    distance: number,
    player: Player,
    obstacles: Obstacle[],
    boss: Boss,
    projectiles: Projectile[],
    enemyProjectiles: Projectile[],
    carColor: string,
    frameCount: number
  ) {
    const theme = THEMES[themeName];

    // 1. Background
    this.drawBackground(theme, distance, frameCount);
    this.drawGround(theme, distance);

    // 2. Entities (Static then Dynamic)
    obstacles.forEach(o => this.drawObstacle(o, theme));
    
    if (boss.active) {
        this.drawBoss(boss);
    }

    // 3. Projectiles
    this.drawProjectiles(projectiles, enemyProjectiles);

    // 4. Player
    this.drawPlayer(player, carColor);
  }

  private drawBackground(theme: typeof THEMES.OVERWORLD, distance: number, frameCount: number) {
    this.ctx.fillStyle = theme.SKY;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (theme === THEMES.OVERWORLD) {
      this.drawClouds(theme, frameCount);
      this.drawHills(theme, distance);
    } else if (theme === THEMES.UNDERGROUND) {
      this.drawCaveBackground(theme);
    } else {
      this.drawCastleBackground(distance);
    }
  }

  private drawGround(theme: typeof THEMES.OVERWORLD, distance: number) {
    const { ctx, canvas } = this;
    // Ground Top
    ctx.fillStyle = theme.GROUND;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    
    // Grass/Detail line
    ctx.fillStyle = theme.GROUND_DETAIL;
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 15);

    // Checkered Dirt Pattern
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    const patternSize = 20;
    const move = (distance) % patternSize;
    
    for (let x = -move; x < canvas.width; x += patternSize) {
        for (let y = canvas.height - GROUND_HEIGHT + 15; y < canvas.height; y += patternSize) {
            if ((Math.floor(x/patternSize) + Math.floor(y/patternSize)) % 2 === 0) {
                ctx.fillRect(x, y, patternSize/2, patternSize/2);
            }
        }
    }
  }

  private drawClouds(theme: typeof THEMES.OVERWORLD, frameCount: number) {
    const { ctx, canvas } = this;
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

  private drawHills(theme: typeof THEMES.OVERWORLD, distance: number) {
     const { ctx, canvas } = this;
     const offset = (distance * 0.2) % canvas.width;
     
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
         const x = i * 600 - (distance * 0.5) % 600;
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

  private drawCaveBackground(theme: typeof THEMES.OVERWORLD) {
      const { ctx, canvas } = this;
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

  private drawCastleBackground(distance: number) {
      const { ctx, canvas } = this;
      // Pillars
      ctx.fillStyle = '#1a0505';
      const offset = (distance * 0.2) % 300;
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

  private drawObstacle(obs: Obstacle, theme: typeof THEMES.OVERWORLD) {
      const { ctx } = this;
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
          this.drawGoomba(obs);
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
          this.drawQuestionBlock(obs);
      } else if (obs.type === ObstacleType.FIRE_FLOWER) {
          this.drawFireFlower(obs);
      } else if (obs.type === ObstacleType.SHELL) {
          this.drawShell(obs);
      } else if (obs.type === ObstacleType.PIRANHA) {
          this.drawPiranha(obs, theme);
      } else if (obs.type === ObstacleType.COIN) {
          this.drawCoin(obs);
      }
  }

  private drawGoomba(obs: Obstacle) {
      const { ctx } = this;
      const cx = obs.x + obs.width/2;
      const cy = obs.y + obs.height/2;
      
      const walk = Math.sin(Date.now() / 100) * 5;
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.ellipse(cx - 10, obs.y + obs.height - 2 + walk, 8, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 10, obs.y + obs.height - 2 - walk, 8, 5, 0, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(cx - 15, obs.y + obs.height - 5);
      ctx.bezierCurveTo(obs.x - 5, obs.y - 10, obs.x + obs.width + 5, obs.y - 10, cx + 15, obs.y + obs.height - 5);
      ctx.fill();

      ctx.fillStyle = '#CD853F';
      ctx.fillRect(cx - 8, obs.y + obs.height/2, 16, 15);

      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(cx - 6, cy + 5, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 6, cy + 5, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath(); ctx.arc(cx - 5, cy + 5, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 5, cy + 5, 1.5, 0, Math.PI*2); ctx.fill();
      
      ctx.strokeStyle = 'black'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 2, cy + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 2, cy + 3); ctx.stroke();
  }

  private drawQuestionBlock(obs: Obstacle) {
      const { ctx } = this;
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
         if (Math.floor(Date.now() / 200) % 2 === 0) {
             ctx.fillStyle = '#FFD700';
             ctx.fillRect(obs.x+2, obs.y+2, 4, 4);
             ctx.fillRect(obs.x+34, obs.y+2, 4, 4);
             ctx.fillRect(obs.x+2, obs.y+34, 4, 4);
             ctx.fillRect(obs.x+34, obs.y+34, 4, 4);
         }
      }
  }

  private drawFireFlower(obs: Obstacle) {
      const { ctx } = this;
      const cx = obs.x + 15;
      const cy = obs.y + 15;
      
      ctx.fillStyle = '#00aa00'; 
      ctx.beginPath(); ctx.ellipse(cx-8, cy+8, 6, 3, -0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+8, cy+8, 6, 3, 0.5, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = '#FF4500'; 
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFFF00'; 
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.fill();
      
      ctx.fillStyle = 'black';
      ctx.fillRect(cx-3, cy-2, 2, 4);
      ctx.fillRect(cx+1, cy-2, 2, 4);
  }

  private drawShell(obs: Obstacle) {
      const { ctx } = this;
      ctx.fillStyle = '#00aa00';
      ctx.beginPath(); ctx.arc(obs.x+20, obs.y+20, 15, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(obs.x+5, obs.y+20, 30, 8);
      ctx.fillStyle = 'yellow';
      const walk = Math.sin(Date.now() / 80) * 3;
      ctx.beginPath(); ctx.arc(obs.x+10 + walk, obs.y+30, 6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(obs.x+30 - walk, obs.y+30, 6, 0, Math.PI*2); ctx.fill();
  }

  private drawPiranha(obs: Obstacle, theme: typeof THEMES.OVERWORLD) {
      const { ctx } = this;
      ctx.fillStyle = theme.PIPE;
      ctx.fillRect(obs.x + 10, obs.y + 30, 30, 50);
      ctx.strokeRect(obs.x + 10, obs.y + 30, 30, 50);
      
      const bite = Math.sin(Date.now() / 150) * 5;
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(obs.x+25, obs.y+20, 18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.moveTo(obs.x+25, obs.y+20); ctx.lineTo(obs.x+40, obs.y+10 - bite); ctx.lineTo(obs.x+40, obs.y+30 + bite); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(obs.x+18, obs.y+15, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(obs.x+20, obs.y+28, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(obs.x+30, obs.y+12, 3, 0, Math.PI*2); ctx.fill();
  }

  private drawCoin(obs: Obstacle) {
      const { ctx } = this;
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

  private drawBoss(boss: Boss) {
      const { ctx } = this;
      const x = boss.x;
      const y = boss.y;
      const w = boss.width;
      const h = boss.height;
      const cx = x + w/2;

      const hover = Math.sin(Date.now() / 300) * 15;
      const drawY = y + hover;

      ctx.fillStyle = '#006400';
      ctx.beginPath(); ctx.arc(cx, drawY + h/2, 50, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dddddd';
      ctx.beginPath(); ctx.moveTo(cx, drawY+h/2 - 50); ctx.lineTo(cx-10, drawY+h/2-70); ctx.lineTo(cx+10, drawY+h/2-70); ctx.fill();
      
      ctx.fillStyle = '#FFA500';
      ctx.beginPath(); ctx.ellipse(cx, drawY + h/2, 40, 50, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFF5E1';
      ctx.beginPath(); ctx.ellipse(cx, drawY + h/2 + 10, 25, 35, 0, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = '#FFA500';
      ctx.beginPath(); ctx.arc(cx, drawY + 40, 35, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.moveTo(cx-10, drawY+10); ctx.lineTo(cx, drawY-20); ctx.lineTo(cx+10, drawY+10); ctx.fill();

      ctx.fillStyle = '#FFA500';
      ctx.beginPath(); ctx.moveTo(cx-25, drawY+20); ctx.lineTo(cx-35, drawY-10); ctx.lineTo(cx-10, drawY+15); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+25, drawY+20); ctx.lineTo(cx+35, drawY-10); ctx.lineTo(cx+10, drawY+15); ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(cx-15, drawY+20); ctx.lineTo(cx-20, drawY+5); ctx.lineTo(cx-5, drawY+20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+15, drawY+20); ctx.lineTo(cx+20, drawY+5); ctx.lineTo(cx+5, drawY+20); ctx.fill();

      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.ellipse(cx-10, drawY+35, 8, 10, -0.2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+10, drawY+35, 8, 10, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'red';
      ctx.beginPath(); ctx.arc(cx-10, drawY+35, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+10, drawY+35, 3, 0, Math.PI*2); ctx.fill();

      ctx.fillStyle = '#FFE4B5';
      ctx.beginPath(); ctx.ellipse(cx, drawY+50, 15, 12, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.moveTo(cx-8, drawY+50); ctx.lineTo(cx-5, drawY+58); ctx.lineTo(cx-2, drawY+50); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+8, drawY+50); ctx.lineTo(cx+5, drawY+58); ctx.lineTo(cx+2, drawY+50); ctx.fill();

      ctx.fillStyle = '#000';
      ctx.fillRect(x + 20, drawY - 20, 140, 10);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 22, drawY - 18, 136 * (boss.hp / boss.maxHp), 6);
  }

  private drawPlayer(player: Player, carColor: string) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(player.x + player.width/2, player.y + player.height/2);
      ctx.rotate(player.rotation * Math.PI / 180);
      
      let primaryColor = carColor;
      if (carColor === 'RAINBOW') {
          const hue = (Date.now() / 5) % 360;
          primaryColor = `hsl(${hue}, 100%, 50%)`;
      }
      
      ctx.fillStyle = player.hasFirePower ? '#ffffff' : primaryColor; 
      ctx.beginPath(); 
      ctx.moveTo(-25, 5);
      ctx.lineTo(-25, -5);
      ctx.lineTo(10, -5);
      ctx.lineTo(25, 10);
      ctx.lineTo(25, 15);
      ctx.lineTo(-20, 15);
      ctx.fill();

      if (player.hasFirePower) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(-20, 0, 30, 4);
      } 

      ctx.fillStyle = '#555';
      ctx.fillRect(-28, 5, 5, 5);

      ctx.fillStyle = player.hasFirePower ? '#ffffff' : primaryColor;
      ctx.beginPath(); ctx.arc(-5, -12, 10, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffccaa';
      ctx.beginPath(); ctx.arc(-2, -12, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = player.hasFirePower ? '#ffffff' : primaryColor;
      ctx.fillRect(0, -18, 10, 4);

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

  private drawProjectiles(projectiles: Projectile[], enemyProjectiles: Projectile[]) {
      const { ctx } = this;
      projectiles.forEach(p => {
          ctx.fillStyle = '#ff4400';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#ffff00';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/3, 0, Math.PI*2); ctx.fill();
      });

      enemyProjectiles.forEach(p => {
          ctx.fillStyle = '#ff00aa';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/2, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = 'white';
          ctx.beginPath(); ctx.arc(p.x+p.width/2, p.y+p.height/2, p.width/4, 0, Math.PI*2); ctx.fill();
      });
  }
}
