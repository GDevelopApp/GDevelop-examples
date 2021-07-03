// @ts-check
const dree = require('dree');
const fs = require('fs').promises;

/** @typedef {{name: string, searchToken: string}} Author */
/** @typedef {{name: string, searchToken: string}} License */
/** @typedef {import('dree').Dree} Dree */
/** @typedef {{tags: String[], authors: string[], license: string, allAuthors: Author[], allLicenses: License[]}} FileMetadata */
/** @typedef {{parsedContent?: any}} OptionalParsedJSONContent */
/** @typedef {{children?: DreeWithMetadata[]} & FileMetadata & OptionalParsedJSONContent & Dree} DreeWithMetadata */
/** @typedef {{name: string, children: TagsTreeNode[], allChildrenTags: string[] }} TagsTreeNode */

/**
 * Remove if necessary the BOM character at the beginning of a JSON file content.
 * @param {string} content
 */
const sanitizeJSONContent = (content) => {
  if (content[0] === '\uFEFF') return content.slice(1);

  return content;
};

/**
 * Clean a tag name.
 * @param {string} tagName
 * @returns {string}
 */
const sanitizeTagName = (tagName) => {
  return tagName.replace(/\([0-9]+ assets\)/i, '').trim();
};

/**
 * Extract the license name and authors from a license file, using the list
 * of known authors and licenses.
 * @param {Author[]} authors
 * @param {License[]} licenses
 * @param {string} content
 */
const extractLicenseMetadata = (authors, licenses, content) => {
  let authorName = '';
  let licenseName = '';
  authors.forEach((author) => {
    if (content.indexOf(author.searchToken) !== -1) {
      authorName = author.name;
    }
  });
  licenses.forEach((license) => {
    if (content.indexOf(license.searchToken) !== -1) {
      licenseName = license.name;
    }
  });

  return { authorName, licenseName };
};

/** @param {string} fileName */
const isSampleImageFile = (fileName) => {
  // These files are considered as "sample" (kind of promotional images).
  // They will be discarded from the image used for assets.
  return fileName === 'Sample.png';
};

/**
 * Create a "file tree" by browsing all the files of the specified folder,
 * ignoring some specific folder names and only listing files with extensions
 * that we know are useful.
 *
 * @param {string} rootPath
 * @returns {Promise<Dree>}
 */
const readFileTree = async (rootPath) => {
  return await dree.scanAsync(rootPath, {
    stat: false,
    normalize: true,
    followLinks: true,
    size: false,
    hash: false,
    exclude: [
      /Default size/,
      /Spritesheet/,
      /Tilesheet/,
      /Vector/,
      /Unimplemented/i,
      /TODO/i,
      /Preview\.png/,
    ],
    extensions: ['png', 'md', 'txt', 'json', 'ttf', 'otf', 'wav', 'aac', 'svg'],
  });
};

/**
 * Filter a file tree to remove folders that are marked as being ignored (with a IGNORED.md file)
 * or have a specific name that we know we must ignore.
 *
 * @template {{type: string, children?: Tree[] | undefined, name: string}} Tree
 * @param {Tree} fileTree
 * @param {{fileMagicNamesToIgnoreFolder: string[]}} fileTree
 * @param {Tree[]} siblings
 * @returns {Tree | null}
 */
const filterIgnoredFolders = (
  fileTree,
  options = { fileMagicNamesToIgnoreFolder: ['IGNORED.md'] },
  siblings = []
) => {
  if (fileTree.type === 'file') return fileTree;

  // Remove empty folders
  if (!fileTree.children) return null;

  // Ignore low resolution assets or assets with better alternative
  if (fileTree.name === 'Default size') return null;
  if (
    fileTree.name === 'Sprites' &&
    siblings.find((siblingFileTree) => siblingFileTree.name === 'Sprites X2')
  )
    return null;

  // Remove ignored folders
  if (
    fileTree.children.some((childFileTree) =>
      options.fileMagicNamesToIgnoreFolder.includes(childFileTree.name)
    )
  ) {
    return null;
  }

  return {
    ...fileTree,
    // @ts-ignore
    children: fileTree.children
      .map((childFileTree) =>
        filterIgnoredFolders(childFileTree, options, fileTree.children)
      )
      .filter(Boolean),
  };
};

/**
 * Tags that are always ignored when constructing an enhanced file tree.
 */
const ignoredTagNames = [
  'Retina',
  'PNG',
  'SVG',
  'Master',
  'Default size',
  'Sprites',
  'Sprites X2',
];

/**
 * Browse the specified file tree and add tags, license, author, and the file content (if applicable) for each file.
 * @param {Dree} fileTree
 * @param {FileMetadata} parentMetadata
 * @returns {Promise<{tagsTree: TagsTreeNode[], allTags: Set<string>, fileTreeWithMetadata: DreeWithMetadata, errors: Error[]}>}
 */
