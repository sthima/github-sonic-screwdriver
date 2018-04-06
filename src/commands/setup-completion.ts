import { BaseCommand, completionFactory } from ".";
import { Argv } from "yargs";
import ora from 'ora';
import { promisify } from "util";

class SetupCompletionCommand extends BaseCommand {
  command = 'setup-completion';
  describe = 'Setup completion for your shell';

  builder(yargs: Argv) {
    return yargs
        .wrap(90);
  }
  async handler(argv: any): Promise<Boolean> {
    const spinner = new ora("Wait a moment while we setup completion for you...");
    spinner.start();
    await promisify(setTimeout)(1000);

    try {
      process.on('exit', (options) => {
        spinner.succeed("Done");
      });
      completionFactory().setupShellInitFile();
    } catch(err) {
      spinner.fail("Sorry, we couldn't setup completion.");
      console.log(err);
      return false;
    }
    return true;
  }
}

export = new SetupCompletionCommand();
