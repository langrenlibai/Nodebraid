'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { LimitedBuffer } = require('../shared/limits');
const { parseStatus, parseBranches, parseHistory } = require('../shared/parsers');
const {
  validateRelativePath,
  validateRelativePaths,
  validateExecutablePath
} = require('../shared/path-utils');

const DEFAULT_OUTPUT_LIMIT = 4 * 1024 * 1024;
const DEFAULT_ERROR_LIMIT = 256 * 1024;
const DEFAULT_DIFF_LIMIT = 2 * 1024 * 1024;
const OPERATION_TIMEOUT_MS = 5 * 60 * 1000;

function redactCredentials(text) {
  return String(text)
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/giu, '$1***@')
    .replace(/(https?:\/\/)[^\s/@]+@/giu, '$1***@');
}

class GitError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'GitError';
    this.code = options.code || 'GIT_FAILED';
    this.exitCode = options.exitCode;
    this.truncated = Boolean(options.truncated);
  }
}

function runProcess(executable, args, options = {}) {
  const stdout = new LimitedBuffer(options.maxStdout ?? DEFAULT_OUTPUT_LIMIT);
  const stderr = new LimitedBuffer(options.maxStderr ?? DEFAULT_ERROR_LIMIT);
  const acceptedExitCodes = options.acceptedExitCodes || [0];

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd,
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout ?? OPERATION_TIMEOUT_MS
    });

    child.stdout.on('data', (chunk) => stdout.append(chunk));
    child.stderr.on('data', (chunk) => stderr.append(chunk));

    child.once('error', (error) => {
      const missing = error.code === 'ENOENT';
      reject(new GitError(
        missing
          ? `Git executable was not found: ${executable}. Install Git or choose its executable in Settings.`
          : `Git could not start: ${error.message}`,
        { code: missing ? 'GIT_NOT_FOUND' : 'GIT_START_FAILED' }
      ));
    });

    child.once('close', (exitCode, signal) => {
      const result = {
        stdout: stdout.toBuffer(),
        stderr: stderr.toBuffer(),
        stdoutTruncated: stdout.truncated,
        stderrTruncated: stderr.truncated,
        exitCode,
        signal
      };

      if (acceptedExitCodes.includes(exitCode)) {
        resolve(result);
        return;
      }

      const detail = redactCredentials(stderr.toString().trim())
        || redactCredentials(stdout.toString().trim())
        || (signal ? `Git was stopped by signal ${signal}.` : `Git exited with code ${exitCode}.`);
      const truncationNote = stderr.truncated || stdout.truncated ? ' (output was truncated)' : '';
      reject(new GitError(`${detail}${truncationNote}`, {
        exitCode,
        truncated: stderr.truncated || stdout.truncated
      }));
    });
  });
}

class GitClient {
  constructor(options = {}) {
    const configuredPath = validateExecutablePath(options.executable || '');
    this.executable = configuredPath || 'git';
    this.outputLimit = options.outputLimit ?? DEFAULT_OUTPUT_LIMIT;
    this.diffLimit = options.diffLimit ?? DEFAULT_DIFF_LIMIT;
  }

  async run(args, options = {}) {
    if (!Array.isArray(args) || args.some((argument) => typeof argument !== 'string')) {
      throw new TypeError('Git arguments must be an array of strings');
    }
    // Treat every pathspec as literal at Git's global option layer. Keeping the
    // option before `-C` and the subcommand also covers future commands and the
    // `diff --no-index` fallback without relying on command-specific placement.
    return runProcess(this.executable, ['--literal-pathspecs', ...args], {
      maxStdout: this.outputLimit,
      maxStderr: DEFAULT_ERROR_LIMIT,
      ...options
    });
  }

  async checkAvailable() {
    const result = await this.run(['--version'], { maxStdout: 1024 });
    return result.stdout.toString('utf8').trim();
  }

  async discoverRepository(candidatePath) {
    if (typeof candidatePath !== 'string' || !candidatePath || candidatePath.includes('\0')) {
      throw new TypeError('Repository folder must be a non-empty path without NUL bytes');
    }

    const selectedPath = path.resolve(candidatePath);
    const info = await fs.stat(selectedPath).catch(() => null);
    if (!info || !info.isDirectory()) throw new GitError('The selected folder does not exist.');

    const result = await this.run(['-C', selectedPath, 'rev-parse', '--show-toplevel']);
    if (result.stdoutTruncated) throw new GitError('Repository path output was unexpectedly large.');
    // `rev-parse` terminates its one output record with LF. Remove that record
    // terminator only: spaces (and any other valid path bytes before it) belong
    // to the repository name and must not be trimmed.
    const rootOutput = result.stdout.at(-1) === 0x0a
      ? result.stdout.subarray(0, -1)
      : result.stdout;
    const reportedRoot = rootOutput.toString('utf8');
    if (!reportedRoot) throw new GitError('Git did not report a repository root.');
    return fs.realpath(reportedRoot);
  }

