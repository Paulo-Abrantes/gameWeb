const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

// --- CONFIGURAÇÃO INICIAL DO CANVAS ---
canvas.width = 1024;
canvas.height = 576;

// Fator de escala para renderização (zoom 4x)
const scaleFactor = 4;
const scaledCanvas = {
  width: canvas.width / scaleFactor,
  height: canvas.height / scaleFactor,
};

// --- CONSTANTES DE JOGABILIDADE E GERAÇÃO DE MUNDO ---
const CLOUD_SPEED_1 = 0.5; // Velocidade de rolagem das nuvens
const CLOUD_SPEED_2 = 1.0; // Velocidade de rolagem das nuvens mais rápidas

const CHUNKS_PER_LEVEL = 4; // Cada nível dura 4 pedaços de mapa
const CHUNK_WIDTH = 20 * 15.4; // Largura de cada pedaço do chão

let worldBuildLimit = 0; // A posição X onde o PRÓXIMO CHUNK deve ser construído
let currentLevel = 1; // Nível atual em que o jogador se encontra
let totalChunkIndex = 0; // Contador total de chunks já construídos

// --- DEFINIÇÃO DO TEMA (Grassland Único) ---
const GRASSLAND_THEME = {
  bgPaths: {
    skyColor:
      "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/5 - Sky_color.png",
    cloud1:
      "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/3 - Cloud_cover_1.png",
    cloud2:
      "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/4 - Cloud_cover_2.png",
    hills:
      "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/2 - Hills.png",
    foreground:
      "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/1 - Foreground_scenery.png",
  },
  terrainPath:
    "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Terrain (16 x 16).png",
  name: "Grassland",
};

// Configuração dos Níveis (Total de 5 níveis, todos usando o Grassland)
const TOTAL_LEVELS = 5;
const LEVEL_CYCLE = Array(TOTAL_LEVELS).fill(GRASSLAND_THEME);

// --- INICIALIZAÇÃO DE SPRITES GLOBAIS (Elementos do Parallax) ---
const skyColor = new Sprite({ position: { x: 0, y: 0 }, imageSrc: "" });
const cloudCover1 = new Sprite({ position: { x: 0, y: 0 }, imageSrc: "" });
const cloudCover1_2 = new Sprite({ position: { x: 288, y: 0 }, imageSrc: "" });
const cloudCover2 = new Sprite({ position: { x: 0, y: 0 }, imageSrc: "" });
const cloudCover2_2 = new Sprite({ position: { x: 288, y: 0 }, imageSrc: "" });
const distantHills = new Sprite({ position: { x: 0, y: 0 }, imageSrc: "" });
const foregroundScenery = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: "",
});

// Ordem de desenho do Parallax (da mais distante para a mais próxima)
const backgroundLayers = [
  skyColor,
  cloudCover1,
  cloudCover1_2,
  cloudCover2,
  cloudCover2_2,
  distantHills,
  foregroundScenery,
];

// --- ASSETS DO JOGO (Tilesets) ---
const terrainImage = new Image();
let terrainLoaded = false;
terrainImage.onload = () => {
  terrainLoaded = true;
};

const waterImage = new Image();
waterImage.src =
  "./Seasonal Tilesets/Seasonal Tilesets/5 - Misc. universal tiles/Water_frames (16 x 32).png";
let waterLoaded = false;
waterImage.onload = () => {
  waterLoaded = true;
};

// Entidades (Mantidas para compatibilidade com a classe Platform)
const entityImage = new Image();
entityImage.src =
  "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Grassland_entities (16 x 16).png";

const extraPlantsImage = new Image();
extraPlantsImage.src =
  "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Extra_plants (16 x 16).png";

// --- OBJETOS DO JOGO (Arrays de Entidades) ---
const player = new Player();
const enemies = [];
const platforms = [];
const solidPlatforms = [];
const sprites = [];

let lastTime;

// --- FUNÇÕES DE NÍVEL E CONTEÚDO ---

/**
 * [BLOCO DE CONTEÚDO] Adiciona as plataformas e objetos de colisão para o chunk atual.
 * ATUALMENTE: Cria APENAS O CHÃO LISO, com exceção do buraco do lago no primeiro chunk.
 */
