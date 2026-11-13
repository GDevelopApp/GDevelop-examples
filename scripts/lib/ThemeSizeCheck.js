// @ts-check

/** @typedef {import('./StarterThemer.js').SizedModel} SizedModel */
/** @typedef {import('./StarterThemer.js').ModelDimensions} ModelDimensions */

// How much larger or smaller than the placeholder a theme model can be drawn
// before it is reported.
const MAX_SIZE_RATIO = 1.25;

/** @param {number} ratio */
const toPercent = (ratio) => `${Math.round(ratio * 100)}%`;

/** @param {ModelDimensions} dimensions */
const getLargestDimension = ({ width, height, depth }) =>
  Math.max(width, height, depth);

/**
 * The size a model is fit by, and its name: its height, its length, its
 * volume (compared as the side of a cube), or its largest dimension for a
 * model fit in the placeholder (which is smaller when the model is not of the
 * shape of the placeholder).
 * @param {import('./ThemeSlots.js').ModelFit} fit
 * @returns {{label: string, getSize: (dimensions: ModelDimensions) => number}}
 */
const getMainDimension = (fit) =>
  fit === 'height'
    ? { label: 'height', getSize: (dimensions) => dimensions.depth }
    : fit === 'length'
    ? {
        label: 'length',
        getSize: (dimensions) => Math.max(dimensions.width, dimensions.height),
      }
    : fit === 'volume'
    ? {
        label: 'volume',
        getSize: ({ width, height, depth }) =>
          Math.cbrt(width * height * depth),
      }
    : { label: 'largest dimension', getSize: getLargestDimension };

/**
 * What looks wrong in the size of a theme model compared to the placeholder it
 * replaces: a main dimension more than 25% off (like a prop of another shape
 * than the placeholder, fit in it but much smaller), or a vehicle more than
 * 25% broader than the placeholder. The scale a theme deliberately gives its
 * model is not reported. A model sized by the volume of the placeholder
 * object, for lack of its real dimensions, is not checked: the size it is
 * drawn at is not known.
 *
 * A vehicle taller than the placeholder is not reported (a truck in the place
 * of a car), nor a character wider than it: its model is in its bind pose,
 * arms spread, wider than it is drawn while it moves.
 * @param {SizedModel} sizedModel
 * @returns {Array<string>}
 */
const getSizeWarnings = ({ fit, scale, placeholder, themed: scaledThemed }) => {
  if (!fit) return [];
  const themed = {
    width: scaledThemed.width / scale,
    height: scaledThemed.height / scale,
    depth: scaledThemed.depth / scale,
  };

  /** @type {Array<string>} */
  const warnings = [];
  const mainDimension = getMainDimension(fit);
  const placeholderMainSize = mainDimension.getSize(placeholder);
  if (placeholderMainSize > 0) {
    const ratio = mainDimension.getSize(themed) / placeholderMainSize;
    if (ratio > MAX_SIZE_RATIO || ratio < 1 / MAX_SIZE_RATIO) {
      warnings.push(
        `${toPercent(ratio)} of the ${mainDimension.label} of the placeholder`
      );
    }
  }
  if (fit === 'length') {
    const ratio =
      Math.min(themed.width, themed.height) /
      Math.min(placeholder.width, placeholder.height);
    if (ratio > MAX_SIZE_RATIO) {
      warnings.push(`${toPercent(ratio)} of the breadth of the placeholder`);
    }
  }
  return warnings;
};

module.exports = { getSizeWarnings };
