// @ts-check
const shell = require('shelljs');
const path = require('path');
const fs = require('fs').promises;
const { constants } = require('fs');
const crypto = require('crypto');
const {
  readFileTree,
  filterIgnoredFolders,
  enhanceFileTreeWithMetadata,
  getAllFiles,
} = require('./lib/FileTreeParser');
const { loadGDevelopCoreAndExtensions } = require('./lib/GDevelopCoreLoader');
const allLicenses = require('./lib/licenses.json');
const args = require('minimist')(process.argv.slice(2));
const { loadSerializedProject } = require('./lib/LocalProjectOpener');
const { writeProjectJSONFile } = require('./lib/LocalProjectWriter');

/** @typedef {import('./lib/FileTreeParser.js').DreeWithMetadata} DreeWithMetadata */
/** @typedef {import('./types').libGDevelop} libGDevelop */
/** @typedef {import('./types').gdProject} gdProject */
/** @typedef {import('./types').gdPlatformExtension} gdPlatformExtension */
/** @typedef {import('./types').Example} Example */
/** @typedef {import('./types').ExampleUsedExtension} ExampleUsedExtension */
/** @typedef {import('./types').ExampleEventsBasedExtension} ExampleEventsBasedExtension */
/** @typedef {import('./types').ExampleShortHeader} ExampleShortHeader */

if (!args['gdevelop-root-path']) {
  shell.echo(
    '❌ You must pass --gdevelop-root-path with the path to GDevelop repository with `npm install` ran in `newIDE/app`.'
  );
  shell.exit(1);
}

const sourceExamplesRootPath = path.join(__dirname, '../examples');
const distPath = path.join(__dirname, '../dist');
const examplesRootPath = path.join(distPath, 'examples');
const databaseRootPath = path.join(distPath, 'database');
const gdevelopRootPath = path.resolve(
  process.cwd(),
  args['gdevelop-root-path']
);

/** @param {string} fileOrFolderPath */
const normalizePathSeparators = (fileOrFolderPath) => {
  return fileOrFolderPath.replace(/\\/g, '/');
};

/**
 * Generate the URL used after deployment for a file in the examples folder.
 * @param {string} filePath
 */
const getResourceUrl = (filePath) => {
  const relativeFilePath = normalizePathSeparators(
    path.relative(examplesRootPath, filePath)
  );
  return `https://resources.gdevelop-app.com/examples/${relativeFilePath}`;
};

/**
 * @param {string} name
 */
const formatExampleName = (name) => {
  if (!name.length) return '';

  return name[0].toUpperCase() + name.substr(1).replace(/-/g, ' ');
};

/**
 * Generate a unique id for an example game.
 * @param {string} name
 * @param {string[]} tags
 */
const getExampleUniqueId = (name, tags) => {
  /**
   * @param {string} input
   */
  const computeSha256 = (input) => {
    return crypto.createHash('sha256').update(input).digest('hex');
  };

  const uniqueId = computeSha256(name + tags.join('-'));
  return uniqueId;
};

/**
 * Return only the files that are GDevelop example project files.
 * @param {Object.<string, DreeWithMetadata>} allFiles
 * @returns {DreeWithMetadata[]}
 */
const getAllExampleFiles = (allFiles) => {
  /** @param {DreeWithMetadata} fileWithMetadata */
  const isGame = (fileWithMetadata) => {
    if (fileWithMetadata.name === 'game.json') return true;

    if (fileWithMetadata.name.endsWith('.json')) {
      if (
        path.basename(path.dirname(fileWithMetadata.relativePath)) ===
        path.basename(fileWithMetadata.name, '.json')
      )
        return true;
    }

    return false;
  };

  return Object.values(allFiles).filter((fileWithMetadata) => {
    return isGame(fileWithMetadata);
  });
};

/**
 *
 * @param {libGDevelop} gd
 * @param {gdProject} project
 * @param {string} baseUrl
 */
const updateResources = (gd, project, baseUrl) => {
  const worker = new gd.ArbitraryResourceWorkerJS(
    project.getResourcesManager()
  );
  /** @param {string} file */
  worker.exposeImage = (file) => {
    // Don't do anything
    return file;
  };
  /** @param {string} shader */
  worker.exposeShader = (shader) => {
    // Don't do anything
    return shader;
  };
  /** @param {string} file */
  worker.exposeFile = (file) => {
    if (file.length === 0) return '';
    return baseUrl + '/' + file;
  };

  gd.ResourceExposer.exposeWholeProjectResources(project, worker);
};

