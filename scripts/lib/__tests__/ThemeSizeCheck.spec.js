// @ts-check
const { getSizeWarnings } = require('../ThemeSizeCheck');

/** @typedef {import('../StarterThemer.js').SizedModel} SizedModel */
/** @typedef {import('../StarterThemer.js').ModelDimensions} ModelDimensions */

/**
 * @param {SizedModel['fit']} fit
 * @param {ModelDimensions} placeholder
 * @param {ModelDimensions} themed
 * @returns {SizedModel}
 */
const makeSizedModel = (fit, placeholder, themed) => ({
  objectPath: 'scene:Game Scene/Thing',
  slotId: 'prop.obstacle',
  fit,
  placeholder,
  themed,
});

describe('getSizeWarnings', () => {
  it('accepts a model about the size of the placeholder', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'contain',
          { width: 200, height: 40, depth: 60 },
          { width: 40, height: 180, depth: 60 }
        )
      )
    ).toEqual([]);
  });

  it('reports a prop of another shape, much smaller than the placeholder', () => {
    // A traffic cone in the place of a long barrier.
    expect(
      getSizeWarnings(
        makeSizedModel(
          'contain',
          { width: 200, height: 40, depth: 60 },
          { width: 30, height: 30, depth: 60 }
        )
      )
    ).toEqual(['30% of the largest dimension of the placeholder']);
  });

  it('reports a vehicle much broader than the placeholder', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'length',
          { width: 200, height: 40, depth: 50 },
          { width: 200, height: 120, depth: 50 }
        )
      )
    ).toEqual(['300% of the breadth of the placeholder']);
  });

  it('accepts a vehicle taller than the placeholder', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'length',
          { width: 200, height: 100, depth: 50 },
          { width: 200, height: 100, depth: 150 }
        )
      )
    ).toEqual([]);
  });

  it('accepts a character with arms spread wider than the placeholder', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'height',
          { width: 30, height: 30, depth: 60 },
          { width: 12, height: 65, depth: 60 }
        )
      )
    ).toEqual([]);
  });

  it('does not check a model sized by volume', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'volume',
          { width: 100, height: 100, depth: 100 },
          { width: 100, height: 100, depth: 100 }
        )
      )
    ).toEqual([]);
  });
});
