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
 * @param {{ sceneEvents?: Array<*>, extensionFunctionEvents?: Array<*>, customObjectFunctionEvents?: Array<*> }} events
 */
const createFakeProjectObject = ({
  sceneEvents = [],
  extensionFunctionEvents = [],
  customObjectFunctionEvents = [],
}) => ({
  layouts: [{ name: 'Game Scene', objects: [], events: sceneEvents }],
  externalEvents: [],
  eventsFunctionsExtensions: [
    {
      name: 'MyExtension',
      eventsFunctions: [
        { name: 'MyFunction', events: extensionFunctionEvents },
      ],
      eventsBasedObjects: [
        {
          name: 'MyTank',
          eventsFunctions: [
            { name: 'MuzzleX', events: customObjectFunctionEvents },
          ],
        },
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
const returnMuzzleXAction = createFakeInstruction('SetReturnNumber', [
  'Object.ToParentX(Cannon.X() + Cannon.Width(), Cannon.Y(), Cannon.Object3D::Z())',
]);

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

  it('needs a GDevelop with the conversions of custom objects when a custom object uses them', () => {
    const projectObject = createFakeProjectObject({
      customObjectFunctionEvents: [createFakeEvent([returnMuzzleXAction])],
    });

    expect(getExampleGDevelopVersion(projectObject, [])).toBe('>=5.6.286');
  });

  it('needs the most recent GDevelop of all the features used', () => {
    const projectObject = createFakeProjectObject({
      sceneEvents: [createFakeEvent([setBodyTypeAction])],
      customObjectFunctionEvents: [createFakeEvent([returnMuzzleXAction])],
    });

    expect(getExampleGDevelopVersion(projectObject, ['Physics3D'])).toBe(
      '>=5.6.286'
    );
  });

  it('does not take a function of another object named like a conversion for one', () => {
    const projectObject = createFakeProjectObject({
      sceneEvents: [
        createFakeEvent([
          createFakeInstruction('SetX', ['Bullet', '=', 'Ship.ToParentX()']),
        ]),
      ],
    });

    expect(getExampleGDevelopVersion(projectObject, [])).toBe('');
  });

  it('accepts any GDevelop for the other examples', () => {
    const projectObject = createFakeProjectObject({});

    expect(getExampleGDevelopVersion(projectObject, ['Sprite'])).toBe('');
  });
});
