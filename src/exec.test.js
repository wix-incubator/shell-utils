const fs = require('fs');

const uut = require('./exec');
const TESTFILE = './testfile';

describe('exec', () => {
  let originalConsoleLog;
  let originalConsoleError;

  beforeEach(() => {
    cleanEnv();
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    cleanEnv();
  });

  function cleanEnv() {
    try {
      console.log = originalConsoleLog || console.log;
      console.error = originalConsoleError || console.error;
      fs.unlinkSync(TESTFILE);
    } catch (e) {
      //
    }
  }

  it('execSync', () => {
    expect(fs.existsSync(TESTFILE)).toEqual(false);
    uut.execSync(`touch ${TESTFILE}`);
    expect(fs.existsSync(TESTFILE)).toEqual(true);
  });

  it('execSync normalizes input', () => {
    uut.execSync(`\n\n  \t\t touch        \n \n  ${TESTFILE}      \t\t`);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(`touch ${TESTFILE}`);
  });

  it('execSyncSilent', () => {
    expect(fs.existsSync(TESTFILE)).toEqual(false);
    uut.execSyncSilent(`touch ${TESTFILE}`);
    expect(fs.existsSync(TESTFILE)).toEqual(true);
    expect(console.log).not.toHaveBeenCalled();
  });
  
  it('execSyncSilent swallows exceptions', () => {
    uut.execSyncSilent(`invalid command`);
  });

  it('execSync does not swallows exceptions', () => {
    expect(() => uut.execSync(`invalid command`)).toThrow();
  });

  it('handles empty input', () => {
    expect(uut.execSyncRead()).toEqual('');
  });

  it('execSyncRead returns the stdout as string', () => {
    uut.execSync(`echo "hello world!" > ${TESTFILE}`);
    const result = uut.execSyncRead(`cat ${TESTFILE}`);
    expect(result).toEqual('hello world!');
  });

  it('execSyncRead with silent param', () => {
    uut.execSyncSilent(`echo "hello world!" > ${TESTFILE}`);
    const result = uut.execSyncRead(`cat ${TESTFILE}`, true);
    expect(result).toEqual('hello world!');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('execAsyncRead returns the stdout as string', async () => {
    uut.execSync(`echo "hello world!" > ${TESTFILE}`);
    const result = await uut.execAsyncRead(`cat ${TESTFILE}`);
    expect(result).toEqual('hello world!');
  });

  it('execAsyncRead with silent param', async () => {
    uut.execSyncSilent(`echo "hello world!" > ${TESTFILE}`);
    const result = await uut.execAsyncRead(`cat ${TESTFILE}`, true);
    expect(result).toEqual('hello world!');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('execAsyncRead should reject on invalid command', async () => {

    try {
      const result = await uut.execAsyncRead(`invalid command`);
      fail('should throw');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('execSyncRead returns the stderr into thrown exception', () => {
    try {
      uut.execSyncRead(`npm view 999999999`);
      fail('should throw');
    } catch (e) {
      expect(e.toString()).toContain(`npm ERR! 404`);
    }
  });

  it('execSyncRead throws on exception', () => {
    expect(() => uut.execSyncRead(`invalid command`)).toThrow();
  });

  it('which', () => {
    expect(uut.which(`node`)).toBeDefined();
    expect(uut.which(`invalid bin`)).toEqual(undefined);
  });

  it('execAsync', async () => {
    const result = await uut.execAsync(`node -e "setTimeout(() => console.log('done'), 500)"`);
    expect(result).toEqual({ stderr: '', stdout: 'done\n' });
  });

  it('execAsync reject', async () => {
    try {
      await uut.execAsync(`node -e "setTimeout(() => { throw Error() }, 500)"`);
      fail('should reject');
    } catch (e) {
      expect(e).not.toEqual(undefined);
    }
  });

  it('execAsyncSilent', async () => {
    await uut.execAsyncSilent(`node -e "undefined()"`);
    expect(console.error).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });

  it('execAsyncAll', async () => {
    const cmd1 = `node -e "setTimeout(() => console.log('hello'), 500)"`;
    const cmd2 = `node -e "setTimeout(() => console.log('world'), 1000)"`;
    const result = await uut.execAsyncAll(cmd1, cmd2);
    expect(result).toEqual([{ stderr: '', stdout: 'hello\n' }, { stderr: '', stdout: 'world\n' }]);
  });

  it('execAsyncAll rejects with process exit code 1', async () => {
    const originalExitSignal = process.exit;
    process.exit = jest.fn();
    await uut.execAsyncAll(`node -e "throw Error()"`);
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
    process.exit = originalExitSignal;
  });

  it('kill process', async () => {
    const promise = uut.execAsync(`node -e "setTimeout(() => console.log('hi'), 10000)"`);
    uut.kill('node -e setTimeout');
    try {
      await promise;
      fail('should reject');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('killPort', async () => {
    const cmd = `const server = net.createServer(); server.listen(54321);`
    const resultPromise = uut.execAsync(`node -e "${cmd}"`);
    await new Promise((r) => setTimeout(r, 1000));
    uut.killPort(54321);
    try {
      await resultPromise;
      fail('should reject');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('killPort fails silently', () => {
    uut.killPort(987654321);
  });

  it('kill fails silently', () => {
    uut.kill();
  });
});
