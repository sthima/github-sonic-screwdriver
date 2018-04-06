import { Argv, Options } from "yargs";

import { UserActivity } from '../lib/user-activity';
import { GitHubCommand } from ".";

const lastWeek: Options = {
  alias: 'w',
  describe: 'Show activity for last week',
  type: 'boolean'
};

interface UserActivityArgs {
  username: String;
  lastWeek: Boolean;
}

class UserActivityCommand extends GitHubCommand {
  command = 'user-activity <username>';
  describe = 'Retrieve the activity for a given user';

  builder(yargs: Argv) {
    return yargs
        .options('last-week', lastWeek)
        .positional('username', {
          type: 'string',
          describe: 'Github user'
        })
        .example('git sonic-screwdriver user-activity mmarchini -w',
          'Retrieve the activity for user @mmarchini for the last week')
        .wrap(90);
  }

  async handler(argv: any) {
    await argv;
    let args = await argv as UserActivityArgs;
    const spinner = argv.spinner;
    const user_activity = new UserActivity(args.username, args.lastWeek);
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
}

export = new UserActivityCommand();
