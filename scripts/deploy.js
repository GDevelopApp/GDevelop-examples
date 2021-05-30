const shell = require('shelljs');
const path = require('path');
const { default: axios } = require('axios');
const args = require('minimist')(process.argv.slice(2));

const databasePath = path.join(__dirname, '../dist/database');
const examplesPath = path.join(__dirname, '../dist/examples');
const databaseDestination = `s3://resources.gdevelop-app.com/examples-database`;
const examplesDestination = `s3://resources.gdevelop-app.com/examples`;

if (!args['cf-zoneid'] || !args['cf-token']) {
  shell.echo(
    '❌ You must pass --cf-zoneid, --cf-token to purge the CloudFare cache.'
  );
  shell.exit(1);
}

{
  shell.echo('ℹ️ Uploading examples to resources.gdevelop-app.com/examples...');
  const output = shell.exec(
    `aws s3 sync ${examplesPath} ${examplesDestination} --acl public-read`
  );
  if (output.code !== 0) {
    shell.echo(
      '❌ Unable to upload database to resources.gdevelop-app.com/examples-database. Error is:'
    );
    shell.echo(output.stdout);
    shell.echo(output.stderr);
    shell.exit(output.code);
  }
}

{
  shell.echo(
    'ℹ️ Uploading database to resources.gdevelop-app.com/examples-database...'
  );
  const output = shell.exec(
    `aws s3 sync ${databasePath} ${databaseDestination} --acl public-read`
  );
  if (output.code !== 0) {
    shell.echo(
      '❌ Unable to upload database to resources.gdevelop-app.com/examples-database. Error is:'
    );
    shell.echo(output.stdout);
    shell.echo(output.stderr);
    shell.exit(output.code);
  }
}

shell.echo('✅ Upload finished');

shell.echo('ℹ️ Purging Cloudflare cache...');

const zoneId = args['cf-zoneid'];
const purgeCacheUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;

axios
  .post(
    purgeCacheUrl,
    {
      files: [
        // Update the "database"
        'https://resources.gdevelop-app.com/examples-database/exampleShortHeaders.json',
        'https://resources.gdevelop-app.com/examples-database/filters.json',
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${args['cf-token']}`,
        'Content-Type': 'application/json',
      },
    }
  )
  .then((response) => response.data)
  .then(() => {
    shell.echo('✅ Cache purge done.');
  })
  .catch((error) => {
    shell.echo(
      '❌ Error while requesting cache purge (are your identifiers correct?)'
    );
    shell.echo(error.message || '(unknown error)');
    shell.exit(1);
  });
