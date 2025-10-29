const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

// Define o tamanho do canvas principal
canvas.width = 1024;
canvas.height = 576;

// Cria uma versão "escalada" do canvas, pra facilitar o zoom ou resolução
const scaleFactor = 4;
const scaledCanvas = {
  width: canvas.width / scaleFactor,
  height: canvas.height / scaleFactor,
};

// Caminhos das imagens que vão ser usadas no jogo
const backgroundPath =
  "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/_Complete_static_BG_(288 x 208).png";
const terrainPath =
  "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Terrain (16 x 16).png";
const Water_framesPath =
  "./Seasonal Tilesets/Seasonal Tilesets/5 - Misc. universal tiles/Water_frames (16 x 32).png"; // Caminho que você forneceu

// Cria o plano de fundo do jogo
const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: backgroundPath,
});

// Carrega a imagem que contém o terreno (tileset)
const terrainImage = new Image();
terrainImage.src = terrainPath;
let terrainLoaded = false;

// Carrega a imagem da água
const waterImage = new Image();
waterImage.src = Water_framesPath;
let waterLoaded = false;

// Cria o jogador
const player = new Player();

// Array para guardar os inimigos
const enemies = [];

// Arrays que guardam as plataformas (chão e objetos sólidos)
const platforms = []; // plataformas normais (colidem só por cima)
const solidPlatforms = []; // plataformas sólidas (colidem por todos os lados)

// Variável para calcular o deltaTime
let lastTime;

// Assim que a imagem do terreno carregar, cria as plataformas
terrainImage.onload = () => {
  terrainLoaded = true; // Marca que o terreno foi carregado

  // Cria o chão do cenário
  const groundCropbox = {
    x: 149,
    y: 123,
    width: 17,
    height: 19,
  };

  // Gera o chão principal com um buraco no meio
  const gapStartTile = 15; // Onde o buraco começa (tile 15)
  const gapEndTile = 17; // Onde o chão recomeça (tile 18)
  const numGroundTiles = 20;
  const tileSpacing = 15.4;

  for (let i = 0; i < numGroundTiles; i++) {
    // Pula os tiles 15, 16, e 17 para criar o buraco
    if (i >= gapStartTile && i < gapEndTile) {
      continue; // Pula essa iteração, não cria plataforma
    }

    platforms.push(
      new Platform({
        position: { x: tileSpacing * i, y: 190 },
        image: terrainImage,
        cropbox: groundCropbox,
      })
    );
  }

  // Cria uma plataforma elevada (tipo um bloco flutuante)
  const elevadaCropbox = {
    x: 47,
    y: 16,
    width: 48,
    height: 70,
  };

  // Adiciona essa plataforma no array das sólidas
  solidPlatforms.push(
    new Platform({
      position: { x: 100, y: 158 },
      image: terrainImage,
      cropbox: elevadaCropbox,
    })
  );

  // Cria o inimigo Barry Cherry
  const barryStartY = 190 - 32; // Posição Y (altura do chão - altura do Barry)
  const barryStartX = 150; // Posição X inicial (entre a plataforma e o lago)
  const barry = new BarryCherry({ x: barryStartX, y: barryStartY });
  enemies.push(barry);

  // Cria o inimigo Toggle
  const toggleStartY = 190 - 32; // Posição Y (altura do chão - altura do Barry)
  const toggleStartX = 150; // Posição X inicial (entre a plataforma e o lago)
  const toggle = new Toggle({ x: toggleStartX, y: toggleStartY });
  enemies.push(toggle);
};

// Assim que a imagem da água carregar, cria o lago NO BURACO
waterImage.onload = () => {
  waterLoaded = true;

  // Define o cropbox para usar a imagem inteira da água
  const waterCropbox = {
    x: 0,
    y: 2,
    width: waterImage.width, // Usa a largura real da imagem
    height: waterImage.height,
  };

  const lakeY = 190;

  const gapStartTile = 15; // Onde o buraco começa (tile 15)
  const tileSpacing = 15.4; // O espaçamento dos tiles de chão

  const lakeX = tileSpacing * gapStartTile;
  // TODO: Criar um tipo de plataforma específico para o lago (que não seja sólido) para que o personagem possa cair.
  platforms.push(
    new Platform({
      position: { x: lakeX, y: lakeY },
      image: waterImage,
      cropbox: waterCropbox,
    })
  );
};

// Cria a câmera que vai acompanhar o jogador
const camera = {
  position: {
    x: 0,
    y: 0,
  },
};

// Função principal do jogo — roda várias vezes por segundo
function animate() {
  window.requestAnimationFrame(animate);

  // Espera carregar TODAS as imagens antes de começar a desenhar
  if (!background.loaded || !terrainLoaded || !waterLoaded) {
    return;
  }

  // Limpa a tela com fundo preto
  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.scale(scaleFactor, scaleFactor);

  // Movimentação do jogador
  const input = {
    left: keys.a.pressed,
    right: keys.d.pressed,
    jump: keys.w.pressed,
  };

  const worldWidth = background.width;
  const worldHeight = background.height;

  if (keys.space.pressed) player.attack();
  if (keys.r.pressed) player.reload();

  player.update(worldHeight, worldWidth, platforms, solidPlatforms, input);

  // Calcula o deltaTime (tempo desde o último frame) - NECESSÁRIO PARA BarryCherry
  const currentTime = performance.now();
  const deltaTime = (currentTime - (lastTime || currentTime)) / 1000; // Tempo em segundos
  lastTime = currentTime;
  // --- Fim do cálculo deltaTime ---

  // Atualiza todos os inimigos
  for (const enemy of enemies) {
    // Passamos deltaTime para o update do inimigo
    enemy.update(deltaTime);
  }

  // Atualiza a posição da câmera pra seguir o jogador
  camera.position.x = -player.position.x + scaledCanvas.width / 2;
  camera.position.y = -player.position.y + scaledCanvas.height / 2;
  if (camera.position.x > 0) camera.position.x = 0;
  if (camera.position.x < -(worldWidth - scaledCanvas.width))
    camera.position.x = -(worldWidth - scaledCanvas.width);
  if (camera.position.y > 0) camera.position.y = 0;
  if (camera.position.y < -(worldHeight - scaledCanvas.height))
    camera.position.y = -(worldHeight - scaledCanvas.height);

  // Desenha todos os elementos do jogo
  context.translate(camera.position.x, camera.position.y);

  background.draw(context);

  // Desenha as plataformas normais (agora inclui o lago)
  for (const platform of platforms) {
    platform.draw(context);
  }

  // Desenha as plataformas sólidas
  for (const platform of solidPlatforms) {
    platform.draw(context);
  }

  // Desenha todos os inimigos
  for (const enemy of enemies) {
    enemy.draw(context);
  }

  // Finalmente, desenha o jogador na tela
  player.draw(context);

  context.restore();
}

// Inicia o loop do jogo
animate();
