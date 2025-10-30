const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;

const scaleFactor = 4;
const scaledCanvas = {
  width: canvas.width / scaleFactor,
  height: canvas.height / scaleFactor,
};

const CLOUD_SPEED_1 = 0.5;
const CLOUD_SPEED_2 = 1.0;

const TILE_SIZE = 16; 
const TILE_SPACING = 15.4; 

const TILES_PER_SCENE = 40; 
const SCENE_WIDTH = TILES_PER_SCENE * TILE_SPACING; 

const SCENE_TRANSITION_ADVANCE_X = SCENE_WIDTH - 80; 
const SCENE_TRANSITION_BACK_X = 80;

let worldWidth = SCENE_WIDTH; 
let currentLevel = 1;
const TOTAL_LEVELS = 5;

const WORLD_GROUND_Y = 190; 

let sceneTransitionTriggered = false;
const TRANSITION_BUFFER_MS = 1000; 
let transitionBufferTimer = 0; 

const GRASSLAND_THEME = {
  bgPaths: {
    skyColor: "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/5 - Sky_color.png",
    cloud1: "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/3 - Cloud_cover_1.png",
    cloud2: "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/4 - Cloud_cover_2.png",
    hills: "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/2 - Hills.png",
    foreground: "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Background parts/1 - Foreground_scenery.png",
  },
  terrainPath: "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Terrain (16 x 16).png",
  name: "Grassland",
};

const LEVEL_CYCLE = Array(TOTAL_LEVELS).fill(GRASSLAND_THEME);

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

const backgroundLayers = [
  skyColor,
  cloudCover1,
  cloudCover1_2,
  cloudCover2,
  cloudCover2_2,
  distantHills,
  foregroundScenery,
];

const terrainImage = new Image();
let terrainLoaded = false;
terrainImage.onload = () => {
  terrainLoaded = true;
};

const waterImage = new Image();
waterImage.src = "./Seasonal Tilesets/Seasonal Tilesets/5 - Misc. universal tiles/Water_frames (16 x 32).png";
let waterLoaded = false;
waterImage.onload = () => {
  waterLoaded = true;
};

const entityImage = new Image();
entityImage.src = "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Grassland_entities (16 x 16).png";

const extraPlantsImage = new Image();
extraPlantsImage.src = "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Extra_plants (16 x 16).png";

const heartImage = new Image();
heartImage.src = "./assets/heart_spritesheet.png"; 
let heartLoaded = false;
heartImage.onload = () => {
    heartLoaded = true;
};

const player = new Player();
const enemies = [];
const platforms = [];
const solidPlatforms = [];
const sprites = []; 

let lastTime;
let terrainManager;

function showVictoryScreen() {
  console.log("PARABÉNS VOCÊ VENCEU O JOGO!");
}

function switchBackgrounds(levelIndex) {
  if (levelIndex > TOTAL_LEVELS) return;

  const themeData = LEVEL_CYCLE[levelIndex - 1];

  terrainLoaded = false;
  terrainImage.src = themeData.terrainPath;
  
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

  console.log(`Iniciando Nivel ${levelIndex}: ${themeData.name}`);
}

function advanceToNextScene() {
  if (sceneTransitionTriggered) return;
  sceneTransitionTriggered = true;
  
  setTimeout(() => {
    loadScene(currentLevel + 1, 'advance'); 
    sceneTransitionTriggered = false;
  }, 500);
}

function goToPreviousScene() {
  if (sceneTransitionTriggered) return;
  sceneTransitionTriggered = true;
  
  setTimeout(() => {
    loadScene(currentLevel - 1, 'back'); 
    sceneTransitionTriggered = false;
  }, 500);
}

function checkSceneTransition() {
    if (sceneTransitionTriggered || player.isDead || transitionBufferTimer > 0) return;
    
    if (player.position.x > SCENE_TRANSITION_ADVANCE_X) {
        advanceToNextScene();
        return;
    }
    
    if (player.position.x < SCENE_TRANSITION_BACK_X && currentLevel > 1) {
        goToPreviousScene();
        return;
    }
}

