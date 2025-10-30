// movimentos/comportamento do inimigo astro
const ASTRO_X_VELOCITY = 15;
const ASTRO_GRAVITY = 60;
const ASTRO_JUMP_POWER = 60;
const ASTRO_HOP_GAP = 0.25;

//distancia, cooldown, velocidade e frame do soco
const ASTRO_ATTACK_RANGE = 30;
const ASTRO_ATTACK_COOLDOWN = 2.0;
const ASTRO_PUNCH_FRAME_MS = 80;
const ASTRO_PUNCH_ACTIVE_FRAME = 3;

class Astro {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    this.position = { x, y };
    this.velocity = { x: -ASTRO_X_VELOCITY, y: 0 };

    // escala e dimensoes
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.width = 20;
    this.height = 20;

    // alinhamento com o chao
    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;

    // estado inicial
    this.facing = 'left';
    this.state = 'run'; // 'run', 'air', 'attack'

    // animacao
    this.elapsedMs = 0;
    this.currentFrame = 0;
    this.frameInterval = 90;

    // carrega sprites
    this.images = {
      run: new Image(),
      jump: new Image(),
      attack: new Image()
    };
    this.images.run.src = './Sprite Pack 8/1 - Astro/Run (32 x 32).png';
    this.images.jump.src = './Sprite Pack 8/1 - Astro/Jump (32 x 32).png';
    this.images.attack.src = './Sprite Pack 8/1 - Astro/Half_Health_Punch (32 x 32).png';
    this.image = this.images.run;

    this.totalFrames = { run: 6, jump: 1, attack: 7 }; // Soco tem 7 frames

    // patrulha
    this.patrolStartX = patrolStartX;
    this.patrolEndX = patrolEndX;
    this.hopTimer = ASTRO_HOP_GAP;

    // logica de ataque
    this.attackCooldown = 0.0;
    this.attackHitbox = {
      position: { x: 0, y: 0 },
      width: 10,  // largura soco
      height: 5, // altura soco
      isActive: false
    };

