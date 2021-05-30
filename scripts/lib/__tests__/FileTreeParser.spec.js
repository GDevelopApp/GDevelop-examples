// @ts-check
const path = require('path');
const {
  readFileTree,
  filterIgnoredFolders,
  enhanceFileTreeWithMetadata,
  getAllFiles,
} = require('../FileTreeParser.js');
const allLicenses = require('../licenses.json');

/** @typedef {import('../FileTreeParser.js').DreeWithMetadata} DreeWithMetadata */

/**
 *
 * @param {DreeWithMetadata} fileTreeWithMetadata
 * @param {string} searchedName
 * @returns {DreeWithMetadata}
 */
const findInFileTreeWithMetadataFolder = (
  fileTreeWithMetadata,
  searchedName
) => {
  const foundChild = fileTreeWithMetadata.children
    ? fileTreeWithMetadata.children.find(({ name }) => name === searchedName)
    : null;

  if (!foundChild) throw new Error(`Expected to find ${searchedName}`);

  return foundChild;
};

describe('FileTreeParser', () => {
  it('can parse a tree of files', async () => {
    const fileTree = await readFileTree(
      path.join(__dirname, 'fixtures/fake-examples-folder')
    );

    // Check that folders were read, apart from those with an ignored name.
    expect(fileTree.children).toHaveLength(3);

    // Check that additional ignored folders are removed.
    const filteredFileTree = filterIgnoredFolders(fileTree, []);
    if (!filteredFileTree)
      throw new Error('filteredFileTree should not be undefined');
    expect(filteredFileTree.children).toHaveLength(2);

    const enhancedTree = await enhanceFileTreeWithMetadata(filteredFileTree, {
      allLicenses,
      allAuthors: [],
      authors: [],
      license: '',
      tags: [],
    });
    const { fileTreeWithMetadata, allTags, tagsTree } = enhancedTree;

    const myGameFolder = findInFileTreeWithMetadataFolder(
      fileTreeWithMetadata,
      'mygame'
    );
    const myOtherGameFolder = findInFileTreeWithMetadataFolder(
      fileTreeWithMetadata,
      'MyOtherGame'
    );

    // Check that tags are added
    expect(myOtherGameFolder.tags).toEqual([
      'MyOtherGame',
      'some',
      'tag',
      'for-this-other-game',
    ]);

    expect(allTags).toContain('mygame');
    expect(allTags).toContain('MyOtherGame');
    expect(allTags).toContain('some');
    expect(allTags).toContain('tag');
    expect(allTags).toContain('for-this-other-game');

    // Check that content of games is read
    const myGameGameJsonFile = findInFileTreeWithMetadataFolder(
      myGameFolder,
      'game.json'
    );
    expect(myGameGameJsonFile.parsedContent).toEqual({
      'fake-content': 'my fake game content',
    });

    const myOtherGameGameJsonFile = findInFileTreeWithMetadataFolder(
      myOtherGameFolder,
      'MyOtherGame.json'
    );
    expect(myOtherGameGameJsonFile.parsedContent).toEqual({
      'fake-content': 'my fake other game content',
    });

    const allFiles = getAllFiles(fileTreeWithMetadata);
    expect(Object.keys(allFiles)).toHaveLength(3);
  });
});
