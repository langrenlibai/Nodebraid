'use strict';

const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');

function rejectUnsafeText(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  if (value.includes('\0')) {
    throw new TypeError(`${label} must not contain a NUL byte`);
  }
}

function comparable(value) {
  return process.platform === 'win32' ? value.toLowerCase() : value;
}

function validateRelativePath(repositoryRoot, relativePath) {
  rejectUnsafeText(repositoryRoot, 'Repository root');
  rejectUnsafeText(relativePath, 'Repository-relative path');

  if (!path.isAbsolute(repositoryRoot)) {
    throw new TypeError('Repository root must be absolute');
  }
  if (path.isAbsolute(relativePath)) {
    throw new TypeError('Repository-relative path must not be absolute');
  }

  const root = path.resolve(repositoryRoot);
  const resolved = path.resolve(root, relativePath);
  const rootPrefix = `${comparable(root)}${path.sep}`;
  const candidate = comparable(resolved);

  if (candidate === comparable(root) || !candidate.startsWith(rootPrefix)) {
    throw new RangeError('Path is outside the active repository');
  }

  return relativePath;
}

function validateRelativePaths(repositoryRoot, relativePaths) {
  if (!Array.isArray(relativePaths) || relativePaths.length === 0) {
    throw new TypeError('At least one repository-relative path is required');
  }
  if (relativePaths.length > 1000) {
    throw new RangeError('Too many paths in one operation');
  }
  return [...new Set(relativePaths.map((item) => validateRelativePath(repositoryRoot, item)))];
}

function validateExecutablePath(value) {
  if (typeof value !== 'string') throw new TypeError('Git executable path must be a string');
  if (value.includes('\0')) throw new TypeError('Git executable path must not contain a NUL byte');
  return value.trim();
}

async function validateSelectedExecutable(selectedPath, options = {}) {
  const platform = options.platform || process.platform;
  const fileSystem = options.fileSystem || fsPromises;
  const candidate = validateExecutablePath(selectedPath);

  if (!candidate || !path.isAbsolute(candidate)) {
    throw new TypeError('Selected Git executable path must be absolute');
  }

  let resolved;
  try {
    resolved = await fileSystem.realpath(candidate);
  } catch (_error) {
    throw new TypeError('The selected Git executable does not exist.');
  }

  const info = await fileSystem.stat(resolved).catch(() => null);
  if (!info || !info.isFile()) {
    throw new TypeError('The selected Git executable must be a regular file.');
  }

  if (platform === 'win32') {
    if (!/\.(?:exe|com)$/iu.test(resolved)) {
      throw new TypeError('Select git.exe or another native Windows executable.');
    }
  } else {
    try {
      await fileSystem.access(resolved, fs.constants.X_OK);
    } catch (_error) {
      throw new TypeError('The selected Git executable is not executable.');
    }
  }

  return resolved;
}

module.exports = {
  validateRelativePath,
  validateRelativePaths,
  validateExecutablePath,
  validateSelectedExecutable
};
