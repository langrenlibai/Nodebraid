'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

const api = Object.freeze({
  openRepository: () => invoke('repository:open'),
  openRecent: (repositoryPath) => invoke('repository:open-recent', repositoryPath),
  refresh: () => invoke('repository:refresh'),
  getRecentRepositories: () => invoke('repository:recents'),
  getSettings: () => invoke('settings:get'),
  saveSettings: (settings) => invoke('settings:save', settings),
  chooseGitExecutable: () => invoke('settings:choose-git'),
  useSystemGit: () => invoke('settings:use-system-git'),
  getDiff: (request) => invoke('git:diff', request),
  stage: (request) => invoke('git:stage', request),
  unstage: (request) => invoke('git:unstage', request),
  commit: (request) => invoke('git:commit', request),
  fetch: () => invoke('git:fetch'),
  pull: (request = {}) => invoke('git:pull', request),
  push: () => invoke('git:push'),
  getHistory: (request = { limit: 200 }) => invoke('git:history', request),
  getBranches: (request) => invoke('git:branches', request),
  switchBranch: (request) => invoke('git:switch-branch', request)
});

contextBridge.exposeInMainWorld('nodebraid', api);