/**
 * Check that the resources in the project all have an existing file
 * in the project folder.
 * @param {gdProject} project
 * @param {string} projectFolderPath
 */
const checkProjectResourceFiles = async (project, projectFolderPath) => {
  /** @type {string[]} */
  const errors = [];

  const resourcesManager = project.getResourcesManager();
  const allResourceNames = resourcesManager.getAllResourceNames().toJSArray();
  await Promise.all(
    allResourceNames.map(
      /** @param {string} resourceName */
      async (resourceName) => {
        const resource = resourcesManager.getResource(resourceName);
        const resourceFile = resource.getFile();

        try {
          await fs.access(
            path.join(projectFolderPath, resourceFile),
            constants.R_OK
          );
        } catch (error) {
          errors.push(`${resourceFile} not found.`);
        }
      }
    )
  );

  return errors;
};

const sortedStarterSlugs = new Set([
  'platformer',
  '3d-car-coin-hunt',
  '3d-road-crosser',
  'multiplayer-platformer-arrow-fight',
  'top-down-rpg',
  'multiplayer-jump-game',
  'multiplayer-platformer-pickup',
  'spherez',
  'multiplayer-bounce-puzzle',
  '3d-tile-based-city-builder',
  'plinko',
  'parking-jam',
  '3d-lane-runner',
  'paddle-battle',
  'tappy-plane',
  '3d-shark-frenzy',
  'game-feel-demo',
  'conviction-of-gun-dude-desktop',
  'tower-defense-war',
  'duck-game',
  'ball-cup-boom',
  'particle-effects-demo',
  'space-shooter',
  'run-dino-run',
  'sokoban',
  'bounce-and-hook',
  '3d-racing-game',
  'simple-platformer',
  'absorbus',
  '3d-shooting-gallery',
  'downhill-bike-physics-demo',
  '3d-bomber-bunny',
  'space-asteroids',
  'pairs',
  'wave-defense-shooter',
  'smoothy',
  'isometric-game',
  'geometry-monster',
]);

const sortedStartingPointSlugs = new Set([
  'starting-platformer',
  'starting-top-down',
  'starting-physics',
]);

/**
 * Computes a list of static tags to add to the example based on its slug.
 * @param {string} exampleSlug
 * @returns {string[]}
 */
const getStaticTags = (exampleSlug) => {
  const staticTags = [];
  if (sortedStarterSlugs.has(exampleSlug)) staticTags.push('Starter');

  if (sortedStartingPointSlugs.has(exampleSlug))
    staticTags.push('Starting point');

  return staticTags;
};

/**
 * @param {string} gameFolderPath
 * @param {Object.<string, DreeWithMetadata>} allFiles
 * @returns {string[]}
 */
const getPreviewImageUrls = (gameFolderPath, allFiles) => {
  const imageUrls = [];
  for (const imageName of ['thumbnail.png', 'preview.png', 'square-icon.png']) {
    const imagePath = normalizePathSeparators(
      path.join(gameFolderPath, imageName)
    );
    const hasImage = !!allFiles[imagePath];
    if (hasImage) imageUrls.push(getResourceUrl(imagePath));
  }
  return imageUrls;
};

/**
 * @param {string} gameFolderPath
 * @param {Object.<string, DreeWithMetadata>} allFiles
 * @returns
 */
const getQuickCustomizationImageUrl = (gameFolderPath, allFiles) => {
  const imagePath = normalizePathSeparators(
    path.join(gameFolderPath, 'thumbnail-quick-customization.png')
  );
  const hasImage = !!allFiles[imagePath];
  return hasImage ? getResourceUrl(imagePath) : undefined;
};

/**
 * Extract the information about the example games from the examples folder.
 * @param {libGDevelop} gd
 * @param {Record<string, gdPlatformExtension>} platformExtensionsMap
 * @param {Object.<string, DreeWithMetadata>} allFiles
 * @param {DreeWithMetadata[]} allExampleFiles
 * @returns {Promise<{allExamples: Example[], allExampleTags: Set<string>, errors: Error[]}>}
 */
