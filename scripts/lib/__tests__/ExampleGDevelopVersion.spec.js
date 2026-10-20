// @ts-check
const { getExampleGDevelopVersion } = require('../ExampleGDevelopVersion');

/**
 * @param {string} type
 * @param {Array<string>} parameters
 */
const createFakeInstruction = (type, parameters) => ({
  type: { value: type },
  parameters,
});

/**
 * @param {Array<*>} actions
 * @param {Array<*>} [subEvents]
 */
const createFakeEvent = (actions, subEvents = []) => ({
  type: 'BuiltinCommonInstructions::Standard',
  conditions: [],
  actions,
  events: subEvents,
});

/**
 * @param {{ sceneEvents?: Array<*>, extensionFunctionEvents?: Array<*> }} events
 */
const createFakeProjectObject = ({
  sceneEvents = [],
  extensionFunctionEvents = [],
}) => ({
  layouts: [{ name: 'Game Scene', objects: [], events: sceneEvents }],
  externalEvents: [],
  eventsFunctionsExtensions: [
    {
      name: 'MyExtension',
      eventsFunctions: [
        { name: 'MyFunction', events: extensionFunctionEvents },
      ],
    },
  ],
});

const setBodyTypeAction = createFakeInstruction(
  'Physics3D::Physics3DBehavior::SetBodyType',
  ['Enemy', 'Physics3D', '"Dynamic"']
);
const applyImpulseAction = createFakeInstruction(
  'Physics3D::Physics3DBehavior::ApplyImpulse',
  ['Enemy', 'Physics3D', '0', '0', '0']
);

describe('getExampleGDevelopVersion', () => {
  it('needs a GDevelop with the "Body type" action when a sub-event of a scene uses it', () => {
    const projectObject = createFakeProjectObject({
      sceneEvents: [
        createFakeEvent([], [createFakeEvent([setBodyTypeAction])]),
      ],
    });

    expect(getExampleGDevelopVersion(projectObject, ['Physics3D'])).toBe(
      '>=5.6.285'
    );
  });

  it('needs a GDevelop with the "Body type" action when an extension uses it', () => {
    const projectObject = createFakeProjectObject({
      extensionFunctionEvents: [createFakeEvent([setBodyTypeAction])],
    });

    expect(getExampleGDevelopVersion(projectObject, ['Physics3D'])).toBe(
      '>=5.6.285'
    );
  });

  it('needs a GDevelop with the 3D physics for the other 3D physics examples', () => {
    const projectObject = createFakeProjectObject({
      sceneEvents: [createFakeEvent([applyImpulseAction])],
    });

    expect(getExampleGDevelopVersion(projectObject, ['Physics3D'])).toBe(
      '>=5.5.220'
    );
  });

  it('accepts any GDevelop for the other examples', () => {
    const projectObject = createFakeProjectObject({});

    expect(getExampleGDevelopVersion(projectObject, ['Sprite'])).toBe('');
  });
});
