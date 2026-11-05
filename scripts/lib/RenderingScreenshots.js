// @ts-check
/**
 * Compare the screenshots taken by the rendering tests of the games (the
 * gameplay tests named "Rendering: ...") with the expected images stored in
 * `rendering-screenshots/<example slug>/<screenshot label>.png`.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

/** The rendering tests of a game are the gameplay tests named like this. */
const RENDERING_TESTS_FILTER = 'Rendering:*';
const EXPECTED_SCREENSHOTS_DIRECTORY_NAME = 'rendering-screenshots';

// A pixel differs when one of its channels changed by more than this.
const CHANNEL_TOLERANCE = 8;
// An image differs when more than this proportion of its pixels differs.
const MAX_DIFFERING_PIXELS_RATIO = 0.001;

/**
 * @param {string} testName
 * @returns {boolean}
 */
const isRenderingTestName = (testName) => testName.startsWith('Rendering:');

/**
 * @param {string} label
 * @returns {string}
 */
const getScreenshotFileName = (label) =>
  `${
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'screenshot'
  }.png`;

/**
 * @param {Object} options
 * @param {string} options.repositoryPath
 * @param {string} options.exampleSlug
 * @returns {string}
 */
const getExpectedScreenshotsPath = ({ repositoryPath, exampleSlug }) =>
  path.join(repositoryPath, EXPECTED_SCREENSHOTS_DIRECTORY_NAME, exampleSlug);

/**
 * @typedef {Object} ImageComparison
 * @property {number} differingPixelsRatio
 * @property {PNG} diff The image drawn, darkened, with the pixels that
 * differ in magenta.
 */

/**
 * @param {PNG} actual
 * @param {PNG} expected Must have the same size as `actual`.
 * @returns {ImageComparison}
 */
const compareImages = (actual, expected) => {
  const diff = new PNG({ width: actual.width, height: actual.height });
  let differingPixelsCount = 0;
  for (let index = 0; index < actual.data.length; index += 4) {
    let maxChannelDifference = 0;
    for (let channel = 0; channel < 4; channel++) {
      maxChannelDifference = Math.max(
        maxChannelDifference,
        Math.abs(actual.data[index + channel] - expected.data[index + channel])
      );
    }
    const isDiffering = maxChannelDifference > CHANNEL_TOLERANCE;
    if (isDiffering) differingPixelsCount++;
    diff.data[index] = isDiffering ? 255 : actual.data[index] * 0.3;
    diff.data[index + 1] = isDiffering ? 0 : actual.data[index + 1] * 0.3;
    diff.data[index + 2] = isDiffering ? 255 : actual.data[index + 2] * 0.3;
    diff.data[index + 3] = 255;
  }
  return {
    differingPixelsRatio: differingPixelsCount / (actual.width * actual.height),
    diff,
  };
};

/**
 * Compare a screenshot with its expected image. When they differ, the
 * differences are written next to the screenshot (`.diff.png`).
 * @param {Object} options
 * @param {string} options.screenshotPath
 * @param {string} options.expectedScreenshotPath
 * @returns {string | null} Why the screenshot is not the expected one, or
 * null if it is.
 */
const findScreenshotDifference = ({
  screenshotPath,
  expectedScreenshotPath,
}) => {
  if (!fs.existsSync(expectedScreenshotPath)) {
    return `There is no expected image (${path.basename(
      expectedScreenshotPath
    )}): create it with \`node scripts/check-rendering-screenshots.js --update\`.`;
  }
  const actual = PNG.sync.read(fs.readFileSync(screenshotPath));
  const expected = PNG.sync.read(fs.readFileSync(expectedScreenshotPath));
  if (actual.width !== expected.width || actual.height !== expected.height) {
    return `The screenshot is ${actual.width}x${actual.height} instead of ${expected.width}x${expected.height}.`;
  }
  const { differingPixelsRatio, diff } = compareImages(actual, expected);
  if (differingPixelsRatio <= MAX_DIFFERING_PIXELS_RATIO) return null;
  fs.writeFileSync(
    screenshotPath.replace(/\.png$/, '.diff.png'),
    PNG.sync.write(diff)
  );
  return `${(differingPixelsRatio * 100).toFixed(
    2
  )}% of the pixels differ from the expected image (see the .diff.png next to the screenshot, differences in magenta).`;
};

module.exports = {
  RENDERING_TESTS_FILTER,
  EXPECTED_SCREENSHOTS_DIRECTORY_NAME,
  isRenderingTestName,
  getScreenshotFileName,
  getExpectedScreenshotsPath,
  compareImages,
  findScreenshotDifference,
};
