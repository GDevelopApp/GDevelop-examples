// @ts-check
const {
  applyThemeToStarter,
  getThemedStarterFileName,
} = require('../StarterThemer');

/** @typedef {import('../ThemeSlots.js').StarterThemeSlots} StarterThemeSlots */
/** @typedef {import('../StarterThemer.js').Theme} Theme */

/** @returns {StarterThemeSlots} */
const makeStarterThemeSlots = () => ({
  version: 1,
  objects: {
    'scene:Game Scene/Player': 'character.player',
    'scene:Game Scene/Enemy': 'character.enemy',
    'scene:Game Scene/Ground': 'env.ground',
    'scene:Game Scene/Crate': { top: 'env.ground', front: 'env.wall' },
    'object:TankConfiguration::CombinedTank/TankBase': 'character.player',
  },
  effects: {
    'effect:Game Scene//SkyBox': 'sky.day',
  },
  ignoredObjects: ['scene:Game Scene/Camera'],
});

/** @returns {Theme} */
const makeStarterTheme = () => ({
  id: 'pirate',
  name: 'Pirate islands',
  description: 'Tropical islands.',
  slots: {
    'character.player': {
      kind: 'model',
      file: 'https://asset-resources.gdevelop.io/public-resources/Henry.glb',
      resourceName: 'Henry.glb',
      assetStoreId: 'abc123',
      objectContent: {
        modelResourceName: 'Henry.glb',
        width: 200,
        height: 200,
        depth: 200,
        rotationX: 90,
        rotationY: 0,
        rotationZ: 90,
        materialType: 'StandardWithoutMetalness',
        originLocation: 'ModelOrigin',
        centerLocation: 'CenteredOnZ',
        animations: [
          { name: 'Idle', source: 'Henry_Idle', loop: true },
          { name: 'Run', source: 'Henry_Run', loop: true },
        ],
      },
    },
    'env.ground': {
      kind: 'texture',
      file: 'https://asset-resources.gdevelop.io/public-resources/Sand.png',
      resourceName: 'Sand.png',
    },
    'env.wall': {
      kind: 'texture',
      file: 'https://asset-resources.gdevelop.io/public-resources/Planks.png',
      resourceName: 'Planks.png',
    },
    'sky.day': {
      kind: 'skybox',
      assetStoreId: 'sky123',
      faces: {
        front: {
          file: 'https://asset-resources.gdevelop.io/public-resources/Tropical_Front.png',
          resourceName: 'Tropical_Front.png',
          origin: {
            name: 'gdevelop-asset-store',
            identifier: 'tropical-front',
          },
        },
        top: {
          file: 'https://asset-resources.gdevelop.io/public-resources/Tropical_Top.png',
          resourceName: 'Tropical_Top.png',
        },
      },
    },
  },
});

/** @param {string} modelResourceName */
const makeModelContent = (modelResourceName) => ({
  modelResourceName,
  width: 100,
  height: 100,
  depth: 100,
  originLocation: 'ModelOrigin',
  centerLocation: 'ModelOrigin',
  animations: [],
});

/** @returns {any} */
const makeProjectContent = () => ({
  resources: {
    resources: [
      {
        name: 'unit_orange.glb',
        file: 'assets/unit_orange.glb',
        kind: 'model3D',
      },
      { name: 'unit_red.glb', file: 'assets/unit_red.glb', kind: 'model3D' },
      {
        name: 'Ground.png',
        file: 'assets/Ground.png',
        kind: 'image',
        smoothed: false,
      },
      { name: 'Wall.png', file: 'assets/Wall.png', kind: 'image' },
      { name: 'Sky_Front.png', file: 'assets/Sky_Front.png', kind: 'image' },
      { name: 'Sky_Top.png', file: 'assets/Sky_Top.png', kind: 'image' },
      { name: 'Camera.png', file: 'assets/Camera.png', kind: 'image' },
    ],
  },
  layouts: [
    {
      name: 'Game Scene',
      layers: [
        {
          name: '',
          effects: [
            {
              name: 'SkyBox',
              effectType: 'Scene3D::Skybox',
              stringParameters: {
                frontFaceResourceName: 'Sky_Front.png',
                topFaceResourceName: 'Sky_Top.png',
              },
            },
          ],
        },
      ],
      objects: [
        {
          name: 'Player',
          type: 'Scene3D::Model3DObject',
          behaviors: [
            { name: 'Physics3D', type: 'Physics3D::Physics3DBehavior' },
          ],
          variables: [{ name: 'Health', value: 3 }],
          content: makeModelContent('unit_orange.glb'),
        },
        {
          name: 'Enemy',
          type: 'Scene3D::Model3DObject',
          content: makeModelContent('unit_red.glb'),
        },
        {
          name: 'Ground',
          type: 'Scene3D::Cube3DObject',
          content: {
            frontFaceResourceName: 'Ground.png',
            topFaceResourceName: 'Ground.png',
          },
        },
        {
          name: 'Crate',
          type: 'Scene3D::Cube3DObject',
          content: {
            frontFaceResourceName: 'Wall.png',
            topFaceResourceName: 'Ground.png',
          },
        },
        {
          name: 'Camera',
          type: 'Scene3D::Cube3DObject',
          content: { frontFaceResourceName: 'Camera.png' },
        },
      ],
    },
  ],
  eventsFunctionsExtensions: [
    {
      name: 'TankConfiguration',
      eventsBasedObjects: [
        {
          name: 'CombinedTank',
          objects: [
            {
              name: 'TankBase',
              type: 'Scene3D::Model3DObject',
              content: makeModelContent('unit_orange.glb'),
            },
          ],
        },
      ],
    },
  ],
});

