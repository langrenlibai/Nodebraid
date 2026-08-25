'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseStatus, parseBranches, parseHistory } = require('../src/shared/parsers');

test('parseStatus keeps NUL-delimited unusual filenames intact', () => {
  const hash = '1'.repeat(40);
  const renamedHash = '2'.repeat(40);
  const records = [
    '# branch.oid 0123456789abcdef0123456789abcdef01234567',
    '# branch.head main',
    '# branch.upstream origin/main',
    '# branch.ab +3 -2',
    `1 .M N... 100644 100644 100644 ${hash} ${hash} words -> and "quotes" 你好.txt`,
    '? --leading dash.txt',
    `2 R. N... 100644 100644 100644 ${hash} ${renamedHash} R100 new -> name.txt`,
    'old name.txt',
    ''
  ];

  const parsed = parseStatus(Buffer.from(records.join('\0')));
  assert.deepEqual(parsed.branch, {
    name: 'main',
    oid: '0123456789abcdef0123456789abcdef01234567',
    upstream: 'origin/main',
    ahead: 3,
    behind: 2,
    hasUpstream: true,
    detached: false,
    unborn: false
  });
  assert.deepEqual(parsed.unstaged.map((file) => file.path), [
    '--leading dash.txt',
    'words -> and "quotes" 你好.txt'
  ]);
  assert.deepEqual(parsed.staged, [{
    path: 'new -> name.txt',
    status: 'R',
    kind: 'renamed',
    originalPath: 'old name.txt'
  }]);
});

test('parseStatus reports unborn and detached branch states', () => {
  const unborn = parseStatus('# branch.oid (initial)\0# branch.head topic\0');
  assert.equal(unborn.branch.unborn, true);
  assert.equal(unborn.branch.name, 'topic');

  const detached = parseStatus(`# branch.oid ${'a'.repeat(40)}\0# branch.head (detached)\0`);
  assert.equal(detached.branch.detached, true);
  assert.equal(detached.branch.name, 'Detached HEAD');
});

test('parseBranches reads explicit NUL fields', () => {
  const output = [
    'feature\0 \0abc1234\0',
    'main\0*\0def5678\0origin/main',
    ''
  ].join('\n');
  assert.deepEqual(parseBranches(output), [
    { name: 'feature', current: false, hash: 'abc1234', upstream: '' },
    { name: 'main', current: true, hash: 'def5678', upstream: 'origin/main' }
  ]);
});

test('parseHistory reads five NUL-delimited fields per commit', () => {
  const output = [
    'a'.repeat(40), 'aaaaaaa', 'First subject', 'Ada', '2026-08-25T10:00:00+08:00',
    'b'.repeat(40), 'bbbbbbb', '第二次提交', '李雷', '2026-08-25T11:00:00+08:00',
    ''
  ].join('\0');
  assert.deepEqual(parseHistory(output), [
    {
      hash: 'a'.repeat(40), shortHash: 'aaaaaaa', subject: 'First subject',
      author: 'Ada', date: '2026-08-25T10:00:00+08:00'
    },
    {
      hash: 'b'.repeat(40), shortHash: 'bbbbbbb', subject: '第二次提交',
      author: '李雷', date: '2026-08-25T11:00:00+08:00'
    }
  ]);
});
