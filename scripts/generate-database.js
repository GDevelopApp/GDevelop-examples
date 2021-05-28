// @ts-check
const shell = require('shelljs');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const {
  readFileTree,
  filterIgnoredFolders,
  enhanceFileTreeWithMetadata,
  getAllFiles,
} = require('./lib/file-tree-parser');
const allLicenses = require('./lib/licenses.json');

/** @typedef {import('./lib/file-tree-parser.js').AssetMetadata} AssetMetadata */
/** @typedef {import('./lib/file-tree-parser.js').DreeWithMetadata} DreeWithMetadata */
/** @typedef {import('./types').Example} Example */
/** @typedef {import('./types').ExampleShortHeader} ExampleShortHeader */

const examplesRootPath = path.join(__dirname, '../examples');
const databaseRootPath = path.join(__dirname, '../database');

shell.mkdir('-p', databaseRootPath);
shell.mkdir('-p', path.join(databaseRootPath, 'examples'));

/**
 * @param {string} filePath
 */
const getResourceUrl = (filePath) => {
  const relativeFilePath = path.relative(examplesRootPath, filePath);
  return `https://resources.gdevelop-app.com/examples/${relativeFilePath}`;
};

/**
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
 * @param {Object.<string, DreeWithMetadata>} allFiles
 * @returns {{allExamples: Example[], errors: Error[]}}
 */
const extractExamples = (allFiles) => {
  /** @type {Error[]} */
  const errors = [];

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

  /** @type {Example[]} */
  // @ts-ignore
  const allExamples = Object.keys(allFiles)
    .map((absolutePath) => {
      const fileWithMetadata = allFiles[absolutePath];
      if (!isGame(fileWithMetadata)) return null;

      if (!fileWithMetadata.parsedContent) {
        errors.push(
          new Error(`Expected valid JSON content in ${absolutePath}.`)
        );
        return null;
      }

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

      return {
        id: getExampleUniqueId(fileWithMetadata.name, fileWithMetadata.tags),
        name: fileWithMetadata.name,
        shortDescription,
        description,
        tags: fileWithMetadata.tags,
        previewImageUrls: hasThumbnailFile
          ? [getResourceUrl(thumbnailPath)]
          : [],
        license: fileWithMetadata.license,
        projectFileUrl: getResourceUrl(fileWithMetadata.path),
        gdevelopVersion: '', //TODO
      };
    })
    .filter(Boolean);

  return { allExamples, errors };
};

/**
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

(async () => {
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
  const { fileTreeWithMetadata, errors } = enhancedTree;
  if (errors.length) {
    console.error('There were errors while parsing example files:', errors);
    console.info('Aborting because of these errors.');
    return;
  }

  {
    const allFiles = getAllFiles(fileTreeWithMetadata);
    const { allExamples, errors } = extractExamples(allFiles);
    if (errors.length) {
      console.error(
        'There were errors while extracting example files:',
        errors
      );
      console.info('Aborting because of these errors.');
      return;
    }

    try {
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
            allTags: enhancedTree.allTags,
            tagsTree: enhancedTree.tagsTree,
            defaultTags: [],
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
  }
})();

// Make another script that extract the examples information using libGDevelop.js
// The goal => extract used extensions. Add them as tags. By the way, add event extensions names!

// Create a CircleCI that runs the generate-database, deploy.js with the appropriate secrets (cloudflare, aws s3)
