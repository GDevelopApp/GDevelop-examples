// @ts-check
/**
 * Turn the results written by the GDevelop CLI into a JUnit XML report, so
 * that CircleCI shows each gameplay test individually (with the reason it
 * failed) and can split the next runs by recorded timings.
 */
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} GameplayTestResult
 * @property {string} testName
 * @property {string} status 'passed' | 'failed' | 'error' | 'timeout' | 'stopped'
 * @property {number} [durationMs]
 * @property {number} [framesExecuted]
 * @property {string[]} [errors]
 * @property {{ message: string, passed: boolean }[]} [assertions]
 * @property {string[]} [consoleLogs]
 * @property {{ file?: string, label?: string, frame?: number }[]} [screenshots]
 */

/**
 * @typedef {Object} ProjectRunResult
 * @property {string} relativePath Project file, relative to the repository root.
 * @property {string} exampleSlug
 * @property {number} durationMs Wall clock time of the whole GDevelop run.
 * @property {GameplayTestResult[]} results
 * @property {string} [runError] Set when GDevelop itself could not be run
 * (crash, timeout, no results file...).
 */

/**
 * @param {string} value
 * @returns {string}
 */
const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Control characters are not valid in XML and would break the report.
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, ' ');

/**
 * Describe why a gameplay test did not pass, using everything the result
 * carries: the failed assertions, the errors and the last console logs.
 * @param {GameplayTestResult} result
 * @returns {string}
 */
const makeFailureDescription = (result) => {
  const lines = [`Status: ${result.status}.`];
  const failedAssertions = (result.assertions || []).filter(
    (assertion) => !assertion.passed
  );
  if (failedAssertions.length > 0) {
    lines.push('Failed assertions:');
    for (const assertion of failedAssertions)
      lines.push(`  - ${assertion.message}`);
  }
  if (result.errors && result.errors.length > 0) {
    lines.push('Errors:');
    for (const error of result.errors) lines.push(`  - ${error}`);
  }
  /** @type {string[]} */
  const screenshotFiles = [];
  for (const screenshot of result.screenshots || []) {
    if (screenshot.file) screenshotFiles.push(screenshot.file);
  }
  if (screenshotFiles.length > 0) {
    lines.push('Screenshots (see the artifacts of this job):');
    for (const file of screenshotFiles)
      lines.push(`  - ${path.basename(file)}`);
  }
  const consoleLogs = result.consoleLogs || [];
  if (consoleLogs.length > 0) {
    lines.push('Last console logs:');
    for (const log of consoleLogs.slice(-30)) lines.push(`  ${log}`);
  }
  return lines.join('\n');
};

/**
 * Write a JUnit report for the given project runs.
 *
 * The `file` attribute of each test case is the project file path: this is
 * what `circleci tests split --split-by=timings --timings-type=filename`
 * uses to balance the next runs across the parallel containers.
 * @param {Object} options
 * @param {ProjectRunResult[]} options.projectRunResults
 * @param {string} options.junitPath
 */
const writeJUnitReport = ({ projectRunResults, junitPath }) => {
  const testSuites = projectRunResults.map((projectRunResult) => {
    const { relativePath, exampleSlug, results, runError } = projectRunResult;

    /** @type {string[]} */
    const testCases = [];
    for (const result of results) {
      const durationSeconds = ((result.durationMs || 0) / 1000).toFixed(3);
      const testCaseAttributes =
        `classname="${escapeXml(exampleSlug)}" ` +
        `name="${escapeXml(result.testName)}" ` +
        `file="${escapeXml(relativePath)}" ` +
        `time="${durationSeconds}"`;
      if (result.status === 'passed') {
        testCases.push(`    <testcase ${testCaseAttributes} />`);
      } else {
        testCases.push(
          `    <testcase ${testCaseAttributes}>\n` +
            `      <failure message="${escapeXml(
              `${result.testName} (${result.status})`
            )}">${escapeXml(makeFailureDescription(result))}</failure>\n` +
            `    </testcase>`
        );
      }
    }

    // A run that could not even produce results is reported as a failing
    // test case of its own, so it is never silently green.
    if (runError) {
      testCases.push(
        `    <testcase classname="${escapeXml(exampleSlug)}" ` +
          `name="Running the gameplay tests" ` +
          `file="${escapeXml(relativePath)}" ` +
          `time="${(projectRunResult.durationMs / 1000).toFixed(3)}">\n` +
          `      <failure message="Could not run the gameplay tests">${escapeXml(
            runError
          )}</failure>\n` +
          `    </testcase>`
      );
    }

    const failureCount =
      results.filter((result) => result.status !== 'passed').length +
      (runError ? 1 : 0);
    return (
      `  <testsuite name="${escapeXml(relativePath)}" ` +
      `tests="${testCases.length}" failures="${failureCount}" ` +
      `time="${(projectRunResult.durationMs / 1000).toFixed(3)}">\n` +
      `${testCases.join('\n')}\n` +
      `  </testsuite>`
    );
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<testsuites name="gameplay-tests">\n' +
    `${testSuites.join('\n')}\n` +
    '</testsuites>\n';

  fs.mkdirSync(path.dirname(junitPath), { recursive: true });
  fs.writeFileSync(junitPath, xml);
};

module.exports = { writeJUnitReport, makeFailureDescription, escapeXml };