function loadScene(levelIndex, direction = 'initial') {
    if (levelIndex > TOTAL_LEVELS) {
        currentLevel = TOTAL_LEVELS + 1;
        showVictoryScreen();
        return;
    }
    
    if (levelIndex < 1) levelIndex = 1;

    platforms.length = 0;
    solidPlatforms.length = 0;
    enemies.length = 0; 
    sprites.length = 0;
    player.projectiles.length = 0;

    transitionBufferTimer = TRANSITION_BUFFER_MS;

    if (direction === 'advance') {
        player.position.x = SCENE_TRANSITION_BACK_X + 20; 
    } else if (direction === 'back') {
        player.position.x = SCENE_TRANSITION_ADVANCE_X - 20;
    } else {
        player.position.x = 50;
    }
    
    player.position.y = 100;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.isDead = false;
    player.deathAnimationSpawned = false;

    const bgWidth = distantHills.width; 
    cloudCover1_2.position.x = bgWidth;
    cloudCover2_2.position.x = bgWidth;

    const startX = 0;
    const heightInTiles = 2; 
    const groundY = WORLD_GROUND_Y;
    const tilesInScene = TILES_PER_SCENE;
    
    let aerialPlatformsConfigs = [];
    let groundSegments = [];

    switch (levelIndex) {
        case 1: 
            groundSegments = [{ startTile: 0, count: tilesInScene }];
            aerialPlatformsConfigs = [{ 
                x: TILE_SPACING * 10, 
                y: -64, 
                width: 5 
            }];
            break;

        case 2:
            groundSegments = [
                { startTile: 0, count: 15 }, 
                { startTile: 19, count: tilesInScene - 19 } 
            ];
            aerialPlatformsConfigs = [{ x: TILE_SPACING * 10, y: -60, width: 4 }];
            break;

        case 3:
            groundSegments = [
                { startTile: 0, count: 10 }, 
                { startTile: 13, count: 10 }, 
                { startTile: 26, count: tilesInScene - 26 } 
            ];
            aerialPlatformsConfigs = [
                { x: TILE_SPACING * 5, y: -50, width: 3 }, 
                { x: TILE_SPACING * 18, y: -80, width: 5 }
            ];
            break;

        case 4:
            groundSegments = [{ startTile: 0, count: 5 }];
            aerialPlatformsConfigs = [
                { x: TILE_SPACING * 6, y: -30, width: 2 }, 
                { x: TILE_SPACING * 15, y: -70, width: 3 }, 
                { x: TILE_SPACING * 30, y: -40, width: 4 }
            ];
            break;

        case 5:
            groundSegments = [{ startTile: 0, count: tilesInScene }];
            aerialPlatformsConfigs = [];
            break;
    }

    groundSegments.forEach(segment => {
        const segStartX = startX + segment.startTile * TILE_SPACING;
        const groundTiles = terrainManager.createGroundChunk(segStartX, segment.count, heightInTiles);
        solidPlatforms.push(...groundTiles);
    });

    if (aerialPlatformsConfigs.length > 0) {
        const newPlatforms = terrainManager.createPlatformChunk(startX, aerialPlatformsConfigs);
        platforms.push(...newPlatforms);
    }

    if (levelIndex !== 4) {
        const patrolSets = {
            ASTRO: { patrolStartX: 100, patrolEndX: 250 },
            CEBOLETE: { patrolStartX: 280, patrolEndX: 430 },
            CEREJINHA: { patrolStartX: 460, patrolEndX: 580 }
        };

        const enemyYGround = WORLD_GROUND_Y - 32;
        
        let enemyYPlatform = enemyYGround; 
        let astroSpawnX = patrolSets.ASTRO.patrolStartX;
        
        if (levelIndex === 1) {
            const platY = WORLD_GROUND_Y - 64;
            enemyYPlatform = platY - 32; 
            
            const platStartTile = TILE_SPACING * 10;
            const platWidth = 5 * TILE_SPACING;
            astroSpawnX = platStartTile + (platWidth / 2) - 10; 
            
            patrolSets.ASTRO.patrolStartX = platStartTile;
            patrolSets.ASTRO.patrolEndX = platStartTile + platWidth - 20; 
        }
        
        if (typeof Astro !== 'undefined') {
            enemies.push(new Astro({ 
                x: astroSpawnX, 
                y: (levelIndex === 1) ? enemyYPlatform : enemyYGround,
                patrolStartX: patrolSets.ASTRO.patrolStartX, 
                patrolEndX: patrolSets.ASTRO.patrolEndX
            }));
        }
        
        if (typeof Cebolete !== 'undefined') {
            enemies.push(new Cebolete({ 
                x: patrolSets.CEBOLETE.patrolStartX, 
                y: enemyYGround, 
                patrolStartX: patrolSets.CEBOLETE.patrolStartX, 
                patrolEndX: patrolSets.CEBOLETE.patrolEndX
            }));
        }
        
        if (typeof Cerejinha !== 'undefined') {
            enemies.push(new Cerejinha({ 
                x: patrolSets.CEREJINHA.patrolStartX, 
                y: enemyYGround, 
                patrolStartX: patrolSets.CEREJINHA.patrolStartX, 
                patrolEndX: patrolSets.CEREJINHA.patrolEndX
            }));
        }
    }

    currentLevel = levelIndex;
    switchBackgrounds(currentLevel);
    
    console.log(`Cena ${currentLevel} carregada! Inimigos: ${enemies.length}`);
}

