// --- CLASSE Astro (Modificada para Atacar) ---

// --- CONSTANTES DE MOVIMENTO ---
const ASTRO_X_VELOCITY = 15;   // Velocidade horizontal (px/s)
const ASTRO_GRAVITY = 60;      // Gravidade (px/s²)
const ASTRO_JUMP_POWER = 60;   // Força do pulo (px/s)
const ASTRO_HOP_GAP = 0.25;    // Intervalo entre pulos (s)

// --- CONSTANTES DE ATAQUE (NOVO) ---
const ASTRO_ATTACK_RANGE = 30;     // Distância (px) para o Astro decidir atacar
const ASTRO_ATTACK_COOLDOWN = 2.0; // Cooldown de 2s entre socos
const ASTRO_PUNCH_FRAME_MS = 80;   // Velocidade da animação de soco (ms)
const ASTRO_PUNCH_ACTIVE_FRAME = 3;// Frame da animação que causa dano (0-6)

class Astro {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    this.position = { x, y };
    this.velocity = { x: -ASTRO_X_VELOCITY, y: 0 };

    // Escala e dimensões
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.width = 20;
    this.height = 20;

    // Alinhamento com o chão
    this.spriteBaselineHeight = 32;
    this.groundBottom = y + this.spriteBaselineHeight;

    // Estado inicial
    this.facing = 'left';
    this.state = 'run'; // 'run', 'air', 'attack'

    // Controle de animação
    this.elapsedMs = 0;
    this.currentFrame = 0;
    this.frameInterval = 90;

    // (MODIFICADO) Carrega sprites
    this.images = {
      run: new Image(),
      jump: new Image(),
      attack: new Image() // (NOVO)
    };
    this.images.run.src = './Sprite Pack 8/1 - Astro/Run (32 x 32).png';
    this.images.jump.src = './Sprite Pack 8/1 - Astro/Jump (32 x 32).png';
    // (NOVO) Caminho do soco (usei o que você indicou)
    this.images.attack.src = './Sprite Pack 8/1 - Astro/Half_Health_Punch (32 x 32).png';
    this.image = this.images.run;

    // (MODIFICADO) Total de frames
    this.totalFrames = { run: 6, jump: 1, attack: 7 }; // Soco tem 7 frames

    // Patrulha
    this.patrolStartX = patrolStartX;
    this.patrolEndX = patrolEndX;
    this.hopTimer = ASTRO_HOP_GAP;

    // (NOVO) Lógica de Ataque
    this.attackCooldown = 0.0;
    this.attackHitbox = {
      position: { x: 0, y: 0 },
      width: 10,  // Largura do soco
      height: 5, // Altura do soco
      isActive: false
    };

