'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

async function source(relativePath) {
  return fs.readFile(path.join(projectRoot, relativePath), 'utf8');
}

test('Git process execution never enables a shell', async () => {
  const gitClient = await source('src/main/git-client.js');
  assert.doesNotMatch(gitClient, /shell\s*:\s*true/);
  assert.match(gitClient, /shell\s*:\s*false/);
  assert.doesNotMatch(gitClient, /exec\s*\(/);
});

test('BrowserWindow isolates and sandboxes the renderer', async () => {
  const main = await source('src/main/index.js');
  assert.match(main, /contextIsolation\s*:\s*true/);
  assert.match(main, /nodeIntegration\s*:\s*false/);
  assert.match(main, /sandbox\s*:\s*true/);
  assert.match(main, /setWindowOpenHandler/);
});

test('renderer cannot import Node or access raw Electron IPC', async () => {
  const renderer = [
    await source('src/renderer/index.html'),
    await source('src/renderer/app.js')
  ].join('\n');
  assert.doesNotMatch(renderer, /\brequire\s*\(/);
  assert.doesNotMatch(renderer, /\bipcRenderer\b/);
  assert.doesNotMatch(renderer, /\bprocess\.(?:env|versions|platform)\b/);
  assert.match(renderer, /Content-Security-Policy/);
});

test('preload exposes only fixed methods and fixed channel strings', async () => {
  const preload = await source('src/preload/index.js');
  assert.match(preload, /contextBridge\.exposeInMainWorld\('nodebraid'/);
  assert.doesNotMatch(preload, /invoke:\s*invoke/);
  assert.doesNotMatch(preload, /send\s*:/);
  assert.doesNotMatch(preload, /on\s*:/);
  assert.match(preload, /chooseGitExecutable:\s*\(\)\s*=>\s*invoke\('settings:choose-git'\)/);
  assert.match(preload, /useSystemGit:\s*\(\)\s*=>\s*invoke\('settings:use-system-git'\)/);
});

test('Git executable settings use a native picker and settings save cannot supply a path', async () => {
  const main = await source('src/main/index.js');
  const saveStart = main.indexOf('handle(CHANNELS.SETTINGS_SAVE');
  const pickerStart = main.indexOf('handle(CHANNELS.SETTINGS_CHOOSE_GIT');
  const saveHandler = main.slice(saveStart, pickerStart);

  assert.doesNotMatch(saveHandler, /requestedSettings\?\.gitPath/);
  assert.match(main, /properties:\s*\['openFile'\]/);
  assert.match(main, /validateSelectedExecutable\(selection\.filePaths\[0\]\)/);
  assert.match(main, /\^git version/);
  assert.match(main, /settingsStore\.save\(\{ \.\.\.settings, gitPath: executable \}\)/);
});

test('history and branch UI requests are bound to a repository generation', async () => {
  const html = await source('src/renderer/index.html');
  const renderer = await source('src/renderer/app.js');
  assert.ok(html.indexOf('./request-guard.js') < html.indexOf('./app.js'));
  assert.match(renderer, /repositoryRequests\.capture\(\)/);
  assert.match(renderer, /repositoryRequests\.isCurrent\(requestToken\)/);
  assert.match(renderer, /repositoryPath:\s*branchListToken\.repositoryIdentity/);
  assert.match(renderer, /repositoryPath:\s*requestToken\.repositoryIdentity/);
});

test('project intentionally contains no public-source license file', async () => {
  const entries = await fs.readdir(projectRoot);
  assert.equal(entries.some((entry) => /^licen[cs]e(?:\.|$)/i.test(entry)), false);
});