function generateChunkContent(levelIndex, chunkIndex, startX) {
  // Configurações básicas para o chão
  const groundCropbox = { x: 149, y: 123, width: 17, height: 19 };
  const numGroundTiles = 20;
  const tileSpacing = 15.4;
  const groundY = 190;

  // Condição para criar o buraco do lago (Apenas no PRIMEIRO CHUNK DO NÍVEL 1)
  const hasWaterGap = levelIndex === 1 && totalChunkIndex === 0;
  const gapStartTile = 15;
  const gapEndTile = 17;

  for (let i = 0; i < numGroundTiles; i++) {
    if (hasWaterGap && i >= gapStartTile && i < gapEndTile) {
      continue; // Pula os tiles para criar o buraco do lago
    }
    // Cria o bloco básico do chão
    platforms.push(
      new Platform({
        position: { x: startX + tileSpacing * i, y: groundY },
        image: terrainImage,
        cropbox: groundCropbox,
      })
    );
  }

  // (Espaço reservado para inserir conteúdo por chunk/nível futuramente)
}

/**
 * [BLOCO DE TROCA DE TEMA] Troca dinamicamente as imagens de fundo para um novo nível.
 */
function switchBackgrounds(levelIndex) {
  if (levelIndex > TOTAL_LEVELS) {
    console.log("FIM DO JOGO!");
    return;
  }

  const themeData = LEVEL_CYCLE[levelIndex - 1];

  // 1. Troca o Tileset do Chão
  terrainLoaded = false;
  terrainImage.src = themeData.terrainPath;

  // 2. Troca as imagens de Parallax (e reseta o 'loaded' para forçar o recarregamento)
  skyColor.loaded = false;
  skyColor.image.src = themeData.bgPaths.skyColor;
  cloudCover1.loaded = false;
  cloudCover1.image.src = themeData.bgPaths.cloud1;
  cloudCover1_2.loaded = false;
  cloudCover1_2.image.src = themeData.bgPaths.cloud1;
  cloudCover2.loaded = false;
  cloudCover2.image.src = themeData.bgPaths.cloud2;
  cloudCover2_2.loaded = false;
  cloudCover2_2.image.src = themeData.bgPaths.cloud2;
  distantHills.loaded = false;
  distantHills.image.src = themeData.bgPaths.hills;
  foregroundScenery.loaded = false;
  foregroundScenery.image.src = themeData.bgPaths.foreground;

  console.log(`Iniciando Nível ${levelIndex}: ${themeData.name}`);
}

/**
 * [BLOCO DE GERAÇÃO DE CHUNK] Cria um novo pedaço de mapa e gerencia a transição de nível.
 */
function buildNewChunk() {
  // CRITICAL FIX: Garante que a geração para se atingir o limite total de chunks
  if (totalChunkIndex >= TOTAL_LEVELS * CHUNKS_PER_LEVEL) return;

  // Adiciona o conteúdo ao novo chunk
  const startX = worldBuildLimit;
  const chunkIndex = totalChunkIndex % CHUNKS_PER_LEVEL;
  generateChunkContent(currentLevel, chunkIndex, startX);

  // Atualiza a posição inicial para o próximo chunk
  worldBuildLimit += CHUNK_WIDTH;
  totalChunkIndex++;

  // Verifica se é hora de avançar para o próximo nível
  if (currentLevel < TOTAL_LEVELS && totalChunkIndex % CHUNKS_PER_LEVEL === 0) {
    currentLevel++;
    switchBackgrounds(currentLevel);
  }
}

// --- SETUP INICIAL DO JOGO ---

// O jogo começa quando a imagem da água carrega.
waterImage.onload = () => {
  waterLoaded = true;

  // Adiciona o lago na posição do buraco.
  const waterCropbox = {
    x: 0,
    y: 2,
    width: waterImage.width,
    height: waterImage.height,
  };
  const lakeY = 190;
  const gapStartTile = 15;
  const tileSpacing = 15.4;
  const lakeX = tileSpacing * gapStartTile;

  platforms.push(
    new Platform({
      position: { x: lakeX, y: lakeY },
      image: waterImage,
      cropbox: waterCropbox,
    })
  );

  // Inicializa nível 1 e constrói 3 chunks iniciais
  switchBackgrounds(1);
  buildNewChunk();
  buildNewChunk();
  buildNewChunk();

  // === SPAWN INIMIGOS NO PRIMEIRO CHUNK ===
  const groundY = 190;
  const spriteH = 32;
  const spawnY = groundY - spriteH;

  // patrulha do “corredor” entre a plataforma e o lago no primeiro chunk
  const patrolStartX = 148;
  const patrolEndX = 231; // ~ início do lago (15 * 15.4)

  // posições iniciais
  const cerejinhaX = 150;
  const astroX     = 185;
  const ceboleteX  = 210;

  const cerejinha = new Cerejinha({ x: cerejinhaX, y: spawnY, patrolStartX, patrolEndX });
  const astro     = new Astro({      x: astroX,     y: spawnY, patrolStartX, patrolEndX });
  const cebolete  = new Cebolete({   x: ceboleteX,  y: spawnY, patrolStartX, patrolEndX });

  enemies.push(cerejinha, astro, cebolete);

  console.log('Enemies spawned:', enemies.length);
};

