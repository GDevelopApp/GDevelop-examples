// @ts-check
/**
 * Find the game project files changed by a branch, so that a Pull Request
 * only runs the gameplay tests of the games it touches.
 */
const shell = require('shelljs');

/**
 * Files whose change makes "only test the changed games" meaningless: if
 * the runner or the CI configuration itself changed, every game is tested.
 */
const FILES_REQUIRING_A_FULL_RUN = [
  '.circleci/config.yml',
  'scripts/run-gameplay-tests.js',
  'scripts/lib/ChangedProjectFiles.js',
  'scripts/lib/GDevelopPortableBuild.js',
  'scripts/lib/GameplayTestsJUnitReport.js',
  'scripts/lib/GameplayTestsProjectFinder.js',
];

/**
 * @param {string} command
 * @returns {string | null} The trimmed output, or null if the command failed.
 */
const runGitCommand = (command) => {
  const output = shell.exec(command, { silent: true });
  if (output.code !== 0) return null;
  return output.stdout.trim();
};

/**
 * List the files changed by the current checkout compared to a base branch.
 *
 * The comparison is made against the merge base, so that commits landed on
 * the base branch in the meantime are not reported as changes.
 * @param {Object} options
 * @param {string} options.baseRef For example `origin/main`.
 * @returns {{ changedFiles: string[], filesRequiringAFullRun: string[] } | null} Null
 * when the changed files could not be determined (the caller should then
 * test everything rather than nothing).
 */
const findChangedFiles = ({ baseRef }) => {
  // The base branch is not always fetched on CI checkouts.
  if (runGitCommand(`git rev-parse --verify --quiet ${baseRef}`) === null) {
    const remoteBranch = baseRef.replace(/^origin\//, '');
    runGitCommand(`git fetch --no-tags origin ${remoteBranch}`);
  }
  if (runGitCommand(`git rev-parse --verify --quiet ${baseRef}`) === null) {
    shell.echo(`⚠️ Could not resolve the base ref "${baseRef}".`);
    return null;
  }

  const mergeBase = runGitCommand(`git merge-base ${baseRef} HEAD`);
  if (!mergeBase) {
    shell.echo(`⚠️ Could not find a merge base with "${baseRef}".`);
    return null;
  }

  const diffOutput = runGitCommand(
    `git diff --name-only --diff-filter=d ${mergeBase} HEAD`
  );
  if (diffOutput === null) {
    shell.echo(`⚠️ Could not diff against "${mergeBase}".`);
    return null;
  }

  const changedFiles = diffOutput.split('\n').filter(Boolean);
  const filesRequiringAFullRun = changedFiles.filter((changedFile) =>
    FILES_REQUIRING_A_FULL_RUN.includes(changedFile)
  );
  return { changedFiles, filesRequiringAFullRun };
};

/**
 * Keep only the example game project files of a list of changed files.
 * @param {string[]} changedFiles
 * @returns {string[]}
 */
const keepExampleProjectFiles = (changedFiles) =>
  changedFiles.filter(
    (changedFile) =>
      changedFile.startsWith('examples/') &&
      changedFile.endsWith('.json') &&
      // Only the project files at the root of an example folder:
      // `examples/<slug>/<project>.json`.
      changedFile.split('/').length === 3
  );

module.exports = {
  findChangedFiles,
  keepExampleProjectFiles,
  FILES_REQUIRING_A_FULL_RUN,
};
