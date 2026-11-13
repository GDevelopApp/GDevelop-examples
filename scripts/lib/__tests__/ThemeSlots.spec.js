// @ts-check
const {
  getThemeableObjects,
  checkStarterThemeSlots,
} = require('../ThemeSlots');

/** @typedef {import('../ThemeSlots.js').ThemeSlotsVocabulary} ThemeSlotsVocabulary */
/** @typedef {import('../ThemeSlots.js').StarterThemeSlots} StarterThemeSlots */

/** @type {ThemeSlotsVocabulary} */
const vocabulary = {
  version: 1,
  slots: [
    {
      id: 'character.player',
      kind: 'model',
      label: 'Player character',
      description: 'The character the player controls.',
    },
    {
      id: 'nature.tree',
      kind: 'model',
      label: 'Tree',
      description: 'The trees.',
    },
    {
      id: 'env.ground',
      kind: 'texture',
      label: 'Ground',
      description: 'The texture of the ground.',
    },
    {
      id: 'env.wall',
      kind: 'texture',
      label: 'Wall',
      description: 'The texture of the walls.',
    },
    {
      id: 'sky.day',
      kind: 'skybox',
      label: 'Daytime sky',
      description: 'The sky.',
    },
    {
      id: 'terrain.ground',
      kind: 'material',
      label: 'Terrain ground',
      description: 'The main ground of a terrain.',
    },
    {
      id: 'terrain.grass.tip',
      kind: 'color',
      label: 'Grass tip color',
      description: 'The color of the grass blades at their tip.',
    },
  ],
};

const createFakeProjectObject = () => ({
  layouts: [
    {
      name: 'Game Scene',
      layers: [
        {
          name: '',
          effects: [{ name: 'SkyBox', effectType: 'Scene3D::Skybox' }],
        },
      ],
      objects: [
        { name: 'Player', type: 'Scene3D::Model3DObject' },
        { name: 'Ground', type: 'Scene3D::Cube3DObject' },
        { name: 'Camera', type: 'Scene3D::Cube3DObject' },
        { name: 'Joystick', type: 'Sprite' },
      ],
    },
  ],
  eventsFunctionsExtensions: [
    {
      name: 'TankConfiguration',
      eventsBasedObjects: [
        {
          name: 'CombinedTank',
          objects: [{ name: 'TankBase', type: 'Scene3D::Model3DObject' }],
        },
      ],
    },
  ],
});

/** @returns {StarterThemeSlots} */
const createFakeStarterThemeSlots = () => ({
  version: 1,
  objects: {
    'scene:Game Scene/Player': 'character.player',
    'scene:Game Scene/Ground': 'env.ground',
    'object:TankConfiguration::CombinedTank/TankBase': 'character.player',
  },
  effects: {
    'effect:Game Scene//SkyBox': 'sky.day',
  },
  ignoredObjects: ['scene:Game Scene/Camera'],
});

/** @returns {any} */
const createFakeTerrainProjectObject = () => {
  /** @type {any} */
  const projectObject = createFakeProjectObject();
  projectObject.layouts[0].objects.push({
    name: 'Terrain',
    type: 'Terrain3D::Terrain3D',
  });
  projectObject.eventsFunctionsExtensions.push({
    name: 'Terrain3D',
    eventsBasedObjects: [
      {
        name: 'Terrain3D',
        objects: [],
        propertyDescriptors: [
          { name: 'Layer1Texture', type: 'Resource' },
          { name: 'Layer1NormalMap', type: 'Resource' },
          { name: 'Layer1Color', type: 'Color' },
          { name: 'TextureSize', type: 'Number' },
        ],
      },
    ],
  });
  return projectObject;
};

/** @returns {any} */
const createFakeForestProjectObject = () => {
  /** @type {any} */
  const projectObject = createFakeProjectObject();
  projectObject.layouts[0].objects.push({
    name: 'Forest',
    type: 'Terrain3D::ScatteredModels',
  });
  projectObject.eventsFunctionsExtensions.push({
    name: 'Terrain3D',
    eventsBasedObjects: [
      {
        name: 'ScatteredModels',
        objects: [],
        propertyDescriptors: [
          { name: 'Model', type: 'Resource', extraInformation: ['model3D'] },
          { name: 'Size', type: 'Number' },
        ],
      },
    ],
  });
  return projectObject;
};

/**
 * @param {StarterThemeSlots['objects'][string]} terrainMapping
 * @returns {StarterThemeSlots}
 */
const createFakeTerrainThemeSlots = (terrainMapping) => {
  const starterThemeSlots = createFakeStarterThemeSlots();
  starterThemeSlots.objects['scene:Game Scene/Terrain'] = terrainMapping;
  return starterThemeSlots;
};

