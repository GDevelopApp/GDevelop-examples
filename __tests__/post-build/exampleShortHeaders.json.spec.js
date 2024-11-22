// @ts-check
const fs = require('fs').promises;
const path = require('path');

/** @typedef {import('../../scripts/types').ExampleShortHeader} ExampleShortHeader */

/** @return {Promise<ExampleShortHeader[]>} */
const getExampleShortHeaders = async () => {
  const exampleShortHeadersJson = await fs.readFile(
    path.join(__dirname, '../../dist/database/exampleShortHeaders.json')
  );
  const exampleShortHeaders = JSON.parse(exampleShortHeadersJson.toString());
  return exampleShortHeaders;
};

describe('exampleShortHeaders.json post build checks', () => {
  test('defaultTags', async () => {
    const exampleShortHeaders = await getExampleShortHeaders();

    // Check that the headers seem correct
    expect(exampleShortHeaders.length).toBeGreaterThan(120);

    const platformer = exampleShortHeaders.find(
      ({ name }) => name === 'Platformer'
    );
    if (!platformer)
      throw new Error('Platformer not found in the example short headers');

    expect(platformer).toEqual(
      expect.objectContaining({
        id: 'd260466ba96262fd00930eb950ae486209a828f851add1c1c5bbc2a2d020f868',
        slug: 'platformer',
        name: 'Platformer',
        authorIds: ['R0F5QGNCzgOY5w2cxGeKJOq2UaD2'],
        shortDescription:
          'An example of a basic platformer (Mario-like) game. Jump around and collect as many coins as you can!',
        license: 'MIT',
        previewImageUrls: [
          'https://resources.gdevelop-app.com/examples/platformer/preview.png',
          'https://resources.gdevelop-app.com/examples/platformer/square-icon.png',
        ],
        tags: expect.arrayContaining([
          'platformer',
          'game',
          'simple',
          'Starter',
          'Anchor',
          'Event functions',
          'Sounds and music',
          'Layers and cameras',
          'Conversion',
          'Events and control flow',
          'Mathematical tools',
          'Mouse and touch',
          'Objects',
          'Scene',
          'Timers and time',
          'Variables',
          'Debugger Tools',
          'Linked objects',
          'Panel Sprite (9-patch) Object',
          'Particle system',
          'Platform behavior',
          'Shape painter',
          'Sprite',
          'System information',
          'Text object',
          'Tiled Sprite Object',
          'Top-down movement',
          'Tweening',
          'Panel sprite button',
          'Platformer character animator',
          'Rectangular movement',
          'Smooth Camera',
          'Checkpoints',
          'Gamepads (controllers)',
          'Multitouch joystick and buttons (sprite)',
          'Shake object',
          'Volume Falloff',
        ]),
        codeSizeLevel: 'small',
        difficultyLevel: 'simple',
        gdevelopVersion: '',
      })
    );

    const tappyPlane = exampleShortHeaders.find(
      ({ name }) => name === 'Tappy plane'
    );
    if (!tappyPlane)
      throw new Error('Tappy Plane not found in the example short headers');

    expect(tappyPlane).toEqual(
      expect.objectContaining({
        id: '3cfc75d79ece13652857e8f9c20931f275916ca88f89940ca81b91734da4ac5d',
        name: 'Tappy plane',
        slug: 'tappy-plane',
        shortDescription:
          'Tappy Plane is a Flappy Bird-like game. Tap to keep your plane in the air and make your way through the cave system.\nGet as far as you can before you crash in to a wall, submit your score, and try again.',
        license: 'MIT',
        previewImageUrls: [
          'https://resources.gdevelop-app.com/examples/tappy-plane/thumbnail.png',
        ],
        quickCustomizationImageUrl:
          'https://resources.gdevelop-app.com/examples/tappy-plane/thumbnail-quick-customization.png',
        authorIds: [
          'jy7FXnGX0ZZcWfrAI9YuQaeIphi1',
          '9MGDlUQAh8QUilno4JPycekjRCJ3',
          'R0F5QGNCzgOY5w2cxGeKJOq2UaD2',
        ],
        tags: expect.arrayContaining([
          'tappy-plane',
          'game',
          'simple',
          'Starter',
          'Animatable capability',
          'Event functions',
          'Sounds and music',
          'Layers and cameras',
          'Events and control flow',
          'External layouts',
          'Storage',
          'Keyboard',
          'Mathematical tools',
          'Mouse and touch',
          'Network',
          'Objects',
          'Scene',
          'Timers and time',
          'Variables',
          'Destroy Outside Screen Behavior',
          'Effect capability',
          'Flippable capability',
          'Leaderboards',
          'Opacity capability',
          'Panel Sprite (9-patch) Object',
          'Platform behavior',
          'Player Authentication',
          'Resizable capability',
          'Scalable capability',
          'Sprite',
          'Text capability',
          'Text Input',
          'Text object',
          'Tiled Sprite Object',
          'Tweening',
          'Ellipse movement',
          'Panel sprite button',
          'Shake object',
          'Flash object',
        ]),
        codeSizeLevel: 'small',
        difficultyLevel: 'simple',
        gdevelopVersion: '',
      })
    );
  });
});
