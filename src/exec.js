const cp = require('child_process');
const _ = require('lodash');

function execSync(command, silent = false) {
  const normalized = normalizeSpace(command);
  if (!silent) console.log(normalized);
  const io = silent ? 'ignore' : 'inherit';
  cp.execSync(normalized, { stdio: [io, io, io] });
}

function execSyncSilent(command) {
  try {
    execSync(command, true);
  } catch (e) {
    //
  }
}

function execSyncRead(command, silent = false) {
  const normalized = normalizeSpace(command);
  if (_.isEmpty(normalized)) {
    return '';
  }
  if (!silent) {
    console.log(normalized);
  }
  return _.trim(String(cp.execSync(normalized, { stdio: ['pipe', 'pipe', 'pipe'] })));
}

function execAsyncRead(command, silent = false) {
  return execAsync(command, silent).then((resolve) => {
    return _.trim(String(resolve.stdout))
  });
}

function execAsync(command, silent = false) {
  const normalized = normalizeSpace(command);
  if (!silent) {
    console.log(normalized);
  }
  return new Promise((resolve, reject) => {
    const child = cp.exec(normalized, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err && !silent) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
    if (!silent) {
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
    }
  });
}

function execAsyncSilent(command) {
  return execAsync(command, true);
}

function execAsyncAll(...commands) {
  const promises = _.map(commands, (cmd) => execAsync(cmd));
  return Promise.all(promises)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

function kill(process) {
  execSyncSilent(`pkill -f "${process}"`);
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
  execAsyncRead,
  execAsync,
  execAsyncSilent,
  execAsyncAll,
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

