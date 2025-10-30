class TerrainManager {
    constructor(terrainImage, WORLD_GROUND_Y, TILE_SIZE = 16) {
    this.terrainImage = terrainImage;

    this.TILE_SIZE = TILE_SIZE;
    this.TILE_SPACING = this.TILE_SIZE;
    this.groundTopY = WORLD_GROUND_Y; 

    this.TILES = {
        GROVE_LEFT: { x: 16, y: 48, width: 16, height: 16 }, 
        GROVE_MID: { x: 64, y: 16, width: 16, height: 16 }, 
        GROVE_CENTER: { x: 160, y: 48, width: 16, height: 16 }, 
        GROVE_RIGHT: { x: 112, y: 48, width: 16, height: 16 }, 

        DIRT_FILL: { x: 64, y: 48, width: 16, height: 16 }, 
        DIRT_LEFT: { x: 16, y: 64, width: 16, height: 16 }, 
        DIRT_RIGHT: { x: 112, y: 64, width: 16, height: 16 }, 

        PLAT_LEFT: { x: 144, y: 48, width: 16, height: 16 }, 
        PLAT_CENTER: { x: 160, y: 48, width: 16, height: 16 }, 
        PLAT_RIGHT: { x: 208, y: 48, width: 16, height: 16 } 
    };
}

    createGroundChunk(startX, widthInTiles = 20, heightInTiles = 2) {
    const solids = [];
    const isInitialChunk = startX === 0;

    for (let i = 0; i < widthInTiles; i++) {
      const tileX = startX + this.TILE_SPACING * i;

    let cropboxTop;
    if (i === 0 && isInitialChunk) {
        cropboxTop = this.TILES.GROVE_LEFT;
    } else if (i === widthInTiles - 1) {
        cropboxTop = this.TILES.GROVE_RIGHT;
    } else {
        cropboxTop = this.TILES.GROVE_MID;
    }

    solids.push(
        new Platform({
        position: { x: tileX, y: this.groundTopY },
        image: this.terrainImage,
        cropbox: cropboxTop,
        })
    );
    }

    const dirtFillTiles = this.createDirtFill(startX, this.groundTopY, widthInTiles, heightInTiles);

    dirtFillTiles.forEach(tile => {
    solids.push(
        new Platform({
        position: tile.position,
        image: this.terrainImage,
        cropbox: tile.cropbox,
        })
    );
    });

    return solids;
}


createPlatformChunk(startX, platformConfigs = []) {
    const platforms = [];

    const defaultConfigs = [
        { x: 32, y: -64, width: 3 },
        { x: 128, y: -48, width: 4 }, 
        { x: 224, y: -32, width: 2 } 
    ];

    const configs = platformConfigs.length > 0 ? platformConfigs : defaultConfigs;


    configs.forEach(config => {
        const platformTiles = this.createHorizontalPlatform(
        startX + config.x,
        this.groundTopY + config.y, // y relativo ao topo do chão
        config.width
    );

    platformTiles.forEach(tile => {
        platforms.push(
            new Platform({
            position: tile.position,
            image: this.terrainImage,
            cropbox: tile.cropbox,
            })
        );
    });
    });

    return platforms;
}

createMixedChunk(startX) {
    const allSolids = [];

    const ground = this.createGroundChunk(startX);
    allSolids.push(...ground);

    const platforms = this.createPlatformChunk(startX);
    
    return { solids: allSolids, platforms: platforms };
}

createDirtFill(startX, startY, widthInTiles, heightInTiles) {
    const tiles = [];
    for (let x = 0; x < widthInTiles; x++) {
            for (let y = 1; y <= heightInTiles; y++) {
            tiles.push({
                position: {
                    x: startX + x * this.TILE_SPACING,
                    y: startY + y * this.TILE_SPACING
                },
                cropbox: this.TILES.DIRT_FILL
            });
        }
    }
    return tiles;
}

createHorizontalPlatform(startX, y, numTiles) {
    const tiles = [];
    if (numTiles <= 0) return tiles;

    const leftTile = this.TILES.PLAT_LEFT;
    const centerTile = this.TILES.PLAT_CENTER;
    const rightTile = this.TILES.PLAT_RIGHT;

    if (numTiles === 1) {
        tiles.push({ position: { x: startX, y: y }, cropbox: centerTile });
        return tiles;
    }

    tiles.push({ position: { x: startX, y: y }, cropbox: leftTile });

    for (let i = 1; i < numTiles - 1; i++) {
        tiles.push({
        position: { x: startX + i * this.TILE_SPACING, y: y },
        cropbox: centerTile
        });
    }

    tiles.push({
        position: { x: startX + (numTiles - 1) * this.TILE_SPACING, y: y },
        cropbox: rightTile
    });

    return tiles;
    }
}