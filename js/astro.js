const ASTRO_X_VELOCITY = 15; // Velocidade de movimento do Astro

class Astro {
  constructor({ x, y, patrolStartX = 148, patrolEndX = 231 }) {
    this.position = { x: x, y: y };
    // Começa movendo para a esquerda
    this.velocity = { x: -ASTRO_X_VELOCITY, y: 0 };
    this.width = 32;  // Largura do frame do sprite
    this.height = 32; // Altura do frame do sprite
    this.isImageLoaded = false;
    this.image = new Image();
    this.image.onload = () => {
      this.isImageLoaded = true;
    };
    // Caminho para a imagem do Astro
    // (use "Running (32 x 32).png" se for o nome no seu asset)
    this.image.src = './Sprite Pack 8/1 - Astro/Run (32 x 32).png';

    this.elapsedTime = 0;
    this.currentFrame = 0;
    this.totalFrames = 6;   // A imagem Run (32x32).png tem 6 frames
    this.frameWidth = 32;   // Largura de cada frame na imagem
    this.frameHeight = 32;  // Altura de cada frame na imagem

    this.facing = 'left'; // Direção inicial (começa pela esquerda)

    // Limites de patrulha (agora configuráveis)
    this.patrolStartX = patrolStartX;
    this.patrolEndX   = patrolEndX;

    // Hitbox (ajuste se necessário para colisões futuras)
    this.hitbox = {
      position: { x: this.position.x + 6, y: this.position.y + 6 }, // Offset da hitbox
      width: 20,
      height: 20,
    };
  }

  // Desenha o frame correto do Astro
  draw(context) {
    if (!this.isImageLoaded) return;

    const frameX = this.currentFrame * this.frameWidth;
    const frameY = 0; // A imagem só tem uma linha de frames

    context.save(); // Salva o estado atual do contexto

    // Se estiver virado para a esquerda, inverte o desenho horizontalmente
    if (this.facing === 'left') {
      context.scale(-1, 1); // Inverte horizontalmente
      context.drawImage(
        this.image,
        frameX, frameY, this.frameWidth, this.frameHeight,
        -this.position.x - this.width, // Posição X invertida
        this.position.y,
        this.width, this.height
      );
    } else {
      // Desenho normal (virado para a direita)
      context.drawImage(
        this.image,
        frameX, frameY, this.frameWidth, this.frameHeight,
        this.position.x, this.position.y,
        this.width, this.height
      );
    }

    context.restore();
  }

  // Atualiza a animação do sprite
  updateAnimation(deltaTime) {
    this.elapsedTime += deltaTime * 1000; // deltaTime em segundos -> ms
    const frameInterval = 100; // ms por frame

    if (this.elapsedTime > frameInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.elapsedTime -= frameInterval;
    }
  }

  // Atualiza a posição e direção do Astro
  update(deltaTime) {
    if (!deltaTime) return;

    // Atualiza animação
    this.updateAnimation(deltaTime);

    // Movimento horizontal
    this.position.x += this.velocity.x * deltaTime;

    // Verifica limites da patrulha
    if (this.position.x + this.width >= this.patrolEndX && this.velocity.x > 0) {
      // Chegou ao limite direito, inverte a direção
      this.velocity.x = -ASTRO_X_VELOCITY;
      this.facing = 'left';
    } else if (this.position.x <= this.patrolStartX && this.velocity.x < 0) {
      // Chegou ao limite esquerdo, inverte a direção
      this.velocity.x = ASTRO_X_VELOCITY;
      this.facing = 'right';
    }

    // Atualiza posição da hitbox
    this.hitbox.position.x = this.position.x + 6;
    this.hitbox.position.y = this.position.y + 6;
  }
}
