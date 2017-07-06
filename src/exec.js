const cp = require('child_process');
const _ = require('lodash');

function execSync(command) {
  const normalized = normalizeSpace(command);
  console.log(normalized);
  cp.execSync(normalized, { stdio: ['inherit', 'inherit', 'inherit'] });
}

function execSyncSilent(command) {
  const normalized = normalizeSpace(command);
  cp.execSync(normalized, { stdio: ['ignore', 'ignore', 'ignore'] });
}

function execSyncRead(command) {
  const normalized = normalizeSpace(command);
  console.log(normalized);
  return _.trim(String(cp.execSync(normalized, { stdio: ['inherit', 'pipe', 'inherit'] })));
}

function execAsync(cmd) {
  const normalized = normalizeSpace(command);
  return new Promise((resolve, reject) => {
    const child = cp.exec(normalized, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
}

function kill(process) {
  execSyncSilent(`pkill -f "${process}" || true`);
}

function killPort(port) {
  execSync(`lsof -t -i :${port} | xargs kill || true`);
}

function which(what) {
  try {
    return execSyncRead(`which ${what}`);
  } catch (e) {
    return undefined;
  }
}

module.exports = {
  execSync,
  execSyncSilent,
  execSyncRead,
  exec,
  kill,
  which,
  killPort
};

const WHITESPACE_REGEX = /\s+/g;

function normalizeSpace(str) {
  if (!_.isString(str)) {
    return '';
  }
  return _.replace(_.trim(str), WHITESPACE_REGEX, ' ');
}

