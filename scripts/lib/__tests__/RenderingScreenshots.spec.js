// @ts-check
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');
const {
  getScreenshotFileName,
  findScreenshotDifference,
} = require('../RenderingScreenshots');

/**
 * A 100x100 grey image, with a square of another color in its top left corner.
 * @param {{ squareSize: number, squareColor: [number, number, number] }} square
 * @returns {Buffer}
 */
const createFakeScreenshot = ({ squareSize, squareColor }) => {
  const image = new PNG({ width: 100, height: 100 });
  for (let y = 0; y < 100; y++) {
    for (let x = 0; x < 100; x++) {
      const index = (y * 100 + x) * 4;
      const color =
        x < squareSize && y < squareSize ? squareColor : [128, 128, 128];
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = 255;
    }
  }
  return PNG.sync.write(image);
};

describe('RenderingScreenshots', () => {
  /** @type {string} */
  let folderPath;
  /** @type {string} */
  let screenshotPath;
  /** @type {string} */
  let expectedScreenshotPath;
  beforeEach(() => {
    folderPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rendering-'));
    screenshotPath = path.join(folderPath, 'screenshot.png');
    expectedScreenshotPath = path.join(folderPath, 'expected.png');
    fs.writeFileSync(
      expectedScreenshotPath,
      createFakeScreenshot({ squareSize: 10, squareColor: [255, 0, 0] })
    );
  });
  afterEach(() => {
    fs.rmSync(folderPath, { recursive: true, force: true });
  });

  it('names the expected images after the labels of the screenshots', () => {
    expect(getScreenshotFileName('Sun and Shadows')).toBe(
      'sun-and-shadows.png'
    );
    expect(getScreenshotFileName('The island, from above!')).toBe(
      'the-island-from-above.png'
    );
  });

  it('accepts a screenshot drawn with tiny color changes', () => {
    fs.writeFileSync(
      screenshotPath,
      createFakeScreenshot({ squareSize: 10, squareColor: [250, 4, 3] })
    );

    expect(
      findScreenshotDifference({ screenshotPath, expectedScreenshotPath })
    ).toBe(null);
  });

  it('reports a screenshot where something is drawn differently, with an image of the differences', () => {
    fs.writeFileSync(
      screenshotPath,
      createFakeScreenshot({ squareSize: 20, squareColor: [255, 0, 0] })
    );

    expect(
      findScreenshotDifference({ screenshotPath, expectedScreenshotPath })
    ).toMatch(/^3\.00% of the pixels differ/);
    const diff = PNG.sync.read(
      fs.readFileSync(path.join(folderPath, 'screenshot.diff.png'))
    );
    const pixelInTheDifferences = (15 * 100 + 15) * 4;
    expect(
      Array.from(
        diff.data.slice(pixelInTheDifferences, pixelInTheDifferences + 4)
      )
    ).toEqual([255, 0, 255, 255]);
  });

  it('reports a screenshot without expected image', () => {
    fs.writeFileSync(
      screenshotPath,
      createFakeScreenshot({ squareSize: 10, squareColor: [255, 0, 0] })
    );

    expect(
      findScreenshotDifference({
        screenshotPath,
        expectedScreenshotPath: path.join(folderPath, 'missing.png'),
      })
    ).toMatch(/There is no expected image/);
  });
});
