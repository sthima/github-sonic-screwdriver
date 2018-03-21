'use strict';

const yargs = require('yargs');
const { UserActivity } = require('../lib/user-activity.js');
const auth = require('../lib/auth.js');
const ora = require('ora');

const options = {
  'last-week': {
    alias: 'w',
    describe: 'Show activity for last week',
    type: 'boolean'
  },
};

function builder(yargs) {
  return yargs
    .options(options)
    .positional('username', {
      type: 'string',
      describe: 'Github user'
    })
    .example('git sonic-screwdriver user-activity mmarchini -w',
      'Retrieve the activity for user @mmarchini for the last week')
    .wrap(90);
}

async function handler(argv) {
  const user_activity = new UserActivity(argv.username, argv.lastWeek);
  const spinner = new ora("Fetching data from GitHub");
  spinner.start();
  try {
    const result = await user_activity.run();
    if (result.status == true ) {
      spinner.succeed("Done!");
      console.log(result.text);
      return true;
    }
    spinner.fail(result.text);
    return false;
  } catch (err) {
    spinner.fail(err);
    return false;
  }
}

module.exports = {
  command: 'user-activity <username>',
  describe: 'Retrieves metadata for a PR and validates them against ' +
            'nodejs/node PR rules',
  builder,
  handler
};