    // hitbox principal (para pisar)
    this.hitbox = {
      position: { x: this.position.x + 3, y: this.position.y + 3 },
      width: 14,
      height: 14,
    };
  }

  // gerencia estados (run, air, attack)
  switchState(state) {
    if (this.state === state) return;
    this.state = state;
    this.currentFrame = 0;
    this.elapsedMs = 0;

    switch (state) {
      case 'run':
        this.image = this.images.run;
        this.frameInterval = 90; // ms
        break;
      case 'air':
        this.image = this.images.jump;
        this.frameInterval = 120; // ms
        break;
      case 'attack':
        this.image = this.images.attack;
        this.frameInterval = ASTRO_PUNCH_FRAME_MS;
        this.attackHitbox.isActive = false; // garante hitbox inativa
        break;
    }
  }

  // posiciona a hitbox do soco
  activatePunchHitbox() {
    // pos Y (meio)
    this.attackHitbox.position.y = this.position.y + (this.height / 2) - (this.attackHitbox.height / 2);
    
    // pos X (depende da direcao)
    if (this.facing === 'right') {
      this.attackHitbox.position.x = this.position.x + this.width;
    } else { // 'left'
      this.attackHitbox.position.x = this.position.x - this.attackHitbox.width;
    }
    this.attackHitbox.isActive = true;
  }

  // checa se player esta perto e inicia ataque
  attemptAttack(player) {
    if (this.attackCooldown > 0 || this.state !== 'run') return false;

    // calcula distancia
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distanceX = Math.abs(dx);
    const distanceY = Math.abs(dy);

    // se player perto e astro no chao
    if (distanceX < ASTRO_ATTACK_RANGE && distanceY < (this.height * 2) && this.state === 'run') {
      // vira para o jogador
      this.facing = (dx > 0) ? 'right' : 'left';
      
      this.switchState('attack');
      this.velocity.x = 0; // para de andar
      this.attackCooldown = ASTRO_ATTACK_COOLDOWN; // reinicia cooldown
      return true; // atacou
    }
    return false; // nao atacou
  }

  // animacao e gatilho do soco
  updateAnimation(dt, player) {
    this.elapsedMs += dt * 1000;
    
    let frames = 0;
    if (this.state === 'run') frames = this.totalFrames.run;
    else if (this.state === 'air') frames = this.totalFrames.jump;
    else if (this.state === 'attack') frames = this.totalFrames.attack;

    if (frames === 0) return;

    if (this.elapsedMs >= this.frameInterval) {
      this.elapsedMs -= this.frameInterval;
      this.currentFrame = (this.currentFrame + 1);

      // logica do soco
      if (this.state === 'attack') {
        if (this.currentFrame === ASTRO_PUNCH_ACTIVE_FRAME) {
          // ativa hitbox e checa colisao no frame exato
          this.activatePunchHitbox();
          
          if (this.attackHitbox.isActive && collision({ object1: this.attackHitbox, object2: player.hitbox })) {
            console.log("ASTRO ATINGIU O JOGADOR!");
            // (logica de dano ao player aqui)
            this.attackHitbox.isActive = false; // desativa p/ nao dar hit duplo
          }
        } else {
          // garante hitbox ativa so no frame certo
          this.attackHitbox.isActive = false;
        }
      }

      // reset de frame
      if (this.currentFrame >= frames) {
        this.currentFrame = 0; // reinicia animacao
        if (this.state === 'attack') {
          this.switchState('run'); // terminou soco, volta a correr
        }
      }
    }
  }

  // logica principal
  update(dt, player) {
    if (!dt) return; // player vem do game.js

    // 1. atualiza cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // 2. atualiza animacao (e checa soco)
    this.updateAnimation(dt, player);

    // 3. logica de estado
    if (this.state === 'attack') {
      // atacando: fica parado, so gravidade
      this.velocity.y += ASTRO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      // toca o chao
      if (this.position.y >= this.groundBottom - this.height) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
      }
    } else {
      // nao atacando (run/air): tenta atacar ou se move
      
      // tenta iniciar ataque (so no chao)
      const didAttack = this.attemptAttack(player);

      if (!didAttack) {
        // 4. se nao atacou, patrulha e pulos
        
        // movimento horizontal
        this.velocity.x = (this.facing === 'right') ? ASTRO_X_VELOCITY : -ASTRO_X_VELOCITY;
        this.position.x += this.velocity.x * dt;

        // patrulha lateral
        if (this.position.x + this.width >= this.patrolEndX && this.velocity.x > 0) {
          this.velocity.x = -ASTRO_X_VELOCITY;
          this.facing = 'left';
        } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
          this.velocity.x = ASTRO_X_VELOCITY;
          this.facing = 'right';
        }

        // fisica vertical (pulinhos)
        this.velocity.y += ASTRO_GRAVITY * dt;
        this.position.y += this.velocity.y * dt;

        // toca o chao -> reinicia pulo
        if (this.position.y >= this.groundBottom - this.height) {
          this.position.y = this.groundBottom - this.height;
          this.velocity.y = 0;
          this.switchState('run');

          // timer do pulo
          this.hopTimer -= dt;
          if (this.hopTimer <= 0) {
            this.velocity.y = -ASTRO_JUMP_POWER;
            this.switchState('air');
            this.hopTimer = ASTRO_HOP_GAP;
          }
        } else {
          this.switchState('air');
        }
      }
    }
    
    // 5. atualiza hitbox principal (para pisar)
    this.hitbox.position.x = this.position.x + 3;
    this.hitbox.position.y = this.position.y + 3;
  }

  // desenha o astro
  draw(context) {
    if (!this.image || !this.image.complete) return;

    // pega total de frames do estado atual
    let frames = 0;
    if (this.state === 'run') frames = this.totalFrames.run;
    else if (this.state === 'air') frames = this.totalFrames.jump;
    else if (this.state === 'attack') frames = this.totalFrames.attack;

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