describe('getThemeableObjects', () => {
  it('lists the 3D objects of scenes and custom objects, and the skyboxes', () => {
    const { objects, effects, is3D } = getThemeableObjects(
      createFakeProjectObject()
    );

    expect(is3D).toBe(true);
    expect(objects.map((object) => object.path)).toEqual([
      'scene:Game Scene/Player',
      'scene:Game Scene/Ground',
      'scene:Game Scene/Camera',
      'object:TankConfiguration::CombinedTank/TankBase',
    ]);
    expect(effects).toEqual(['effect:Game Scene//SkyBox']);
  });

  it('does not consider a project without 3D objects as 3D', () => {
    expect(
      getThemeableObjects({
        layouts: [{ name: 'Scene', objects: [{ name: 'A', type: 'Sprite' }] }],
      }).is3D
    ).toBe(false);
  });
});

describe('checkStarterThemeSlots', () => {
  it('accepts a starter whose 3D objects are all mapped or ignored', () => {
    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-3d-test',
        createFakeProjectObject(),
        createFakeStarterThemeSlots()
      )
    ).toEqual([]);
  });

  it('asks for a theme-slots.json when a 3D starter has none', () => {
    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeProjectObject(),
      null
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('has no theme-slots.json');
  });

  it('asks nothing of a starter without 3D objects', () => {
    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-2d-test',
        {
          layouts: [
            { name: 'Scene', objects: [{ name: 'A', type: 'Sprite' }] },
          ],
        },
        null
      )
    ).toEqual([]);
  });

  it('reports a 3D object that is neither mapped nor ignored', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    delete starterThemeSlots.objects['scene:Game Scene/Ground'];

    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeProjectObject(),
      starterThemeSlots
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('"scene:Game Scene/Ground"');
  });

  it('reports a mapping to an object the starter does not have anymore', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.objects['scene:Game Scene/Ghost'] = 'character.player';

    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeProjectObject(),
      starterThemeSlots
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('"scene:Game Scene/Ghost"');
  });

  it('reports a slot that does not exist, or of the wrong kind', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.objects['scene:Game Scene/Player'] = 'character.hero';
    starterThemeSlots.objects['scene:Game Scene/Ground'] = 'character.player';

    const messages = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeProjectObject(),
      starterThemeSlots
    ).map((error) => error.message);

    expect(messages).toEqual([
      expect.stringContaining('"character.hero", which is not a slot'),
      expect.stringContaining('a model slot, but needs a texture slot'),
    ]);
  });

  it('lets a cube map each face to its own slot', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.objects['scene:Game Scene/Ground'] = {
      top: 'env.ground',
      front: 'env.wall',
    };

    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-3d-test',
        createFakeProjectObject(),
        starterThemeSlots
      )
    ).toEqual([]);
  });

  it('reports a skybox mapping to an effect the starter does not have', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.effects = { 'effect:Game Scene//Gone': 'sky.day' };

    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeProjectObject(),
      starterThemeSlots
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('"effect:Game Scene//Gone"');
  });

  it('requires a skybox to map to a skybox slot', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.effects = { 'effect:Game Scene//SkyBox': 'env.wall' };

    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeProjectObject(),
      starterThemeSlots
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain(
      'a texture slot, but needs a skybox slot'
    );
  });

  it('accepts a custom object mapping its resources and colors', () => {
    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-3d-test',
        createFakeTerrainProjectObject(),
        createFakeTerrainThemeSlots({
          Layer1Texture: {
            slot: 'terrain.ground',
            normalMap: 'Layer1NormalMap',
          },
          Layer1Color: 'terrain.grass.tip',
        })
      )
    ).toEqual([]);
  });

  it('does not require custom objects to be mapped', () => {
    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-3d-test',
        createFakeTerrainProjectObject(),
        createFakeStarterThemeSlots()
      )
    ).toEqual([]);
  });

  it('reports a custom object property that does not exist or cannot be themed', () => {
    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeTerrainProjectObject(),
      createFakeTerrainThemeSlots({
        Layer9Texture: 'env.ground',
        TextureSize: 'env.ground',
        Layer1Texture: { slot: 'terrain.ground', normalMap: 'Missing' },
      })
    );

    expect(errors.map((error) => error.message)).toEqual([
      'Starter "starting-3d-test": "scene:Game Scene/Terrain" maps the property "Layer9Texture", which its object does not have.',
      'Starter "starting-3d-test": "scene:Game Scene/Terrain" maps its property "TextureSize", a Number, but only resources and colors can be themed.',
      'Starter "starting-3d-test": "scene:Game Scene/Terrain" maps the property "Missing", which its object does not have.',
    ]);
  });

  it('requires a material slot for a texture with its normal map', () => {
    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeTerrainProjectObject(),
      createFakeTerrainThemeSlots({
        Layer1Texture: { slot: 'env.ground', normalMap: 'Layer1NormalMap' },
        Layer1Color: 'env.ground',
      })
    );

    expect(errors.map((error) => error.message)).toEqual([
      'Starter "starting-3d-test": "scene:Game Scene/Terrain" property "Layer1Texture" maps to "env.ground", a texture slot, but needs a material slot.',
      'Starter "starting-3d-test": "scene:Game Scene/Terrain" property "Layer1Color" maps to "env.ground", a texture slot, but needs a color slot.',
    ]);
  });

  it('accepts a custom object mapping its 3D model to a model slot', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.objects['scene:Game Scene/Forest'] = {
      Model: 'nature.tree',
    };

    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-3d-test',
        createFakeForestProjectObject(),
        starterThemeSlots
      )
    ).toEqual([]);
  });

  it('requires a model slot for the 3D model of a custom object', () => {
    const starterThemeSlots = createFakeStarterThemeSlots();
    starterThemeSlots.objects['scene:Game Scene/Forest'] = {
      Model: 'env.ground',
    };

    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeForestProjectObject(),
      starterThemeSlots
    );

    expect(errors.map((error) => error.message)).toEqual([
      'Starter "starting-3d-test": "scene:Game Scene/Forest" property "Model" maps to "env.ground", a texture slot, but needs a model slot.',
    ]);
  });

  it('requires a custom object drawing a 3D model to be mapped or ignored', () => {
    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeForestProjectObject(),
      createFakeStarterThemeSlots()
    );
    const starterThemeSlots = createFakeStarterThemeSlots();
    (starterThemeSlots.ignoredObjects || []).push('scene:Game Scene/Forest');

    expect(errors.map((error) => error.message)).toEqual([
      'Starter "starting-3d-test": the Terrain3D::ScatteredModels "scene:Game Scene/Forest" draws a 3D model but is neither mapped to slots nor listed in ignoredObjects in theme-slots.json.',
    ]);
    expect(
      checkStarterThemeSlots(
        vocabulary,
        'starting-3d-test',
        createFakeForestProjectObject(),
        starterThemeSlots
      )
    ).toEqual([]);
  });

  it('requires a custom object to map its properties', () => {
    const errors = checkStarterThemeSlots(
      vocabulary,
      'starting-3d-test',
      createFakeTerrainProjectObject(),
      createFakeTerrainThemeSlots('terrain.ground')
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('must map its properties to slots');
  });
});

