// @ts-check
/**
 * Run the gameplay tests of a game with the GDevelop CLI, and gather its
 * results, output and screenshots in a folder of artifacts.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const shell = require('shelljs');

/** @typedef {import('./GameplayTestsJUnitReport').ProjectRunResult} ProjectRunResult */
/** @typedef {import('./GameplayTestsJUnitReport').GameplayTestResult} GameplayTestResult */

/** The folder GDevelop writes the screenshots of a run into. */
const SCREENSHOTS_DIRECTORY_NAME = 'gameplay-test-screenshots';

/**
 * The folder holding the results, GDevelop's output and the screenshots of
 * the run of a game.
 * @param {Object} options
 * @param {string} options.artifactsPath
 * @param {string} options.relativePath Project file, relative to the
 * repository root.
 * @returns {string}
 */
const getProjectArtifactsPath = ({ artifactsPath, relativePath }) =>
  path.join(
    artifactsPath,
    relativePath.replace(/\//g, '__').replace(/\.json$/, '')
  );

/**
 * Run the gameplay tests of a single game project.
 * @param {Object} options
 * @param {string} options.executablePath
 * @param {string} options.repositoryPath Root of the repository.
 * @param {string} options.relativePath Project file, relative to the
 * repository root.
 * @param {string} options.exampleSlug
 * @param {string} options.artifactsPath Where the folder of the results,
 * logs and screenshots of the game is written.
 * @param {number} options.timeoutMs Time budget for the whole game.
 * @param {string[]} [options.testNamesOrFilters] Only run the tests with
 * these names, or matching these filters where `*` matches anything (all the
 * tests when not given).
 * @returns {Promise<ProjectRunResult>}
 */
const runProjectGameplayTests = async ({
  executablePath,
  repositoryPath,
  relativePath,
  exampleSlug,
  artifactsPath,
  timeoutMs,
  testNamesOrFilters = [],
}) => {
  const projectPath = path.join(repositoryPath, relativePath);
  const projectArtifactsPath = getProjectArtifactsPath({
    artifactsPath,
    relativePath,
  });
  shell.mkdir('-p', projectArtifactsPath);

  // GDevelop writes its results next to the project file. Its `--results-path`
  // option cannot be used: the main process only forwards the CLI flags it
  // knows about, and drops that one (its value would even end up parsed as a
  // second project to open). So the files are moved to the artifacts folder
  // after the run instead.
  const resultsPath = path.join(
    path.dirname(projectPath),
    'gameplay-test-results.json'
  );
  const screenshotsPath = path.join(
    path.dirname(projectPath),
    SCREENSHOTS_DIRECTORY_NAME
  );
  // Leftovers from a previous run would be mistaken for this run's results.
  shell.rm('-f', resultsPath);
  shell.rm('-rf', screenshotsPath);

  const startTime = Date.now();
  const { exitCode, output, timedOut } = await runGDevelopCli({
    executablePath,
    repositoryPath,
    timeoutMs,
    cliArguments: [
      projectPath,
      '--run-command',
      'RUN_ALL_TESTS',
      '--no-sandbox',
      '--disable-update-check',
      ...testNamesOrFilters.flatMap((testNameOrFilter) => [
        '--cmd-args',
        testNameOrFilter,
      ]),
    ],
  });
  const durationMs = Date.now() - startTime;

  fs.writeFileSync(
    path.join(projectArtifactsPath, 'gdevelop-output.log'),
    output
  );

  // The screenshots a test took are written by GDevelop next to the results,
  // in the game folder. Move them into this game's artifacts folder, next to
  // the results file they belong to, so that CI stores both together.
  const artifactsScreenshotsPath = path.join(
    projectArtifactsPath,
    SCREENSHOTS_DIRECTORY_NAME
  );
  // A previous attempt of the same game (a run retried after a timeout) would
  // otherwise end up nested inside its own folder.
  shell.rm('-rf', artifactsScreenshotsPath);
  if (fs.existsSync(screenshotsPath)) {
    shell.mv(screenshotsPath, artifactsScreenshotsPath);
  }

  /** @type {GameplayTestResult[]} */
  let results = [];
  let runError;
  if (fs.existsSync(resultsPath)) {
    try {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    } catch (error) {
      runError = `The results file written by GDevelop could not be read: ${error}`;
    }
    shell.rm('-f', resultsPath);
    // GDevelop records where it wrote each screenshot as an absolute path in
    // the game folder — where they no longer are. Point them at the file
    // sitting next to the results instead, so the stored results are usable
    // as they are (in the CI artifacts, or downloaded).
    for (const result of results) {
      for (const screenshot of result.screenshots || []) {
        if (!screenshot.file) continue;
        screenshot.file = path.posix.join(
          SCREENSHOTS_DIRECTORY_NAME,
          path.basename(screenshot.file)
        );
      }
    }
    fs.writeFileSync(
      path.join(projectArtifactsPath, 'results.json'),
      JSON.stringify(results, null, 2)
    );
  }
  if (!runError && results.length === 0) {
    runError = timedOut
      ? `GDevelop did not finish within ${Math.round(
          timeoutMs / 1000
        )}s and was killed.`
      : `GDevelop exited with code ${exitCode} without writing any test result. ` +
        `Last lines of its output:\n${output
          .split('\n')
          .slice(-30)
          .join('\n')}`;
  }

  return { relativePath, exampleSlug, durationMs, results, runError };
};

/**
 * Spawn the GDevelop executable, capturing its output and killing it if it
 * takes too long. Never rejects: the caller reports the failure.
 * @param {Object} options
 * @param {string} options.executablePath
 * @param {string} options.repositoryPath
 * @param {number} options.timeoutMs
 * @param {string[]} options.cliArguments
 * @returns {Promise<{ exitCode: number | null, output: string, timedOut: boolean }>}
 */
const runGDevelopCli = ({
  executablePath,
  repositoryPath,
  timeoutMs,
  cliArguments,
}) =>
  new Promise((resolve) => {
    // Even in CLI mode, Electron needs a display to initialize its graphics
    // stack on a headless Linux machine.
    const child = spawn(
      'xvfb-run',
      ['-a', '--server-args=-screen 0 1280x800x24', executablePath].concat(
        cliArguments
      ),
      { cwd: repositoryPath }
    );

    let output = '';
    let timedOut = false;
    /** @param {Buffer} data */
    const onData = (data) => {
      const text = data.toString();
      output += text;
      // Only echo the lines of the test runner itself: the editor is very
      // verbose (asset loading, network errors on a CI machine...).
      for (const line of text.split('\n')) {
        if (line.includes('[CLI]')) shell.echo(`   ${line.trim()}`);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({ exitCode: null, output: `${output}\n${error}`, timedOut });
    });
    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);
      resolve({ exitCode, output, timedOut });
    });
  });

module.exports = {
  runProjectGameplayTests,
  getProjectArtifactsPath,
  SCREENSHOTS_DIRECTORY_NAME,
};
