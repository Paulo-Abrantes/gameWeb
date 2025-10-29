// --- FUNÇÕES DE COLISÃO ---
// Essas funções servem pra saber se dois objetos estão se encostando
// Uma verifica colisão em todos os lados e a outra só quando o jogador pisa em cima

// Detecta colisão completa (todos os lados)
function collision({ object1, object2 }) {
  return (
    object1.position.y + object1.height >= object2.position.y &&
    object1.position.y <= object2.position.y + object2.height &&
    object1.position.x <= object2.position.x + object2.width &&
    object1.position.x + object1.width >= object2.position.x
  );
}

// Detecta colisão apenas quando o jogador cai sobre uma plataforma
function platformCollision({ object1, object2 }) {
  return (
    object1.position.y + object1.height >= object2.position.y &&
    object1.position.y + object1.height <=
      object2.position.y + object2.height &&
    object1.position.x <= object2.position.x + object2.width &&
    object1.position.x + object1.width >= object2.position.x
  );
}

// Classe que representa o fundo (background)
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

  // Desenha a imagem de fundo no canvas
  draw(context) {
    if (this.image) {
      context.drawImage(this.image, this.position.x, this.position.y);
    }
  }
}

// Classe que representa uma plataforma (chão ou bloco)
class Platform {
  constructor({ position, image, cropbox }) {
    this.position = position;
    this.image = image;
    this.width = cropbox.width;
    this.height = cropbox.height;
    this.cropbox = cropbox;
  }

  // Desenha a plataforma no lugar certo, cortando a parte certa do tileset
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

// --- CLASSE PLAYER ---
// Essa é a parte mais importante: controla o jogador e suas colisões
class Player {
  constructor() {
    this.position = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.width = 16;
    this.height = 16;
    this.isOnGround = false;
    this.gravity = 0.5;
    this.direction = 1; // 1 = direita | -1 = esquerda

    this.animations = {
      idle: {
        src: "./Sprite Pack 8/2 - Tracy/Idle_1 (32 x 32).png",
        frames: 5,
      },
      run: { src: "./Sprite Pack 8/2 - Tracy/Run (32 x 32).png", frames: 6 },
      jump: { src: "./Sprite Pack 8/2 - Tracy/Jump (32 x 32).png", frames: 1 },
      fall: {
        src: "./Sprite Pack 8/2 - Tracy/Falling (32 x 32).png",
        frames: 1,
      },
      attack: {
        src: "./Sprite Pack 8/2 - Tracy/Standing_Crossbow_Shot (32 x 32).png",
        frames: 4,
      },
      reload: {
        src: "./Sprite Pack 8/2 - Tracy/Reloading_Crossbow (32 x 32).png",
        frames: 16,
      },
    };

    this.currentState = "idle";
    this.frameX = 0;
    this.frameTimer = 0;
    this.frameInterval = 10;
    this.image = new Image();
    this.image.src = this.animations[this.currentState].src;
    this.maxFrames = this.animations[this.currentState].frames;
    this.frameWidth = 32;
    this.frameHeight = 32;

    this.cooldown = 0; // tempo entre disparos
    this.projectiles = []; // flechas ativas

    //carrega o sprite do player
    this.image = new Image();
    this.image.src = "./Sprite Pack 8/2 - Tracy/Idle_1 (32 x 32).png";

    //animação
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrames = 5;
    this.frameWidth = 32;
    this.frameHeight = 32;
    this.frameTimer = 0;
    this.frameInterval = 10;

    /* // A hitbox é a "caixa" que detecta colisões do jogador
    this.hitbox = {
      position: this.position,
      width: this.width,
      height: this.height,
    }; */
  }

  switchState(state) {
    if (this.currentState !== state) {
      this.currentState = state;
      this.image.src = this.animations[state].src;
      this.maxFrames = this.animations[state].frames;
      this.frameX = 0;
      this.frameTimer = 0;
    }
  }

  // aplica gravidade
  applyGravity() {
    this.velocity.y += this.gravity;
    this.position.y += this.velocity.y;
  }

  move(input) {
    this.velocity.x = 0;
    if (input.left) {
      this.velocity.x = -2;
      this.direction = -1;
    } else if (input.right) {
      this.velocity.x = 2;
      this.direction = 1;
    }

    //movimento vertical
    if (input.jump && this.isOnGround) {
      this.velocity.y = -8;
      this.isOnGround = false;
    }
    // Atualiza estado de animação conforme o movimento
    if (!this.isOnGround) {
      if (this.velocity.y < 0) this.switchState("jump");
      else this.switchState("fall");
    } else if (this.velocity.x !== 0) {
      this.switchState("run");
    } else {
      this.switchState("idle");
    }
  }