waterImage.onload = () => {
  waterLoaded = true;
  terrainManager = new TerrainManager(terrainImage, WORLD_GROUND_Y, TILE_SIZE);
  loadScene(1);
};

const camera = {
  position: { x: 0, y: 0 },
};

function animate() {
  window.requestAnimationFrame(animate);

  const allBackgroundsLoaded = backgroundLayers.every((layer) => layer.loaded);
  if (!terrainLoaded || !waterLoaded || !allBackgroundsLoaded) {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "16px Arial";
    context.fillStyle = "white";
    context.fillText("CARREGANDO NIVEL...", 450, 280);
    return;
  }

  context.fillStyle = "black";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.scale(scaleFactor, scaleFactor);

  const movement = typeof getMovementDirection !== 'undefined' ? getMovementDirection(keys) : { left: keys.a.pressed, right: keys.d.pressed };

  const input = {
    left: movement.left,
    right: movement.right,
    jump: keys.w.pressed,
  };
  
  if (input.left || input.right) {
    console.log(`Debug Input: Left=${input.left}, Right=${input.right} | X: ${Math.round(player.position.x)}`);
  }

  worldWidth = SCENE_WIDTH;
  const worldHeight = foregroundScenery.height;

  const currentTime = performance.now();
  const deltaTime = (currentTime - (lastTime || currentTime)) / 1000;
  lastTime = currentTime;

  if (transitionBufferTimer > 0) {
      transitionBufferTimer -= deltaTime * 1000;
  }

checkSceneTransition();

  if (!player.isDead && !sceneTransitionTriggered) {
    if (keys.mouseLeft.pressed) player.attack();

    player.update(worldHeight, worldWidth, platforms, solidPlatforms, input, deltaTime);

    if (player.position.y > WORLD_GROUND_Y + 100) {
        player.die(); 
    }

    for (const enemy of enemies) {
        enemy.update(deltaTime, player);

        if (collision({ object1: player.hitbox, object2: enemy.hitbox })) {
            if (player.velocity.y > 0 && player.position.y + player.height <= enemy.position.y + 5) {
                player.velocity.y = -PLAYER_JUMP_POWER * 0.5;
            } else {
                player.takeDamage();
            }
        }
        
        if (enemy instanceof Cebolete) {
            for (let j = enemy.projectiles.length - 1; j >= 0; j--) {
                const seed = enemy.projectiles[j];
                if (collision({ object1: seed, object2: player.hitbox })) {
                    player.takeDamage(2); 
                    enemy.projectiles.splice(j, 1);
                }
            }

            if (collision({ object1: player.hitbox, object2: enemy.hitbox })) {
                player.takeDamage(2); 
            }
        }
        
        for (let i = player.projectiles.length - 1; i >= 0; i--) {
            const arrow = player.projectiles[i];
            if (collision({ object1: arrow, object2: enemy.hitbox })) {
                player.projectiles.splice(i, 1);
            }
        }
    }

  } else if (sceneTransitionTriggered) {
    player.animate();
  }

  if (player.isDead && !player.deathAnimationSpawned) {
    player.deathAnimationSpawned = true;

    sprites.push(
      new DeathAnimation({
        position: {
          x: player.position.x - 40 / 2 + player.width / 2,
          y: player.position.y - 40 / 2 + player.height / 2,
        },
        imageSrc: "./Sprite Pack 8/enemy-death.png",
        frameWidth: 40,
        frameHeight: 40,
        totalFrames: 6,
        frameInterval: 30,
      })
    );
  }

  if (player.position.x > worldWidth - player.width) {
    player.position.x = worldWidth - player.width;
  } else if (player.position.x < 0) {
    player.position.x = 0;
  }

  camera.position.x = -player.position.x + scaledCanvas.width / 2;
  camera.position.y = -player.position.y + scaledCanvas.height / 2;

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
  camera.position.x = Math.round(camera.position.x);
  camera.position.y = Math.round(camera.position.y);

  const layerParallaxFactors = [0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.8];
  let layerIndex = 0;
  
  context.save();
  context.translate(
    camera.position.x * layerParallaxFactors[layerIndex++],
    camera.position.y * layerParallaxFactors[layerIndex]
  );
  skyColor.draw(context);
  context.restore();

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

  for (let i = 0; i < 4; i++) {
    const layer = backgroundLayers[layerIndex + i];
    context.save();
    context.translate(layer.position.x, layer.position.y);
    layer.draw(context);
    context.restore();
  }
  layerIndex += 4;

  for (let i = 0; i < 2; i++) {
    const layer = backgroundLayers[layerIndex + i];
    const factor = layerParallaxFactors[layerIndex + i];

    context.save();
    context.translate(camera.position.x * factor, camera.position.y * factor);
    layer.draw(context);
    
    if (SCENE_WIDTH > layer.width) {
        context.drawImage(layer.image, layer.position.x + layer.width, layer.position.y);
    }
    context.restore();
  }

  context.translate(camera.position.x, camera.position.y);

  for (const platform of platforms) { platform.draw(context); }
  for (const solidPlatform of solidPlatforms) { solidPlatform.draw(context); }
  
  for (const enemy of enemies) { enemy.draw(context); } 

  for (const arrow of player.projectiles) { arrow.draw(context); }
  for (let i = sprites.length - 1; i >= 0; i--) { 
    const sprite = sprites[i];
    if (sprite.done) { sprites.splice(i, 1); } 
    else { sprite.update(); sprite.draw(context); }
  }

  player.draw(context);
  context.restore();

  context.save();
  context.font = "16px Arial";
  context.fillStyle = "white";

  const levelText = `CENA: ${currentLevel} / ${TOTAL_LEVELS}`;
  context.fillText(levelText, 10, 20);

  if (heartLoaded) {
    const heartFullCrop = { x: 0, y: 0, width: 61, height: 41 };
    const heartEmptyCrop = { x: 61, y: 0, width: 65, height: 41 };
    const maxLives = 3; 
    const drawWidth = 30.5; 
    const drawHeight = 20.5; 
    const startX = 10; 
    const startY = 25; 
    const spacing = 40; 

    for (let i = 0; i < maxLives; i++) {
      const crop = (i < player.lives) ? heartFullCrop : heartEmptyCrop;
      context.drawImage(heartImage, crop.x, crop.y, crop.width, crop.height, startX + (i * spacing), startY, drawWidth, drawHeight);
    }
  } else {
    const livesText = `VIDAS: ${player.lives}`;
    context.fillText(livesText, 10, 40);
  }

  const enemiesText = `INIMIGOS: ${enemies.length}`;
  context.fillText(enemiesText, 10, 60);

  if (player.position.x > SCENE_TRANSITION_ADVANCE_X - 50 && currentLevel <= TOTAL_LEVELS) {
    context.fillStyle = "lime";
    context.font = "20px Arial";
    context.fillText("→ PRÓXIMA CENA →", canvas.width - 250, 40);
  }
  
  if (player.position.x < SCENE_TRANSITION_BACK_X + 50 && currentLevel > 1) {
    context.fillStyle = "yellow";
    context.font = "20px Arial";
    context.fillText("← VOLTAR", 10, 80);
  }

  context.font = "12px Arial";
  context.fillStyle = "yellow";
  const debugText = `DEBUG - X: ${Math.round(player.position.x)} | Buffer: ${Math.max(0, Math.round(transitionBufferTimer))}ms`;
  context.fillText(debugText, 10, canvas.height - 10);

  if (player.isDead) {
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "red";
    context.font = "40px Arial";
    context.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
  }

  if (currentLevel > TOTAL_LEVELS) {
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "gold";
    context.font = "48px Arial";
    context.fillText("VITÓRIA!", canvas.width / 2 - 120, canvas.height / 2 - 50);
    context.fillStyle = "white";
    context.font = "24px Arial";
    context.fillText("Você completou todos os níveis!", canvas.width / 2 - 180, canvas.height / 2 + 20);
  }

  context.save();
  context.font = "16px Arial";
  context.fillStyle = "white";

  // Desenha o Nível
  const levelText = `NIVEL: ${currentLevel} / ${TOTAL_LEVELS}`;
  context.fillText(levelText, 10, 20);

//vidas do player (coraçao)
  if (heartLoaded) {
    const heartFullCrop = { x: 0, y: 0, width: 61, height: 41 };
    const heartEmptyCrop = { x: 61, y: 0, width: 65, height: 41 };

    const maxLives = 3; 
    
    const drawWidth = 30.5; 
    const drawHeight = 20.5; 
    
    const startX = 10; 
    const startY = 25; 
    const spacing = 40; 

    for (let i = 0; i < maxLives; i++) {
      // Decide qual coração desenhar
      const crop = (i < player.lives) ? heartFullCrop : heartEmptyCrop;
      
      context.drawImage(
        heartImage,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        startX + (i * spacing), 
        startY,                 
        drawWidth,              
        drawHeight              
      );
    }
  } else {
    
    const livesText = `VIDAS: ${player.lives}`;
    context.fillText(livesText, 10, 40);
  }

  // qtd de inimigos 
  const enemiesText = `INIMIGOS: ${window.remainingEnemies}`;
  context.fillText(enemiesText, 10, 60); 
  
  //game over
  if (player.isDead) {
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "red";
    context.font = "40px Arial";
    context.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
    return;
  }

  if (window.gameWon) {
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "lime";
    context.font = "40px Arial";
    context.fillText("YOU WIN!", canvas.width / 2 - 80, canvas.height / 2);
    return;
  }
  context.restore();
}

animate();
