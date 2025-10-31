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

const CHUNKS_PER_LEVEL = 4;
const CHUNK_WIDTH = 20 * 15.4;

let worldBuildLimit = 0;
let currentLevel = 1;
let totalChunkIndex = 0;

window.gameWon = false;

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

const TOTAL_LEVELS = 5;
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
waterImage.src =
  "./Seasonal Tilesets/Seasonal Tilesets/5 - Misc. universal tiles/Water_frames (16 x 32).png";
let waterLoaded = false;
waterImage.onload = () => {
  waterLoaded = true;
};

const entityImage = new Image();
entityImage.src =
  "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Grassland_entities (16 x 16).png";

const extraPlantsImage = new Image();
extraPlantsImage.src =
  "./Seasonal Tilesets/Seasonal Tilesets/1 - Grassland/Extra_plants (16 x 16).png";

const player = new Player();
const enemies = [];
const platforms = [];
const solidPlatforms = [];
const sprites = [];

const WORLD_GROUND_Y = 190; 
const TILE_SPACING = 15.4;

const FLOATING_PLATFORMS = [  // a construção das plataformas 
  { x: 3 * TILE_SPACING, y: WORLD_GROUND_Y - 80, width: 3 }, 
  { x: 8 * TILE_SPACING, y: WORLD_GROUND_Y - 55, width: 4 }, 
  { x: 15 * TILE_SPACING, y: WORLD_GROUND_Y - 30, width: 2 } 
];

const platformGenerator = new PlatformGenerator(terrainImage);

let lastTime;

function generateChunkContent(levelIndex, chunkIndex, startX) {
  const groundCropbox = { x: 149, y: 123, width: 17, height: 19 };
  const numGroundTiles = 20;
  const tileSpacing = 15.4;
  const groundY = WORLD_GROUND_Y; 
  
  const HAS_DEATH_GAP = chunkIndex === 1 || chunkIndex === 3; // ta meio errado isso aqui 
  const DEATH_GAP_START = 8; 
  const DEATH_GAP_END = 12;  // ate aqui era para morrer quando cai no buraco mas n morre 
  
  const hasWaterGap = levelIndex === 1 && totalChunkIndex === 0;
  const waterGapStartTile = 15;
  const waterGapEndTile = 17;
  
  for (let i = 0; i < numGroundTiles; i++) {
    if (hasWaterGap && i >= waterGapStartTile && i < waterGapEndTile) {
      continue;
    }
    
    if (HAS_DEATH_GAP && i >= DEATH_GAP_START && i < DEATH_GAP_END) {
        continue;
    }

    platforms.push(
      new Platform({
        position: { x: startX + tileSpacing * i, y: groundY },
        image: terrainImage,
        cropbox: groundCropbox,
      })
    );
  }

  const newPlatforms = platformGenerator.createFloatingPlatforms(startX, FLOATING_PLATFORMS);
  solidPlatforms.push(...newPlatforms);
  
  const spriteH = 32;
  const spawnY = groundY - spriteH;
  
  const patrolStartX = startX;
  const patrolEndX = startX + CHUNK_WIDTH - 20;

  const astroX = startX + 5 * TILE_SPACING;
  const ceboleteX = startX + 13 * TILE_SPACING;

  if (!HAS_DEATH_GAP) {
    const astro = new Astro({ x: astroX, y: spawnY, patrolStartX, patrolEndX });
    const cebolete = new Cebolete({
      x: ceboleteX,
      y: spawnY,
      patrolStartX,
      patrolEndX,
    });
    
    enemies.push(astro, cebolete);
  }

}

