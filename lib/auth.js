const util = require('util');
const ghauth = util.promisify(require('ghauth'));

const authOptions = {
  configName : 'github-sonic-screwdriver',
  scopes     : [ 'user' ],
  note       : 'Token for GitHub Sonic Screwdriver CLI tool',
  userAgent  : 'GitHub Sonic Screwdriver',
}

async function auth() {
  return await ghauth(authOptions);
}

module.exports = auth;
