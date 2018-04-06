import { promisify } from 'util';

// TODO (mmarchini): Move this to declaration files
export interface ghauthOptions {
  configName: String;
  noSave?: Boolean;
  authUrl?: String;
  promptName?: String;
  scopes?: Array<String>;
  note?: String;
  userAgent?: String;
}

export interface ghauthData {
  user: String;
  token: String;
}

type ghauthFn = (options: ghauthOptions, callback: (err: Error, data: ghauthData) => void) => void;

declare namespace ghauthFn {
  function __promisify__(options: ghauthOptions): Promise<ghauthData>;
}

const ghauth: ghauthFn = require('ghauth');

let promiseGhauth = promisify(ghauth);

const authOptions: ghauthOptions = {
  configName : 'github-sonic-screwdriver',
  scopes     : [ 'user', 'repo', 'gist', 'notifications' ],
  note       : 'Token for GitHub Sonic Screwdriver CLI tool',
  userAgent  : 'GitHub Sonic Screwdriver',
}

export default async function auth(): Promise<ghauthData> {
  return await promiseGhauth(authOptions);
}
