// @ts-check
/**
 * Run the gameplay tests of the example games, with a real GDevelop.
 *
 * The Linux "portable" build published on S3 by GDevelop's own CI is
 * downloaded, and every example game project that contains gameplay tests
 * is opened with it in CLI mode (`--run-command RUN_ALL_TESTS`).
 *
 * Usage:
 *   node scripts/run-gameplay-tests.js [options]
 *
 *   --only-changed             Only test the games changed compared to
 *                              --base-ref (used on branches / Pull Requests).
 *   --base-ref=origin/main     Base to compare against for --only-changed.
 *   --projects=a.json,b.json   Test exactly these project files (takes
 *                              precedence over --only-changed).
 *   --projects-file=file.txt   Same, with one project file per line (this is
 *                              how the CI feeds the output of
 *                              `circleci tests split`).
 *   --list                     Print the project files that would be tested,
 *                              one per line, and exit. Nothing is run.
 *   --shard-index=0            Test only a slice of the projects. Defaults to
 *   --shard-total=1            CIRCLE_NODE_INDEX / CIRCLE_NODE_TOTAL.
 *   --gdevelop-branch=master   Branch of GDevelop to take the build from.
 *   --gdevelop-version=5.6.277 Skip reading the version from the branch.
 *   --work-dir=...             Where GDevelop is downloaded and extracted
 *                              (cached between CI jobs).
 *   --artifacts-dir=...        Where the per game results, logs and failure
 *                              screenshots are written.
 *   --junit-path=...           Where the JUnit report is written.
 *   --timeout-ms=900000        Time budget for a single game.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const shell = require('shelljs');
const args = require('minimist')(process.argv.slice(2));

const {
  findProjectsWithGameplayTests,
} = require('./lib/GameplayTestsProjectFinder');
const { getGDevelopExecutable } = require('./lib/GDevelopPortableBuild');
const { writeJUnitReport } = require('./lib/GameplayTestsJUnitReport');
const {
  findChangedFiles,
  keepExampleProjectFiles,
} = require('./lib/ChangedProjectFiles');

/** @typedef {import('./lib/GameplayTestsJUnitReport').ProjectRunResult} ProjectRunResult */
/** @typedef {import('./lib/GameplayTestsJUnitReport').GameplayTestResult} GameplayTestResult */

const repositoryPath = path.resolve(__dirname, '..');

const gdevelopBranch = args['gdevelop-branch'] || 'master';
const gdevelopVersion = args['gdevelop-version'] || undefined;
const baseRef = args['base-ref'] || 'origin/main';
const onlyChanged = !!args['only-changed'];
const listOnly = !!args['list'];
const workPath = path.resolve(
  args['work-dir'] || path.join(repositoryPath, '.gameplay-tests-work')
);
const artifactsPath = path.resolve(
  args['artifacts-dir'] || path.join(repositoryPath, 'gameplay-tests-artifacts')
);
const junitPath = path.resolve(
  args['junit-path'] ||
    path.join(repositoryPath, 'gameplay-tests-results/results.xml')
);
const timeoutMs = Number(args['timeout-ms']) || 15 * 60 * 1000;
const shardTotal =
  Number(args['shard-total'] || process.env.CIRCLE_NODE_TOTAL) || 1;
const shardIndex =
  Number(args['shard-index'] || process.env.CIRCLE_NODE_INDEX) || 0;

/**
 * Print an informational message. With `--list`, stdout is reserved for the
 * list of project files (it is piped into `circleci tests split`), so the
 * messages go to stderr instead.
 * @param {string} message
 */
const log = (message) => {
  if (listOnly) console.error(message);
  else shell.echo(message);
};

/**
 * @param {unknown} value
 * @returns {string[]}
 */
const parseCommaSeparatedList = (value) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

/**
 * Decide which project files should be considered for this run.
 * @returns {string[] | null} Null means "every example game" (no restriction).
 */
