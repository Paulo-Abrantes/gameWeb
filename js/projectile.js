// --- CLASSE PROJECTILE ---
export class Projectile {
  constructor({ position, direction }) {
    this.position = position;
    this.direction = direction;
    this.speed = 5 * direction;
    this.width = 16;
    this.height = 4;

    this.image = new Image(); // esse new aqui tbm n pode
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