const enhanceFileTreeWithMetadata = async (fileTree, parentMetadata) => {
  /** @type {any[]} */
  const tagsTree = [];

  /** @type {Error[]} */
  const errors = [];

  /** @type {Set<string>} */
  const allTags = new Set();

  const newMetadata = {
    ...parentMetadata,
    tags: [...parentMetadata.tags],
    license: parentMetadata.license,
    authors: [...parentMetadata.authors],
  };

  /** @type {DreeWithMetadata[]} */
  const childrenFileTreeWithMetadata = [];

  /** @type {Object.<string, any>} */
  const parsedContents = {};

  if (fileTree.type === 'directory' && fileTree.children) {
    // Make a first pass on the directory to read the "metadata" files.
    await Promise.all(
      fileTree.children.map(async (childFileTree) => {
        if (childFileTree.type === 'file') {
          if (childFileTree.name === 'TAGS.md') {
            const content = await fs.readFile(childFileTree.path, 'utf-8');
            content
              .toLowerCase() // Normalize all tags in lower case
              .split(',')
              .forEach((tag) => {
                const tagName = tag.trim();
                allTags.add(tagName);
                if (!newMetadata.tags.includes(tagName))
                  newMetadata.tags.push(tagName);
              });
          } else if (childFileTree.name.toLowerCase() === 'license.txt') {
            const content = await fs.readFile(childFileTree.path, 'utf-8');
            const { authorName, licenseName } = extractLicenseMetadata(
              parentMetadata.allAuthors,
              parentMetadata.allLicenses,
              content
            );
            if (licenseName) newMetadata.license = licenseName;
            else {
              errors.push(
                new Error('Unknown license in ' + childFileTree.path)
              );
              return;
            }

            if (authorName && !newMetadata.authors.includes(authorName))
              newMetadata.authors.push(authorName);
          } else if (isSampleImageFile(childFileTree.name)) {
            // TODO: Handle sample files
          } else if (childFileTree.name.endsWith('.json')) {
            try {
              const content = await fs.readFile(childFileTree.path, 'utf-8');
              const sanitizedContent = sanitizeJSONContent(content);
              const parsedContent = JSON.parse(sanitizedContent);
              parsedContents[childFileTree.name] = parsedContent;
            } catch (error) {
              errors.push(
                new Error(
                  'Unable to read the content of ' +
                    childFileTree.path +
                    ' - is it valid JSON?'
                )
              );
            }
          } else if (childFileTree.name.endsWith('.md')) {
            try {
              const content = await fs.readFile(childFileTree.path, 'utf-8');
              parsedContents[childFileTree.name] = content;
            } catch (error) {
              errors.push(
                new Error(
                  'Unable to read the content of ' +
                    childFileTree.path +
                    ' - is it a valid Markdown file?'
                )
              );
            }
          }
        }
      })
    );

    // Make a second pass to build the tree
    await Promise.all(
      fileTree.children.map(async (childFileTree) => {
        if (childFileTree.type === 'file') {
          if (!isSampleImageFile(childFileTree.name)) {
            childrenFileTreeWithMetadata.push({
              ...childFileTree,
              ...newMetadata,
              parsedContent: parsedContents[childFileTree.name],
              children: [],
            });
          }
        } else {
          const tagName = sanitizeTagName(childFileTree.name);
          const isTagIgnored = ignoredTagNames.includes(tagName);
          const childEnhancedTree = await enhanceFileTreeWithMetadata(
            childFileTree,
            isTagIgnored
              ? newMetadata
              : {
                  ...newMetadata,
                  tags: [...newMetadata.tags, tagName],
                }
          );
          if (isTagIgnored) {
            childEnhancedTree.tagsTree.forEach((childTagsTree) =>
              tagsTree.push(childTagsTree)
            );
          } else {
            tagsTree.push({
              name: tagName,
              children: childEnhancedTree.tagsTree,
              allChildrenTags: childEnhancedTree.allTags,
            });

            allTags.add(tagName);
          }

          childEnhancedTree.allTags.forEach((tag) => allTags.add(tag));
          childrenFileTreeWithMetadata.push(
            childEnhancedTree.fileTreeWithMetadata
          );
        }
      })
    );
  }

  return {
    tagsTree,
    allTags,
    fileTreeWithMetadata: {
      ...fileTree,
      ...newMetadata,
      children: childrenFileTreeWithMetadata,
    },
    errors,
  };
};

/**
 * @param {TagsTreeNode[]} tagsTree
 * @return {TagsTreeNode[]}
 */
const sortTagsTree = (tagsTree) => {
  return tagsTree
    .map((tagTreeNode) => {
      return {
        ...tagTreeNode,
        allChildrenTags: [...tagTreeNode.allChildrenTags].sort((tag1, tag2) =>
          tag1.localeCompare(tag2)
        ),
        children: sortTagsTree(tagTreeNode.children),
      };
    })
    .sort(
      /**
       * @param {TagsTreeNode} node1
       * @param {TagsTreeNode} node2
       */
      (node1, node2) => node1.name.localeCompare(node2.name)
    );
};

/**
 * Get all files of a file tree indexed by their absolute path.
 * @param {DreeWithMetadata} fileTreeWithMetadata
 * @returns {Object.<string, DreeWithMetadata>}
 */
const getAllFiles = (fileTreeWithMetadata) => {
  if (fileTreeWithMetadata.type === 'file') {
    return { [fileTreeWithMetadata.path]: fileTreeWithMetadata };
  } else {
    /** @type {Object.<string, DreeWithMetadata>} */
    let allFiles = {};

    if (!fileTreeWithMetadata.children) {
      // A folder without children - just ignore it.
      return allFiles;
    }

    fileTreeWithMetadata.children.forEach((childFileTreeWithMetadata) => {
      allFiles = { ...allFiles, ...getAllFiles(childFileTreeWithMetadata) };
    });
    return allFiles;
  }
};

module.exports = {
  readFileTree,
  filterIgnoredFolders,
  enhanceFileTreeWithMetadata,
  sortTagsTree,
  getAllFiles,
};