/**
 * @param {any} projectContent
 * @param {string} name
 * @returns {any}
 */
const getResource = (projectContent, name) =>
  projectContent.resources.resources.find(
    /** @param {any} resource */ (resource) => resource.name === name
  );

/** @param {any} projectContent */
const applyPirateTheme = (projectContent) =>
  applyThemeToStarter(
    projectContent,
    makeStarterThemeSlots(),
    makeStarterTheme()
  );

describe('applyThemeToStarter', () => {
  it('adds the theme files as resources named like in the asset store', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(getResource(projectContent, 'Henry.glb')).toEqual({
      name: 'Henry.glb',
      file: 'https://asset-resources.gdevelop.io/public-resources/Henry.glb',
      kind: 'model3D',
      origin: {
        name: 'gdevelop-asset-store',
        identifier:
          'https://asset-resources.gdevelop.io/public-resources/Henry.glb',
      },
    });
    expect(getResource(projectContent, 'Tropical_Front.png').origin).toEqual({
      name: 'gdevelop-asset-store',
      identifier: 'tropical-front',
    });
  });

  it('configures a theme resource like the resource it replaces', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(getResource(projectContent, 'Sand.png').smoothed).toBe(false);
  });

  it('makes the objects and effects use the theme resources', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    const [player, , ground] = projectContent.layouts[0].objects;
    expect(player.content.modelResourceName).toBe('Henry.glb');
    expect(ground.content.frontFaceResourceName).toBe('Sand.png');
    expect(
      projectContent.layouts[0].layers[0].effects[0].stringParameters
    ).toEqual({
      frontFaceResourceName: 'Tropical_Front.png',
      topFaceResourceName: 'Tropical_Top.png',
    });
    expect(getResource(projectContent, 'Sky_Front.png')).toBeUndefined();
    expect(getResource(projectContent, 'Sky_Top.png')).toBeUndefined();
  });

  it('removes the resources that were replaced', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(getResource(projectContent, 'unit_orange.glb')).toBeUndefined();
    expect(getResource(projectContent, 'Ground.png')).toBeUndefined();
  });

  it('keeps a replaced resource that something else still uses', () => {
    const projectContent = makeProjectContent();
    // The camera helper, which is not themed, shows the ground image.
    projectContent.layouts[0].objects[4].content.frontFaceResourceName =
      'Ground.png';
    applyPirateTheme(projectContent);

    expect(getResource(projectContent, 'Ground.png').file).toBe(
      'assets/Ground.png'
    );
  });

  it('does not touch the resources of ignored or unmapped objects', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(getResource(projectContent, 'Camera.png').file).toBe(
      'assets/Camera.png'
    );
  });

  it('numbers a theme resource named like another resource of the starter', () => {
    const projectContent = makeProjectContent();
    projectContent.resources.resources[6].name = 'Sand.png';
    projectContent.layouts[0].objects[4].content.frontFaceResourceName =
      'Sand.png';
    applyPirateTheme(projectContent);

    expect(getResource(projectContent, 'Sand.png').file).toBe(
      'assets/Camera.png'
    );
    expect(getResource(projectContent, 'Sand.png 2').file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Sand.png'
    );
    expect(
      projectContent.layouts[0].objects[2].content.frontFaceResourceName
    ).toBe('Sand.png 2');
  });

  it('takes the theme model content while keeping the object identity', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    const player = projectContent.layouts[0].objects[0];
    expect(player.name).toBe('Player');
    expect(player.behaviors).toEqual([
      { name: 'Physics3D', type: 'Physics3D::Physics3DBehavior' },
    ]);
    expect(player.variables).toEqual([{ name: 'Health', value: 3 }]);
    expect(player.assetStoreId).toBe('abc123');
    expect(player.content.materialType).toBe('StandardWithoutMetalness');
    expect(player.content.originLocation).toBe('ModelOrigin');
    expect(player.content.centerLocation).toBe('ModelOrigin');
  });

  it('scales the theme model to the volume the placeholder occupied', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    const player = projectContent.layouts[0].objects[0];
    expect(player.content.width).toBeCloseTo(100);
    expect(player.content.height).toBeCloseTo(100);
    expect(player.content.depth).toBeCloseTo(100);
  });

  it('gives the object the theme animations when it had none', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(projectContent.layouts[0].objects[0].content.animations).toEqual([
      { name: 'Idle', source: 'Henry_Idle', loop: true },
      { name: 'Run', source: 'Henry_Run', loop: true },
    ]);
  });

  it('keeps the animation names the object already had', () => {
    const projectContent = makeProjectContent();
    projectContent.layouts[0].objects[0].content.animations = [
      { name: 'Run', source: 'Placeholder_Run', loop: true },
      { name: 'Jump', source: 'Placeholder_Jump', loop: false },
    ];
    applyPirateTheme(projectContent);

    const animations = projectContent.layouts[0].objects[0].content.animations;
    expect(
      animations.map(
        /** @param {any} animation */ (animation) => animation.name
      )
    ).toEqual(['Run', 'Jump', 'Idle']);
    expect(animations[0].source).toBe('Henry_Run');
    // An animation the theme does not have falls back to its first one.
    expect(animations[1].source).toBe('Henry_Idle');
  });

  it('lets a cube map each face to a different slot', () => {
    const projectContent = makeProjectContent();
    const result = applyPirateTheme(projectContent);

    const crate = projectContent.layouts[0].objects[3];
    expect(crate.content.frontFaceResourceName).toBe('Planks.png');
    expect(crate.content.topFaceResourceName).toBe('Sand.png');
    expect(result.appliedSlots).toContain('env.wall');
  });

  it('themes the 3D objects held by events-based objects', () => {
    const projectContent = makeProjectContent();
    const result = applyPirateTheme(projectContent);

    const tankBase =
      projectContent.eventsFunctionsExtensions[0].eventsBasedObjects[0]
        .objects[0];
    expect(tankBase.content.materialType).toBe('StandardWithoutMetalness');
    // Player, Ground, Crate and TankBase: the theme has no enemy.
    expect(result.changedObjectsCount).toBe(4);
  });

  it('reports the slots the theme does not fill and leaves them untouched', () => {
    const projectContent = makeProjectContent();
    const result = applyPirateTheme(projectContent);

    expect(result.missingSlots).toEqual(['character.enemy']);
    expect(getResource(projectContent, 'unit_red.glb').file).toBe(
      'assets/unit_red.glb'
    );
  });

  it('gives objects sharing a resource the resource of their own slot', () => {
    const projectContent = makeProjectContent();
    // The enemy uses the same model file as the player.
    projectContent.layouts[0].objects[1].content.modelResourceName =
      'unit_orange.glb';
    const starterTheme = makeStarterTheme();
    starterTheme.slots['character.enemy'] = {
      kind: 'model',
      file: 'https://asset-resources.gdevelop.io/public-resources/Skeleton.glb',
      resourceName: 'Skeleton.glb',
      objectContent: {
        modelResourceName: 'Skeleton.glb',
        width: 100,
        height: 100,
        depth: 100,
        animations: [],
      },
    };

    applyThemeToStarter(projectContent, makeStarterThemeSlots(), starterTheme);

    const [player, enemy] = projectContent.layouts[0].objects;
    expect(player.content.modelResourceName).toBe('Henry.glb');
    expect(enemy.content.modelResourceName).toBe('Skeleton.glb');
    expect(getResource(projectContent, 'Skeleton.glb').file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Skeleton.glb'
    );
  });

  it('skips a mapped object the project does not have', () => {
    const projectContent = makeProjectContent();
    const starterThemeSlots = makeStarterThemeSlots();
    starterThemeSlots.objects['scene:Game Scene/Ghost'] = 'character.player';

    const result = applyThemeToStarter(
      projectContent,
      starterThemeSlots,
      makeStarterTheme()
    );

    expect(result.changedObjectsCount).toBe(4);
  });

  it('can be applied again to change the theme of an already themed project', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    const secondTheme = makeStarterTheme();
    secondTheme.id = 'medieval';
    secondTheme.slots['character.player'] = {
      kind: 'model',
      file: 'https://asset-resources.gdevelop.io/public-resources/Knight.glb',
      resourceName: 'Knight.glb',
      objectContent: {
        modelResourceName: 'Knight.glb',
        width: 150,
        height: 150,
        depth: 150,
        animations: [{ name: 'Idle', source: 'Knight_Idle', loop: true }],
      },
    };
    applyThemeToStarter(projectContent, makeStarterThemeSlots(), secondTheme);

    expect(getResource(projectContent, 'Knight.glb').file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Knight.glb'
    );
    expect(getResource(projectContent, 'Henry.glb')).toBeUndefined();
    expect(
      projectContent.layouts[0].objects[0].content.animations[0].source
    ).toBe('Knight_Idle');
  });

  it('changes nothing when the theme fills no slot of the starter', () => {
    const projectContent = makeProjectContent();
    const result = applyThemeToStarter(
      projectContent,
      makeStarterThemeSlots(),
      { id: 'empty', name: 'Empty', description: '', slots: {} }
    );

    expect(result.changedObjectsCount).toBe(0);
    expect(result.changedResourcesCount).toBe(0);
    expect(getResource(projectContent, 'unit_orange.glb').file).toBe(
      'assets/unit_orange.glb'
    );
  });
});

