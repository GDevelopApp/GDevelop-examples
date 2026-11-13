// @ts-check
const { getSizeWarnings } = require('../ThemeSizeCheck');

/** @typedef {import('../StarterThemer.js').SizedModel} SizedModel */
/** @typedef {import('../StarterThemer.js').ModelDimensions} ModelDimensions */

/**
 * @param {SizedModel['fit']} fit
 * @param {ModelDimensions} placeholder
 * @param {ModelDimensions} themed
 * @param {number=} scale
 * @returns {SizedModel}
 */
const makeSizedModel = (fit, placeholder, themed, scale = 1) => ({
  objectPath: 'scene:Game Scene/Thing',
  slotId: 'prop.obstacle',
  fit,
  scale,
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

  it('does not report the scale a theme deliberately gives its model', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'height',
          { width: 30, height: 30, depth: 60 },
          { width: 30, height: 30, depth: 120 },
          2
        )
      )
    ).toEqual([]);
  });

  it('compares a projectile by its volume', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          'volume',
          { width: 40, height: 10, depth: 10 },
          { width: 40, height: 40, depth: 40 }
        )
      )
    ).toEqual(['252% of the volume of the placeholder']);
  });

  it('does not check a model sized by the volume of the placeholder object', () => {
    expect(
      getSizeWarnings(
        makeSizedModel(
          null,
          { width: 100, height: 100, depth: 100 },
          { width: 100, height: 100, depth: 100 }
        )
      )
    ).toEqual([]);
  });
});
