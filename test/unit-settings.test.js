'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { SettingsStore, normalizeSettings } = require('../src/shared/settings-store');

test('normalizeSettings applies allowlisted preferences and caps recents', () => {
  const recents = Array.from({ length: 12 }, (_, index) => `/repo/${index}`);
  assert.deepEqual(normalizeSettings({
    language: 'zh-CN',
    gitPath: '  /opt/git  ',
    recentRepositories: [...recents, recents[0], null]
  }), {
    language: 'zh-CN',
    gitPath: '/opt/git',
    recentRepositories: recents.slice(0, 8)
  });
  assert.equal(normalizeSettings({ language: 'fr' }).language, 'en');
});

test('SettingsStore saves through a temporary file and loads the result', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-settings-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'nested', 'settings.json');
  const store = new SettingsStore(filePath);

  assert.deepEqual(await store.load(), { language: 'en', gitPath: '', recentRepositories: [] });
  await store.save({ language: 'zh-CN', gitPath: '/usr/bin/git', recentRepositories: ['/repo'] });
  assert.deepEqual(await store.load(), {
    language: 'zh-CN', gitPath: '/usr/bin/git', recentRepositories: ['/repo']
  });

  const siblings = await fs.readdir(path.dirname(filePath));
  assert.deepEqual(siblings, ['settings.json']);
});

test('SettingsStore recovers defaults from malformed JSON', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'nodebraid-settings-bad-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'settings.json');
  await fs.writeFile(filePath, '{ definitely not JSON', 'utf8');
  assert.deepEqual(await new SettingsStore(filePath).load(), {
    language: 'en', gitPath: '', recentRepositories: []
  });
});
