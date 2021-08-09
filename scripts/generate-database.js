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

/**
 * Generate the URL used after deployment for a file in the examples folder.
 * @param {string} filePath
 */
const getResourceUrl = (filePath) => {
  const relativeFilePath = path.relative(examplesRootPath, filePath);
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
  const worker = new gd.ArbitraryResourceWorkerJS();
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

  project.exposeResources(worker);
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

        /** @type {{name: string, fullName: string}[]} */
        const usedExtensions = gd.UsedExtensionsFinder.scanProject(project)
          .toNewVectorString()
          .toJSArray()
          .map(
            /** @param {string} name */
            (name) => ({
              name,
              fullName: platformExtensionsMap[name]
                ? platformExtensionsMap[name].getFullName()
                : '',
            })
          );
        /** @type {{name: string, fullName: string}[]} */
        const eventsBasedExtensions = [];
        for (let i = 0; i < project.getEventsFunctionsExtensionsCount(); ++i) {
          eventsBasedExtensions.push({
            name: project.getEventsFunctionsExtensionAt(i).getName(),
            fullName: project.getEventsFunctionsExtensionAt(i).getFullName(),
          });
        }

        // Extract example informations
        const gameFolderPath = path.dirname(fileWithMetadata.path);
        const readmePath = path.join(gameFolderPath, 'README.md');
        const thumbnailPath = path.join(gameFolderPath, 'thumbnail.png');
        const hasThumbnailFile = !!allFiles[thumbnailPath];
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
        const shortDescription =
          readmeFileWithMetadata.parsedContent.split('\n\n')[0];
        const description = readmeFileWithMetadata.parsedContent
          .split('\n\n')
          .slice(1)
          .join('\n\n');

        const tags = [
          ...fileWithMetadata.tags,
          ...usedExtensions.map(({ fullName }) => fullName),
          ...eventsBasedExtensions.map(({ fullName }) => fullName),
        ];
        tags.forEach((tag) => allExampleTags.add(tag));

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
          name: formatExampleName(
            path.basename(fileWithMetadata.name, '.json')
          ),
          shortDescription,
          description,
          authors: [], // TODO: parse the authors from the project author field.
          tags,
          usedExtensions,
          eventsBasedExtensions,
          previewImageUrls: hasThumbnailFile
            ? [getResourceUrl(thumbnailPath)]
            : [],
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
 * Generate the "short headers" for the examples.
 * @param {Example[]} allExamples
 * @return {ExampleShortHeader[]}
 */
const generateShortHeaders = (allExamples) => {
  return allExamples.map((example) => ({
    id: example.id,
    name: example.name,
    shortDescription: example.shortDescription,
    license: example.license,
    previewImageUrls: example.previewImageUrls,
    tags: example.tags,
    gdevelopVersion: example.gdevelopVersion,
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

    const exampleShortHeaders = generateShortHeaders(allExamples);
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
