// (Arquivo: gameWeb/js/sprites.js)

const globalArrowImage = new Image();
globalArrowImage.src =
  "./Sprite Pack 8/2 - Tracy/Arrow_Projectile (16 x 16).png";

// FUNCOES DE COLISAO
function collision({ object1, object2 }) {
  return (
    object1.position.y + object1.height >= object2.position.y &&
    object1.position.y <= object2.position.y + object2.height &&
    object1.position.x <= object2.position.x + object2.width &&
    object1.position.x + object1.width >= object2.position.x
  );
}

function platformCollision({ object1, object2 }) {
  return (
    object1.position.y + object1.height >= object2.position.y &&
    object1.position.y + object1.height <=
      object2.position.y + object2.height &&
    object1.position.x <= object2.position.x + object2.width &&
    object1.position.x + object1.width >= object2.position.x
  );
}

// Classe base
class Sprite {
  constructor({ position, imageSrc }) {
    this.position = position;
    this.loaded = false;
    this.image = new Image();
    this.image.onload = () => {
      this.width = this.image.width;
      this.height = this.image.height;
      this.loaded = true;
    };
    this.image.src = imageSrc;
    this.width = 0;
    this.height = 0;
  }

  draw(context) {
    if (this.image) {
      context.drawImage(this.image, this.position.x, this.position.y);
    }
  }
}

// Classe plataforma
class Platform {
  constructor({ position, image, cropbox }) {
    this.position = position;
    this.image = image;
    this.width = cropbox.width;
    this.height = cropbox.height;
    this.cropbox = cropbox;
  }

  draw(context) {
    if (this.image && this.image.complete) {
      context.drawImage(
        this.image,
        this.cropbox.x,
        this.cropbox.y,
        this.cropbox.width,
        this.cropbox.height,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
  }
}

// --- CLASSE PLAYER (MODIFICADA COM VIDAS) ---
class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 16;
    this.height = 16;
    this.isOnGround = false;
    this.gravity = 0.5;
    this.direction = 1; 

    // Vidas e Dano
    this.lives = 3;
    this.isDead = false;
    this.deathAnimationSpawned = false; 
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.invincibilityDuration = 100; 

    this.animations = {
      idle: {
        src: "./Sprite Pack 8/2 - Tracy/Idle_1 (32 x 32).png",
        frames: 5,
      },
      run: { src: "./Sprite Pack 8/2 - Tracy/Run (32 x 32).png", frames: 6 },
      jump: { src: "./Sprite Pack 8/2 - Tracy/Jump (32 x 32).png", frames: 1 },
      fall: {
        src: "./Sprite Pack 8/2 - Tracy/Falling (32 x 32).png",
        frames: 1,
      },
      attack: {
        src: "./Sprite Pack 8/2 - Tracy/Standing_Crossbow_Shot (32 x 32).png",
        frames: 4,
      },
      hurt: { 
        src: "./Sprite Pack 8/2 - Tracy/Hurt (32 x 32).png",
        frames: 1,
        interval: 100, 
      },
    };

    this.currentState = "idle";
    this.frameX = 0;
    this.frameTimer = 0;
    this.frameInterval = 10;
    
    this.frameWidth = 32;
    this.frameHeight = 32;

    this.cooldown = 0; 
    this.projectiles = []; 

    // Pre-carrega imagens
    this.images = {};
    for (let state in this.animations) {
      const animation = this.animations[state];
      this.images[state] = new Image();
      this.images[state].src = animation.src;
    }
    this.currentImage = this.images.idle;
    this.maxFrames = this.animations.idle.frames;

    this.hitbox = {
      position: this.position,
      width: this.width,
      height: this.height,
    };
  }

  switchState(state) {
    if (this.currentState === state) return;
    
    this.currentState = state;
    this.currentImage = this.images[state];
    if (!this.currentImage) {
      console.error(`Imagem nao encontrada: ${state}`);
      this.currentImage = this.images.idle; 
    }

    this.maxFrames = this.animations[state].frames;
    this.frameX = 0;
    this.frameTimer = 0;

    
    if (this.animations[state].interval) {
      this.frameInterval = this.animations[state].interval / 10; // Ajuste
    } else {
      this.frameInterval = 10; 
    }
  }

  applyGravity() {
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;
  }

