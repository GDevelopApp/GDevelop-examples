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
      ({ slug }) => slug === 'platformer'
    );
    if (!platformer)
      throw new Error('Platformer not found in the example short headers');

    expect(platformer).toMatchSnapshot();

    const tappyPlane = exampleShortHeaders.find(
      ({ slug }) => slug === 'tappy-plane'
    );
    if (!tappyPlane)
      throw new Error('Tappy Plane not found in the example short headers');

    expect(tappyPlane).toMatchSnapshot();

    const startingPointPlatformer = exampleShortHeaders.find(
      ({ slug }) => slug === 'starting-platformer'
    );
    if (!startingPointPlatformer)
      throw new Error(
        'Starting Point Platformer not found in the example short headers'
      );

    expect(startingPointPlatformer).toMatchSnapshot();

    const startingPointPixelPlatformer = exampleShortHeaders.find(
      ({ slug }) => slug === 'starting-platformer-pixel'
    );
    if (!startingPointPixelPlatformer)
      throw new Error(
        'Starting Point Pixel Platformer not found in the example short headers'
      );

    expect(startingPointPixelPlatformer).toMatchSnapshot();
  });
});
