#!/usr/bin/env node

import path from 'path';
import * as yargs from 'yargs';
import { completionFactory } from '../commands';

const commandDir = path.join(__dirname, '..', 'commands');
const epilogue = "Everything you need to have fun with GitHub on CLI!";

completionFactory();

yargs
  .usage('Usage: git sonic-screwdriver <command> [options]')
  .commandDir(commandDir)
  .demandCommand(1)
  .epilogue(epilogue)
  .help()
  .version()
  .argv;
