// cebolete.js

// Movimento: corrida + pulinhos curtos
const CEBO_X_VELOCITY   = 18;    // px/s (horizontal)
const CEBO_GRAVITY      = 220;   // px/s² (gravidade)
const CEBO_JUMP_POWER   = 60;   // px/s  (impulso do pulo)
const CEBO_HOP_GAP      = 0.2;   // s     (intervalo entre pulos)
const CEBO_RUN_FRAME_MS = 90;    // ms    (animação no chão)
const CEBO_AIR_FRAME_MS = 120;   // ms    (animação no ar)

class Cebolete {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    // posição e velocidade
    this.position = { x, y };                     // y recebido é o TOPO considerando sprite de 32px
    this.velocity = { x: CEBO_X_VELOCITY, y: 0 }; // começa andando p/ direita

    // dimensões desenhadas (reduzido)
    this.width  = 20;
    this.height = 20;

    // >>> baseline de 32px vindo do game.js (spawnY = groundY - 32)
    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight; // linha do "chão" para o fundo do inimigo

    // patrulha
    this.patrolStartX = patrolStartX;
    this.patrolEndX   = patrolEndX;

    // direção do espelhamento
    this.facing = 'right';

    // estado/anim
    this.state         = 'run';         // 'run' (no chão) | 'air' (pulando)
    this.frameWidth    = 32;
    this.frameHeight   = 32;
    this.currentFrame  = 0;
    this.elapsedMs     = 0;
    this.frameInterval = CEBO_RUN_FRAME_MS;

    // sprites/folhas
    this.images = {
      run:  new Image(),
      jump: new Image()
    };
    this.images.run.src  = './Sprite Pack 8/3 - Cebolete/Running (32 x 32).png';
    this.images.jump.src = './Sprite Pack 8/3 - Cebolete/Jump (32 x 32).png';

    // total de frames
    this.totalFrames = { run: 6, jump: 1 };
    this.image = this.images.run;

    // temporizador do “pulo curto”
    this.hopTimer = CEBO_HOP_GAP;

    // hitbox simples
    this.hitbox = {
      position: { x: this.position.x + 6, y: this.position.y + 6 },
      width: 20,
      height: 20
    };
  }

  switchState(state) {
    if (this.state === state) return;
    this.state = state;
    this.image = state === 'run' ? this.images.run : this.images.jump;
    this.currentFrame  = 0;
    this.elapsedMs     = 0;
    this.frameInterval = state === 'run' ? CEBO_RUN_FRAME_MS : CEBO_AIR_FRAME_MS;
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

    // patrulha horizontal
    this.position.x += this.velocity.x * dt;

    if (this.position.x + this.width >= this.patrolEndX && this.velocity.x > 0) {
      this.velocity.x = -CEBO_X_VELOCITY;
      this.facing = 'left';
    } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
      this.velocity.x =  CEBO_X_VELOCITY;
      this.facing = 'right';
    }

    // física vertical (pulos curtos)
    this.velocity.y += CEBO_GRAVITY * dt;
    this.position.y += this.velocity.y * dt;

    // ----- COLISÃO COM O "CHÃO" USANDO O FUNDO -----
    const bottom = this.position.y + this.height;
    if (bottom >= this.groundBottom) {
      // realinha topo = groundBottom - altura atual (20px)
      this.position.y = this.groundBottom - this.height;
      this.velocity.y = 0;

      // no chão → estado run
      this.switchState('run');

      // cronometra e dispara novo “pulo curto”
      this.hopTimer -= dt;
      if (this.hopTimer <= 0) {
        this.velocity.y = -CEBO_JUMP_POWER; // impulso do pulo
        this.switchState('air');
        this.hopTimer = CEBO_HOP_GAP;
      }
    } else {
      // no ar
      this.switchState('air');
    }

    // animação
    this.updateAnimation(dt);

    // hitbox
    this.hitbox.position.x = this.position.x + 6;
    this.hitbox.position.y = this.position.y + 6;
  }

  draw(context) {
    if (!this.image || !this.image.complete) return;

    const frames = this.state === 'run' ? this.totalFrames.run : this.totalFrames.jump;
    const safeFrame = frames > 0 ? (this.currentFrame % frames) : 0;
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
