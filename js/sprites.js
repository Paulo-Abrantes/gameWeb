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