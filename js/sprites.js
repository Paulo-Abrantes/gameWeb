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
    object1.position.y + object1.height <= object2.position.y + object2.height &&
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

        // A hitbox é a "caixa" que detecta colisões do jogador
        this.hitbox = {
            position: this.position,
            width: this.width,
            height: this.height,
        };
    }

    // Desenha o jogador como um quadrado branco
    draw(context) {
        context.fillStyle = 'white';
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Atualiza a hitbox do jogador
    updateHitbox() {
        this.hitbox = {
            position: this.position,
            width: this.width,
            height: this.height,
        };
    }

    // Faz o jogador cair (aplica a gravidade)
    applyGravity() {
        this.velocity.y += this.gravity;
        this.position.y += this.velocity.y;
    }

    // --- LÓGICA DE COLISÃO HORIZONTAL ---
    // Impede o jogador de atravessar blocos sólidos pelos lados
    checkForHorizontalCollisions({ solidPlatforms = [] }) {
        for (let i = 0; i < solidPlatforms.length; i++) {
            const platform = solidPlatforms[i];
            
            if (collision({ object1: this.hitbox, object2: platform })) {
                if (this.velocity.x > 0) { // indo pra direita
                    this.velocity.x = 0;
                    this.position.x = platform.position.x - this.hitbox.width - 0.01;
                    break;
                }
                if (this.velocity.x < 0) { // indo pra esquerda
                    this.velocity.x = 0;
                    this.position.x = platform.position.x + platform.width + 0.01;
                    break;
                }
            }
        }
    }

    // --- LÓGICA DE COLISÃO VERTICAL ---
    // Detecta quando o jogador cai em cima ou bate a cabeça
    checkForVerticalCollisions({ worldHeight, platforms = [], solidPlatforms = [] }) {
        this.isOnGround = false; // assume que o jogador está no ar

        // Primeiro verifica blocos sólidos (colidem em todos os lados)
        for (let i = 0; i < solidPlatforms.length; i++) {
            const platform = solidPlatforms[i];
            
            if (collision({ object1: this.hitbox, object2: platform })) {
                if (this.velocity.y > 0) { // caindo
                    this.velocity.y = 0;
                    this.position.y = platform.position.y - this.hitbox.height - 0.01;
                    this.isOnGround = true;
                    break;
                }
                if (this.velocity.y < 0) { // batendo a cabeça
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
                if (this.velocity.y > 0) { // caindo em cima
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
    update(worldHeight, worldWidth, platforms = [], solidPlatforms = []) {
        // 1. Atualiza movimento horizontal
        this.position.x += this.velocity.x;
        this.updateHitbox();

        // 2. Checa colisão horizontal (com blocos sólidos)
        this.checkForHorizontalCollisions({ solidPlatforms });

        // 3. Aplica gravidade (movimento vertical)
        this.applyGravity();
        this.updateHitbox();

        // 4. Checa colisões verticais (com tudo)
        this.checkForVerticalCollisions({ worldHeight, platforms, solidPlatforms });

        // 5. Impede o jogador de sair da tela (paredes do mundo)
        if (this.position.x < 0) {
            this.position.x = 0;
        } else if (this.position.x + this.width > worldWidth) {
            this.position.x = worldWidth - this.width;
        }

        // 6. Por fim, desenha o jogador na tela
        this.draw(context);
    }
}
