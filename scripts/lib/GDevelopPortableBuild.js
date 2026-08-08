// @ts-check
/**
 * Download and extract the Linux "portable" build of GDevelop that its own
 * CI publishes on S3, so that the examples can be opened and tested with a
 * real GDevelop, without building it.
 *
 * The layout of the bucket is set by GDevelop's `.circleci/config.yml`:
 *   s3://gdevelop-releases/<branch>/latest/gdevelop-<version>.zip
 * The bucket does not allow listing, so the version is read from the
 * `newIDE/electron-app/app/package.json` of the same branch (the same
 * source of truth GDevelop's own smoke test uses).
 */
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const RELEASES_BASE_URL = 'https://gdevelop-releases.s3.amazonaws.com';
const GDEVELOP_RAW_BASE_URL = 'https://raw.githubusercontent.com/4ian/GDevelop';

/**
 * Download a URL with curl, which streams straight to disk (the build is a
 * few hundred megabytes) and follows redirects.
 * @param {string} url
 * @param {string} destinationPath
 */
const downloadFile = (url, destinationPath) => {
  const output = shell.exec(
    `curl --silent --show-error --fail --location --retry 3 --retry-delay 5 ` +
      `--output "${destinationPath}" "${url}"`,
    { silent: true }
  );
  if (output.code !== 0) {
    shell.rm('-f', destinationPath);
    throw new Error(
      `Could not download ${url}: ${
        output.stderr.trim() || `curl exited with code ${output.code}`
      }`
    );
  }
};

/**
 * Read the GDevelop version published on a branch: the S3 bucket cannot be
 * listed, so the name of the zip is rebuilt from the version of the branch.
 * @param {string} branch
 * @returns {string}
 */
const fetchGDevelopVersion = (branch) => {
  const url = `${GDEVELOP_RAW_BASE_URL}/${branch}/newIDE/electron-app/app/package.json`;
  const output = shell.exec(
    `curl --silent --show-error --fail --location --retry 3 --retry-delay 5 "${url}"`,
    { silent: true }
  );
  if (output.code !== 0) {
    throw new Error(
      `Could not read ${url}: ${
        output.stderr.trim() || `curl exited with code ${output.code}`
      }`
    );
  }
  let version;
  try {
    version = JSON.parse(output.stdout).version;
  } catch (error) {
    throw new Error(`Could not parse the package.json read from ${url}.`);
  }
  if (typeof version !== 'string' || !version) {
    throw new Error(`Could not read the GDevelop version from ${url}.`);
  }
  return version;
};

/**
 * Find the GDevelop executable in an extracted portable build. On Linux,
 * electron-builder names it after the `name` field of the package.json.
 * @param {string} rootPath
 * @returns {string | null}
 */
const findExecutable = (rootPath) => {
  const executableNames = ['gdevelop', 'GDevelop'];
  /** @type {string[]} */
  const directoriesToVisit = [rootPath];
  while (directoriesToVisit.length > 0) {
    const directoryPath = directoriesToVisit.pop();
    if (!directoryPath) continue;
    /** @type {fs.Dirent[]} */
    let entries;
    try {
      entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    } catch (error) {
      continue;
    }
    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry.name);
      if (entry.isDirectory()) directoriesToVisit.push(entryPath);
      else if (entry.isFile() && executableNames.includes(entry.name))
        return entryPath;
    }
  }
  return null;
};

/**
 * Get a ready to run GDevelop executable: the portable build is downloaded
 * and extracted once, then reused (which is what makes it cheap to cache
 * the work folder between CI jobs).
 * @param {Object} options
 * @param {string} options.branch Branch of the GDevelop repository to take
 * the build from.
 * @param {string} [options.version] Version to download, when it should not
 * be read from the branch.
 * @param {string} options.workPath Folder where the build is downloaded and
 * extracted.
 * @returns {Promise<{ executablePath: string, version: string }>}
 */
const getGDevelopExecutable = async ({ branch, version, workPath }) => {
  const gdevelopVersion = version || fetchGDevelopVersion(branch);
  const zipName = `gdevelop-${gdevelopVersion}.zip`;
  const zipPath = path.join(workPath, zipName);
  const extractedPath = path.join(workPath, `gdevelop-${gdevelopVersion}`);

  shell.mkdir('-p', workPath);

  const alreadyExtractedExecutablePath = fs.existsSync(extractedPath)
    ? findExecutable(extractedPath)
    : null;
  if (alreadyExtractedExecutablePath) {
    shell.echo(
      `ℹ️ Reusing the GDevelop ${gdevelopVersion} build already extracted in ${extractedPath}.`
    );
    shell.chmod('+x', alreadyExtractedExecutablePath);
    return {
      executablePath: alreadyExtractedExecutablePath,
      version: gdevelopVersion,
    };
  }

  if (!fs.existsSync(zipPath)) {
    const zipUrl = `${RELEASES_BASE_URL}/${branch}/latest/${zipName}`;
    shell.echo(`🌐 Downloading ${zipUrl}...`);
    downloadFile(zipUrl, zipPath);
    shell.echo(
      `✅ Downloaded ${zipName} (${Math.round(
        fs.statSync(zipPath).size / 1024 / 1024
      )} MiB).`
    );
  }

  shell.echo(`📂 Extracting ${zipName} to ${extractedPath}...`);
  shell.rm('-rf', extractedPath);
  shell.mkdir('-p', extractedPath);
  const unzipOutput = shell.exec(
    `unzip -q "${zipPath}" -d "${extractedPath}"`,
    {
      silent: true,
    }
  );
  if (unzipOutput.code !== 0) {
    throw new Error(
      `Could not extract ${zipPath}: ${
        unzipOutput.stderr || unzipOutput.stdout
      }`
    );
  }

  const executablePath = findExecutable(extractedPath);
  if (!executablePath) {
    throw new Error(
      `Could not find a GDevelop executable in ${extractedPath} (contents: ${shell
        .ls(extractedPath)
        .join(', ')}).`
    );
  }
  shell.chmod('+x', executablePath);
  shell.echo(`✅ GDevelop ${gdevelopVersion} ready: ${executablePath}`);
  return { executablePath, version: gdevelopVersion };
};

module.exports = {
  fetchGDevelopVersion,
  findExecutable,
  getGDevelopExecutable,
};