  //  tomar dano
  takeDamage() {
    if (this.isInvincible || this.isDead) return;

    this.isInvincible = true;
    this.invincibilityTimer = this.invincibilityDuration;
    this.lives--;
    
    console.log("VIDAS RESTANTES: " + this.lives);

    if (this.lives <= 0) {
      this.die();
    } else {
      this.switchState('hurt');
      this.velocity.y = -5; 
      this.isOnGround = false;
    }
  }

  // Logica de morrer
  die() {
    this.isDead = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
    // O player vai ser escondido no 'draw'
  }

  move(input) {
    // Nao se move se estiver morto, tomando dano, ou atacando
    if (this.currentState === "attack" || this.currentState === "hurt" || this.isDead) {
      this.velocity.x = 0;
      return;
    }

    this.velocity.x = 0;
    if (input.left) {
      this.velocity.x = -2;
      this.direction = -1;
    } else if (input.right) {
      this.velocity.x = 2;
      this.direction = 1;
    }

    if (input.jump && this.isOnGround) {
      this.velocity.y = -8;
      this.isOnGround = false;
    }
    
    // Animacao de movimento
    if (!this.isOnGround) {
      if (this.velocity.y < 0) this.switchState("jump");
      else this.switchState("fall");
    } else if (this.velocity.x !== 0) {
      this.switchState("run");
    } else {
      this.switchState("idle");
    }
  }

  attack() {
    if (this.cooldown > 0 || this.currentState === 'hurt' || this.isDead) return;
    this.switchState("attack");
    this.cooldown = 50; 

    const arrow = new Projectile({
      position: {
        x: this.position.x + (this.direction === 1 ? this.width : -10),
        y: this.position.y + this.height / 2 - 4,
      },
      direction: this.direction,
      image: globalArrowImage, 
    });
    this.projectiles.push(arrow);
  }

  updateHitbox() {
    this.hitbox = {
      position: this.position,
      width: this.width,
      height: this.height,
    };
  }

  animate() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      
      if (this.currentState === "attack" && this.frameX === this.maxFrames - 1) {
        this.switchState("idle");
      } 
      
      else if (this.currentState === 'hurt' && this.frameX === this.maxFrames - 1) {
          
          if(this.frameTimer > 30) { 
             this.switchState('idle');
          }
      }

      this.frameX = (this.frameX + 1) % this.maxFrames;
      this.frameTimer = 0;
    }
  }

  draw(context) {
    // nao desenha se morreu
    if (this.isDead) return;
    
    const flip = this.direction === -1;

    context.save();
    
    
    if (this.isInvincible) {
      
      if (Math.floor(this.invincibilityTimer / 4) % 2 === 0) {
         context.globalAlpha = 0.5;
      }
    }
    
    if (flip) {
      context.scale(-1, 1);
      context.drawImage(
        this.currentImage,
        this.frameX * this.frameWidth, 0,
        this.frameWidth, this.frameHeight,
        -this.position.x - this.width, this.position.y,
        this.width, this.height
      );
    } else {
      context.drawImage(
        this.currentImage,
        this.frameX * this.frameWidth, 0,
        this.frameWidth, this.frameHeight,
        this.position.x, this.position.y,
        this.width, this.height
      );
    }
    context.restore(); 
  }

  // colisao horizontal
  checkForHorizontalCollisions({ solidPlatforms = [] }) {
    for (let i = 0; i < solidPlatforms.length; i++) {
      const platform = solidPlatforms[i];
      if (collision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.x > 0) {
          this.velocity.x = 0;
          this.position.x = platform.position.x - this.hitbox.width - 0.01;
          break;
        }
        if (this.velocity.x < 0) {
          this.velocity.x = 0;
          this.position.x = platform.position.x + platform.width + 0.01;
          break;
        }
      }
    }
  }

  // Colisao vertical
  checkForVerticalCollisions({ worldHeight, platforms = [], solidPlatforms = [] }) {
    this.isOnGround = false;
    for (let i = 0; i < solidPlatforms.length; i++) {
      const platform = solidPlatforms[i];
      if (collision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          this.position.y = platform.position.y - this.hitbox.height - 0.01;
          this.isOnGround = true;
          break;
        }
        if (this.velocity.y < 0) {
          this.velocity.y = 0;
          this.position.y = platform.position.y + platform.height + 0.01;
          break;
        }
      }
    }
    if (this.isOnGround) return;
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      if (platformCollision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          this.position.y = platform.position.y - this.hitbox.height - 0.01;
          this.isOnGround = true;
          break;
        }
      }
    }
    if (!this.isOnGround && this.position.y + this.height >= worldHeight) {
      this.velocity.y = 0;
      this.position.y = worldHeight - this.height;
      this.isOnGround = true;
    }
  }

  // Funcao principal de atualizacao
  update(worldHeight, worldWidth, platforms = [], solidPlatforms = [], input) {
    
    if (this.isDead) {
         return;
    }

    
    if (this.isInvincible) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        
        if (this.currentState === 'hurt') {
            this.switchState('idle');
        }
      }
    }

    this.updateHitbox(); 
    this.move(input);
    
    
    if (this.currentState !== 'hurt') {
         this.position.x += this.velocity.x;
    }
    
    this.applyGravity();
    this.isOnGround = false; 

    
    this.checkForHorizontalCollisions({ solidPlatforms });
    this.checkForVerticalCollisions({ worldHeight, platforms, solidPlatforms });

    
    if (this.cooldown > 0) this.cooldown--;

    // at flechas
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const arrow = this.projectiles[i];
      arrow.update();
      if (arrow.position.x < 0 || arrow.position.x > worldWidth) {
        this.projectiles.splice(i, 1);
      }
    }

    this.animate();
    this.draw(context);
  }
}


