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
          'Shake Object',
          'Volume Falloff',
        ]),
        codeSizeLevel: 'small',
        difficultyLevel: 'simple',
        gdevelopVersion: '',
      })
    );
  });
});