/** @returns {StarterThemeSlots} */
const makeTerrainThemeSlots = () => ({
  version: 1,
  objects: {
    'scene:Game Scene/Terrain': {
      Layer1Texture: { slot: 'terrain.ground', normalMap: 'Layer1NormalMap' },
      Layer2Texture: { slot: 'terrain.road', normalMap: 'Layer2NormalMap' },
      Layer3Texture: { slot: 'terrain.rock', normalMap: 'Layer3NormalMap' },
    },
    'scene:Game Scene/Grass': {
      BaseColor: 'terrain.grass.base',
      TipColor: 'terrain.grass.tip',
    },
  },
});

/** @returns {Theme} */
const makeTerrainTheme = () => ({
  id: 'winter',
  name: 'Winter',
  description: 'Snowy mountains.',
  slots: {
    'terrain.ground': {
      kind: 'material',
      file: 'https://asset-resources.gdevelop.io/public-resources/Snow_Color.jpg',
      resourceName: 'Snow_Color.jpg',
      normalMap: {
        file: 'https://asset-resources.gdevelop.io/public-resources/Snow_Normal.jpg',
        resourceName: 'Snow_Normal.jpg',
      },
    },
    'terrain.road': {
      kind: 'material',
      file: 'https://asset-resources.gdevelop.io/public-resources/Ice.jpg',
      resourceName: 'Ice.jpg',
    },
    'terrain.grass.base': { kind: 'color', color: '120;130;140' },
    'terrain.grass.tip': { kind: 'color', color: '230;235;240' },
  },
});