const getRestrictedProjectFiles = () => {
  const explicitProjects = parseCommaSeparatedList(args['projects']);
  if (explicitProjects.length > 0) return explicitProjects;

  if (typeof args['projects-file'] === 'string') {
    return fs
      .readFileSync(args['projects-file'], 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (!onlyChanged) return null;

  const changes = findChangedFiles({ baseRef });
  if (!changes) {
    log(
      '⚠️ Falling back to testing every game, as the changed files could not be determined.'
    );
    return null;
  }
  if (changes.requiresFullRun) {
    log(
      'ℹ️ The gameplay tests runner or the CI configuration changed: testing every game.'
    );
    return null;
  }
  const changedProjectFiles = keepExampleProjectFiles(changes.changedFiles);
  log(
    `ℹ️ ${changes.changedFiles.length} file(s) changed compared to ${baseRef}, ` +
      `including ${changedProjectFiles.length} game project(s).`
  );
  return changedProjectFiles;
};

/**
 * Run the gameplay tests of a single game project.
 * @param {Object} options
 * @param {string} options.executablePath
 * @param {string} options.relativePath
 * @param {string} options.exampleSlug
 * @returns {Promise<ProjectRunResult>}
 */
const runProjectGameplayTests = async ({
  executablePath,
  relativePath,
  exampleSlug,
}) => {
  const projectPath = path.join(repositoryPath, relativePath);
  const projectArtifactsPath = path.join(
    artifactsPath,
    relativePath.replace(/\//g, '__').replace(/\.json$/, '')
  );
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
    'gameplay-test-screenshots'
  );
  // Leftovers from a previous run would be mistaken for this run's results.
  shell.rm('-f', resultsPath);
  shell.rm('-rf', screenshotsPath);

  const startTime = Date.now();
  const { exitCode, output, timedOut } = await runGDevelopCli({
    executablePath,
    cliArguments: [
      projectPath,
      '--run-command',
      'RUN_ALL_TESTS',
      '--no-sandbox',
      '--disable-update-check',
    ],
  });
  const durationMs = Date.now() - startTime;

  fs.writeFileSync(
    path.join(projectArtifactsPath, 'gdevelop-output.log'),
    output
  );

  /** @type {GameplayTestResult[]} */
  let results = [];
  let runError;
  if (fs.existsSync(resultsPath)) {
    try {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    } catch (error) {
      runError = `The results file written by GDevelop could not be read: ${error}`;
    }
    shell.mv(resultsPath, path.join(projectArtifactsPath, 'results.json'));
  }
  if (fs.existsSync(screenshotsPath)) {
    shell.mv(screenshotsPath, projectArtifactsPath);
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
 * @param {string[]} options.cliArguments
 * @returns {Promise<{ exitCode: number | null, output: string, timedOut: boolean }>}
 */
const runGDevelopCli = ({ executablePath, cliArguments }) =>
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

(async () => {
  const restrictedProjectFiles = getRestrictedProjectFiles();
  const allProjects = findProjectsWithGameplayTests({
    repositoryPath,
    onlyRelativePaths: restrictedProjectFiles || undefined,
  });

  if (shardTotal > 1) {
    // With `--list`, stdout is the list of projects (it is piped into
    // `circleci tests split`): everything else must go to stderr.
    log(
      `ℹ️ Shard ${shardIndex + 1}/${shardTotal} of ${
        allProjects.length
      } game(s) with gameplay tests.`
    );
  }
  const projects =
    shardTotal > 1
      ? allProjects.filter((_, index) => index % shardTotal === shardIndex)
      : allProjects;

  if (listOnly) {
    for (const project of projects) console.log(project.relativePath);
    return;
  }

  if (projects.length === 0) {
    shell.echo(
      restrictedProjectFiles
        ? '✅ None of the games to test has gameplay tests: nothing to run.'
        : '✅ No game with gameplay tests was found: nothing to run.'
    );
    // Still write an (empty) report, so that a CI job always has test
    // results to collect.
    writeJUnitReport({ projectRunResults: [], junitPath });
    return;
  }

  shell.echo(
    `ℹ️ Running the gameplay tests of ${projects.length} game(s):\n` +
      projects
        .map(
          (project) =>
            `   - ${project.relativePath} (${project.testNames.length} test(s))`
        )
        .join('\n')
  );

  const { executablePath, version } = await getGDevelopExecutable({
    branch: gdevelopBranch,
    version: gdevelopVersion,
    workPath,
  });
  shell.mkdir('-p', artifactsPath);

  /** @type {ProjectRunResult[]} */
  const projectRunResults = [];
  for (const project of projects) {
    shell.echo(`\n▶ ${project.relativePath}`);
    projectRunResults.push(
      await runProjectGameplayTests({
        executablePath,
        relativePath: project.relativePath,
        exampleSlug: project.exampleSlug,
      })
    );
  }

  writeJUnitReport({ projectRunResults, junitPath });

  // Summary.
  let passedCount = 0;
  let failedCount = 0;
  /** @type {string[]} */
  const failureLines = [];
  for (const projectRunResult of projectRunResults) {
    for (const result of projectRunResult.results) {
      if (result.status === 'passed') passedCount++;
      else {
        failedCount++;
        failureLines.push(
          `   ❌ ${projectRunResult.relativePath} — "${result.testName}" (${result.status})`
        );
      }
    }
    if (projectRunResult.runError) {
      failedCount++;
      failureLines.push(
        `   ❌ ${projectRunResult.relativePath} — ${
          projectRunResult.runError.split('\n')[0]
        }`
      );
    }
  }

  shell.echo(
    `\nℹ️ GDevelop ${version} — ${passedCount} gameplay test(s) passed, ${failedCount} failed.`
  );
  shell.echo(`ℹ️ JUnit report: ${junitPath}`);
  shell.echo(`ℹ️ Results and screenshots: ${artifactsPath}`);
  if (failedCount > 0) {
    shell.echo(failureLines.join('\n'));
    shell.echo('❌ Some gameplay tests did not pass.');
    shell.exit(1);
  }
  shell.echo('🎉 All gameplay tests passed.');
})().catch((error) => {
  shell.echo(`❌ ${error && error.stack ? error.stack : error}`);
  shell.exit(1);
});
