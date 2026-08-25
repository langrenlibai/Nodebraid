'use strict';

const path = require('node:path');
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { GitClient } = require('./git-client');
const { OperationGate } = require('./operation-gate');
const { SettingsStore, normalizeSettings } = require('../shared/settings-store');
const { validateSelectedExecutable } = require('../shared/path-utils');

const CHANNELS = Object.freeze({
  OPEN_REPOSITORY: 'repository:open',
  OPEN_RECENT: 'repository:open-recent',
  REFRESH: 'repository:refresh',
  RECENTS: 'repository:recents',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  SETTINGS_CHOOSE_GIT: 'settings:choose-git',
  SETTINGS_USE_SYSTEM_GIT: 'settings:use-system-git',
  DIFF: 'git:diff',
  STAGE: 'git:stage',
  UNSTAGE: 'git:unstage',
  COMMIT: 'git:commit',
  FETCH: 'git:fetch',
  PULL: 'git:pull',
  PUSH: 'git:push',
  HISTORY: 'git:history',
  BRANCHES: 'git:branches',
  SWITCH_BRANCH: 'git:switch-branch'
});

let mainWindow = null;
let settingsStore = null;
let settings = null;
let git = null;
let activeRepositoryRoot = '';
const operationGate = new OperationGate();

function ensureTrustedSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error('Untrusted IPC sender');
  }
}

function requireRepository() {
  if (!activeRepositoryRoot) throw new Error('Open a repository first.');
  return activeRepositoryRoot;
}

function requireExpectedRepository(payload) {
  const repositoryRoot = requireRepository();
  if (typeof payload?.repositoryPath !== 'string' || payload.repositoryPath !== repositoryRoot) {
    throw new Error('The active repository changed. Reload this view and try again.');
  }
  return repositoryRoot;
}

function pathsFromPayload(payload) {
  return Array.isArray(payload) ? payload : payload?.paths;
}

async function availabilityFields(client = git) {
  try {
    const gitVersion = await client.checkAvailable();
    return { gitAvailable: true, gitVersion, gitError: '' };
  } catch (error) {
    return { gitAvailable: false, gitVersion: '', gitError: error.message };
  }
}

function gitSettingsFields(gitVersion = '') {
  return {
    language: settings.language,
    gitPath: settings.gitPath,
    gitAvailable: true,
    gitVersion,
    gitError: ''
  };
}

async function verifyGitClient(client) {
  const gitVersion = await client.checkAvailable();
  if (!/^git version(?:\s|$)/iu.test(gitVersion)) {
    throw new Error('The selected program did not identify itself as Git.');
  }
  return gitVersion;
}

async function saveGitExecutable(executable) {
  const candidateGit = new GitClient({ executable });
  const gitVersion = await verifyGitClient(candidateGit);
  const saved = await settingsStore.save({ ...settings, gitPath: executable });
  settings = saved;
  git = candidateGit;
  return gitSettingsFields(gitVersion);
}

async function snapshot() {
  if (!activeRepositoryRoot) {
    return {
      repository: null,
      branch: { name: '', ahead: 0, behind: 0, hasUpstream: false },
      staged: [],
      unstaged: [],
      dirty: false,
      ...(await availabilityFields())
    };
  }

  const status = await git.status(activeRepositoryRoot);
  return {
    repository: {
      name: path.basename(activeRepositoryRoot),
      path: activeRepositoryRoot
    },
    branch: status.branch,
    staged: status.staged,
    unstaged: status.unstaged,
    dirty: status.staged.length > 0 || status.unstaged.length > 0,
    gitAvailable: true,
    gitError: ''
  };
}

async function rememberRepository(repositoryRoot) {
  settings.recentRepositories = [
    repositoryRoot,
    ...settings.recentRepositories.filter((item) => item !== repositoryRoot)
  ].slice(0, 8);
  settings = await settingsStore.save(settings);
}

async function activateRepository(selectedPath) {
  const repositoryRoot = await git.discoverRepository(selectedPath);
  activeRepositoryRoot = repositoryRoot;
  await rememberRepository(repositoryRoot);
  return snapshot();
}

async function mutate(label, operation) {
  const repositoryRoot = requireRepository();
  return operationGate.run(label, async () => {
    await operation(repositoryRoot);
    return snapshot();
  });
}

function handle(channel, handler) {
  ipcMain.handle(channel, async (event, payload) => {
    ensureTrustedSender(event);
    return handler(payload);
  });
}

