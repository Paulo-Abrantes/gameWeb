class Player extends Sprite {
  constructor() {
    super({
      position: { x: 100, y: 100 },
      imageSrc: "./Sprite Pack 8/2 - Tracy/Idle_1 (32 x 32).png",
      totalFrames: 5,
      frameWidth: 32,
      frameHeight: 32,
    });

    this.width = 16;
    this.height = 16;

    this.velocity = { x: 0, y: 0 };
    this.isOnGround = false;
    this.gravity = 0.5;
    this.direction = 1;

    this.animations = {
      idle: {
        src: "./Sprite Pack 8/2 - Tracy/Idle_1 (32 x 32).png",
        frames: 5,
        interval: 100,
      },
      run: {
        src: "./Sprite Pack 8/2 - Tracy/Run (32 x 32).png",
        frames: 6,
        interval: 80,
      },
      jump: {
        src: "./Sprite Pack 8/2 - Tracy/Jump (32 x 32).png",
        frames: 1,
        interval: 100,
      },
      fall: {
        src: "./Sprite Pack 8/2 - Tracy/Falling (32 x 32).png",
        frames: 1,
        interval: 100,
      },
      attack: {
        src: "./Sprite Pack 8/2 - Tracy/Standing_Crossbow_Shot (32 x 32).png",
        frames: 4,
        interval: 50,
      },
    };
    this.currentState = "idle";

    this.cooldown = 0;
    this.projectiles = [];

    this.hitbox = {
      position: { x: this.position.x, y: this.position.y },
      width: this.width,
      height: this.height,
    };
  }

  draw(context) {
    if (!this.loaded) return;

    const frameX = this.currentFrame * this.frameWidth;
    const flip = this.direction === -1;

    context.save();
    if (flip) {
      context.scale(-1, 1);
      context.drawImage(
        this.image,
        frameX,
        0,
        this.frameWidth,
        this.frameHeight,
        -this.position.x - this.width,
        this.position.y,
        this.width,
        this.height
      );
    } else {
      super.draw(context);
    }
    context.restore();
  }

  switchState(state) {
    if (this.currentState !== state) {
      this.currentState = state;
      const anim = this.animations[state];

      this.image.src = anim.src;
      this.totalFrames = anim.frames;
      this.frameInterval = anim.interval;

      this.currentFrame = 0;
      this.elapsedTime = 0;
    }
  }

  applyGravity() {
    this.velocity.y += this.gravity;
  }

  move(input) {
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
    if (this.cooldown > 0) return;
    this.switchState("attack");
    this.cooldown = 50;

    const arrow = new Projectile({
      position: {
        x: this.position.x + (this.direction === 1 ? this.width : -10),
        y: this.position.y + this.height / 2 - 10,
      },
      direction: this.direction,
    });
    this.projectiles.push(arrow);
  }

  updateHitbox() {
    this.hitbox.position.x = this.position.x;
    this.hitbox.position.y = this.position.y;
    this.hitbox.width = this.width;
    this.hitbox.height = this.height;
  }

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
      S;
    }

    if (!this.isOnGround && this.position.y + this.height >= worldHeight) {
      this.velocity.y = 0;
      this.position.y = worldHeight - this.height;
      this.isOnGround = true;
    }
  }

  update(worldHeight, platforms = [], solidPlatforms = [], input, deltaTime) {
    super.updateAnimation(deltaTime);
    if (this.cooldown > 0) this.cooldown--;

    this.move(input);
    this.updateHitbox();

    this.position.x += this.velocity.x;
    this.checkForHorizontalCollisions({ solidPlatforms });

    this.applyGravity();
    this.position.y += this.velocity.y;
    this.checkForVerticalCollisions({ worldHeight, platforms, solidPlatforms });

    for (const arrow of this.projectiles) {
      arrow.update();
    }
  }
}
