// movimentos
const ASTRO_X_VELOCITY = 15;
const ASTRO_GRAVITY = 60;
const ASTRO_JUMP_POWER = 60;
const ASTRO_HOP_GAP = 0.25;

//animção
const ASTRO_ATTACK_RANGE = 30;
const ASTRO_ATTACK_COOLDOWN = 2.0;
const ASTRO_PUNCH_FRAME_MS = 80;
const ASTRO_PUNCH_ACTIVE_FRAME = 3;

class Astro {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    this.position = { x, y };
    this.velocity = { x: -ASTRO_X_VELOCITY, y: 0 };

    this.frameWidth = 32;
    this.frameHeight = 32;
    this.width = 20;
    this.height = 20;

    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;

    this.facing = "left";
    this.state = "run";

    this.elapsedMs = 0;
    this.currentFrame = 0;
    this.frameInterval = 90;

    //sprites
    this.images = {
      run: new Image(),
      jump: new Image(),
      attack: new Image(),
    };
    this.images.run.src = "./Sprite Pack 8/1 - Astro/Run (32 x 32).png";
    this.images.jump.src = "./Sprite Pack 8/1 - Astro/Jump (32 x 32).png";
    this.images.attack.src =
      "./Sprite Pack 8/1 - Astro/Half_Health_Punch (32 x 32).png";
    this.image = this.images.run;

    this.totalFrames = { run: 6, jump: 1, attack: 7 };

    this.patrolStartX = patrolStartX;
    this.patrolEndX = patrolEndX;
    this.hopTimer = ASTRO_HOP_GAP;

    this.attackCooldown = 0.0;
    this.attackHitbox = {
      position: { x: 0, y: 0 },
      width: 10,
      height: 5,
      isActive: false,
    };

    this.hitbox = {
      position: { x: this.position.x + 3, y: this.position.y + 3 },
      width: 14,
      height: 14,
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
        this.frameInterval = 90;
        break;
      case "air":
        this.image = this.images.jump;
        this.frameInterval = 120;
        break;
      case "attack":
        this.image = this.images.attack;
        this.frameInterval = ASTRO_PUNCH_FRAME_MS;
        this.attackHitbox.isActive = false;
        break;
    }
  }

  activatePunchHitbox() {
    this.attackHitbox.position.y =
      this.position.y + this.height / 2 - this.attackHitbox.height / 2;

    if (this.facing === "right") {
      this.attackHitbox.position.x = this.position.x + this.width;
    } else {
      this.attackHitbox.position.x = this.position.x - this.attackHitbox.width;
    }
    this.attackHitbox.isActive = true;
  }

  attemptAttack(player) {
    if (this.attackCooldown > 0 || this.state !== "run") return false;

    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distanceX = Math.abs(dx);
    const distanceY = Math.abs(dy);

    if (
      distanceX < ASTRO_ATTACK_RANGE &&
      distanceY < this.height * 2 &&
      this.state === "run"
    ) {
      // vira para o jogador
      this.facing = dx > 0 ? "right" : "left";

      this.switchState("attack");
      this.velocity.x = 0;
      this.attackCooldown = ASTRO_ATTACK_COOLDOWN;
      return true;
    }
    return false;
  }

  updateAnimation(dt, player) {
    this.elapsedMs += dt * 1000;

    let frames = 0;
    if (this.state === "run") frames = this.totalFrames.run;
    else if (this.state === "air") frames = this.totalFrames.jump;
    else if (this.state === "attack") frames = this.totalFrames.attack;

    if (frames === 0) return;

    if (this.elapsedMs >= this.frameInterval) {
      this.elapsedMs -= this.frameInterval;
      this.currentFrame = this.currentFrame + 1;

      if (this.state === "attack") {
        if (this.currentFrame === ASTRO_PUNCH_ACTIVE_FRAME) {
          // ativa hitbox e checa colisao no frame exato
          this.activatePunchHitbox();

          if (
            this.attackHitbox.isActive &&
            collision({ object1: this.attackHitbox, object2: player.hitbox })
          ) {
            player.takeDamage();
            this.attackHitbox.isActive = false;
          }
        } else {
          this.attackHitbox.isActive = false;
        }
      }

      if (this.currentFrame >= frames) {
        this.currentFrame = 0;
        if (this.state === "attack") {
          this.switchState("run");
        }
      }
    }
  }

  update(dt, player) {
    if (!dt) return;
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    this.updateAnimation(dt, player);

    if (this.state === "attack") {
      this.velocity.y += ASTRO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      if (this.position.y >= this.groundBottom - this.height) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
      }
    } else {
      const didAttack = this.attemptAttack(player);

      if (!didAttack) {
        this.velocity.x =
          this.facing === "right" ? ASTRO_X_VELOCITY : -ASTRO_X_VELOCITY;
        this.position.x += this.velocity.x * dt;

        if (
          this.position.x + this.width >= this.patrolEndX &&
          this.velocity.x > 0
        ) {
          this.velocity.x = -ASTRO_X_VELOCITY;
          this.facing = "left";
        } else if (
          this.position.x <= this.patrolStartX &&
          this.velocity.x < 0
        ) {
          this.velocity.x = ASTRO_X_VELOCITY;
          this.facing = "right";
        }

        this.velocity.y += ASTRO_GRAVITY * dt;
        this.position.y += this.velocity.y * dt;

        if (this.position.y >= this.groundBottom - this.height) {
          this.position.y = this.groundBottom - this.height;
          this.velocity.y = 0;
          this.switchState("run");

          this.hopTimer -= dt;
          if (this.hopTimer <= 0) {
            this.velocity.y = -ASTRO_JUMP_POWER;
            this.switchState("air");
            this.hopTimer = ASTRO_HOP_GAP;
          }
        } else {
          this.switchState("air");
        }
      }
    }

    this.hitbox.position.x = this.position.x + 3;
    this.hitbox.position.y = this.position.y + 3;
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
  }
}
