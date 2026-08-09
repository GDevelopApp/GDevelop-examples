// @ts-check
/**
 * Find the example game projects that contain gameplay tests.
 *
 * Gameplay tests are stored in a game project file as a top level `tests`
 * array (a sibling of `layouts`), so a project "has gameplay tests" when
 * that array exists and is not empty.
 */
const fs = require('fs');
const path = require('path');

/**
 * Serialized game projects are written with a two space indentation, so a
 * top level key always appears at exactly one indentation level. Looking
 * for this before parsing avoids parsing the ~350 MB of project files just
 * to find the few that have tests.
 */
const TOP_LEVEL_TESTS_KEY = '\n  "tests": [';

/**
 * @typedef {Object} ProjectWithGameplayTests
 * @property {string} relativePath Path of the project file, relative to the
 * repository root (this is the identity used everywhere: CLI arguments,
 * JUnit report, test splitting).
 * @property {string} exampleSlug Name of the example folder.
 * @property {string[]} testNames Names of the gameplay tests it contains.
 */

/**
 * List the example game projects of the repository, in a stable order.
 * @param {string} examplesPath
 * @returns {string[]} The project file paths, relative to the repository root.
 */
const listExampleProjectFiles = (examplesPath) => {
  /** @type {string[]} */
  const projectFiles = [];
  const exampleFolderNames = fs.readdirSync(examplesPath).sort();
  for (const exampleFolderName of exampleFolderNames) {
    const exampleFolderPath = path.join(examplesPath, exampleFolderName);
    if (!fs.statSync(exampleFolderPath).isDirectory()) continue;

    // Most examples are named `<slug>/<slug>.json`, but not all of them:
    // list every JSON file at the root of the example folder.
    const fileNames = fs.readdirSync(exampleFolderPath).sort();
    for (const fileName of fileNames) {
      if (!fileName.endsWith('.json')) continue;
      projectFiles.push(`examples/${exampleFolderName}/${fileName}`);
    }
  }
  return projectFiles;
};

/**
 * Read a project file and return its gameplay tests, or null if it has none
 * (or is not a game project at all).
 * @param {string} repositoryPath
 * @param {string} relativePath
 * @returns {ProjectWithGameplayTests | null}
 */
const readProjectGameplayTests = (repositoryPath, relativePath) => {
  const absolutePath = path.join(repositoryPath, relativePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  if (content.indexOf(TOP_LEVEL_TESTS_KEY) === -1) return null;

  let project;
  try {
    project = JSON.parse(content);
  } catch (error) {
    // Not a valid JSON file: other checks of the repository report this.
    return null;
  }
  if (!project || !Array.isArray(project.tests) || project.tests.length === 0) {
    return null;
  }

  return {
    relativePath,
    exampleSlug: path.basename(path.dirname(relativePath)),
    testNames: project.tests.map(
      (/** @type {{ name?: string }} */ test) => test.name || '(unnamed test)'
    ),
  };
};

/**
 * Find every example game project containing at least one gameplay test.
 * @param {Object} options
 * @param {string} options.repositoryPath Root of the repository.
 * @param {string[]} [options.onlyRelativePaths] When given, only these
 * project files are considered (used to test the games changed in a branch).
 * @returns {ProjectWithGameplayTests[]}
 */
const findProjectsWithGameplayTests = ({
  repositoryPath,
  onlyRelativePaths,
}) => {
  const candidateRelativePaths = onlyRelativePaths
    ? onlyRelativePaths.filter((relativePath) =>
        fs.existsSync(path.join(repositoryPath, relativePath))
      )
    : listExampleProjectFiles(path.join(repositoryPath, 'examples'));

  /** @type {ProjectWithGameplayTests[]} */
  const projects = [];
  for (const relativePath of candidateRelativePaths) {
    const project = readProjectGameplayTests(repositoryPath, relativePath);
    if (project) projects.push(project);
  }
  return projects;
};

module.exports = {
  findProjectsWithGameplayTests,
  listExampleProjectFiles,
  readProjectGameplayTests,
};
