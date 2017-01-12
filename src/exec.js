const cp = require('child_process');
const _ = require('lodash');

function execSync(command) {
  const normalized = normalizeSpace(command);
  console.log(normalized);
  cp.execSync(normalized, {stdio: ['inherit', 'inherit', 'inherit']});
}

function execSyncSilent(command) {
  const normalized = normalizeSpace(command);
  cp.execSync(normalized, {stdio: ['ignore', 'ignore', 'ignore']});
}

function execSyncRead(command) {
  const normalized = normalizeSpace(command);
  console.log(normalized);
  return _.trim(String(cp.execSync(normalized, {stdio: ['inherit', 'pipe', 'inherit']})));
}

function exec(command) {
  cp.exec(command);
}

function kill(process) {
  execSyncSilent(`pkill -f "${process}" || true`);
}

module.exports = {
  execSync,
  execSyncSilent,
  execSyncRead,
  exec,
  kill
};

const WHITESPACE_REGEX = /\s+/g;

function normalizeSpace(str) {
  if (!_.isString(str)) {
    return '';
  }
  return _.replace(_.trim(str), WHITESPACE_REGEX, ' ');
}