const extractExamples = async (
  gd,
  platformExtensionsMap,
  allFiles,
  allExampleFiles
) => {
  /** @type {Error[]} */
  const errors = [];

  /** @type {Set<string>} */
  const allExampleTags = new Set();

  /** @type {Array<Example | null>} */
  const allExamplesOrNulls = await Promise.all(
    allExampleFiles.map(
      /** @param {DreeWithMetadata} fileWithMetadata */
      async (fileWithMetadata) => {
        // Analyze the project
        const projectObject = fileWithMetadata.parsedContent;
        if (!projectObject) {
          errors.push(
            new Error(
              `Expected valid JSON content in ${fileWithMetadata.path}.`
            )
          );
          return null;
        }

        const project = loadSerializedProject(gd, projectObject);

        /** @type {number} */
        const instructionsCount =
          gd.InstructionsCountEvaluator.scanProject(project);
        /** @type {string} */
        const codeSizeLevel =
          instructionsCount < 20
            ? 'tiny'
            : instructionsCount < 100
            ? 'small'
            : instructionsCount < 200
            ? 'medium'
            : instructionsCount < 500
            ? 'big'
            : 'huge';
        /** @type {ExampleUsedExtension[]} */
        const usedExtensions = gd.UsedExtensionsFinder.scanProject(project)
          .getUsedExtensions()
          .toNewVectorString()
          .toJSArray()
          .map(
            /** @param {string} name */
            (name) => {
              const platformExtension = platformExtensionsMap[name];
              if (!platformExtension) {
                return { name, fullName: '', helpPath: '', iconUrl: '' };
              }

              /** @type {ExampleUsedExtension} */
              const usedExtension = {
                name,
                fullName: platformExtension.getFullName(),
                helpPath: platformExtension.getHelpPath(),
                iconUrl: platformExtension.getIconUrl(),
                category: platformExtension.getCategory(),
              };
              return usedExtension;
            }
          );
        /** @type {ExampleEventsBasedExtension[]} */
        const eventsBasedExtensions = [];
        for (let i = 0; i < project.getEventsFunctionsExtensionsCount(); ++i) {
          const extension = project.getEventsFunctionsExtensionAt(i);
          eventsBasedExtensions.push({
            name: extension.getName(),
            fullName: extension.getFullName(),
            helpPath: extension.getHelpPath(),
            category: extension.getCategory(),
            previewIconUrl: extension.getPreviewIconUrl(),
            authorIds: extension.getAuthorIds().toJSArray(),
          });
        }

        // Extract example informations
        const slug = path.basename(fileWithMetadata.name, '.json');
        const gameFolderPath = path.dirname(fileWithMetadata.path);
        const readmePath = normalizePathSeparators(
          path.join(gameFolderPath, 'README.md')
        );
        const readmeFileWithMetadata = allFiles[readmePath];
        if (!readmeFileWithMetadata) {
          errors.push(new Error(`Expected a game README at ${readmePath}.`));
          return null;
        }
        if (!readmeFileWithMetadata.parsedContent) {
          errors.push(
            new Error(
              `Expected a game README that is not empty at ${readmePath}.`
            )
          );
          return null;
        }
        const readmeFileContent = readmeFileWithMetadata.parsedContent
          .replace(/\r\n/g, '\n')
          .trim();
        const exampleName = formatExampleName(slug);

        const shortDescription = readmeFileContent.split('\n\n')[0];
        const description = readmeFileContent
          .split('\n\n')
          .slice(1)
          .join('\n\n');

        const tags = [
          ...fileWithMetadata.tags,
          ...getStaticTags(slug),
          ...usedExtensions.map(({ fullName }) => fullName),
          ...eventsBasedExtensions.map(({ fullName }) => fullName),
        ].filter((tag) => tag.length > 0);
        tags.forEach((tag) => allExampleTags.add(tag));
        const difficultyLevel = tags.includes('simple')
          ? 'simple'
          : tags.includes('advanced')
          ? 'advanced'
          : tags.includes('expert')
          ? 'expert'
          : undefined;

        const authorIds = project.getAuthorIds().toJSArray();

        const resourceErrors = await checkProjectResourceFiles(
          project,
          gameFolderPath
        );
        if (resourceErrors.length > 0) {
          errors.push(
            new Error(
              `Resource errors in ${gameFolderPath}:\n\n${resourceErrors.join(
                '\n\n'
              )}`
            )
          );
          return null;
        }

        /** @type {Example} */
        const example = {
          id: getExampleUniqueId(fileWithMetadata.name, fileWithMetadata.tags),
          slug,
          name: exampleName,
          shortDescription,
          description,
          authorIds,
          tags,
          codeSizeLevel,
          difficultyLevel,
          usedExtensions,
          eventsBasedExtensions,
          previewImageUrls: getPreviewImageUrls(gameFolderPath, allFiles),
          quickCustomizationImageUrl: getQuickCustomizationImageUrl(
            gameFolderPath,
            allFiles
          ),
          license: fileWithMetadata.license,
          projectFileUrl: getResourceUrl(fileWithMetadata.path),
          gdevelopVersion: '', //TODO: set to the GDevelop version used to author the example?
        };

        return example;
      }
    )
  );

  return {
    // @ts-ignore
    allExamples: allExamplesOrNulls.filter(Boolean),
    allExampleTags,
    errors,
  };
};