/** @returns {any} */
const makeTerrainProjectContent = () => ({
  resources: {
    resources: [
      { name: 'Grass.jpg', file: 'assets/Grass.jpg', kind: 'image' },
      {
        name: 'GrassNormal.jpg',
        file: 'assets/GrassNormal.jpg',
        kind: 'image',
        smoothed: true,
      },
      { name: 'Asphalt.jpg', file: 'assets/Asphalt.jpg', kind: 'image' },
      {
        name: 'AsphaltNormal.jpg',
        file: 'assets/AsphaltNormal.jpg',
        kind: 'image',
      },
    ],
  },
  layouts: [
    {
      name: 'Game Scene',
      layers: [],
      objects: [
        {
          name: 'Terrain',
          type: 'Terrain3D::Terrain3D',
          content: {
            Layer1Texture: 'Grass.jpg',
            Layer1NormalMap: '',
            Layer2Texture: 'Asphalt.jpg',
            Layer2NormalMap: 'AsphaltNormal.jpg',
            Layer3Texture: '',
            Layer3NormalMap: '',
          },
        },
        {
          name: 'Grass',
          type: 'Terrain3D::TerrainGrass',
          content: { BaseColor: '40;62;22', TipColor: '112;130;52' },
        },
      ],
    },
  ],
});

