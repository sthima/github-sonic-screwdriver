import { Argv } from "yargs";
import ora from 'ora';
import omelette from 'omelette';

export function completionFactory() {
  const completion = omelette("gh-sonic-screwdriver").tree({
    "user-activity": ["-w|--last-week"],
    "setup-completion": [],
    "--help": [],
    "--version": [],
  });
  completion.init();

  return completion;
}

function authenticationMiddleware(argv: any) {
  const spinner = new ora("Fetch data from GitHub...");
  spinner.start();
  argv.spinner = spinner;
  return argv;
}

export abstract class BaseCommand {
  public abstract command: String;
  public abstract describe: String;
  // middlewares = [];

  abstract builder(yargs: Argv): Argv;
  abstract async handler(argv: any): Promise<Boolean>;
}

export abstract class GitHubCommand extends BaseCommand {
  middlewares = [authenticationMiddleware];
}
