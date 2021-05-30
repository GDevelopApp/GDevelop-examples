const path = require('path');

/** @typedef {import('../types').libGDevelop} libGDevelop */

/**
 * Load GDevelop core library and JavaScript extensions.
 *
 * @param {{gdevelopRootPath: string}} options
 * @returns {Promise<{gd: ?libGDevelop, extensionLoadingResults: any[], errors: Error[]}>}
 */
const loadGDevelopCoreAndExtensions = async ({ gdevelopRootPath }) => {
  /** @type {Error[]} */
  const errors = [];

  const libGDJsPath = path.join(gdevelopRootPath, 'newIDE/app/public/libGD.js');
  const localJsExtensionLoaderPath = path.join(
    gdevelopRootPath,
    'newIDE/app/src/JsExtensionsLoader/LocalJsExtensionsLoader.js'
  );

  /** @type {?() => Promise<libGDevelop>} */
  let initializeGDevelopJs = null;
  try {
    initializeGDevelopJs = require(libGDJsPath);
  } catch (error) {
    errors.push(
      new Error(`Unable to load libGD.js from ${libGDJsPath}:` + error)
    );
  }

  /** @type {?Function} */
  let makeExtensionsLoader = null;
  try {
    makeExtensionsLoader = require(localJsExtensionLoaderPath);
  } catch (error) {
    errors.push(
      new Error(
        `Unable to load LocalJsExtensionsLoader.js from ${localJsExtensionLoaderPath}:` +
          error
      )
    );
  }

  if (!initializeGDevelopJs || !makeExtensionsLoader) {
    return {
      gd: null,
      extensionLoadingResults: [],
      errors,
    };
  }

  return new Promise((resolve) => {
    // @ts-ignore
    initializeGDevelopJs().then(
      /** @param {libGDevelop} gd */
      async (gd) => {
        /** @param {string} str */
        const noopTranslationFunction = (str) => str;

        gd.ProjectHelper.initializePlatforms();

        // @ts-ignore
        const extensionLoadingResults = await makeExtensionsLoader({
          gd,
          filterExamples: true,
          onFindGDJS: async () => ({
            gdjsRoot: path.join(gdevelopRootPath, 'newIDE/app/resources/GDJS'),
          }),
        }).loadAllExtensions(noopTranslationFunction);

        resolve({
          gd,
          extensionLoadingResults,
          errors,
        });
      }
    );
  });
};

module.exports = {
  loadGDevelopCoreAndExtensions,
};
