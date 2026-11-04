// @ts-check
/**
 * Check that the games are still drawn the same: run the rendering tests of
 * the games (their gameplay tests named "Rendering: ...", taking PNG
 * screenshots) with a real GDevelop, and compare each screenshot with the
 * expected image in `rendering-screenshots/<example slug>/<label>.png`.
 *
 * The games are drawn in software (SwiftShader), which draws the same pixels
 * from one run to the next: an image that differs means that the rendering
 * of GDevelop (or of the game) changed.
 *
 * Usage:
 *   node scripts/check-rendering-screenshots.js [options]
 *
 *   --update                   Write the screenshots as the expected images
 *                              (after a change of the rendering made on
 *                              purpose). Check them in the diff.
 *   --projects=a.json,b.json   Check only these games.
 *   --only-changed             Check only the games whose project or expected
 *   --base-ref=origin/main     images changed compared to --base-ref (every
 *                              game if the scripts or the CI changed).
 *   --gdevelop-branch=master   Branch of GDevelop to take the build from.
 *   --gdevelop-version=5.6.286 Skip reading the version from the branch.
 *   --work-dir=...             Where GDevelop is downloaded and extracted.
 *   --artifacts-dir=...        Where the results, logs, screenshots and the
 *                              differences with the expected images go.
 *   --junit-path=...           Where the JUnit report is written.
 *   --timeout-ms=600000        Time budget for a single game.
 */
const path = require('path');
const shell = require('shelljs');
const args = require('minimist')(process.argv.slice(2));

const {
  findProjectsWithGameplayTests,
} = require('./lib/GameplayTestsProjectFinder');
const { getGDevelopExecutable } = require('./lib/GDevelopPortableBuild');
const { writeJUnitReport } = require('./lib/GameplayTestsJUnitReport');
const {
  runProjectGameplayTests,
  getProjectArtifactsPath,
} = require('./lib/GameplayTestsRunner');
const { findChangedFiles } = require('./lib/ChangedProjectFiles');
const {
  RENDERING_TESTS_FILTER,
  EXPECTED_SCREENSHOTS_DIRECTORY_NAME,
  isRenderingTestName,
  getScreenshotFileName,
  getExpectedScreenshotsPath,
  findScreenshotDifference,
} = require('./lib/RenderingScreenshots');

/** @typedef {import('./lib/GameplayTestsJUnitReport').ProjectRunResult} ProjectRunResult */
/** @typedef {import('./lib/GameplayTestsJUnitReport').GameplayTestResult} GameplayTestResult */
/** @typedef {import('./lib/GameplayTestsProjectFinder').ProjectWithGameplayTests} ProjectWithGameplayTests */

const repositoryPath = path.resolve(__dirname, '..');
const update = !!args['update'];
const onlyChanged = !!args['only-changed'];
const baseRef = args['base-ref'] || 'origin/main';
const gdevelopBranch = args['gdevelop-branch'] || 'master';
const gdevelopVersion = args['gdevelop-version'] || undefined;
const workPath = path.resolve(
  args['work-dir'] || path.join(repositoryPath, '.gameplay-tests-work')
);
const artifactsPath = path.resolve(
  args['artifacts-dir'] ||
    path.join(repositoryPath, 'rendering-screenshots-artifacts')
);
const junitPath = path.resolve(
  args['junit-path'] ||
    path.join(repositoryPath, 'rendering-screenshots-results/results.xml')
);
const timeoutMs = Number(args['timeout-ms']) || 10 * 60 * 1000;

// Changing these can change the result of every game.
const FILES_REQUIRING_A_FULL_CHECK = [
  '.circleci/config.yml',
  'package-lock.json',
  'scripts/check-rendering-screenshots.js',
  'scripts/lib/GameplayTestsRunner.js',
  'scripts/lib/GDevelopPortableBuild.js',
  'scripts/lib/RenderingScreenshots.js',
];

/**
 * @param {ProjectWithGameplayTests[]} projects
 * @returns {ProjectWithGameplayTests[]}
 */
const keepProjectsToCheck = (projects) => {
  const explicitProjects =
    typeof args['projects'] === 'string'
      ? args['projects'].split(',').map((project) => project.trim())
      : [];
  if (explicitProjects.length > 0)
    return projects.filter((project) =>
      explicitProjects.includes(project.relativePath)
    );
  if (!onlyChanged) return projects;

  const changes = findChangedFiles({ baseRef });
  if (!changes) {
    shell.echo('⚠️ Checking every game: the changed files are unknown.');
    return projects;
  }
  if (
    changes.changedFiles.some((changedFile) =>
      FILES_REQUIRING_A_FULL_CHECK.includes(changedFile)
    )
  ) {
    shell.echo('ℹ️ Checking every game: the scripts or the CI changed.');
    return projects;
  }
  return projects.filter((project) =>
    changes.changedFiles.some(
      (changedFile) =>
        changedFile === project.relativePath ||
        changedFile.startsWith(
          `${EXPECTED_SCREENSHOTS_DIRECTORY_NAME}/${project.exampleSlug}/`
        )
    )
  );
};

