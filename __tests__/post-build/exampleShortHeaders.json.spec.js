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

describe('filters.json post build checks', () => {
  test('defaultTags', async () => {
    const exampleShortHeaders = await getExampleShortHeaders();

    // Check that the headers seem correct
    expect(exampleShortHeaders.length).toBeGreaterThan(120);

    const platformer = exampleShortHeaders.find(
      ({ name }) => name === 'Platformer'
    );
    if (!platformer)
      throw new Error('Platformer not found in the example short headers');

    expect(platformer).toEqual({
      id: '244c50f590aaef77fda8c883e95e64c728fc75be0825e42093b275b56320667f',
      name: 'Platformer',
      authorIds: [],
      shortDescription:
        'An example of a basic platformer (Mario-like) game. Jump around and collect as many coins as you can!',
      license: 'MIT',
      previewImageUrls: [
        'https://resources.gdevelop-app.com/examples/platformer/preview.png',
        'https://resources.gdevelop-app.com/examples/platformer/thumbnail.png',
      ],
      tags: [
        'platformer',
        'Starter',
        '',
        'Anchor',
        'Audio',
        'Cameras and layers features',
        'Standard Conversions',
        'Builtin events',
        'Keyboard features',
        'Mouse and touch',
        'Features for all objects',
        'Scene management features',
        'Variable features',
        'Window features',
        'Platform Behavior',
        'Sprite',
        'System information',
        'Text object',
        'Tiled Sprite Object',
        'Tweening',
        'Parallax for Tiled Sprite',
      ],
      gdevelopVersion: '',
    });
  });
});
