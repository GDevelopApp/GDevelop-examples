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
    'effect:Game Scene//SkyBox': { frontFaceResourceName: 'sky.day.front' },
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
    },
    'env.wall': {
      kind: 'texture',
      file: 'https://asset-resources.gdevelop.io/public-resources/Planks.png',
    },
    'sky.day.front': {
      kind: 'texture',
      file: 'https://asset-resources.gdevelop.io/public-resources/Tropical.png',
      origin: { name: 'gdevelop-asset-store', identifier: 'tropical-front' },
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
      { name: 'Ground.png', file: 'assets/Ground.png', kind: 'image' },
      { name: 'Wall.png', file: 'assets/Wall.png', kind: 'image' },
      { name: 'Sky_Front.png', file: 'assets/Sky_Front.png', kind: 'image' },
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
              stringParameters: { frontFaceResourceName: 'Sky_Front.png' },
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

/** @param {any} projectContent */
const applyPirateTheme = (projectContent) =>
  applyThemeToStarter(
    projectContent,
    makeStarterThemeSlots(),
    makeStarterTheme()
  );

describe('applyThemeToStarter', () => {
  it('repoints the resources of mapped objects at the theme files', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    const resources = projectContent.resources.resources;
    expect(resources[0].file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Henry.glb'
    );
    expect(resources[2].file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Sand.png'
    );
    expect(resources[4].file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Tropical.png'
    );
    expect(resources[4].origin).toEqual({
      name: 'gdevelop-asset-store',
      identifier: 'tropical-front',
    });
  });

  it('does not touch the resources of ignored or unmapped objects', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(projectContent.resources.resources[5].file).toBe(
      'assets/Camera.png'
    );
  });

  it('keeps resource names so every reference follows', () => {
    const projectContent = makeProjectContent();
    applyPirateTheme(projectContent);

    expect(projectContent.resources.resources[2].name).toBe('Ground.png');
    expect(
      projectContent.layouts[0].objects[2].content.frontFaceResourceName
    ).toBe('Ground.png');
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
    expect(player.content.modelResourceName).toBe('unit_orange.glb');
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

    expect(projectContent.resources.resources[3].file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Planks.png'
    );
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
    expect(projectContent.resources.resources[1].file).toBe(
      'assets/unit_red.glb'
    );
  });

  it('gives objects sharing a resource their own copy when they play different slots', () => {
    const projectContent = makeProjectContent();
    // The enemy uses the same model file as the player.
    projectContent.layouts[0].objects[1].content.modelResourceName =
      'unit_orange.glb';
    const starterTheme = makeStarterTheme();
    starterTheme.slots['character.enemy'] = {
      kind: 'model',
      file: 'https://asset-resources.gdevelop.io/public-resources/Skeleton.glb',
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
    /** @type {Object.<string, any>} */
    const resourceByName = {};
    projectContent.resources.resources.forEach(
      /** @param {any} resource */ (resource) => {
        resourceByName[resource.name] = resource;
      }
    );
    expect(player.content.modelResourceName).toBe('unit_orange.glb');
    expect(resourceByName['unit_orange.glb'].file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Henry.glb'
    );
    expect(enemy.content.modelResourceName).toBe(
      'unit_orange.glb (character.enemy)'
    );
    expect(resourceByName['unit_orange.glb (character.enemy)'].file).toBe(
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
      objectContent: {
        modelResourceName: 'Knight.glb',
        width: 150,
        height: 150,
        depth: 150,
        animations: [{ name: 'Idle', source: 'Knight_Idle', loop: true }],
      },
    };
    const result = applyThemeToStarter(
      projectContent,
      makeStarterThemeSlots(),
      secondTheme
    );

    expect(projectContent.resources.resources[0].file).toBe(
      'https://asset-resources.gdevelop.io/public-resources/Knight.glb'
    );
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
    expect(projectContent.resources.resources[0].file).toBe(
      'assets/unit_orange.glb'
    );
  });
});

describe('getThemedStarterFileName', () => {
  it('names the themed copy after the starter, to sit next to it', () => {
    expect(getThemedStarterFileName('starting-3d-tank', 'pirate')).toBe(
      'starting-3d-tank.theme-pirate.json'
    );
  });
});
