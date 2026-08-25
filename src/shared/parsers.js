'use strict';

function asText(output) {
  if (Buffer.isBuffer(output)) return output.toString('utf8');
  return String(output ?? '');
}

function takeFields(text, count) {
  const fields = [];
  let offset = 0;

  for (let index = 0; index < count; index += 1) {
    const separator = text.indexOf(' ', offset);
    if (separator === -1) {
      throw new Error(`Malformed Git record: expected ${count} fields`);
    }
    fields.push(text.slice(offset, separator));
    offset = separator + 1;
  }

  return { fields, remainder: text.slice(offset) };
}

function fileState(path, code, originalPath, kind) {
  return {
    path,
    status: code,
    kind,
    ...(originalPath ? { originalPath } : {})
  };
}

function stateKind(code) {
  return ({
    A: 'added',
    C: 'copied',
    D: 'deleted',
    M: 'modified',
    R: 'renamed',
    T: 'type-changed',
    U: 'conflicted',
    '?': 'untracked'
  })[code] || 'changed';
}

function addTrackedState(result, path, xy, originalPath, recordKind) {
  const indexCode = xy[0] || '.';
  const worktreeCode = xy[1] || '.';

  if (indexCode !== '.') {
    result.staged.push(fileState(path, indexCode, originalPath, stateKind(indexCode)));
  }
  if (worktreeCode !== '.') {
    result.unstaged.push(fileState(path, worktreeCode, originalPath, stateKind(worktreeCode)));
  }

  if (recordKind === 'unmerged' && indexCode === '.' && worktreeCode === '.') {
    result.unstaged.push(fileState(path, 'U', originalPath, 'conflicted'));
  }
}

/**
 * Parse `git status --porcelain=v2 -z --branch` without interpreting filenames.
 * The returned paths are exactly the UTF-8 paths emitted by Git.
 */
function parseStatus(output) {
  const records = asText(output).split('\0');
  const result = {
    branch: {
      name: '',
      oid: '',
      upstream: '',
      ahead: 0,
      behind: 0,
      hasUpstream: false,
      detached: false,
      unborn: false
    },
    staged: [],
    unstaged: []
  };

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;

    if (record.startsWith('# branch.oid ')) {
      const oid = record.slice('# branch.oid '.length);
      result.branch.oid = oid;
      result.branch.unborn = oid === '(initial)';
      continue;
    }
    if (record.startsWith('# branch.head ')) {
      const head = record.slice('# branch.head '.length);
      result.branch.detached = head === '(detached)';
      result.branch.name = result.branch.detached ? 'Detached HEAD' : head;
      continue;
    }
    if (record.startsWith('# branch.upstream ')) {
      result.branch.upstream = record.slice('# branch.upstream '.length);
      result.branch.hasUpstream = true;
      continue;
    }
    if (record.startsWith('# branch.ab ')) {
      const match = /^# branch\.ab \+(\d+) -(\d+)$/.exec(record);
      if (match) {
        result.branch.ahead = Number(match[1]);
        result.branch.behind = Number(match[2]);
      }
      continue;
    }

    if (record.startsWith('1 ')) {
      const { fields, remainder: path } = takeFields(record.slice(2), 7);
      addTrackedState(result, path, fields[0], undefined, 'ordinary');
      continue;
    }
    if (record.startsWith('2 ')) {
      const { fields, remainder: path } = takeFields(record.slice(2), 8);
      const originalPath = records[index + 1] ?? '';
      index += 1;
      addTrackedState(result, path, fields[0], originalPath, 'renamed');
      continue;
    }
    if (record.startsWith('u ')) {
      const { fields, remainder: path } = takeFields(record.slice(2), 10);
      addTrackedState(result, path, fields[0], undefined, 'unmerged');
      continue;
    }
    if (record.startsWith('? ')) {
      const path = record.slice(2);
      result.unstaged.push(fileState(path, '?', undefined, 'untracked'));
    }
  }

  const byPath = (left, right) => left.path.localeCompare(right.path);
  result.staged.sort(byPath);
  result.unstaged.sort(byPath);
  return result;
}

/** Parse NUL-field, newline-record output from `git for-each-ref`. */
function parseBranches(output) {
  const text = asText(output);
  if (!text) return [];

  return text.split(/\r?\n/)
    .filter(Boolean)
    .map((record) => {
      const [name = '', head = '', hash = '', upstream = ''] = record.split('\0');
      return {
        name,
        current: head === '*',
        hash,
        upstream
      };
    })
    .filter((branch) => branch.name);
}

/** Parse five NUL-delimited fields per commit. */
function parseHistory(output) {
  const fields = asText(output).split('\0');
  const commits = [];
  let index = 0;

  while (index + 4 < fields.length) {
    if (!fields[index]) {
      index += 1;
      continue;
    }
    const [hash, shortHash, subject, author, date] = fields.slice(index, index + 5);
    commits.push({ hash, shortHash, subject, author, date });
    index += 5;
  }

  return commits;
}

module.exports = {
  parseStatus,
  parseBranches,
  parseHistory
};
