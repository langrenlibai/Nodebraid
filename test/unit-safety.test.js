'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { LimitedBuffer } = require('../src/shared/limits');
const {
  validateRelativePath,
  validateRelativePaths,
  validateExecutablePath,
  validateSelectedExecutable
} = require('../src/shared/path-utils');
const { redactCredentials } = require('../src/main/git-client');
const { OperationGate } = require('../src/main/operation-gate');

test('LimitedBuffer caps bytes while continuing to accept input', () => {
  const output = new LimitedBuffer(5);
  output.append('abc');
  output.append('defgh');
  output.append('ignored');
  assert.equal(output.toString(), 'abcde');
  assert.equal(output.length, 5);
  assert.equal(output.truncated, true);
});

test('LimitedBuffer handles a zero byte limit', () => {
  const output = new LimitedBuffer(0);
  output.append('x');
  assert.equal(output.toString(), '');
  assert.equal(output.truncated, true);
});

test('repository path validation allows unusual safe names', () => {
  const root = path.resolve(path.sep, 'tmp', 'nodebraid-repository');
  for (const candidate of [
    '--leading.txt',
    'space name.txt',
    'quote"name.txt',
    'left -> right.txt',
    '目录/文件.txt'
  ]) {
    assert.equal(validateRelativePath(root, candidate), candidate);
  }
  assert.deepEqual(validateRelativePaths(root, ['a.txt', 'a.txt', '--b']), ['a.txt', '--b']);
});

test('repository path validation rejects traversal, roots, absolute paths, and NUL', () => {
  const root = path.resolve(path.sep, 'tmp', 'nodebraid-repository');
  assert.throws(() => validateRelativePath(root, '../outside.txt'), /outside/);
  assert.throws(() => validateRelativePath(root, '.'), /outside/);
  assert.throws(() => validateRelativePath(root, path.resolve(root, 'absolute.txt')), /absolute/);
  assert.throws(() => validateRelativePath(root, 'bad\0name'), /NUL/);
  assert.throws(() => validateRelativePaths(root, []), /At least one/);
});

test('Git executable validation rejects embedded NUL and trims values', () => {
  assert.equal(validateExecutablePath('  /usr/bin/git  '), '/usr/bin/git');
  assert.throws(() => validateExecutablePath('git\0other'), /NUL/);
});

test('selected Git executable validation resolves a real executable file', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-executable-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const executable = path.join(directory, process.platform === 'win32' ? 'git.exe' : 'git');
  await fs.writeFile(executable, 'not executed by this validation test');
  if (process.platform !== 'win32') await fs.chmod(executable, 0o700);

  assert.equal(
    await validateSelectedExecutable(executable),
    await fs.realpath(executable)
  );
  await assert.rejects(validateSelectedExecutable(directory), /regular file/);
  await assert.rejects(validateSelectedExecutable('git'), /absolute/);
});

test('selected Git executable validation enforces platform executability', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-executable-mode-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'git');
  await fs.writeFile(file, 'plain file');

  if (process.platform === 'win32') {
    await assert.rejects(validateSelectedExecutable(file), /native Windows executable/);
  } else {
    await fs.chmod(file, 0o600);
    await assert.rejects(validateSelectedExecutable(file), /not executable/);
  }
});

test('credential redaction removes userinfo from HTTP remote URLs', () => {
  const message = 'fatal: https://alice:secret@example.test/repo and https://token@example.test/other';
  const redacted = redactCredentials(message);
  assert.equal(redacted.includes('alice'), false);
  assert.equal(redacted.includes('secret'), false);
  assert.equal(redacted.includes('token@'), false);
  assert.match(redacted, /https:\/\/\*\*\*@example\.test/);
});

test('OperationGate prevents overlapping mutations and resets afterward', async () => {
  const gate = new OperationGate();
  let release;
  const first = gate.run('First operation', () => new Promise((resolve) => { release = resolve; }));
  await assert.rejects(gate.run('Second operation', async () => {}), /First operation/);
  release('done');
  assert.equal(await first, 'done');
  assert.equal(await gate.run('Third operation', async () => 'ok'), 'ok');
});
