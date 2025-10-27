// Pega o canvas e o contexto 2D — é onde tudo vai ser desenhado na tela
const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

// Define o tamanho do canvas principal
canvas.width = 1024;
canvas.height = 576; 

// Cria uma versão "escalada" do canvas, pra facilitar o zoom ou resolução
const scaleFactor = 4; 
const scaledCanvas = {
    width: canvas.width / scaleFactor,
    height: canvas.height / scaleFactor
}

// Caminhos das imagens que vão ser usadas no jogo
const backgroundPath = './Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/_Complete_static_BG_(288 x 208).png';
const terrainPath = './Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Terrain (16 x 16).png';

// Cria o plano de fundo do jogo
const background = new Sprite({
    position: { x: 0, y: 0 },
    imageSrc: backgroundPath
});

// Carrega a imagem que contém o terreno (tileset)
const terrainImage = new Image();
terrainImage.src = terrainPath;
let terrainLoaded = false;

// Cria o jogador
const player = new Player();

// Arrays que guardam as plataformas (chão e objetos sólidos)
const platforms = [];        // plataformas normais (colidem só por cima)
const solidPlatforms = [];   // plataformas sólidas (colidem por todos os lados)

// Assim que a imagem do terreno carregar, cria as plataformas
terrainImage.onload = () => {
    terrainLoaded = true; // Marca que o terreno foi carregado

    // Cria o chão do cenário
    const groundCropbox = { 
        x: 149,
        y: 123,
        width: 17,
        height: 19
    };
    
    // Gera 20 pedaços de chão seguidos, formando o piso principal
    for (let i = 0; i < 20; i++) {
        platforms.push(new Platform({
            position: { x: 15.4 * i, y: 190 }, 
            image: terrainImage,
            cropbox: groundCropbox
        }));
    }
    
    // Cria uma plataforma elevada (tipo um bloco flutuante)
    const elevadaCropbox = {
        x: 47,
        y: 16,
        width: 48,
        height: 70
    };

    // Adiciona essa plataforma no array das sólidas
    solidPlatforms.push(new Platform({
        position: { x: 100, y: 158 },
        image: terrainImage,
        cropbox: elevadaCropbox 
    }));
};

// Cria a câmera que vai acompanhar o jogador
const camera = {
    position: {
        x: 0,
        y: 0
    }
}

// Função principal do jogo — roda várias vezes por segundo
function animate() {
    window.requestAnimationFrame(animate);
    
    // Espera carregar as imagens antes de começar a desenhar
    if (!background.loaded || !terrainLoaded) {
        return;
    }
    
    // Limpa a tela com fundo preto
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    context.scale(scaleFactor, scaleFactor);

    // Movimentação do jogador
    player.velocity.x = 0;
    if (keys.a.pressed) player.velocity.x = -1;
    else if (keys.d.pressed) player.velocity.x = 1;
    if (keys.w.pressed && player.isOnGround) player.velocity.y = -8;

    const worldWidth = background.width;
    const worldHeight = background.height;

    // Atualiza o jogador, verificando colisões com os dois tipos de plataforma
    player.update(worldHeight, worldWidth, platforms, solidPlatforms);

    // Atualiza a posição da câmera pra seguir o jogador
    camera.position.x = -player.position.x + (scaledCanvas.width / 2);
    camera.position.y = -player.position.y + (scaledCanvas.height / 2);
    if (camera.position.x > 0) camera.position.x = 0;
    if (camera.position.x < -(worldWidth - scaledCanvas.width)) camera.position.x = -(worldWidth - scaledCanvas.width);
    if (camera.position.y > 0) camera.position.y = 0;
    if (camera.position.y < -(worldHeight - scaledCanvas.height)) camera.position.y = -(worldHeight - scaledCanvas.height);

    // Desenha todos os elementos do jogo (fundo, plataformas e jogador)
    context.translate(camera.position.x, camera.position.y);

    background.draw(context);

    // Desenha as plataformas normais
    for (const platform of platforms) {
        platform.draw(context);
    }

    // Desenha as plataformas sólidas
    for (const platform of solidPlatforms) {
        platform.draw(context);
    }

    // Finalmente, desenha o jogador na tela
    player.draw(context);

    context.restore();
}

// Inicia o loop do jogo
animate();
