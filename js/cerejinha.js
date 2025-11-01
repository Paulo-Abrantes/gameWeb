const CEREJINHA_X_VELOCITY = 20;

class Cerejinha {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231, level = 1 }) {
    this.position = { x, y };
    this.velocity = { x: CEREJINHA_X_VELOCITY, y: 0 };

    this.frameWidth = 32;
    this.frameHeight = 32;
    this.width = 20;
    this.height = 20;

    this.level = level;

    // alinhamento com o chao
    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;
    this.isImageLoaded = false;
    this.image = new Image();
    this.image.onload = () => {
      this.isImageLoaded = true;
    };

    this.image.src = "./Sprite Pack 8/4 - Cerejinha/Running (32 x 32).png";

    this.elapsedTime = 0;
    this.currentFrame = 0;
    this.totalFrames = 6;
    this.facing = "right";

    // limites de patrulha
    this.patrolStartX = patrolStartX;
    this.patrolEndX = patrolEndX;

    // hitbox proporcional
    this.hitbox = {
      position: {
        x: this.position.x + 6,
        y: this.position.y + 10,
      },
      width: 14,
      height: 14,
    };
  }

  draw(context) {
    if (!this.isImageLoaded) return;

    const frameX = this.currentFrame * this.frameWidth;

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

  updateAnimation(deltaTime) {
    this.elapsedTime += deltaTime * 1000;
    const frameInterval = 100;
    if (this.elapsedTime > frameInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.elapsedTime -= frameInterval;
    }
  }

  update(deltaTime) {
    if (!deltaTime) return;

    this.updateAnimation(deltaTime);

    // movimento horizontal
    this.position.x += this.velocity.x * deltaTime;

    const bottom = this.position.y + this.height;
    if (bottom !== this.groundBottom) {
      this.position.y = this.groundBottom - this.height;
    }

    // verifica limites
    if (
      this.position.x + this.width >= this.patrolEndX &&
      this.velocity.x > 0
    ) {
      this.velocity.x = -CEREJINHA_X_VELOCITY;
      this.facing = "left";
    } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
      this.velocity.x = CEREJINHA_X_VELOCITY;
      this.facing = "right";
    }

    // atualiza
    this.hitbox.position.x = this.position.x + 6;
    this.hitbox.position.y = this.position.y + 10;
  }
}
