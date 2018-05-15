import { Argv } from "yargs";

import { GitHubCommand } from ".";
import { PullRequestReport } from "../lib/pull-request";


class PullRequestReportCommand extends GitHubCommand {
  command = 'pull-request-report';
  describe = '';

  builder(yargs: Argv) {
    return yargs
        .wrap(90);
  }

  async handler(argv: any) {
    let args = await argv as any;
    const spinner = args.spinner;
    const pull_request_report = new PullRequestReport ();
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