describe('applyThemeToStarter on custom objects', () => {
  /** @param {any} projectContent */
  const applyWinterTheme = (projectContent) =>
    applyThemeToStarter(
      projectContent,
      makeTerrainThemeSlots(),
      makeTerrainTheme()
    );

  it('gives a terrain layer the texture and the normal map of a material', () => {
    const projectContent = makeTerrainProjectContent();
    applyWinterTheme(projectContent);

    const terrainContent = projectContent.layouts[0].objects[0].content;
    expect(terrainContent.Layer1Texture).toBe('Snow_Color.jpg');
    expect(terrainContent.Layer1NormalMap).toBe('Snow_Normal.jpg');
    expect(getResource(projectContent, 'Snow_Normal.jpg')).toEqual({
      name: 'Snow_Normal.jpg',
      file: 'https://asset-resources.gdevelop.io/public-resources/Snow_Normal.jpg',
      kind: 'image',
      origin: {
        name: 'gdevelop-asset-store',
        identifier:
          'https://asset-resources.gdevelop.io/public-resources/Snow_Normal.jpg',
      },
    });
    expect(getResource(projectContent, 'Grass.jpg')).toBeUndefined();
  });

  it('removes the normal map of a layer whose material has none', () => {
    const projectContent = makeTerrainProjectContent();
    applyWinterTheme(projectContent);

    const terrainContent = projectContent.layouts[0].objects[0].content;
    expect(terrainContent.Layer2Texture).toBe('Ice.jpg');
    expect(terrainContent.Layer2NormalMap).toBe('');
    expect(getResource(projectContent, 'AsphaltNormal.jpg')).toBeUndefined();
  });

  it('leaves a layer untouched when the theme does not fill its slot', () => {
    const projectContent = makeTerrainProjectContent();
    const result = applyWinterTheme(projectContent);

    const terrainContent = projectContent.layouts[0].objects[0].content;
    expect(terrainContent.Layer3Texture).toBe('');
    expect(result.missingSlots).toEqual(['terrain.rock']);
  });

  it('gives a color property the color of a color slot', () => {
    const projectContent = makeTerrainProjectContent();
    const result = applyWinterTheme(projectContent);

    expect(projectContent.layouts[0].objects[1].content).toEqual({
      BaseColor: '120;130;140',
      TipColor: '230;235;240',
    });
    expect(result.appliedSlots).toEqual([
      'terrain.grass.base',
      'terrain.grass.tip',
      'terrain.ground',
      'terrain.road',
    ]);
    expect(result.changedObjectsCount).toBe(2);
  });

  it('fills a layer that had no texture', () => {
    const projectContent = makeTerrainProjectContent();
    applyThemeToStarter(projectContent, makeTerrainThemeSlots(), {
      ...makeTerrainTheme(),
      slots: { 'terrain.rock': makeTerrainTheme().slots['terrain.ground'] },
    });

    const terrainContent = projectContent.layouts[0].objects[0].content;
    expect(terrainContent.Layer3Texture).toBe('Snow_Color.jpg');
    expect(terrainContent.Layer3NormalMap).toBe('Snow_Normal.jpg');
    expect(getResource(projectContent, 'Snow_Color.jpg').kind).toBe('image');
  });

  it('gives a layer a texture without its normal map', () => {
    const projectContent = makeTerrainProjectContent();
    applyThemeToStarter(projectContent, makeTerrainThemeSlots(), {
      ...makeTerrainTheme(),
      slots: {
        'terrain.road': {
          kind: 'texture',
          file: 'https://asset-resources.gdevelop.io/public-resources/Sand.png',
          resourceName: 'Sand.png',
        },
      },
    });

    const terrainContent = projectContent.layouts[0].objects[0].content;
    expect(terrainContent.Layer2Texture).toBe('Sand.png');
    expect(terrainContent.Layer2NormalMap).toBe('');
  });

  it('gives scattered models the model of a model slot, keeping their size', () => {
    /** @type {any} */
    const projectContent = {
      resources: {
        resources: [
          { name: 'Pine.glb', file: 'assets/Pine.glb', kind: 'model3D' },
        ],
      },
      layouts: [
        {
          name: 'Game Scene',
          layers: [],
          objects: [
            {
              name: 'Forest',
              type: 'Terrain3D::ScatteredModels',
              content: { Model: 'Pine.glb', Size: 300 },
            },
          ],
        },
      ],
    };
    const result = applyThemeToStarter(
      projectContent,
      {
        version: 1,
        objects: { 'scene:Game Scene/Forest': { Model: 'nature.tree' } },
      },
      {
        ...makeTerrainTheme(),
        slots: {
          'nature.tree': {
            kind: 'model',
            file: 'https://asset-resources.gdevelop.io/public-resources/Palm.glb',
            resourceName: 'Palm.glb',
            objectContent: { modelResourceName: 'Palm.glb', rotationX: 90 },
          },
        },
      }
    );

    expect(projectContent.layouts[0].objects[0].content).toEqual({
      Model: 'Palm.glb',
      Size: 300,
    });
    expect(getResource(projectContent, 'Palm.glb').kind).toBe('model3D');
    expect(getResource(projectContent, 'Pine.glb')).toBeUndefined();
    expect(result.appliedSlots).toEqual(['nature.tree']);
  });

  it('gives a cube face the texture of a material', () => {
    const projectContent = makeProjectContent();
    applyThemeToStarter(projectContent, makeStarterThemeSlots(), {
      ...makeStarterTheme(),
      slots: { 'env.ground': makeTerrainTheme().slots['terrain.ground'] },
    });

    expect(
      projectContent.layouts[0].objects[2].content.topFaceResourceName
    ).toBe('Snow_Color.jpg');
  });
});

