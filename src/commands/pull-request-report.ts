import { Argv, Options } from "yargs";

import { GitHubCommand } from ".";
import { PullRequestReport } from "../lib/pull-request";


const ignoreRepositories: Options = {
  alias: 'i',
  describe: 'List of repositories to ignore',
  type: 'array',
  default: []
};


class PullRequestReportCommand extends GitHubCommand {
  command = 'pull-request-report';
  describe = '';

  builder(yargs: Argv) {
    return yargs
        .options('ignore', ignoreRepositories)
        .wrap(90);
  }

  async handler(argv: any) {
    let args = await argv as any;
    const spinner = args.spinner;
    const ignoredRepositories: Array<String> = argv.ignore;
    const pull_request_report = new PullRequestReport(ignoredRepositories);
    // try {
      await pull_request_report.run();
      spinner.succeed("Done");
    // } catch (err) {
    //     spinner.fail('oops')
    //     return false;
    // }
    return true;
  }
}

export = new PullRequestReportCommand();
