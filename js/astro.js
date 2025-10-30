// --- CLASSE Astro ---
const ASTRO_X_VELOCITY = 15;   // Velocidade horizontal
const ASTRO_GRAVITY = 60;     // Gravidade (px/s²)
const ASTRO_JUMP_POWER = 60;   // Força do pulo (px/s)
const ASTRO_HOP_GAP = 0.25;    // Intervalo entre pulos (s)

class Astro {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    this.position = { x, y };
    this.velocity = { x: -ASTRO_X_VELOCITY, y: 0 };

    // Escala e dimensões
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.width = 20;
    this.height = 20;

    // Corrige alinhamento com o chão
    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;

    // Estado inicial
    this.facing = 'left';
    this.state = 'run'; // 'run' = chão | 'air' = pulando

    // Controle de animação
    this.elapsedMs = 0;
    this.currentFrame = 0;
    this.frameInterval = 90;
    this.totalFrames = { run: 6, jump: 1 };

    // Carrega sprites
    this.images = {
      run: new Image(),
      jump: new Image()
    };
    this.images.run.src = './Sprite Pack 8/1 - Astro/Run (32 x 32).png';
    this.images.jump.src = './Sprite Pack 8/1 - Astro/Jump (32 x 32).png';
    this.image = this.images.run;

    // Patrulha
    this.patrolStartX = patrolStartX;
    this.patrolEndX = patrolEndX;

    // Temporizador do pulo
    this.hopTimer = ASTRO_HOP_GAP;

    // Hitbox
    this.hitbox = {
      position: { x: this.position.x + 3, y: this.position.y + 3 },
      width: 14,
      height: 14,
    };
  }

  switchState(state) {
    if (this.state === state) return;
    this.state = state;
    this.image = state === 'run' ? this.images.run : this.images.jump;
    this.currentFrame = 0;
    this.elapsedMs = 0;
    this.frameInterval = state === 'run' ? 90 : 120;
  }

  updateAnimation(dt) {
    this.elapsedMs += dt * 1000;
    const frames = this.state === 'run' ? this.totalFrames.run : this.totalFrames.jump;
    if (this.elapsedMs >= this.frameInterval) {
      this.currentFrame = (this.currentFrame + 1) % frames;
      this.elapsedMs -= this.frameInterval;
    }
  }

  update(dt) {
    if (!dt) return;

    // Movimento horizontal
    this.position.x += this.velocity.x * dt;

    // Patrulha lateral
    if (this.position.x + this.width >= this.patrolEndX && this.velocity.x > 0) {
      this.velocity.x = -ASTRO_X_VELOCITY;
      this.facing = 'left';
    } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
      this.velocity.x = ASTRO_X_VELOCITY;
      this.facing = 'right';
    }

    // Física vertical (pulinhos)
    this.velocity.y += ASTRO_GRAVITY * dt;
    this.position.y += this.velocity.y * dt;

    // Toca o chão → reinicia pulo
    if (this.position.y >= this.groundBottom - this.height) {
      this.position.y = this.groundBottom - this.height;
      this.velocity.y = 0;

      this.switchState('run');
      this.hopTimer -= dt;
      if (this.hopTimer <= 0) {
        this.velocity.y = -ASTRO_JUMP_POWER;
        this.switchState('air');
        this.hopTimer = ASTRO_HOP_GAP;
      }
    } else {
      this.switchState('air');
    }

    this.updateAnimation(dt);

    // Atualiza hitbox
    this.hitbox.position.x = this.position.x + 3;
    this.hitbox.position.y = this.position.y + 3;
  }

  draw(context) {
    if (!this.image || !this.image.complete) return;

    const frames = this.state === 'run' ? this.totalFrames.run : this.totalFrames.jump;
    const safeFrame = frames > 0 ? this.currentFrame % frames : 0;
    const frameX = safeFrame * this.frameWidth;

    context.save();
    if (this.facing === 'left') {
      context.scale(-1, 1);
      context.drawImage(
        this.image,
        frameX, 0, this.frameWidth, this.frameHeight,
        -this.position.x - this.width, this.position.y,
        this.width, this.height
      );
    } else {
      context.drawImage(
        this.image,
        frameX, 0, this.frameWidth, this.frameHeight,
        this.position.x, this.position.y,
        this.width, this.height
      );
    }
    context.restore();
  }
}
