// cebolete.js (Modificado para Atirar)

// Movimento
const CEBO_X_VELOCITY   = 18;    // px/s (horizontal)
const CEBO_GRAVITY      = 220;   // px/s² (gravidade)
const CEBO_JUMP_POWER   = 60;    // px/s  (impulso do pulo)
const CEBO_HOP_GAP      = 0.2;   // s     (intervalo entre pulos)

// Animação
const CEBO_RUN_FRAME_MS   = 120; // ms (corrida)
const CEBO_AIR_FRAME_MS   = 120; // ms (no ar)
const CEBO_ATTACK_FRAME_MS = 100; // ms (ataque)

// Ataque
const CEBO_ATTACK_COOLDOWN = 2.5;  // s (tempo entre ataques)
const CEBO_ATTACK_FRAME_TO_SHOOT = 3; // Dispara a semente no frame 3 da animação

class Cebolete {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    // posição e velocidade
    this.position = { x, y };
    this.velocity = { x: CEBO_X_VELOCITY, y: 0 };

    // dimensões desenhadas (reduzido)
    this.width  = 20;
    this.height = 20;

    // baseline
    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;

    // patrulha
    this.patrolStartX = patrolStartX;
    this.patrolEndX   = patrolEndX;
    this.facing = 'right'; // 'right' ou 'left'

    // estado/anim
    this.state         = 'run';
    this.frameWidth    = 32;
    this.frameHeight   = 32;
    this.currentFrame  = 0;
    this.elapsedMs     = 0;
    this.frameInterval = CEBO_RUN_FRAME_MS;

    // sprites
    this.images = {
      run:    new Image(),
      jump:   new Image(),
      attack: new Image() // (NOVO)
    };
    // Corrigindo o caminho (barra normal /)
    this.images.run.src    = './Sprite Pack 8/3 - Cebolete/Running (32 x 32).png';
    this.images.jump.src   = './Sprite Pack 8/3 - Cebolete/Jump (32 x 32).png';
    this.images.attack.src = './Sprite Pack 8/3 - Cebolete/Flower_Whip_Attack (32 x 32).png'; // (NOVO)

    // total de frames
    this.totalFrames = { run: 6, jump: 1, attack: 5 }; // (NOVO: attack: 5)
    this.image = this.images.run;

    // pulo curto
    this.hopTimer = CEBO_HOP_GAP;

    // (NOVO) Ataque
    this.projectiles = []; // Armazena as sementes
    this.attackCooldown = 0.0; // Temporizador
    this.hasFired = false; // Controle para atirar só uma vez por animação