describe('checkStarterThemeSlots on a 2D starter', () => {
  /** @type {ThemeSlotsVocabulary} */
  const vocabulary2D = {
    version: 1,
    slots: [
      { id: '2d.side.player', kind: 'sprite', label: '', description: '' },
      { id: '2d.side.ground', kind: 'texture', label: '', description: '' },
      { id: '2d.tilemap', kind: 'tilemap', label: '', description: '' },
    ],
  };
  const project = {
    layouts: [
      {
        name: 'Game Scene',
        objects: [
          { name: 'Player', type: 'Sprite' },
          { name: 'Ground', type: 'TiledSpriteObject::TiledSprite' },
          { name: 'Tiles', type: 'TileMap::SimpleTileMap' },
          { name: 'JumpButton', type: 'Sprite' },
        ],
      },
    ],
  };

  it('accepts sprites, tiled sprites and tile maps mapped to slots of their kind', () => {
    expect(
      checkStarterThemeSlots(vocabulary2D, 'starting-platformer', project, {
        version: 1,
        requireAllSlots: true,
        objects: {
          'scene:Game Scene/Player': {
            slot: '2d.side.player',
            anchor: 'bottom',
          },
          'scene:Game Scene/Ground': '2d.side.ground',
          'scene:Game Scene/Tiles': {
            slot: '2d.tilemap',
            tiles: { 0: 'ground' },
          },
        },
      })
    ).toEqual([]);
  });

  it('reports an object the starter does not have, and a slot of the wrong kind', () => {
    const errors = checkStarterThemeSlots(
      vocabulary2D,
      'starting-platformer',
      project,
      {
        version: 1,
        objects: {
          'scene:Game Scene/Hero': '2d.side.player',
          'scene:Game Scene/Player': '2d.side.ground',
          'scene:Game Scene/Ground': '2d.side.unknown',
          'scene:Game Scene/Tiles': { slot: '2d.tilemap' },
        },
      }
    ).map((error) => error.message);

    expect(errors).toHaveLength(4);
    expect(errors[0]).toContain('"scene:Game Scene/Hero", which is not');
    expect(errors[1]).toContain('a texture slot, but needs a sprite slot');
    expect(errors[2]).toContain('which is not a slot of theme-slots.json');
    expect(errors[3]).toContain('must map the role of each of its tiles');
  });
});
