'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

async function createGate() {
  const source = await fs.readFile(
    path.join(__dirname, '..', 'src', 'renderer', 'request-guard.js'),
    'utf8'
  );
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: 'request-guard.js' });
  return sandbox.window.NodebraidRequestGuard.createRepositoryRequestGate();
}

test('repository request tokens become stale after switching repositories', async () => {
  const gate = await createGate();
  gate.advance('/repository/one');
  const oldRepositoryRequest = gate.capture();
  assert.equal(gate.isCurrent(oldRepositoryRequest), true);

  gate.advance('/repository/two');
  assert.equal(gate.isCurrent(oldRepositoryRequest), false);
  assert.equal(gate.capture().repositoryIdentity, '/repository/two');
});

test('repository request tokens also become stale after a same-repository refresh', async () => {
  const gate = await createGate();
  gate.advance('/repository/one');
  const oldBranchList = gate.capture();
  gate.advance('/repository/one');

  assert.equal(gate.isCurrent(oldBranchList), false);
  assert.equal(gate.isCurrent(gate.capture()), true);
});
