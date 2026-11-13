// @ts-check
const { PNG } = require('pngjs');

/**
 * The size of an image and the box of its visible (not transparent) pixels.
 * @typedef {{
 *   width: number,
 *   height: number,
 *   box: {left: number, top: number, right: number, bottom: number},
 * }} ImageBox
 */

// Fainter pixels (soft shadows, antialiasing) are not part of the shape.
const VISIBLE_ALPHA = 32;

/**
 * @param {Buffer} buffer The content of a PNG file.
 * @returns {ImageBox | null} null if the image cannot be read.
 */
const readPngBox = (buffer) => {
  /** @type {PNG} */
  let png;
  try {
    png = PNG.sync.read(buffer);
  } catch (error) {
    return null;
  }

  const { width, height, data } = png;
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < VISIBLE_ALPHA) continue;
      if (x < left) left = x;
      if (x + 1 > right) right = x + 1;
      if (y < top) top = y;
      if (y + 1 > bottom) bottom = y + 1;
    }
  }
  if (right <= left || bottom <= top) {
    return {
      width,
      height,
      box: { left: 0, top: 0, right: width, bottom: height },
    };
  }
  return { width, height, box: { left, top, right, bottom } };
};

module.exports = { readPngBox };
