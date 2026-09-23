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
    { id: 'character.player', kind: 'model', label: 'Player character' },
    { id: 'env.ground', kind: 'texture', label: 'Ground' },
    { id: 'env.wall', kind: 'texture', label: 'Wall' },
    { id: 'sky.day', kind: 'skybox', label: 'Daytime sky' },
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
});
