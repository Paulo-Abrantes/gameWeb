const PLAYER_X_VELOCITY = 150; 
const PLAYER_JUMP_POWER = 150; 
const PLAYER_GRAVITY = 200; 

const globalArrowImage = new Image();
globalArrowImage.src =
  "./Sprite Pack 8/2 - Tracy/Arrow_Projectile (16 x 16).png";

class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 16;
    this.height = 16;
    this.isOnGround = false;
    this.gravity = PLAYER_GRAVITY; 
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
      this.frameInterval = this.animations[state].interval / 10; 
    } else {
      this.frameInterval = 50; 
    }
  }
  
  applyGravity(deltaTime) {
    this.velocity.y += this.gravity * deltaTime;
  }

  takeDamage() {
    if (this.isInvincible || this.isDead) return;

    this.isInvincible = true;
    this.invincibilityTimer = this.invincibilityDuration;
    this.lives--;

    console.log("VIDAS RESTANTES: " + this.lives);

    if (this.lives <= 0) {
      this.die();
    } else {
      this.switchState("hurt");
      this.velocity.y = -5;
      this.isOnGround = false;
    }
  }

  die() {
    this.isDead = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  move(input) {
    if (
      this.currentState === "attack" ||
      this.currentState === "hurt" ||
      this.isDead
    ) {
      this.velocity.x = 0;
      return;
    }

    this.velocity.x = 0;
    if (input.left) {
      this.velocity.x = -PLAYER_X_VELOCITY;
      this.direction = -1;
    } else if (input.right) {
      this.velocity.x = PLAYER_X_VELOCITY;
      this.direction = 1;
    }

    if (input.jump && this.isOnGround) {
      this.velocity.y = -PLAYER_JUMP_POWER;
      this.isOnGround = false;
    }

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
    if (this.cooldown > 0 || this.currentState === "hurt" || this.isDead)
      return;
    this.switchState("attack");
    this.cooldown = 10;

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
      if (
        this.currentState === "attack" &&
        this.frameX === this.maxFrames - 1
      ) {
        this.switchState("idle");
      } else if (
        this.currentState === "hurt" &&
        this.frameX === this.maxFrames - 1
      ) {
        if (this.frameTimer > 30) {
          this.switchState("idle");
        }
      }

      this.frameX = (this.frameX + 1) % this.maxFrames;
      this.frameTimer = 0;
    }
  }

  draw(context) {
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
        this.frameX * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        -this.position.x - this.width,
        this.position.y,
        this.width,
        this.height
      );
    } else {
      context.drawImage(
        this.currentImage,
        this.frameX * this.frameWidth,
        0,
        this.frameWidth,
        this.frameHeight,
        this.position.x,
        this.position.y,
        this.width,
        this.height
      );
    }
    context.restore();
  }

  checkForHorizontalCollisions({ solidPlatforms = [] }) {
    for (let i = 0; i < solidPlatforms.length; i++) {

      const platform = solidPlatforms[i];
      
      if (collision({ object1: this.hitbox, object2: platform })) {
        
        if (this.velocity.x > 0) {
          this.velocity.x = 0;
          this.position.x = platform.position.x - this.hitbox.width;
          break;
        }

        if (this.velocity.x < 0) {
          this.velocity.x = 0;
          this.position.x = platform.position.x + platform.width;
          break;
        }
      }
    }
  }

  checkForVerticalCollisions({
    worldHeight,
    platforms = [],
    solidPlatforms = [],
    
  }) {
    this.isOnGround = false;
    for (let i = 0; i < solidPlatforms.length; i++) {
      const platform = solidPlatforms[i];
      if (collision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          this.position.y = platform.position.y - this.hitbox.height; 
          this.isOnGround = true;
          break;
        }
        if (this.velocity.y < 0) {
          this.velocity.y = 0;
          this.position.y = platform.position.y + platform.height; 
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
          this.position.y = platform.position.y - this.hitbox.height; 
          this.isOnGround = true;
          break;
        }
      }
    }
  }

  update(worldHeight, worldWidth, platforms = [], solidPlatforms = [], input, deltaTime) {
    if (this.isDead || !deltaTime) {
      return;
    }

    if (this.isInvincible) {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;

        if (this.currentState === "hurt") {
          this.switchState("idle");
        }
      }
    }

    this.updateHitbox();
    this.move(input);

    if (this.currentState !== "hurt") {
      this.position.x += this.velocity.x * deltaTime;
    }

    this.applyGravity(deltaTime);
    this.position.y += this.velocity.y * deltaTime;
    this.isOnGround = false;

    this.checkForHorizontalCollisions({ solidPlatforms });
    this.checkForVerticalCollisions({ worldHeight, platforms, solidPlatforms });

    if (this.cooldown > 0) this.cooldown--;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const arrow = this.projectiles[i];
      arrow.update();
      if (arrow.position.x < 0 || arrow.position.x > worldWidth) {
        this.projectiles.splice(i, 1);
      }
    }

    this.animate();
  }
}