class Projectile {
  constructor({ position, direction, image }) {
    this.position = position;
    this.direction = direction;
    this.speed = 5 * direction;
    this.width = 16;
    this.height = 4;
    this.image = image; 
  }

  update() {
    this.position.x += this.speed;
  }

  draw(context) {
    context.save();
    if (this.direction === -1) {
      context.scale(-1, 1);
      context.drawImage(
        this.image,
        -this.position.x - this.width,
        this.position.y,
        this.width,
        this.height
      );
    } else {
      context.drawImage(
        this.image,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
    context.restore();
  }
}

// Classe de animacao de morte
class DeathAnimation extends Sprite {
  constructor({
    position,
    imageSrc,
    frameWidth,
    frameHeight,
    totalFrames,
    frameInterval = 10,
  }) {
    super({ position, imageSrc });

    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;
      this.width = frameWidth;
      this.height = frameHeight;
    };
    this.image.src = imageSrc;

    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.maxFrames = totalFrames;
    this.frameX = 0;
    this.frameTimer = 0;
    this.frameInterval = frameInterval;
    this.done = false;
  }

  update() {
    if (this.done || !this.loaded) return;

    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      this.frameX++; 
      if (this.frameX >= this.maxFrames) {
        this.done = true;
        this.frameX = this.maxFrames - 1;
      }
      this.frameTimer = 0;
    }
  }

  draw(context) {
    if (this.done || !this.loaded) return;

    const frameX_coord = this.frameX * this.frameWidth;

    context.drawImage(
      this.image,
      frameX_coord,
      0, 
      this.frameWidth,
      this.frameHeight,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
}

// Classe do projetil de semente
class SeedProjectile {
  constructor({ position, direction }) {
    this.position = position;
    this.direction = direction; 
    this.velocity = { x: 80 * this.direction, y: 0 }; 

    this.image = new Image();
    this.image.src = "./Sprite Pack 8/3 - Cebolete/Seed_Launch (8 x 8).png";
    this.loaded = false;
    this.image.onload = () => {
      this.loaded = true;
    };

    this.width = 8;
    this.height = 8;
    this.frameWidth = 8;
    this.frameHeight = 8;
    this.maxFrames = 2; 

    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.frameInterval = 150; 
  }

  updateAnimation(dt) {
    if (!this.loaded) return;

    this.elapsedMs += dt * 1000;
    if (this.elapsedMs >= this.frameInterval) {
      this.elapsedMs -= this.frameInterval;
      this.currentFrame = (this.currentFrame + 1) % this.maxFrames;
    }
  }

  update(dt) {
    this.updateAnimation(dt);
    this.position.x += this.velocity.x * dt;
  }

  draw(context) {
    if (!this.loaded) return;
    const frameX = this.currentFrame * this.frameWidth;
    
    context.save();
    if (this.direction === -1) {
      context.scale(-1, 1);
      context.drawImage(
        this.image,
        frameX, 0, this.frameWidth, this.frameHeight,
        -this.position.x - this.width, 
        this.position.y,
        this.width,
        this.height
      );
    } else {
      context.drawImage(
        this.image,
        frameX, 0, this.frameWidth, this.frameHeight,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
    context.restore();
  }
}