describe('applyThemeToStarter on a 2D starter', () => {
  const makeProject = () => ({
    resources: {
      resources: [
        { name: 'Player.png', kind: 'image', file: 'assets/Player.png' },
        { name: 'Ground.png', kind: 'image', file: 'assets/Ground.png' },
        { name: 'Tiles.png', kind: 'image', file: 'assets/Tiles.png' },
      ],
    },
    layouts: [
      {
        name: 'Game Scene',
        objects: [
          {
            name: 'Player',
            type: 'Sprite',
            behaviors: [{ name: 'Platformer' }],
            animations: [
              {
                name: '',
                directions: [
                  {
                    sprites: [
                      {
                        image: 'Player.png',
                        originPoint: { name: 'origine', x: 0, y: 0 },
                        centerPoint: { name: 'centre', automatic: true },
                        points: [{ name: 'Hand', x: 64, y: 32 }],
                        hasCustomCollisionMask: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: 'Ground',
            type: 'TiledSpriteObject::TiledSprite',
            content: { texture: 'Ground.png', width: 64, height: 64 },
          },
          {
            name: 'Tiles',
            type: 'TileMap::SimpleTileMap',
            content: {
              atlasImage: 'Tiles.png',
              tileSize: 64,
              columnCount: 3,
              rowCount: 1,
              tilesWithHitBox: '2',
            },
          },
        ],
        instances: [
          { name: 'Player', customSize: false, width: 0, height: 0 },
          { name: 'Player', customSize: true, width: 128, height: 128 },
          {
            name: 'Tiles',
            stringProperties: [
              {
                name: 'tilemap',
                value: JSON.stringify({
                  layers: [{ id: 0, tiles: [[0, 1, 2, -1]] }],
                }),
              },
            ],
          },
        ],
      },
    ],
  });

  /** @returns {StarterThemeSlots} */
  const makeThemeSlots = () => ({
    version: 1,
    requireAllSlots: true,
    objects: {
      'scene:Game Scene/Player': { slot: '2d.side.player', anchor: 'bottom' },
      'scene:Game Scene/Ground': '2d.side.ground',
      'scene:Game Scene/Tiles': {
        slot: '2d.overhead.tilemap',
        tiles: { 0: 'ground', 1: 'ground', 2: 'area' },
      },
    },
  });

  /** @param {string} image */
  const makeThemeFrame = (image) => ({
    image,
    originPoint: { name: 'origine', x: 0, y: 0 },
    centerPoint: { name: 'centre', automatic: true },
    points: [],
    hasCustomCollisionMask: true,
    customCollisionMask: [
      [
        { x: 28, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 128 },
        { x: 28, y: 128 },
      ],
    ],
  });

  /** @returns {Theme} */
  const makeTheme = () => ({
    id: 'platformer',
    name: 'Colorful platformer',
    description: 'A cheerful platformer world.',
    slots: {
      '2d.side.player': {
        kind: 'sprite',
        assetStoreId: 'hero123',
        width: 128,
        height: 128,
        objectContent: {
          type: 'Sprite',
          animations: [
            {
              name: 'idle',
              directions: [{ sprites: [makeThemeFrame('Hero_idle.png')] }],
            },
            {
              name: 'walk',
              directions: [{ sprites: [makeThemeFrame('Hero_walk.png')] }],
            },
          ],
        },
        resources: [
          { name: 'Hero_idle.png', kind: 'image', file: 'https://a/idle.png' },
          { name: 'Hero_walk.png', kind: 'image', file: 'https://a/walk.png' },
        ],
      },
      '2d.side.ground': {
        kind: 'texture',
        file: 'https://a/grass.png',
        resourceName: 'tiled_Grass.png',
      },
      '2d.overhead.tilemap': {
        kind: 'tilemap',
        file: 'https://a/atlas.png',
        resourceName: 'Terrain atlas.png',
        tileSize: 64,
        columnCount: 10,
        rowCount: 4,
        tiles: { ground: 12, area: 30 },
      },
    },
  });

  // The placeholder is a 64x64 image entirely visible.
  const options = {
    getStarterImageBox: () => ({
      width: 64,
      height: 64,
      box: { left: 0, top: 0, right: 64, bottom: 64 },
    }),
  };

  it('draws the theme sprite where the placeholder was, standing on its bottom', () => {
    const project = makeProject();
    const result = applyThemeToStarter(
      project,
      makeThemeSlots(),
      makeTheme(),
      options
    );
    /** @type {any} */
    const player = project.layouts[0].objects[0];

    expect(result.missingSlots).toEqual([]);
    // The 72x128 art is as tall as the 64 pixels placeholder.
    expect(player.preScale).toBe(0.5);
    expect(player.behaviors).toEqual([{ name: 'Platformer' }]);
    expect(player.assetStoreId).toBe('hero123');
    // The animation of the starter is played by the first one of the theme,
    // and the other animations of the theme are added.
    expect(player.animations.map((/** @type {any} */ a) => a.name)).toEqual([
      '',
      'walk',
    ]);
    const frame = player.animations[0].directions[0].sprites[0];
    expect(frame.image).toBe('Hero_idle.png');
    // The top-left corner of the placeholder is 32 pixels left of the art.
    expect(frame.originPoint).toMatchObject({ x: 0, y: 0 });
    expect(frame.centerPoint).toMatchObject({ automatic: false, x: 64, y: 64 });
    expect(frame.points).toEqual([{ name: 'Hand', x: 128, y: 64 }]);
    // The collision mask is the one of the theme art.
    expect(frame.customCollisionMask[0][0]).toEqual({ x: 28, y: 0 });
  });

  it('keeps the instances with a custom size as large as they were', () => {
    const project = makeProject();
    applyThemeToStarter(project, makeThemeSlots(), makeTheme(), options);
    // 128 pixels for a 64 pixels placeholder: twice the theme art at its scale.
    expect(project.layouts[0].instances[1]).toMatchObject({
      width: 128,
      height: 128,
    });
  });

  it('replaces the placeholder images by the images of the theme', () => {
    const project = makeProject();
    applyThemeToStarter(project, makeThemeSlots(), makeTheme(), options);
    expect(
      project.resources.resources.map((resource) => resource.name).sort()
    ).toEqual([
      'Hero_idle.png',
      'Hero_walk.png',
      'Terrain atlas.png',
      'tiled_Grass.png',
    ]);
    /** @type {any} */
    const ground = project.layouts[0].objects[1];
    expect(ground.content.texture).toBe('tiled_Grass.png');
  });

  it('paints a tile map with the tiles of the theme playing the same roles', () => {
    const project = makeProject();
    applyThemeToStarter(project, makeThemeSlots(), makeTheme(), options);
    /** @type {any} */
    const tiles = project.layouts[0].objects[2];
    expect(tiles.content).toEqual({
      atlasImage: 'Terrain atlas.png',
      tileSize: 64,
      columnCount: 10,
      rowCount: 4,
      tilesWithHitBox: '30',
    });
    /** @type {any} */
    const instance = project.layouts[0].instances[2];
    expect(JSON.parse(instance.stringProperties[0].value)).toEqual({
      layers: [{ id: 0, tiles: [[12, 12, 30, -1]] }],
    });
  });

  it('reports the slots the theme does not fill', () => {
    const theme = makeTheme();
    delete theme.slots['2d.side.ground'];
    // A tile map of another tile size cannot replace the tiles of the starter.
    // @ts-ignore - this slot is a tile map.
    theme.slots['2d.overhead.tilemap'].tileSize = 16;
    const project = makeProject();
    const result = applyThemeToStarter(
      project,
      makeThemeSlots(),
      theme,
      options
    );
    expect(result.missingSlots).toEqual([
      '2d.overhead.tilemap',
      '2d.side.ground',
    ]);
    /** @type {any} */
    const tiles = project.layouts[0].objects[2];
    expect(tiles.content.atlasImage).toBe('Tiles.png');
  });

  it('scales art drawn on a grid of tiles to the grid of the starter', () => {
    const theme = makeTheme();
    /** @type {any} */
    const slot = theme.slots['2d.side.player'];
    // 16 pixels tiles, for a starter built on 64 pixels tiles.
    slot.tileSize = 16;
    slot.width = 32;
    slot.height = 32;
    const project = makeProject();
    applyThemeToStarter(project, makeThemeSlots(), theme, options);
    /** @type {any} */
    const player = project.layouts[0].objects[0];
    expect(player.preScale).toBe(4);
    // An instance with a custom size takes the size of the art at that scale.
    expect(project.layouts[0].instances[1]).toMatchObject({
      customSize: false,
    });

    const pixelProject = makeProject();
    applyThemeToStarter(
      pixelProject,
      { ...makeThemeSlots(), tileSize: 32 },
      theme,
      options
    );
    /** @type {any} */
    const pixelPlayer = pixelProject.layouts[0].objects[0];
    expect(pixelPlayer.preScale).toBe(2);
  });

  it('halves the scale of grid art wider than an instance with a custom size', () => {
    const theme = makeTheme();
    /** @type {any} */
    const slot = theme.slots['2d.side.player'];
    slot.tileSize = 16;
    slot.width = 32;
    slot.height = 48;
    slot.objectContent.animations.forEach((/** @type {any} */ animation) => {
      animation.directions[0].sprites[0].customCollisionMask = [
        [
          { x: 0, y: 0 },
          { x: 32, y: 0 },
          { x: 32, y: 48 },
          { x: 0, y: 48 },
        ],
      ];
    });
    const project = makeProject();
    Object.assign(project.layouts[0].instances[1], {
      x: 100,
      y: 200,
      width: 64,
      height: 128,
    });
    applyThemeToStarter(project, makeThemeSlots(), theme, options);
    // 128x192 at the scale of the grid: 64x96, standing on the same bottom.
    // The origin is at (8, 32) in the art, so the art is drawn at (100, 232).
    expect(project.layouts[0].instances[1]).toMatchObject({
      customSize: true,
      x: 116,
      y: 296,
      width: 64,
      height: 96,
    });
  });

  it('plays an animation with the theme animation the starter asks for', () => {
    const project = makeProject();
    /** @type {any} */
    const player = project.layouts[0].objects[0];
    player.animations[0].name = 'Walk0';
    const themeSlots = makeThemeSlots();
    themeSlots.objects['scene:Game Scene/Player'] = {
      slot: '2d.side.player',
      animations: { Walk0: ['Walk Right', 'walk'] },
    };
    applyThemeToStarter(project, themeSlots, makeTheme(), options);
    expect(player.animations[0].name).toBe('Walk0');
    expect(player.animations[0].directions[0].sprites[0].image).toBe(
      'Hero_walk.png'
    );
    // The other animation of the theme is still added.
    expect(player.animations.map((/** @type {any} */ a) => a.name)).toEqual([
      'Walk0',
      'idle',
    ]);
  });

  it('gives each animation of a sprite the art of its own slot', () => {
    const project = makeProject();
    /** @type {any} */
    const player = project.layouts[0].objects[0];
    player.animations = [
      { ...player.animations[0], name: 'Unit' },
      { ...player.animations[0], name: 'Tower' },
    ];
    const theme = makeTheme();
    /** @type {any} */
    const heroSlot = theme.slots['2d.side.player'];
    theme.slots['2d.board.tower'] = {
      ...heroSlot,
      assetStoreId: 'tower123',
      objectContent: {
        type: 'Sprite',
        animations: [
          {
            name: '',
            directions: [{ sprites: [makeThemeFrame('Tower.png')] }],
          },
        ],
      },
      resources: [
        { name: 'Tower.png', kind: 'image', file: 'https://a/t.png' },
      ],
    };
    const themeSlots = makeThemeSlots();
    themeSlots.objects['scene:Game Scene/Player'] = {
      animationSlots: { Unit: '2d.side.player', Tower: '2d.board.tower' },
    };
    const result = applyThemeToStarter(project, themeSlots, theme, options);

    expect(result.missingSlots).toEqual([]);
    expect(
      player.animations.map(
        (/** @type {any} */ a) =>
          a.name + ':' + a.directions[0].sprites[0].image
      )
    ).toEqual(['Unit:Hero_idle.png', 'Tower:Tower.png']);

    // Without one of the slots, the sprite is left as it was.
    delete theme.slots['2d.board.tower'];
    const untouchedProject = makeProject();
    /** @type {any} */
    const untouchedPlayer = untouchedProject.layouts[0].objects[0];
    untouchedPlayer.animations = [
      { ...untouchedPlayer.animations[0], name: 'Unit' },
      { ...untouchedPlayer.animations[0], name: 'Tower' },
    ];
    const missing = applyThemeToStarter(
      untouchedProject,
      themeSlots,
      theme,
      options
    );
    expect(missing.missingSlots).toContain('2d.board.tower');
    expect(untouchedPlayer.animations[0].directions[0].sprites[0].image).toBe(
      'Player.png'
    );
  });

  it('takes the image and the tile map a theme made for the tiles of the starter', () => {
    const theme = makeTheme();
    /** @type {any} */
    const slots = theme.slots;
    slots['2d.side.player'].tileSize = 16;
    slots['2d.side.ground'].variants = [
      {
        kind: 'texture',
        file: 'https://a/grass32.png',
        resourceName: 'tiled_Grass 32.png',
        tileSize: 32,
      },
    ];
    slots['2d.overhead.tilemap'].variants = [
      {
        ...slots['2d.overhead.tilemap'],
        file: 'https://a/atlas32.png',
        resourceName: 'Terrain 32 atlas.png',
        tileSize: 32,
      },
    ];
    const project = makeProject();
    /** @type {any} */
    const tiles = project.layouts[0].objects[2];
    tiles.content.tileSize = 32;
    const result = applyThemeToStarter(
      project,
      { ...makeThemeSlots(), tileSize: 32 },
      theme,
      options
    );

    expect(result.missingSlots).toEqual([]);
    /** @type {any} */
    const ground = project.layouts[0].objects[1];
    expect(ground.content.texture).toBe('tiled_Grass 32.png');
    expect(tiles.content.atlasImage).toBe('Terrain 32 atlas.png');
  });

  it('does not use art that is not pixel art in a starter built on small tiles', () => {
    const project = makeProject();
    const result = applyThemeToStarter(
      project,
      { ...makeThemeSlots(), tileSize: 32 },
      makeTheme(),
      options
    );
    // The sprite is not drawn on a grid, and the image is made for 64 pixels
    // tiles.
    expect(result.missingSlots).toEqual(['2d.side.ground', '2d.side.player']);
  });

  it('does not enlarge art smaller than the placeholder', () => {
    const theme = makeTheme();
    /** @type {any} */
    const slot = theme.slots['2d.side.player'];
    slot.objectContent.animations.forEach((/** @type {any} */ animation) => {
      animation.directions[0].sprites[0].customCollisionMask = [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 4 },
          { x: 0, y: 4 },
        ],
      ];
    });
    const project = makeProject();
    applyThemeToStarter(project, makeThemeSlots(), theme, options);
    /** @type {any} */
    const player = project.layouts[0].objects[0];
    expect(player.preScale).toBe(1);
  });
});

describe('getThemedStarterFileName', () => {
  it('names the themed copy after the starter, to sit next to it', () => {
    expect(getThemedStarterFileName('starting-3d-tank', 'pirate')).toBe(
      'starting-3d-tank.theme-pirate.json'
    );
  });
});