/**
 * @param {ExampleShortHeader} example1
 * @param {ExampleShortHeader} example2
 * @returns {number}
 */
const examplePreviewImageSortingFunction = (example1, example2) => {
  const difference =
    (example2.previewImageUrls.length ? 1 : 0) -
    (example1.previewImageUrls.length ? 1 : 0);
  return difference;
};

/**
 * Update the example game files to use resources on resources.gdevelop-app.com
 * @param {libGDevelop} gd
 * @param {DreeWithMetadata[]} allExampleFiles
 * @returns {Promise<{errors: Error[]}>}
 */
const updateExampleFiles = async (gd, allExampleFiles) => {
  /** @type {Error[]} */
  const errors = [];

  await Promise.all(
    allExampleFiles.map(async (fileWithMetadata) => {
      const projectObject = fileWithMetadata.parsedContent;
      if (!projectObject) {
        errors.push(
          new Error(`Expected valid JSON content in ${fileWithMetadata.path}.`)
        );
        return;
      }

      const project = loadSerializedProject(gd, projectObject);
      const gameFolderPath = path.dirname(fileWithMetadata.path);
      updateResources(gd, project, getResourceUrl(gameFolderPath));

      try {
        await writeProjectJSONFile(gd, project, fileWithMetadata.path);
      } catch (error) {
        errors.push(
          new Error(
            `Error while writing the updated project file at ${fileWithMetadata.path}: ` +
              error
          )
        );
      }
    })
  );

  return { errors };
};

/**
 * Generate the "short headers" for the examples, with starters
 * listed first and in the order specified by `sortedStarterSlugs` or `sortedStartingPointSlugs`.
 * @param {Example[]} allExamples
 * @return {ExampleShortHeader[]}
 */
const generateSortedShortHeaders = (allExamples) => {
  const starters = [];
  const startingPoints = [];
  const examplesWithGameTag = [];
  const examplesWithNeitherStarterNorGameTags = [];
  for (const example of allExamples) {
    if (sortedStarterSlugs.has(example.slug)) {
      starters.push(example);
    } else if (sortedStartingPointSlugs.has(example.slug)) {
      startingPoints.push(example);
    } else if (example.tags.includes('game')) {
      examplesWithGameTag.push(example);
    } else {
      examplesWithNeitherStarterNorGameTags.push(example);
    }
  }
  const sortedStarterSlugsArray = [...sortedStarterSlugs];
  const sortedStarters = [...starters].sort((example1, example2) => {
    return (
      sortedStarterSlugsArray.indexOf(example1.slug) -
      sortedStarterSlugsArray.indexOf(example2.slug)
    );
  });

  const sortedStartingPointSlugsArray = [...sortedStartingPointSlugs];
  const sortedStartingPoints = [...startingPoints].sort(
    (example1, example2) => {
      return (
        sortedStartingPointSlugsArray.indexOf(example1.slug) -
        sortedStartingPointSlugsArray.indexOf(example2.slug)
      );
    }
  );

  examplesWithNeitherStarterNorGameTags.sort(
    examplePreviewImageSortingFunction
  );

  return [
    ...sortedStarters,
    ...examplesWithGameTag,
    ...sortedStartingPoints,
    ...examplesWithNeitherStarterNorGameTags,
  ].map((example) => ({
    id: example.id,
    name: example.name,
    slug: example.slug,
    shortDescription: example.shortDescription,
    description: example.description,
    license: example.license,
    previewImageUrls: example.previewImageUrls,
    quickCustomizationImageUrl: example.quickCustomizationImageUrl,
    authorIds: example.authorIds,
    tags: example.tags,
    difficultyLevel: example.difficultyLevel,
    gdevelopVersion: example.gdevelopVersion,
    codeSizeLevel: example.codeSizeLevel,
  }));
};