    // Hitbox principal (para ser pisado)
    this.hitbox = {
      position: { x: this.position.x + 3, y: this.position.y + 3 },
      width: 14,
      height: 14,
    };
  }

  // (MODIFICADO) Gerencia os estados, incluindo 'attack'
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
      case 'attack': // (NOVO)
        this.image = this.images.attack;
        this.frameInterval = ASTRO_PUNCH_FRAME_MS;
        this.attackHitbox.isActive = false; // Garante que a hitbox de soco comece inativa
        break;
    }
  }

  // (NOVO) Posiciona a hitbox do soco na frente do Astro
  activatePunchHitbox() {
    // Posição Y (meio do corpo)
    this.attackHitbox.position.y = this.position.y + (this.height / 2) - (this.attackHitbox.height / 2);
    
    // Posição X (depende da direção)
    if (this.facing === 'right') {
      this.attackHitbox.position.x = this.position.x + this.width;
    } else { // 'left'
      this.attackHitbox.position.x = this.position.x - this.attackHitbox.width;
    }
    this.attackHitbox.isActive = true;
  }

  // (NOVO) Verifica se o player está próximo e inicia o ataque
  attemptAttack(player) {
    if (this.attackCooldown > 0 || this.state !== 'run') return false;

    // Calcula a distância do jogador
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    // Usamos distância X e Y separadas para criar uma "área" de detecção
    const distanceX = Math.abs(dx);
    const distanceY = Math.abs(dy);

    // Se o player está perto, no mesmo nível, e o Astro está no chão
    if (distanceX < ASTRO_ATTACK_RANGE && distanceY < (this.height * 2) && this.state === 'run') {
      // Vira para o jogador
      this.facing = (dx > 0) ? 'right' : 'left';
      
      this.switchState('attack');
      this.velocity.x = 0; // Para de andar para atacar
      this.attackCooldown = ASTRO_ATTACK_COOLDOWN; // Reinicia o cooldown
      return true; // Conseguiu atacar
    }
    return false; // Não atacou
  }

  // (MODIFICADO) Animação agora também checa o frame de soco
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

      // (NOVO) Lógica do soco
      if (this.state === 'attack') {
        if (this.currentFrame === ASTRO_PUNCH_ACTIVE_FRAME) {
          // Ativa a hitbox e checa colisão no exato frame do soco
          this.activatePunchHitbox();
          
          if (this.attackHitbox.isActive && collision({ object1: this.attackHitbox, object2: player.hitbox })) {
            console.log("ASTRO ATINGIU O JOGADOR!");
            // (Aqui entraria a lógica de dano ao jogador, ex: player.takeDamage())
            this.attackHitbox.isActive = false; // Desativa para não dar hit duplo
          }
        } else {
          // Garante que a hitbox só fique ativa no frame certo
          this.attackHitbox.isActive = false;
        }
      }

      // (MODIFICADO) Reset de frame
      if (this.currentFrame >= frames) {
        this.currentFrame = 0; // Reinicia a animação
        if (this.state === 'attack') {
          this.switchState('run'); // Terminou o soco, volta a correr
        }
      }
    }
  }

  // (MODIFICADO) Lógica principal de update
  update(dt, player) {
    if (!dt) return; // 'player' é passado pelo game.js

    // 1. Atualiza cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // 2. Atualiza animação (e checa colisão do soco)
    this.updateAnimation(dt, player);

    // 3. Lógica de Estado
    if (this.state === 'attack') {
      // Se está atacando, fica parado (this.velocity.x = 0)
      // e só sofre gravidade.
      this.velocity.y += ASTRO_GRAVITY * dt;
      this.position.y += this.velocity.y * dt;

      // Toca o chão
      if (this.position.y >= this.groundBottom - this.height) {
        this.position.y = this.groundBottom - this.height;
        this.velocity.y = 0;
      }
    } else {
      // Se não está atacando ('run' or 'air'), tenta atacar ou se move.
      
      // Tenta iniciar um ataque (só funciona se estiver no chão 'run')
      const didAttack = this.attemptAttack(player);

      if (!didAttack) {
        // 4. Se não atacou, faz a patrulha e pulos (lógica original)
        
        // Movimento horizontal
        this.velocity.x = (this.facing === 'right') ? ASTRO_X_VELOCITY : -ASTRO_X_VELOCITY;
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

          // Timer do pulo
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
    
    // 5. Atualiza hitbox principal (para ser pisado)
    this.hitbox.position.x = this.position.x + 3;
    this.hitbox.position.y = this.position.y + 3;
  }

  // (MODIFICADO) Desenha o Astro
  draw(context) {
    if (!this.image || !this.image.complete) return;

    // Pega o total de frames do estado atual
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

    // --- DEBUG: Descomente para ver a hitbox do soco ---
    /*
    if (this.attackHitbox.isActive) {
      context.save();
      context.fillStyle = 'rgba(255, 0, 0, 0.5)';
      context.fillRect(
        this.attackHitbox.position.x,
        this.attackHitbox.position.y,
        this.attackHitbox.width,
        this.attackHitbox.height
      );
      context.restore();
    }
    */
    // --- FIM DEBUG ---
  }
}