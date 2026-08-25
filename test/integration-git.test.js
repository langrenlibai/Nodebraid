'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { GitClient } = require('../src/main/git-client');

const gitProbe = spawnSync('git', ['--version'], { encoding: 'utf8', shell: false });
const gitAvailable = gitProbe.status === 0;
const isWindows = process.platform === 'win32';

function systemGit(repository, args) {
  const result = spawnSync('git', ['-C', repository, ...args], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true
  });
  if (result.status !== 0) {
    throw new Error(`Test Git failed (${args.join(' ')}): ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function initializeRepository(repository) {
  systemGit(repository, ['init', '--initial-branch=main']);
  systemGit(repository, ['config', 'user.name', 'Nodebraid Test']);
  systemGit(repository, ['config', 'user.email', 'nodebraid@example.invalid']);
}

test('GitClient covers status, unusual paths, diffs, stage, unstage, commit, branches, and history', {
  skip: gitAvailable ? false : 'system Git is unavailable'
}, async (context) => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-git-'));
  context.after(() => fs.rm(repository, { recursive: true, force: true }));
  initializeRepository(repository);

  await fs.writeFile(path.join(repository, 'tracked.txt'), 'first line\n', 'utf8');
  systemGit(repository, ['add', '--', 'tracked.txt']);
  systemGit(repository, ['commit', '-m', 'Initial checkpoint']);

  const client = new GitClient();
  const nested = path.join(repository, 'nested');
  await fs.mkdir(nested);
  assert.equal(await client.discoverRepository(nested), await fs.realpath(repository));
  assert.match(await client.checkAvailable(), /^git version /);

  const unusualPaths = [
    'space name.txt',
    '--leading.txt',
    'quote"name.txt',
    'left - right.txt',
    '你好.txt'
  ];
  await Promise.all(unusualPaths.map((name, index) => (
    fs.writeFile(path.join(repository, name), `new file ${index}\n`, 'utf8')
  )));
  await fs.appendFile(path.join(repository, 'tracked.txt'), 'second line\n', 'utf8');

  let status = await client.status(repository);
  assert.equal(status.branch.name, 'main');
  assert.equal(status.branch.hasUpstream, false);
  const unstagedNames = new Set(status.unstaged.map((file) => file.path));
  for (const filename of [...unusualPaths, 'tracked.txt']) {
    assert.equal(unstagedNames.has(filename), true, `${filename} should be unstaged`);
  }

  const trackedDiff = await client.diff(repository, 'tracked.txt', false);
  assert.equal(trackedDiff.truncated, false);
  assert.match(trackedDiff.text, /\+second line/);
  const limitedDiff = await new GitClient({ diffLimit: 80 }).diff(repository, 'tracked.txt', false);
  assert.equal(limitedDiff.truncated, true);
  assert.ok(Buffer.byteLength(limitedDiff.text, 'utf8') <= 80);
  const untrackedDiff = await client.diff(repository, 'left - right.txt', false);
  assert.match(untrackedDiff.text, /\+new file 3/);

  await client.stage(repository, [...unusualPaths, 'tracked.txt']);
  status = await client.status(repository);
  assert.equal(status.unstaged.length, 0);
  assert.equal(status.staged.length, unusualPaths.length + 1);

  const stagedDiff = await client.diff(repository, 'space name.txt', true);
  assert.match(stagedDiff.text, /\+new file 0/);

  await client.unstage(repository, ['--leading.txt', 'quote"name.txt']);
  status = await client.status(repository);
  assert.equal(status.unstaged.some((file) => file.path === '--leading.txt'), true);
  assert.equal(status.unstaged.some((file) => file.path === 'quote"name.txt'), true);
  await client.stage(repository, ['--leading.txt', 'quote"name.txt']);

  await client.commit(repository, 'Record unusual filenames');
  status = await client.status(repository);
  assert.equal(status.staged.length, 0);
  assert.equal(status.unstaged.length, 0);

  const history = await client.history(repository, 200);
  assert.equal(history.length, 2);
  assert.equal(history[0].subject, 'Record unusual filenames');
  assert.equal(history[0].author, 'Nodebraid Test');
  assert.match(history[0].date, /^\d{4}-\d{2}-\d{2}T/);

  systemGit(repository, ['branch', 'feature']);
  let branches = await client.branches(repository);
  assert.equal(branches.find((branch) => branch.name === 'main').current, true);
  assert.equal(branches.some((branch) => branch.name === 'feature'), true);
  await client.switchBranch(repository, 'feature');
  branches = await client.branches(repository);
  assert.equal(branches.find((branch) => branch.name === 'feature').current, true);
});

test('GitClient unstages files in an unborn repository without deleting working files', {
  skip: gitAvailable ? false : 'system Git is unavailable'
}, async (context) => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-unborn-'));
  context.after(() => fs.rm(repository, { recursive: true, force: true }));
  initializeRepository(repository);
  const client = new GitClient();

  await fs.writeFile(path.join(repository, '--first 文件.txt'), 'keep me\n', 'utf8');
  await client.stage(repository, ['--first 文件.txt']);
  assert.equal((await client.status(repository)).staged.length, 1);
  await fs.appendFile(path.join(repository, '--first 文件.txt'), 'changed after staging\n', 'utf8');
  await client.unstage(repository, ['--first 文件.txt']);

  const status = await client.status(repository);
  assert.equal(status.staged.length, 0);
  assert.equal(status.unstaged.some((file) => file.path === '--first 文件.txt'), true);
  assert.equal(
    await fs.readFile(path.join(repository, '--first 文件.txt'), 'utf8'),
    'keep me\nchanged after staging\n'
  );
});

test('GitClient treats pathspec magic-looking filenames as literal paths', {
  skip: !gitAvailable
    ? 'system Git is unavailable'
    : (isWindows ? 'Windows filesystems reject colon and asterisk filename characters' : false)
}, async (context) => {
  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-literal-pathspec-'));
  context.after(() => fs.rm(repository, { recursive: true, force: true }));
  initializeRepository(repository);

  await fs.writeFile(path.join(repository, 'anchor.md'), 'anchor\n', 'utf8');
  systemGit(repository, ['add', '--', 'anchor.md']);
  systemGit(repository, ['commit', '-m', 'Anchor']);

  const magicLookingName = ':(glob)*.txt';
  const otherName = 'other.txt';
  await fs.writeFile(path.join(repository, magicLookingName), 'selected file only\n', 'utf8');
  await fs.writeFile(path.join(repository, otherName), 'must remain separate\n', 'utf8');

  const client = new GitClient();
  const untrackedDiff = await client.diff(repository, magicLookingName, false);
  assert.match(untrackedDiff.text, /selected file only/);
  assert.doesNotMatch(untrackedDiff.text, /must remain separate/);

  await client.stage(repository, [magicLookingName]);
  let status = await client.status(repository);
  assert.equal(status.staged.some((file) => file.path === magicLookingName), true);
  assert.equal(status.staged.some((file) => file.path === otherName), false);
  assert.equal(status.unstaged.some((file) => file.path === otherName), true);

  const stagedDiff = await client.diff(repository, magicLookingName, true);
  assert.match(stagedDiff.text, /selected file only/);
  assert.doesNotMatch(stagedDiff.text, /must remain separate/);

  await client.stage(repository, [otherName]);
  await client.unstage(repository, [magicLookingName]);
  status = await client.status(repository);
  assert.equal(status.unstaged.some((file) => file.path === magicLookingName), true);
  assert.equal(status.staged.some((file) => file.path === magicLookingName), false);
  assert.equal(status.staged.some((file) => file.path === otherName), true);
});

test('GitClient discovers a repository whose directory name ends with a space', {
  skip: !gitAvailable
    ? 'system Git is unavailable'
    : (isWindows ? 'Windows strips trailing spaces from directory names' : false)
}, async (context) => {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-trailing-space-'));
  context.after(() => fs.rm(parent, { recursive: true, force: true }));
  const repository = path.join(parent, 'repository ');
  await fs.mkdir(repository);
  initializeRepository(repository);

  const client = new GitClient();
  assert.equal(await client.discoverRepository(repository), await fs.realpath(repository));
});