function registerIpcHandlers() {
  handle(CHANNELS.OPEN_REPOSITORY, async () => {
    const selection = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Git Repository',
      properties: ['openDirectory']
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return activateRepository(selection.filePaths[0]);
  });

  handle(CHANNELS.OPEN_RECENT, async (requestedPath) => {
    if (typeof requestedPath !== 'string' || !settings.recentRepositories.includes(requestedPath)) {
      throw new Error('That folder is not in the recent repository list.');
    }
    return activateRepository(requestedPath);
  });

  handle(CHANNELS.REFRESH, () => snapshot());
  handle(CHANNELS.RECENTS, async () => settings.recentRepositories.map((repositoryPath) => ({
    path: repositoryPath,
    name: path.basename(repositoryPath)
  })));

  handle(CHANNELS.SETTINGS_GET, async () => ({
    language: settings.language,
    gitPath: settings.gitPath,
    ...(await availabilityFields())
  }));

  handle(CHANNELS.SETTINGS_SAVE, async (requestedSettings) => {
    const candidate = normalizeSettings({
      ...settings,
      language: requestedSettings?.language
    });
    settings = await settingsStore.save(candidate);
    return {
      language: settings.language,
      gitPath: settings.gitPath,
      ...(await availabilityFields())
    };
  });

  handle(CHANNELS.SETTINGS_CHOOSE_GIT, async () => {
    const selection = await dialog.showOpenDialog(mainWindow, {
      title: settings.language === 'zh-CN' ? '选择 Git 可执行文件' : 'Choose Git executable',
      properties: ['openFile'],
      filters: process.platform === 'win32'
        ? [{ name: 'Git', extensions: ['exe'] }]
        : []
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    const executable = await validateSelectedExecutable(selection.filePaths[0]);
    return saveGitExecutable(executable);
  });

  handle(CHANNELS.SETTINGS_USE_SYSTEM_GIT, () => saveGitExecutable(''));

  handle(CHANNELS.DIFF, (payload) => git.diff(
    requireRepository(),
    payload?.path,
    Boolean(payload?.staged)
  ));

  handle(CHANNELS.STAGE, (payload) => mutate('Stage files', (root) => (
    git.stage(root, pathsFromPayload(payload))
  )));

  handle(CHANNELS.UNSTAGE, (payload) => mutate('Unstage files', (root) => (
    git.unstage(root, pathsFromPayload(payload))
  )));

  handle(CHANNELS.COMMIT, (payload) => mutate('Commit', (root) => (
    git.commit(root, typeof payload === 'string' ? payload : payload?.message)
  )));

  handle(CHANNELS.FETCH, () => mutate('Fetch', (root) => git.fetch(root)));

  handle(CHANNELS.PULL, (payload) => mutate('Pull', async (root) => {
    const currentStatus = await git.status(root);
    const dirty = currentStatus.staged.length > 0 || currentStatus.unstaged.length > 0;
    if (dirty && payload?.confirmDirty !== true) {
      throw new Error('Pull can affect uncommitted work. Confirm the warning before continuing.');
    }
    await git.pull(root);
  }));

  handle(CHANNELS.PUSH, () => mutate('Push', (root) => git.push(root)));
  handle(CHANNELS.HISTORY, (payload) => git.history(requireExpectedRepository(payload), payload?.limit));
  handle(CHANNELS.BRANCHES, (payload) => git.branches(requireExpectedRepository(payload)));

  handle(CHANNELS.SWITCH_BRANCH, (payload) => mutate('Switch branch', async (root) => {
    if (typeof payload?.repositoryPath !== 'string' || payload.repositoryPath !== root) {
      throw new Error('The active repository changed. Reload the branch list and try again.');
    }
    const currentStatus = await git.status(root);
    const dirty = currentStatus.staged.length > 0 || currentStatus.unstaged.length > 0;
    if (dirty && payload?.confirmDirty !== true) {
      throw new Error('Switching branches can affect uncommitted work. Confirm the warning before continuing.');
    }
    await git.switchBranch(root, payload?.name);
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 920,
    minHeight: 620,
    show: false,
    backgroundColor: '#0B1220',
    title: 'Nodebraid',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(async () => {
  app.setName('Nodebraid');
  settingsStore = new SettingsStore(path.join(app.getPath('userData'), 'settings.json'));
  settings = await settingsStore.load();
  git = new GitClient({ executable: settings.gitPath });
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  dialog.showErrorBox('Nodebraid could not start', error.message);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports = { CHANNELS };
