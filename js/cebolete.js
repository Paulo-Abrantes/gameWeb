//movimento
const CEBO_X_VELOCITY = 18;
const CEBO_GRAVITY = 220;
const CEBO_JUMP_POWER = 60;
const CEBO_HOP_GAP = 0.2;

//animação
const CEBO_RUN_FRAME_MS = 120;
const CEBO_AIR_FRAME_MS = 120;
const CEBO_ATTACK_FRAME_MS = 100;

//ataque
const CEBO_ATTACK_COOLDOWN = 2.5;
const CEBO_ATTACK_FRAME_TO_SHOOT = 3;

class Cebolete {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231, level = 1 }) {
    this.position = { x, y };
    this.velocity = { x: CEBO_X_VELOCITY, y: 0 };

    this.width = 20;
    this.height = 20;

    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;

    this.level = level;

    this.patrolStartX = patrolStartX;
    this.patrolEndX = patrolEndX;
    this.facing = "right";

    this.state = "run";
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.frameInterval = CEBO_RUN_FRAME_MS;

    //sprites
    this.images = {
      run: new Image(),
      jump: new Image(),
      attack: new Image(),
    };
    this.images.run.src = "./Sprite Pack 8/3 - Cebolete/Running (32 x 32).png";
    this.images.jump.src = "./Sprite Pack 8/3 - Cebolete/Jump (32 x 32).png";
    this.images.attack.src =
      "./Sprite Pack 8/3 - Cebolete/Flower_Whip_Attack (32 x 32).png";

    this.totalFrames = { run: 6, jump: 1, attack: 5 };
    this.image = this.images.run;

    this.hopTimer = CEBO_HOP_GAP;

    this.projectiles = [];
    this.attackCooldown = 0.0;
    this.hasFired = false;

    this.hitbox = {
      position: { x: this.position.x + 6, y: this.position.y + 6 },
      width: 20,
      height: 20,
    };
  }

  switchState(state) {
    if (this.state === state) return;
    this.state = state;
    this.currentFrame = 0;
    this.elapsedMs = 0;

    switch (state) {
      case "run":
        this.image = this.images.run;
        this.frameInterval = CEBO_RUN_FRAME_MS;
        break;
      case "air":
        this.image = this.images.jump;
        this.frameInterval = CEBO_AIR_FRAME_MS;
        break;
      case "attack":
        this.image = this.images.attack;
        this.frameInterval = CEBO_ATTACK_FRAME_MS;
        this.hasFired = false;
        break;
    }
  }

  //controle de animação
  updateAnimation(dt) {
    this.elapsedMs += dt * 1000;

    if (this.elapsedMs >= this.frameInterval) {
      this.elapsedMs -= this.frameInterval;
      this.currentFrame = this.currentFrame + 1;

      let maxFrames = 0;
      if (this.state === "run") maxFrames = this.totalFrames.run;
      else if (this.state === "air") maxFrames = this.totalFrames.jump;
      else if (this.state === "attack") maxFrames = this.totalFrames.attack;

      if (
        this.state === "attack" &&
        this.currentFrame === CEBO_ATTACK_FRAME_TO_SHOOT &&
        !this.hasFired
      ) {
        this.spawnSeed();
        this.hasFired = true;
      }

      if (this.currentFrame >= maxFrames) {
        this.currentFrame = 0;
        if (this.state === "attack") {
          this.switchState("run");
        }
      }
    }
  }

  shoot() {
    if (this.attackCooldown > 0 || this.state === "air") return;

    this.switchState("attack");
    this.velocity.x = 0;
    this.attackCooldown = CEBO_ATTACK_COOLDOWN;
  }

  //criar semente (projetil)
  spawnSeed() {
    const seedX =
      this.facing === "right"
        ? this.position.x + this.width
        : this.position.x - 8;

    const seedY = this.position.y + 10;

    const seed = new SeedProjectile({
      position: { x: seedX, y: seedY },
      direction: this.facing === "right" ? 1 : -1,
    });

    this.projectiles.push(seed);
  }

  update(dt) {
    if (!dt) return;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    this.updateAnimation(dt);

    if (this.state === "attack") {
      this.velocity.y += CEBO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      const bottom = this.position.y + this.height;
      if (bottom >= this.groundBottom) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
      }
    } else {
      this.velocity.x =
        this.facing === "right" ? CEBO_X_VELOCITY : -CEBO_X_VELOCITY;
      this.position.x += this.velocity.x * dt;

      if (
        this.position.x + this.width >= this.patrolEndX &&
        this.velocity.x > 0
      ) {
        this.facing = "left";
      } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
        this.facing = "right";
      }

      this.velocity.y += CEBO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      const bottom = this.position.y + this.height;
      if (bottom >= this.groundBottom) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
        this.switchState("run");

        if (this.attackCooldown <= 0) {
          this.shoot(); // Hora de atacar
        } else {
          // Se não pode atacar, faz o pulinho
          this.hopTimer -= dt;
          if (this.hopTimer <= 0) {
            this.velocity.y = -CEBO_JUMP_POWER;
            this.switchState("air");
            this.hopTimer = CEBO_HOP_GAP;
          }
        }
      } else {
        this.switchState("air");
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const seed = this.projectiles[i];
      seed.update(dt);

      if (
        seed.position.x < this.position.x - 400 ||
        seed.position.x > this.position.x + 400
      ) {
        this.projectiles.splice(i, 1);
      }
    }

    this.hitbox.position.x = this.position.x + 6;
    this.hitbox.position.y = this.position.y + 6;
  }

  draw(context) {
    if (!this.image || !this.image.complete) return;

    let frames = 0;
    if (this.state === "run") frames = this.totalFrames.run;
    else if (this.state === "air") frames = this.totalFrames.jump;
    else if (this.state === "attack") frames = this.totalFrames.attack;

    const safeFrame = frames > 0 ? this.currentFrame % frames : 0;
    const frameX = safeFrame * this.frameWidth;

    context.save();
    if (this.facing === "left") {
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
      context.drawImage(
        this.image,
        frameX,
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

    for (const seed of this.projectiles) {
      seed.draw(context);
    }
  }
}