  async status(repositoryRoot) {
    const result = await this.run([
      '-C', repositoryRoot,
      'status', '--porcelain=v2', '-z', '--branch', '--untracked-files=all'
    ]);
    if (result.stdoutTruncated) {
      throw new GitError('This repository has too many changed paths to display safely.', {
        code: 'OUTPUT_LIMIT',
        truncated: true
      });
    }
    return parseStatus(result.stdout);
  }

  async diff(repositoryRoot, relativePath, staged = false) {
    validateRelativePath(repositoryRoot, relativePath);
    const args = ['-C', repositoryRoot, 'diff'];
    if (staged) args.push('--cached');
    args.push('--no-ext-diff', '--', relativePath);
    let result = await this.run(args, { maxStdout: this.diffLimit });

    if (!staged && result.stdout.length === 0) {
      const status = await this.status(repositoryRoot);
      if (status.unstaged.some((file) => file.path === relativePath && file.status === '?')) {
        result = await this.run(
          ['-C', repositoryRoot, 'diff', '--no-index', '--no-ext-diff', '--', '/dev/null', relativePath],
          { maxStdout: this.diffLimit, acceptedExitCodes: [0, 1] }
        );
      }
    }

    return {
      text: result.stdout.toString('utf8'),
      truncated: result.stdoutTruncated
    };
  }

  async stage(repositoryRoot, relativePaths) {
    const paths = validateRelativePaths(repositoryRoot, relativePaths);
    await this.run(['-C', repositoryRoot, 'add', '--', ...paths]);
  }

  async hasHead(repositoryRoot) {
    const result = await this.run(
      ['-C', repositoryRoot, 'rev-parse', '--verify', 'HEAD'],
      { acceptedExitCodes: [0, 128] }
    );
    return result.exitCode === 0;
  }

  async unstage(repositoryRoot, relativePaths) {
    const paths = validateRelativePaths(repositoryRoot, relativePaths);
    if (await this.hasHead(repositoryRoot)) {
      await this.run(['-C', repositoryRoot, 'restore', '--staged', '--', ...paths]);
      return;
    }
    // With no HEAD there is nothing for `restore --staged` to restore. Removing
    // only the named index entries leaves every working-tree file untouched,
    // including files changed again after they were staged.
    await this.run(['-C', repositoryRoot, 'update-index', '--force-remove', '--', ...paths]);
  }

  async commit(repositoryRoot, message) {
    if (typeof message !== 'string' || !message.trim()) {
      throw new TypeError('Commit message must not be empty');
    }
    if (message.includes('\0')) throw new TypeError('Commit message must not contain a NUL byte');
    if (Buffer.byteLength(message, 'utf8') > 64 * 1024) {
      throw new RangeError('Commit message is too large');
    }
    await this.run(['-C', repositoryRoot, 'commit', '-m', message]);
  }

  async fetch(repositoryRoot) {
    await this.run(['-C', repositoryRoot, 'fetch', '--prune']);
  }

  async pull(repositoryRoot) {
    await this.run(['-C', repositoryRoot, 'pull', '--ff-only']);
  }

  async push(repositoryRoot) {
    await this.run(['-C', repositoryRoot, 'push']);
  }

  async branches(repositoryRoot) {
    const format = '%(refname:short)%00%(HEAD)%00%(objectname:short)%00%(upstream:short)';
    const result = await this.run([
      '-C', repositoryRoot,
      'for-each-ref', `--format=${format}`, 'refs/heads'
    ]);
    if (result.stdoutTruncated) throw new GitError('Branch output exceeded the safety limit.');
    return parseBranches(result.stdout);
  }

  async switchBranch(repositoryRoot, branchName) {
    if (typeof branchName !== 'string' || !branchName || branchName.includes('\0')) {
      throw new TypeError('Branch name must be a non-empty string without NUL bytes');
    }
    const branches = await this.branches(repositoryRoot);
    if (!branches.some((branch) => branch.name === branchName)) {
      throw new GitError('That local branch no longer exists. Refresh and try again.');
    }
    await this.run(['-C', repositoryRoot, 'switch', '--', branchName]);
  }

  async history(repositoryRoot, requestedLimit = 200) {
    const limit = Number.isSafeInteger(requestedLimit)
      ? Math.max(1, Math.min(200, requestedLimit))
      : 200;
    if (!await this.hasHead(repositoryRoot)) return [];

    const format = '%H%x00%h%x00%s%x00%an%x00%aI';
    const result = await this.run([
      '-C', repositoryRoot,
      'log', '-z', `--max-count=${limit}`, `--pretty=format:${format}`
    ]);

    if (result.stdoutTruncated) throw new GitError('History output exceeded the safety limit.');
    return parseHistory(result.stdout);
  }
}

module.exports = {
  DEFAULT_OUTPUT_LIMIT,
  DEFAULT_DIFF_LIMIT,
  GitClient,
  GitError,
  redactCredentials,
  runProcess
};