  attack() {
    if (this.cooldown > 0) return; // impede spam
    this.switchState("attack");
    this.cooldown = 50; // frames de espera antes de poder atacar de novo

    // Cria flecha
    const arrow = new Projectile({
      position: {
        x: this.position.x + (this.direction === 1 ? this.width : -10),
        y: this.position.y + this.height / 2 - 4,
      },
      direction: this.direction,
    });
    this.projectiles.push(arrow);
  }

  reload() {
    this.switchState("reload");
    this.cooldown = 80;
  }

  // atualiza a hitbox do jogador
  updateHitbox() {
    this.hitbox = {
      position: this.position,
      width: this.width,
      height: this.height,
    };
  }

  animate() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameInterval) {
      this.frameX = (this.frameX + 1) % this.maxFrames;
      this.frameTimer = 0;
    }
  }

  draw(context) {
    const flip = this.direction === -1;

    context.save();
    if (flip) {
      context.scale(-1, 1);
      context.drawImage(
        this.image,
        this.frameX * this.frameWidth,
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
        this.frameX * this.frameWidth,
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

  // --- LÓGICA DE COLISÃO HORIZONTAL ---
  // Impede o jogador de atravessar blocos sólidos pelos lados
  checkForHorizontalCollisions({ solidPlatforms = [] }) {
    for (let i = 0; i < solidPlatforms.length; i++) {
      const platform = solidPlatforms[i];

      if (collision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.x > 0) {
          // indo pra direita
          this.velocity.x = 0;
          this.position.x = platform.position.x - this.hitbox.width - 0.01;
          break;
        }
        if (this.velocity.x < 0) {
          // indo pra esquerda
          this.velocity.x = 0;
          this.position.x = platform.position.x + platform.width + 0.01;
          break;
        }
      }
    }
  }

  // --- LÓGICA DE COLISÃO VERTICAL ---
  // Detecta quando o jogador cai em cima ou bate a cabeça
  checkForVerticalCollisions({
    worldHeight,
    platforms = [],
    solidPlatforms = [],
  }) {
    this.isOnGround = false; // assume que o jogador está no ar

    // Primeiro verifica blocos sólidos (colidem em todos os lados)
    for (let i = 0; i < solidPlatforms.length; i++) {
      const platform = solidPlatforms[i];

      if (collision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.y > 0) {
          // caindo
          this.velocity.y = 0;
          this.position.y = platform.position.y - this.hitbox.height - 0.01;
          this.isOnGround = true;
          break;
        }
        if (this.velocity.y < 0) {
          // batendo a cabeça
          this.velocity.y = 0;
          this.position.y = platform.position.y + platform.height + 0.01;
          break;
        }
      }
    }

    // Se já aterrissou, não precisa checar mais nada
    if (this.isOnGround) return;

    // Depois verifica as plataformas normais (colidem só por cima)
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];

      if (platformCollision({ object1: this.hitbox, object2: platform })) {
        if (this.velocity.y > 0) {
          // caindo em cima
          this.velocity.y = 0;
          this.position.y = platform.position.y - this.hitbox.height - 0.01;
          this.isOnGround = true;
          break;
        }
      }
    }

    // Se não achou nenhuma plataforma, verifica o "chão" do mundo
    if (!this.isOnGround && this.position.y + this.height >= worldHeight) {
      this.velocity.y = 0;
      this.position.y = worldHeight - this.height;
      this.isOnGround = true;
    }
  }

  // --- FUNÇÃO PRINCIPAL DE ATUALIZAÇÃO ---
  // Essa função roda a cada frame e controla todo o comportamento do jogador
  update(worldHeight, worldWidth, platforms = [], solidPlatforms = [], input) {
    // movimentação e física
    this.move(input);
    this.position.x += this.velocity.x;
    this.applyGravity();
    this.isOnGround = false;

    // colisões básicas
    for (const platform of [...platforms, ...solidPlatforms]) {
      if (
        this.position.y + this.height >= platform.position.y &&
        this.position.y + this.height <=
          platform.position.y + platform.height &&
        this.position.x + this.width >= platform.position.x &&
        this.position.x <= platform.position.x + platform.width &&
        this.velocity.y >= 0
      ) {
        this.position.y = platform.position.y - this.height;
        this.velocity.y = 0;
        this.isOnGround = true;
      }
    }

    if (this.cooldown > 0) this.cooldown--;

    // Atualiza e desenha as flechas
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const arrow = this.projectiles[i];
      arrow.update();
      if (arrow.position.x < 0 || arrow.position.x > worldWidth) {
        this.projectiles.splice(i, 1); // remove flechas fora da tela
      } else {
        arrow.draw(context);
      }
    }

    this.animate();
    this.draw(context);
  }
}

class Projectile {
  constructor({ position, direction }) {
    this.position = position;
    this.direction = direction;
    this.speed = 5 * direction;
    this.width = 16;
    this.height = 4;

    this.image = new Image();
    this.image.src = "./sprites/projectiles/arrow.png";
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