/**
 * Compare the screenshots of the rendering tests of a game with the
 * expected images (or write them as the expected images when updating).
 * @param {ProjectWithGameplayTests} project
 * @param {ProjectRunResult} projectRunResult
 * @returns {GameplayTestResult[]} One result per screenshot.
 */
const checkScreenshots = (project, projectRunResult) => {
  const projectArtifactsPath = getProjectArtifactsPath({
    artifactsPath,
    relativePath: project.relativePath,
  });
  const expectedScreenshotsPath = getExpectedScreenshotsPath({
    repositoryPath,
    exampleSlug: project.exampleSlug,
  });
  if (update) {
    // Images of screenshots not taken anymore would never be checked again.
    shell.rm('-rf', expectedScreenshotsPath);
    shell.mkdir('-p', expectedScreenshotsPath);
  }

  /** @type {GameplayTestResult[]} */
  const screenshotResults = [];
  for (const result of projectRunResult.results) {
    for (const screenshot of result.screenshots || []) {
      const label = screenshot.label || '';
      const testName = `${result.testName} — ${label}`;
      if (!screenshot.file || !screenshot.file.endsWith('.png')) {
        screenshotResults.push({
          testName,
          status: 'failed',
          errors: [
            "The screenshot is not a PNG: take it with `{ format: 'png' }`.",
          ],
        });
        continue;
      }
      const screenshotPath = path.join(projectArtifactsPath, screenshot.file);
      const expectedScreenshotPath = path.join(
        expectedScreenshotsPath,
        getScreenshotFileName(label)
      );
      if (update) {
        shell.cp(screenshotPath, expectedScreenshotPath);
        screenshotResults.push({ testName, status: 'passed' });
        continue;
      }
      const difference = findScreenshotDifference({
        screenshotPath,
        expectedScreenshotPath,
      });
      screenshotResults.push(
        difference
          ? { testName, status: 'failed', errors: [difference] }
          : { testName, status: 'passed' }
      );
    }
  }
  return screenshotResults;
};

(async () => {
  const projects = keepProjectsToCheck(
    findProjectsWithGameplayTests({ repositoryPath }).filter((project) =>
      project.testNames.some(isRenderingTestName)
    )
  );
  if (projects.length === 0) {
    shell.echo('✅ No game with rendering tests to check.');
    writeJUnitReport({ projectRunResults: [], junitPath });
    return;
  }
  shell.echo(
    `ℹ️ Checking the rendering of ${projects.length} game(s):\n` +
      projects.map((project) => `   - ${project.relativePath}`).join('\n')
  );

  const { executablePath, version } = await getGDevelopExecutable({
    branch: gdevelopBranch,
    version: gdevelopVersion,
    workPath,
  });
  shell.rm('-rf', artifactsPath);
  shell.mkdir('-p', artifactsPath);

  /** @type {ProjectRunResult[]} */
  const projectRunResults = [];
  for (const project of projects) {
    shell.echo(`\n▶ ${project.relativePath}`);
    const projectRunResult = await runProjectGameplayTests({
      executablePath,
      repositoryPath,
      relativePath: project.relativePath,
      exampleSlug: project.exampleSlug,
      artifactsPath,
      timeoutMs,
      testNamesOrFilters: [RENDERING_TESTS_FILTER],
    });
    // The rendering tests themselves must pass, and their screenshots be
    // the expected ones.
    projectRunResults.push({
      ...projectRunResult,
      results: [
        ...projectRunResult.results.filter(
          (result) => result.status !== 'passed'
        ),
        ...checkScreenshots(project, projectRunResult),
      ],
    });
  }
  writeJUnitReport({ projectRunResults, junitPath });

  /** @type {string[]} */
  const failureLines = [];
  let checkedCount = 0;
  for (const projectRunResult of projectRunResults) {
    if (projectRunResult.runError) {
      failureLines.push(
        `   ❌ ${projectRunResult.relativePath} — ${
          projectRunResult.runError.split('\n')[0]
        }`
      );
    }
    for (const result of projectRunResult.results) {
      checkedCount++;
      if (result.status === 'passed') continue;
      failureLines.push(
        `   ❌ ${projectRunResult.relativePath} — "${result.testName}": ${
          (result.errors || [result.status])[0]
        }`
      );
    }
  }
  shell.echo(
    `\nℹ️ GDevelop ${version} — ${checkedCount} screenshot(s) ${
      update ? 'written as the expected images' : 'checked'
    }.`
  );
  shell.echo(`ℹ️ Screenshots and differences: ${artifactsPath}`);
  if (failureLines.length > 0) {
    shell.echo(failureLines.join('\n'));
    shell.echo(
      update
        ? '❌ Some rendering tests did not pass: their images were not all written.'
        : '❌ Some games are not drawn like their expected images. If the change is on purpose, update the images with `node scripts/check-rendering-screenshots.js --update`.'
    );
    shell.exit(1);
  }
  shell.echo(
    update
      ? `✅ The expected images were written in ${EXPECTED_SCREENSHOTS_DIRECTORY_NAME}/: check them in the diff.`
      : '🎉 Every game is drawn like its expected images.'
  );
})().catch((error) => {
  shell.echo(`❌ ${error && error.stack ? error.stack : error}`);
  shell.exit(1);
});