/**
 *
 * @param {libGDevelop} gd
 * @returns {Record<string, gdPlatformExtension>}
 */
const createPlatformExtensionsMap = (gd) => {
  /** @type {Record<string, gdPlatformExtension>} */
  const platformExtensionsMap = {};
  const allPlatformExtensions = gd.JsPlatform.get().getAllPlatformExtensions();
  for (let i = 0; i < allPlatformExtensions.size(); ++i) {
    const platformExtension = allPlatformExtensions.at(i);
    platformExtensionsMap[platformExtension.getName()] = platformExtension;
  }

  return platformExtensionsMap;
};

/**
 * Discover all examples and extract information from them.
 */
(async () => {
  shell.mkdir('-p', distPath);
  shell.rm('-rf', examplesRootPath);
  shell.cp('-r', sourceExamplesRootPath, examplesRootPath);

  const loadedGDevelop = await loadGDevelopCoreAndExtensions({
    gdevelopRootPath,
  });
  const { gd } = loadedGDevelop;
  if (!gd || loadedGDevelop.errors.length) {
    console.error(
      'Unable to load GDevelop core and the extensions:',
      loadedGDevelop.errors
    );
    shell.exit(1);
  }
  console.info(
    'Loaded GDevelop and extensions',
    loadedGDevelop.extensionLoadingResults
  );

  const fileTree = await readFileTree(examplesRootPath);
  const filteredFileTree = filterIgnoredFolders(fileTree);
  if (!filteredFileTree)
    throw new Error('Expected filteredFileTree not to be null');

  const enhancedTree = await enhanceFileTreeWithMetadata(filteredFileTree, {
    allLicenses,
    allAuthors: [],
    authors: [],
    license: 'MIT', // Unless state otherwise, games are MIT licensed.
    tags: [],
  });
  const { fileTreeWithMetadata } = enhancedTree;
  if (enhancedTree.errors.length) {
    console.error(
      'There were errors while parsing example files:',
      enhancedTree.errors
    );
    console.info('Aborting because of these errors.');
    shell.exit(1);
  }

  const allFiles = getAllFiles(fileTreeWithMetadata);
  const allExampleFiles = getAllExampleFiles(allFiles);
  const platformExtensionsMap = createPlatformExtensionsMap(gd);

  const { allExamples, allExampleTags, errors } = await extractExamples(
    gd,
    platformExtensionsMap,
    allFiles,
    allExampleFiles
  );
  if (errors.length) {
    console.error('There were errors while extracting example files:', errors);
    console.info('Aborting because of these errors.');
    shell.exit(1);
  }

  const updatedExampleFiles = await updateExampleFiles(gd, allExampleFiles);
  if (updatedExampleFiles.errors.length) {
    console.error('There were errors while updating example files:', errors);
    console.info('Aborting because of these errors.');
    shell.exit(1);
  }

  try {
    shell.mkdir('-p', databaseRootPath);
    shell.mkdir('-p', path.join(databaseRootPath, 'examples'));

    await Promise.all(
      allExamples.map((example) =>
        fs.writeFile(
          path.join(databaseRootPath, 'examples', example.id + '.json'),
          JSON.stringify(example)
        )
      )
    );

    const exampleShortHeaders = generateSortedShortHeaders(allExamples);
    await fs.writeFile(
      path.join(databaseRootPath, 'exampleShortHeaders.json'),
      JSON.stringify(exampleShortHeaders)
    );

    await fs.writeFile(
      path.join(databaseRootPath, 'filters.json'),
      JSON.stringify(
        {
          allTags: [],
          tagsTree: [],
          defaultTags: Object.values(platformExtensionsMap)
            .map((platformExtension) => platformExtension.getFullName())
            // Ensure we only show by default tags that actually have examples for them.
            .filter((tag) => allExampleTags.has(tag))
            .sort((a, b) => a.localeCompare(b)),
        },
        (key, value) => {
          if (value instanceof Set) {
            return [...value.keys()];
          }

          return value;
        }
      )
    );
  } catch (error) {
    console.error('Error while writing the database files:', error);
    shell.exit(1);
  }
})();
