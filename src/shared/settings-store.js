'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_SETTINGS = Object.freeze({
  language: 'en',
  gitPath: '',
  recentRepositories: []
});

function normalizeSettings(value = {}) {
  const language = value.language === 'zh-CN' ? 'zh-CN' : 'en';
  const gitPath = typeof value.gitPath === 'string' && !value.gitPath.includes('\0')
    ? value.gitPath.trim()
    : '';
  const recentRepositories = Array.isArray(value.recentRepositories)
    ? [...new Set(value.recentRepositories
      .filter((item) => typeof item === 'string' && item && !item.includes('\0')))]
      .slice(0, 8)
    : [];

  return { language, gitPath, recentRepositories };
}

class SettingsStore {
  constructor(filePath) {
    if (!path.isAbsolute(filePath)) throw new TypeError('Settings path must be absolute');
    this.filePath = filePath;
  }

  async load() {
    try {
      const contents = await fs.readFile(this.filePath, 'utf8');
      return normalizeSettings(JSON.parse(contents));
    } catch (error) {
      if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        return { ...DEFAULT_SETTINGS, recentRepositories: [] };
      }
      throw error;
    }
  }

  async save(settings) {
    const normalized = normalizeSettings(settings);
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const contents = `${JSON.stringify(normalized, null, 2)}\n`;

    try {
      await fs.writeFile(temporaryPath, contents, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(temporaryPath, this.filePath);
    } catch (error) {
      await fs.rm(temporaryPath, { force: true }).catch(() => {});
      throw error;
    }

    return normalized;
  }
}

module.exports = {
  DEFAULT_SETTINGS,
  normalizeSettings,
  SettingsStore
};
