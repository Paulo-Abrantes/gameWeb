// cebolete.js

// “pulinhos curtos” + corrida
const CEBO_X_VELOCITY   = 18;   // velocidade horizontal
const CEBO_GRAVITY      = 120;  // gravidade (px/s²)
const CEBO_JUMP_POWER   = 140;  // impulso do pulo (px/s)
const CEBO_HOP_GAP      = 0.25; // intervalo entre pulos, em segundos
const CEBO_RUN_FRAME_MS = 90;   // animação correndo
const CEBO_AIR_FRAME_MS = 120;  // animação no ar

class Cebolete {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    this.position = { x, y };
    this.velocity = { x: CEBO_X_VELOCITY, y: 0 };

    this.width = 32;
    this.height = 32;
    this.facing = 'right';

    // patrulha configurável
    this.patrolStartX = patrolStartX;
    this.patrolEndX   = patrolEndX;

    // “chão” de referência = Y inicial
    this.groundY = y;

    // estado / animação
    this.state = 'run'; // 'run' (chão) | 'air' (pulando)
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.currentFrame = 0;
    this.elapsedTime = 0;
    this.totalFrames = 6; // será recalculado no onload
    this.frameInterval = CEBO_RUN_FRAME_MS;

    // sprites
    this.images = {
      run:  new Image(),
      jump: new Image()
    };
    this.images.run.onload  = () => { this._recalcFrames('run'); };
    this.images.jump.onload = () => { this._recalcFrames(this.state); };

    // caminhos conforme seu print
    this.images.run.src  = './Sprite Pack 8/3 - Cebolete/Running (32 x 32).png';
    this.images.jump.src = './Sprite Pack 8/3 - Cebolete/Jump (32 x 32).png';

    this.image = this.images.run;

    this.jumpTimer = 0;

    // hitbox simples
    this.hitbox = {
      position: { x: this.position.x + 6, y: this.position.y + 6 },
      width: 20,
      height: 20
    };
  }

  _recalcFrames(state) {
    const img = this.images[state];
    const frames = Math.floor(img.width / this.frameWidth);
    if (frames > 0) this.totalFrames = frames;
  }

  _switchState(state) {
    if (this.state === state) return;
    this.state = state;
    this.image = this.images[state];
    this.currentFrame = 0;
    this.elapsedTime = 0;
    this.frameInterval = state === 'run' ? CEBO_RUN_FRAME_MS : CEBO_AIR_FRAME_MS;
    this._recalcFrames(state);
  }

  updateAnimation(dt) {
    this.elapsedTime += dt * 1000;
    if (this.elapsedTime > this.frameInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.elapsedTime -= this.frameInterval;
    }
  }

  update(dt) {
    if (!dt) return;

    // patrulha horizontal
    this.position.x += this.velocity.x * dt;
    if (this.position.x + this.width >= this.patrolEndX && this.velocity.x > 0) {
      this.velocity.x = -CEBO_X_VELOCITY; this.facing = 'left';
    } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
      this.velocity.x = CEBO_X_VELOCITY; this.facing = 'right';
    }

    // física vertical (pulinhos)
    this.velocity.y += CEBO_GRAVITY * dt;
    this.position.y += this.velocity.y * dt;

    // toca o chão → corre + agenda novo pulo
    if (this.position.y >= this.groundY) {
      this.position.y = this.groundY;
      this.velocity.y = 0;

      this._switchState('run');
      this.jumpTimer -= dt;
      if (this.jumpTimer <= 0) {
        this.velocity.y = -CEBO_JUMP_POWER;  // pequeno pulo
        this._switchState('air');
        this.jumpTimer = CEBO_HOP_GAP;
      }
    } else {
      // no ar
      this._switchState('air');
    }

    this.updateAnimation(dt);

    // hitbox
    this.hitbox.position.x = this.position.x + 6;
    this.hitbox.position.y = this.position.y + 6;
  }

  draw(context) {
    const frameX = this.currentFrame * this.frameWidth;

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
