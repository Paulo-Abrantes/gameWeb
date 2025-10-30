class Projectile {
  constructor({ position, direction }) {
    this.position = { x: position.x, y: position.y };
    this.direction = direction;
    this.speed = 6 * direction;
    this.width = 12;
    this.height = 6;

    this.image = new Image();
    this.image.src = "./Sprite Pack 8/2 - Tracy/Arrow_Projectile (16 x 16).png";
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