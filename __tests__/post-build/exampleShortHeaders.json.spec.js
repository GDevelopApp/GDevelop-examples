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
        id: '244c50f590aaef77fda8c883e95e64c728fc75be0825e42093b275b56320667f',
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
          'Starter',
          'Mathematical tools',
          'Platform behavior',
          'Gamepads (controllers)',
        ]),
        gdevelopVersion: '',
      })
    );
  });
});