function switchBackgrounds(levelIndex) {
  if (levelIndex > TOTAL_LEVELS) {
    console.log("FIM DO JOGO!");
    return;
  }

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

function buildNewChunk() {
  if (totalChunkIndex >= TOTAL_LEVELS * CHUNKS_PER_LEVEL) return;

  const startX = worldBuildLimit;
  const chunkIndex = totalChunkIndex % CHUNKS_PER_LEVEL;
  generateChunkContent(currentLevel, chunkIndex, startX);

  worldBuildLimit += CHUNK_WIDTH;
  totalChunkIndex++;

  if (currentLevel < TOTAL_LEVELS && totalChunkIndex % CHUNKS_PER_LEVEL === 0) {
    currentLevel++;
    switchBackgrounds(currentLevel);
  }
}

waterImage.onload = () => {
  waterLoaded = true;

  const waterCropbox = {
    x: 0,
    y: 2,
    width: waterImage.width,
    height: waterImage.height,
  };
  const lakeY = WORLD_GROUND_Y;
  const waterGapStartTile = 15;
  const tileSpacing = 15.4;
  const lakeX = tileSpacing * waterGapStartTile;

  platforms.push(
    new Platform({
      position: { x: lakeX, y: lakeY },
      image: waterImage,
      cropbox: waterCropbox,
    })
  );

  switchBackgrounds(1);
  buildNewChunk();
  buildNewChunk();
  buildNewChunk();

  window.totalEnemies = enemies.length;
  window.remainingEnemies = enemies.length;
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

  const input = {
    left: keys.a.pressed,
    right: keys.d.pressed,
    jump: keys.w.pressed,
  };
  const worldWidth = worldBuildLimit;
  const worldHeight = foregroundScenery.height;

  const currentTime = performance.now();
  const deltaTime = (currentTime - (lastTime || currentTime)) / 1000;
  lastTime = currentTime;

  if (!player.isDead) {
    if (keys.mouseLeft.pressed) player.attack();

    player.update(worldHeight, worldWidth, platforms, solidPlatforms, input);

    const DEATH_ZONE_Y = worldHeight + 50;

    if (player.position.y > DEATH_ZONE_Y) { // aqui tbm cosia de morrer no buraco que n funciona
        player.lives = 0; 
        player.die();    
    }
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

  if (
    totalChunkIndex < TOTAL_LEVELS * CHUNKS_PER_LEVEL &&
    player.position.x + scaledCanvas.width > worldBuildLimit - CHUNK_WIDTH
  ) {
    buildNewChunk();
  }

  const recycleThreshold = player.position.x - CHUNK_WIDTH * 3; 

  for (let i = platforms.length - 1; i >= 0; i--) {
    const platform = platforms[i];
    if (platform.position.x + platform.width < recycleThreshold) {
      platforms.splice(i, 1);
    }
  }

  for (let i = solidPlatforms.length - 1; i >= 0; i--) {
    const platform = solidPlatforms[i];
    if (platform.position.x + platform.width < recycleThreshold) {
      solidPlatforms.splice(i, 1);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (enemy instanceof Astro) {
      enemy.update(deltaTime, player);
    } else {
      enemy.update(deltaTime);
    }

    for (let j = player.projectiles.length - 1; j >= 0; j--) {
      const arrow = player.projectiles[j];

      if (collision({ object1: arrow, object2: enemy.hitbox })) {
        console.log(" atingiu o inimigo", enemy.constructor.name);
        sprites.push(
          new DeathAnimation({
            position: { x: enemy.position.x, y: enemy.position.y },
            imageSrc: "./Sprite Pack 8/enemy-death.png",
            frameWidth: 40,
            frameHeight: 40,
            totalFrames: 6,
            frameInterval: 30,
          })
        );

        enemies.splice(i, 1);
        player.projectiles.splice(j, 1);
        window.remainingEnemies--;
        break;
      }
    }

    if (enemy instanceof Cerejinha) {
      const isStomping =
        platformCollision({
          object1: player.hitbox,
          object2: enemy.hitbox,
        }) && player.velocity.y > 0;

      if (isStomping && !player.isDead) {
        player.velocity.y = -4;
        sprites.push(
          new DeathAnimation({
            position: { x: enemy.position.x, y: enemy.position.y },
            imageSrc: "./Sprite Pack 8/enemy-death.png",
            frameWidth: 40,
            frameHeight: 40,
            totalFrames: 6,
            frameInterval: 30,
          })
        );
        enemies.splice(i, 1);
        window.remainingEnemies--;
      } else if (collision({ object1: player.hitbox, object2: enemy.hitbox })) {
        player.takeDamage();
      }
    } else if (enemy instanceof Cebolete) {
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
    } else if (enemy instanceof Astro) {
      if (
        collision({ object1: player.hitbox, object2: enemy.hitbox }) &&
        enemy.state !== "attack"
      ) {
        player.takeDamage();
      }
    }
  }

  if (enemies.length === 0 && !player.isDead) {
    if (!window.gameWon) {
      window.gameWon = true;
      console.log("player venceu!");
    }
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

  const layerParallaxFactors = [0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.8];
  let layerIndex = 0;

  //ceu
  context.save();
  context.translate(
    camera.position.x * layerParallaxFactors[layerIndex++],
    camera.position.y * layerParallaxFactors[layerIndex]
  );
  skyColor.draw(context);
  context.restore();

  //nuvens
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
    context.restore();
  }

  context.translate(camera.position.x, camera.position.y);

  for (const platform of platforms) {
    platform.draw(context);
  }

  for (const platform of solidPlatforms) {
    platform.draw(context);
  }

  for (const enemy of enemies) {
    enemy.draw(context);
  }

  for (const arrow of player.projectiles) {
    arrow.draw(context);
  }

  for (let i = sprites.length - 1; i >= 0; i--) {
    const sprite = sprites[i];
    if (sprite.done) {
      sprites.splice(i, 1);
    } else {
      sprite.update();
      sprite.draw(context);
    }
  }

  player.draw(context);

  context.restore();

  context.save();
  context.font = "16px Arial";
  context.fillStyle = "white";

  const levelText = `NIVEL: ${currentLevel} / ${TOTAL_LEVELS}`;
  context.fillText(levelText, 10, 20);

  const livesText = `VIDAS: ${player.lives}`; // n ta funcinando 
  context.fillText(livesText, 10, 40);

  const enemiesText = `INIMIGOS: ${window.remainingEnemies}`;
  context.fillText(enemiesText, 10, 60);

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