    // hitbox
    this.hitbox = {
      position: { x: this.position.x + 6, y: this.position.y + 6 },
      width: 20,
      height: 20
    };
  }

  // (MODIFICADO) Troca de estado
  switchState(state) {
    if (this.state === state) return;
    this.state = state;
    this.currentFrame  = 0;
    this.elapsedMs     = 0;

    switch (state) {
      case 'run':
        this.image = this.images.run;
        this.frameInterval = CEBO_RUN_FRAME_MS;
        break;
      case 'air':
        this.image = this.images.jump;
        this.frameInterval = CEBO_AIR_FRAME_MS;
        break;
      case 'attack': // (NOVO)
        this.image = this.images.attack;
        this.frameInterval = CEBO_ATTACK_FRAME_MS;
        this.hasFired = false; // Reseta o controle de tiro
        break;
    }
  }

  // (MODIFICADO) Controla a animação e os gatilhos
  updateAnimation(dt) {
    this.elapsedMs += dt * 1000;

    if (this.elapsedMs >= this.frameInterval) {
      this.elapsedMs -= this.frameInterval;
      this.currentFrame = this.currentFrame + 1;

      let maxFrames = 0;
      if (this.state === 'run') maxFrames = this.totalFrames.run;
      else if (this.state === 'air') maxFrames = this.totalFrames.jump;
      else if (this.state === 'attack') maxFrames = this.totalFrames.attack;

      // (NOVO) Gatilho de atirar no meio da animação
      if (this.state === 'attack' && 
          this.currentFrame === CEBO_ATTACK_FRAME_TO_SHOOT && 
          !this.hasFired) {
            
        this.spawnSeed();
        this.hasFired = true;
      }

      // Se a animação terminou
      if (this.currentFrame >= maxFrames) {
        this.currentFrame = 0;
        // (NOVO) Se a animação de ataque terminou, volta a correr
        if (this.state === 'attack') {
          this.switchState('run');
        }
      }
    }
  }

  // (NOVO) Inicia o ataque
  shoot() {
    // Não ataca se estiver no ar ou em cooldown
    if (this.attackCooldown > 0 || this.state === 'air') return;
    
    this.switchState('attack');
    this.velocity.x = 0; // Para de andar
    this.attackCooldown = CEBO_ATTACK_COOLDOWN; // Reinicia o cooldown
  }

  // (NOVO) Cria a semente
  spawnSeed() {
    // Define a posição inicial da semente
    const seedX = (this.facing === 'right') 
      ? this.position.x + this.width   // Lado direito
      : this.position.x - 8;          // Lado esquerdo (8 = largura da semente)
      
    // Posição Y (centro do corpo)
    const seedY = this.position.y + 10; 
    
    const seed = new SeedProjectile({
      position: { x: seedX, y: seedY },
      direction: (this.facing === 'right' ? 1 : -1)
    });
    
    this.projectiles.push(seed);
  }

  // (MODIFICADO) Lógica principal
  update(dt) {
    if (!dt) return;

    // 1. Atualiza o cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // 2. Atualiza a animação (que pode disparar o 'spawnSeed')
    this.updateAnimation(dt);

    // 3. Lógica de estado
    if (this.state === 'attack') {
      // Se está atacando, fica parado e espera a gravidade
      this.velocity.y += CEBO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;
      
      // Checa o chão (para não cair)
      const bottom = this.position.y + this.height;
      if (bottom >= this.groundBottom) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
      }

    } else {
      // Se NÃO está atacando (run ou air), faz a patrulha e pulos

      // Patrulha horizontal
      this.velocity.x = (this.facing === 'right' ? CEBO_X_VELOCITY : -CEBO_X_VELOCITY);
      this.position.x += this.velocity.x * dt;

      if (this.position.x + this.width >= this.patrolEndX && this.velocity.x > 0) {
        this.facing = 'left';
      } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
        this.facing = 'right';
      }

      // Física vertical (pulos curtos)
      this.velocity.y += CEBO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      // Colisão com o "chão"
      const bottom = this.position.y + this.height;
      if (bottom >= this.groundBottom) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
        this.switchState('run');

        // Decide se ataca ou pula
        if (this.attackCooldown <= 0) {
          this.shoot(); // Hora de atacar
        } else {
          // Se não pode atacar, faz o pulinho
          this.hopTimer -= dt;
          if (this.hopTimer <= 0) {
            this.velocity.y = -CEBO_JUMP_POWER;
            this.switchState('air');
            this.hopTimer = CEBO_HOP_GAP;
          }
        }
      } else {
        // No ar
        this.switchState('air');
      }
    }

    // 4. Atualiza os projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const seed = this.projectiles[i];
      seed.update(dt);
      
      // Remove sementes que saíram da tela (distância de 400px do Cebolete)
      if (seed.position.x < this.position.x - 400 || 
          seed.position.x > this.position.x + 400) {
        this.projectiles.splice(i, 1);
      }
    }

    // 5. Atualiza a hitbox
    this.hitbox.position.x = this.position.x + 6;
    this.hitbox.position.y = this.position.y + 6;
  }

  // (MODIFICADO) Desenha o Cebolete e suas sementes
  draw(context) {
    if (!this.image || !this.image.complete) return;

    let frames = 0;
    if (this.state === 'run') frames = this.totalFrames.run;
    else if (this.state === 'air') frames = this.totalFrames.jump;
    else if (this.state === 'attack') frames = this.totalFrames.attack;

    const safeFrame = frames > 0 ? (this.currentFrame % frames) : 0;
    const frameX = safeFrame * this.frameWidth;

    // Desenha o Cebolete
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

    // (NOVO) Desenha os projéteis
    for (const seed of this.projectiles) {
      seed.draw(context);
    }
  }
}