// --- OBJETO CÂMERA ---
const camera = {
  position: { x: 0, y: 0 },
};

// --- GAME LOOP PRINCIPAL: animate() ---
function animate() {
  window.requestAnimationFrame(animate);

  // [BLOCO DE CARREGAMENTO SEGURO] Garante que todos os assets do nível atual carregaram
  const allBackgroundsLoaded = backgroundLayers.every((layer) => layer.loaded);

  if (!terrainLoaded || !waterLoaded || !allBackgroundsLoaded) {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "16px Arial";
    context.fillStyle = "white";
    context.fillText("CARREGANDO NÍVEL...", 450, 280);
    return;
  }

  // Limpa a tela
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.scale(scaleFactor, scaleFactor);

  // --- ATUALIZAÇÃO DO JOGADOR ---
  const input = {
    left: keys.a.pressed,
    right: keys.d.pressed,
    jump: keys.w.pressed,
  };
  const worldWidth = worldBuildLimit;
  const worldHeight = foregroundScenery.height;

  // Cálculo do DeltaTime
  const currentTime = performance.now();
  const deltaTime = (currentTime - (lastTime || currentTime)) / 1000;
  lastTime = currentTime;

  if (keys.mouseLeft.pressed) player.attack();
  player.update(worldHeight, worldWidth, platforms, solidPlatforms, {
    left: keys.a.pressed,
    right: keys.d.pressed,
    jump: keys.w.pressed,
    attack: keys.mouseLeft.pressed,
  });

  // --- LÓGICA DE MUNDO E RECICLAGEM ---

  // [BLOCO DE GERAÇÃO] Constrói um novo chunk se o jogador se aproximar do limite
  if (
    totalChunkIndex < TOTAL_LEVELS * CHUNKS_PER_LEVEL &&
    player.position.x + scaledCanvas.width > worldBuildLimit - CHUNK_WIDTH
  ) {
    buildNewChunk();
  }

  // [BLOCO DE RECICLAGEM] Remove plataformas que saíram da área de jogo
  const recycleThreshold = player.position.x - CHUNK_WIDTH * 2;

  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];
    if (platform.position.x + platform.width < recycleThreshold) {
      platforms.splice(i, 1);
    }
  }

  // [ATUALIZAÇÃO DE INIMIGOS E COLISÃO]
  // (Loop 'for' reverso para permitir remoção segura com 'splice')
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // (MODIFICAÇÃO 1: Passa o 'player' para o update do Astro)
    if (enemy instanceof Astro) {
      enemy.update(deltaTime, player);
    } else {
      enemy.update(deltaTime); // Lógica antiga para outros inimigos
    }
    
    // --- LÓGICA DE DERROTA DO CEREJINHA ---
    if (enemy instanceof Cerejinha) {
      
      // 1. Checar "Pulo na Cabeça" (Stomp)
      const isStomping = platformCollision({
        object1: player.hitbox,
        object2: enemy.hitbox,
      }) && player.velocity.y > 0; // Confirma que o jogador está caindo

      if (isStomping) {
        player.velocity.y = -4; // Faz o jogador pular (bounce)

        sprites.push(new DeathAnimation({
          position: { x: enemy.position.x, y: enemy.position.y },
          imageSrc: './Sprite Pack 8/enemy-death.png',
          frameWidth: 40,
          frameHeight: 40,
          totalFrames: 6,
          frameInterval: 30
        }));
        
        enemies.splice(i, 1); // Remove o inimigo
      
      } else if (collision({ object1: player.hitbox, object2: enemy.hitbox })) {
        // 2. Checar Colisão Lateral (Jogador se machuca)
        console.log("Jogador colidiu lateralmente com Cerejinha");
        // (Aqui entraria a lógica de dano ao jogador)
      }
    } 
    // (MODIFICAÇÃO 2: Adiciona colisão para projéteis do Cebolete)
    else if (enemy instanceof Cebolete) {
      
      // Checa colisão das sementes
      for (let j = enemy.projectiles.length - 1; j >= 0; j--) {
        const seed = enemy.projectiles[j];
        
        if (collision({ object1: seed, object2: player.hitbox })) {
          console.log("JOGADOR ATINGIDO PELA SEMENTE!");
          // (Aqui entraria a lógica de dano ao jogador)
          enemy.projectiles.splice(j, 1); // Remove a semente
        }
      }
      
      // Checa colisão lateral com o Cebolete
      if (collision({ object1: player.hitbox, object2: enemy.hitbox })) {
         console.log("Jogador colidiu lateralmente com Cebolete");
         // (Aqui entraria a lógica de dano ao jogador)
      }
    }
    // (A colisão do soco do Astro já é tratada dentro do update() do próprio Astro)
    else if (enemy instanceof Astro) {
       // Checa colisão lateral com o Astro (quando ele não está socando)
       if (collision({ object1: player.hitbox, object2: enemy.hitbox }) && enemy.state !== 'attack') {
         console.log("Jogador colidiu lateralmente com Astro");
         // (Aqui entraria a lógica de dano ao jogador)
      }
    }
  }

  // --- CÂMERA: POSICIONAMENTO E LIMITES ---
  camera.position.x = -player.position.x + scaledCanvas.width / 2;
  camera.position.y = -player.position.y + scaledCanvas.height / 2;

  // Limites da Câmera
  if (camera.position.x > 0) camera.position.x = 0;
  if (
    worldWidth > scaledCanvas.width &&
    camera.position.x < -(worldWidth - scaledCanvas.width)
  ) {
    camera.position.x = -(worldWidth - scaledCanvas.width);
  }
  if (camera.position.y > 0) camera.position.y = 0;
  if (camera.position.y < -(worldHeight - scaledCanvas.height))
    camera.position.y = -(worldHeight - scaledCanvas.height);

  // --- DESENHO: EFEITO PARALLAX ---
  const layerParallaxFactors = [0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.8];
  let layerIndex = 0;

  // 1. Céu
  context.save();
  context.translate(
    camera.position.x * layerParallaxFactors[layerIndex++],
    camera.position.y * layerParallaxFactors[layerIndex]
  );
  skyColor.draw(context);
  context.restore();

  // 2. Nuvens (movimento próprio)
  const layerWidth = 288;
  cloudCover1.position.x -= CLOUD_SPEED_1 * deltaTime;
  cloudCover1_2.position.x -= CLOUD_SPEED_1 * deltaTime;
  if (cloudCover1.position.x < -layerWidth)
    cloudCover1.position.x += layerWidth * 2;
  if (cloudCover1_2.position.x < -layerWidth)
    cloudCover1_2.position.x += layerWidth * 2;
  cloudCover2.position.x -= CLOUD_SPEED_2 * deltaTime;
  cloudCover2_2.position.x -= CLOUD_SPEED_2 * deltaTime;
  if (cloudCover2.position.x < -layerWidth)
    cloudCover2.position.x += layerWidth * 2;
  if (cloudCover2_2.position.x < -layerWidth)
    cloudCover2_2.position.x += layerWidth * 2;

  // Desenha as 4 camadas de nuvens
  for (let i = 0; i < 4; i++) {
    const layer = backgroundLayers[layerIndex + i];
    context.save();
    context.translate(layer.position.x, layer.position.y);
    layer.draw(context);
    context.restore();
  }
  layerIndex += 4;

  // 3. Hills e Foreground (parallax com a câmera)
  for (let i = 0; i < 2; i++) {
    const layer = backgroundLayers[layerIndex + i];
    const factor = layerParallaxFactors[layerIndex + i];

    context.save();
    context.translate(camera.position.x * factor, camera.position.y * factor);
    layer.draw(context);
    context.restore();
  }

  // --- DESENHO: OBJETOS DE JOGO (Movimento com a Câmera) ---
  context.translate(camera.position.x, camera.position.y);

  // Plataformas e sólidos
  for (const platform of platforms) {
    platform.draw(context);
  }
  for (const platform of solidPlatforms) {
    platform.draw(context);
  }

  // Inimigos
  for (const enemy of enemies) {
    enemy.draw(context);
  }

  // Desenha e atualiza as animações (ex: morte)
  for (let i = sprites.length - 1; i >= 0; i--) {
    const sprite = sprites[i];
    
    if (sprite.done) {
      sprites.splice(i, 1); // Remove a animação se ela já terminou
    } else {
      sprite.update(); // (Usa o timer interno, não deltaTime)
      sprite.draw(context);
    }
  }

  // Jogador
  player.draw(context);

  // HUD
  context.font = "8px Arial";
  context.fillStyle = "white";
  const levelText = `NÍVEL: ${currentLevel} / ${TOTAL_LEVELS} - ${
    LEVEL_CYCLE[currentLevel - 1].name
  }`;
  context.fillText(levelText, -camera.position.x + 10, -camera.position.y + 10);

  context.restore();
}

// Inicia o loop do jogo
animate();