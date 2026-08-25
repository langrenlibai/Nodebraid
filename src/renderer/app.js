(() => {
  "use strict";

  const api = window.nodebraid;
  const CANCELLED = Symbol("cancelled");
  const repositoryRequests = window.NodebraidRequestGuard.createRepositoryRequestGate();

  const messages = {
    en: {
      tagline: "Every change, clearly connected.",
      repository: "Repository",
      noRepository: "No repository open",
      openRepository: "Open repository",
      recentRepositories: "Recent repositories",
      refresh: "Refresh",
      settings: "Settings",
      gitUnavailableTitle: "Git is not available",
      gitUnavailableBody: "Install Git or set its executable path in Settings, then try again.",
      openSettings: "Open settings",
      changes: "Changes",
      history: "History",
      branches: "Branches",
      noUpstream: "No upstream",
      upToDate: "Up to date with upstream",
      aheadOnly: "{count} ahead",
      behindOnly: "{count} behind",
      aheadBehind: "{ahead} ahead · {behind} behind",
      fetch: "Fetch",
      pull: "Pull",
      push: "Push",
      unstaged: "Unstaged",
      unstagedHint: "Changes outside the next commit",
      staged: "Staged",
      stagedHint: "Changes included in the next commit",
      selectAll: "Select all",
      clearSelection: "Clear",
      stageSelected: "Stage selected",
      unstageSelected: "Unstage selected",
      noUnstaged: "No unstaged changes",
      noStaged: "Stage files to prepare a commit",
      nextCheckpoint: "Next checkpoint",
      commitChanges: "Commit changes",
      commitMessage: "Commit message",
      commitPlaceholder: "Describe this checkpoint",
      commitLocalHint: "A commit stays local until you push it.",
      commit: "Commit",
      filesStaged: "{count} staged",
      diffPreview: "Diff preview",
      chooseFile: "Choose a file",
      chooseFileHint: "Select a filename to inspect exactly what changed.",
      loadingDiff: "Loading diff…",
      diffTruncated: "This preview was shortened to keep Nodebraid responsive.",
      noTextDiff: "No text diff is available for this file.",
      diffFailed: "Could not load this diff: {message}",
      unstagedDiff: "Unstaged diff",
      stagedDiff: "Staged diff",
      renamedFrom: "Previously: {path}",
      repositoryTimeline: "Repository timeline",
      recentHistory: "Recent history",
      historyHint: "The newest 200 commits, shown in local time.",
      filterHistory: "Filter history",
      loadingHistory: "Loading history…",
      noHistory: "No commits yet",
      noFilteredHistory: "No matching commits",
      noHistoryHint: "Your first commit will begin this timeline.",
      noFilteredHistoryHint: "Try a different subject, author, or hash.",
      commitHash: "Commit",
      summary: "Summary",
      author: "Author",
      date: "Date",
      localBranches: "Local branches",
      branchesHint: "Move between local lines of work without rewriting history.",
      currentlyOn: "Currently on",
      loadingBranches: "Loading branches…",
      noBranches: "No local branches found",
      noBranchesHint: "Refresh after creating a branch with Git.",
      current: "Current",
      currentBranch: "Current branch",
      localBranch: "Local branch",
      switch: "Switch",
      startHere: "Start here",
      welcomeTitle: "See how every change connects",
      welcomeBody: "Open an existing Git repository to review changes, prepare a commit, and stay in sync.",
      gitRequired: "Git must already be installed on this computer.",
      status: "Status",
      ready: "Ready",
      lastResult: "Last result",
      nothingYet: "Nothing yet",
      privacyNote: "No telemetry · credentials stay with system Git",
      preferences: "Preferences",
      language: "Language",
      gitExecutable: "Git executable",
      gitPathHint: "Choose through the system file picker, or use Git from your system PATH.",
      chooseGitExecutable: "Choose Git…",
      useSystemGit: "Use system Git",
      systemGit: "System Git (PATH)",
      credentialsHint: "Nodebraid does not store hosting passwords or tokens. Authentication stays with system Git, your credential helper, or SSH.",
      cancel: "Cancel",
      saveSettings: "Save settings",
      close: "Close",
      pullWarningTitle: "Pull with local changes?",
      pullWarningBody: "This worktree has uncommitted changes. Nodebraid will only attempt a fast-forward pull, and Git may refuse if files overlap. Review your changes before continuing.",
      continuePull: "Continue pull",
      switchWarningTitle: "Switch with local changes?",
      switchWarningBody: "This worktree has uncommitted changes. Switching to “{branch}” can be refused if those changes do not carry over safely.",
      continueSwitch: "Switch branch",
      keepWorking: "Keep working here",
      openingRepository: "Opening repository…",
      repositoryOpened: "Repository opened",
      openingRecent: "Opening recent repository…",
      refreshingRepository: "Refreshing repository…",
      repositoryRefreshed: "Repository refreshed",
      stagingFiles: "Staging {count} file(s)…",
      filesStagedSuccess: "Selected files staged",
      unstagingFiles: "Unstaging {count} file(s)…",
      filesUnstagedSuccess: "Selected files unstaged",
      creatingCommit: "Creating local commit…",
      commitCreated: "Local commit created",
      fetchingRemote: "Fetching remote updates…",
      fetchComplete: "Fetch complete",
      pullingRemote: "Pulling with fast-forward only…",
      pullComplete: "Pull complete",
      pushingRemote: "Pushing to upstream…",
      pushComplete: "Push complete",
      switchingBranch: "Switching to {branch}…",
      branchSwitched: "Switched to {branch}",
      savingSettings: "Saving settings…",
      settingsSaved: "Settings saved",
      choosingGit: "Checking the selected Git executable…",
      gitExecutableSaved: "Git executable selected",
      restoringSystemGit: "Checking Git from the system PATH…",
      systemGitRestored: "Now using system Git",
      operationFailed: "Operation failed: {message}",
      integrationUnavailable: "The secure Nodebraid bridge is unavailable. Restart the application.",
      repositoryRequired: "Open a repository first.",
      loadHistoryFailed: "Could not load history: {message}",
      loadBranchesFailed: "Could not load branches: {message}",
      fileSelected: "Select {path}",
      fileDiff: "Show diff for {path}",
    },
    "zh-CN": {
      tagline: "让每一次改动，清晰相连。",
      repository: "仓库",
      noRepository: "尚未打开仓库",
      openRepository: "打开仓库",
      recentRepositories: "最近的仓库",
      refresh: "刷新",
      settings: "设置",
      gitUnavailableTitle: "Git 不可用",
      gitUnavailableBody: "请安装 Git，或在“设置”中指定 Git 可执行文件路径，然后重试。",
      openSettings: "打开设置",
      changes: "更改",
      history: "历史",
      branches: "分支",
      noUpstream: "未配置上游",
      upToDate: "已与上游同步",
      aheadOnly: "领先 {count}",
      behindOnly: "落后 {count}",
      aheadBehind: "领先 {ahead} · 落后 {behind}",
      fetch: "获取",
      pull: "拉取",
      push: "推送",
      unstaged: "未暂存",
      unstagedHint: "不会进入下一次提交的更改",
      staged: "已暂存",
      stagedHint: "将进入下一次提交的更改",
      selectAll: "全选",
      clearSelection: "清除",
      stageSelected: "暂存所选",
      unstageSelected: "取消暂存",
      noUnstaged: "没有未暂存的更改",
      noStaged: "请暂存文件以准备提交",
      nextCheckpoint: "下一个检查点",
      commitChanges: "提交更改",
      commitMessage: "提交说明",
      commitPlaceholder: "描述这个检查点",
      commitLocalHint: "提交只保存在本地，推送后才会影响远程。",
      commit: "提交",
      filesStaged: "已暂存 {count} 个",
      diffPreview: "差异预览",
      chooseFile: "选择文件",
      chooseFileHint: "选择文件名，查看具体发生了哪些更改。",
      loadingDiff: "正在加载差异…",
      diffTruncated: "为保持 Nodebraid 流畅，此预览已被截短。",
      noTextDiff: "此文件没有可显示的文本差异。",
      diffFailed: "无法加载此差异：{message}",
      unstagedDiff: "未暂存差异",
      stagedDiff: "已暂存差异",
      renamedFrom: "原路径：{path}",
      repositoryTimeline: "仓库时间线",
      recentHistory: "近期历史",
      historyHint: "按本地时间显示最新的 200 次提交。",
      filterHistory: "筛选历史",
      loadingHistory: "正在加载历史…",
      noHistory: "还没有提交",
      noFilteredHistory: "没有匹配的提交",
      noHistoryHint: "第一次提交会开启这条时间线。",
      noFilteredHistoryHint: "请尝试其他主题、作者或哈希。",
      commitHash: "提交",
      summary: "摘要",
      author: "作者",
      date: "日期",
      localBranches: "本地分支",
      branchesHint: "在不同的本地工作线之间切换，不重写历史。",
      currentlyOn: "当前位于",
      loadingBranches: "正在加载分支…",
      noBranches: "未找到本地分支",
      noBranchesHint: "使用 Git 创建分支后请刷新。",
      current: "当前",
      currentBranch: "当前分支",
      localBranch: "本地分支",
      switch: "切换",
      startHere: "从这里开始",
      welcomeTitle: "看清每一次改动如何相连",
      welcomeBody: "打开现有 Git 仓库，检查更改、准备提交并与远程保持同步。",
      gitRequired: "此电脑上必须已安装 Git。",
      status: "状态",
      ready: "就绪",
      lastResult: "上次结果",
      nothingYet: "暂无",
      privacyNote: "无遥测 · 凭据由系统 Git 管理",
      preferences: "偏好设置",
      language: "语言",
      gitExecutable: "Git 可执行文件",
      gitPathHint: "请通过系统文件选择器指定，或使用系统 PATH 中的 Git。",
      chooseGitExecutable: "选择 Git…",
      useSystemGit: "使用系统 Git",
      systemGit: "系统 Git（PATH）",
      credentialsHint: "Nodebraid 不会保存代码托管密码或令牌。身份验证由系统 Git、凭据助手或 SSH 负责。",
      cancel: "取消",
      saveSettings: "保存设置",
      close: "关闭",
      pullWarningTitle: "带着本地更改拉取？",
      pullWarningBody: "当前工作树有未提交的更改。Nodebraid 只会尝试快进拉取；若文件重叠，Git 可能拒绝操作。继续前请检查你的更改。",
      continuePull: "继续拉取",
      switchWarningTitle: "带着本地更改切换？",
      switchWarningBody: "当前工作树有未提交的更改。如果这些更改无法安全带到“{branch}”，Git 会拒绝切换。",
      continueSwitch: "切换分支",
      keepWorking: "留在当前分支",
      openingRepository: "正在打开仓库…",
      repositoryOpened: "仓库已打开",
      openingRecent: "正在打开最近的仓库…",
      refreshingRepository: "正在刷新仓库…",
      repositoryRefreshed: "仓库已刷新",
      stagingFiles: "正在暂存 {count} 个文件…",
      filesStagedSuccess: "所选文件已暂存",
      unstagingFiles: "正在取消暂存 {count} 个文件…",
      filesUnstagedSuccess: "所选文件已取消暂存",
      creatingCommit: "正在创建本地提交…",
      commitCreated: "本地提交已创建",
      fetchingRemote: "正在获取远程更新…",
      fetchComplete: "获取完成",
      pullingRemote: "正在以仅快进方式拉取…",
      pullComplete: "拉取完成",
      pushingRemote: "正在推送到上游…",
      pushComplete: "推送完成",
      switchingBranch: "正在切换到 {branch}…",
      branchSwitched: "已切换到 {branch}",
      savingSettings: "正在保存设置…",
      settingsSaved: "设置已保存",
      choosingGit: "正在检查所选 Git 可执行文件…",
      gitExecutableSaved: "已选择 Git 可执行文件",
      restoringSystemGit: "正在检查系统 PATH 中的 Git…",
      systemGitRestored: "已恢复使用系统 Git",
      operationFailed: "操作失败：{message}",
      integrationUnavailable: "安全的 Nodebraid 桥接不可用。请重启应用。",
      repositoryRequired: "请先打开仓库。",
      loadHistoryFailed: "无法加载历史：{message}",
      loadBranchesFailed: "无法加载分支：{message}",
      fileSelected: "选择 {path}",
      fileDiff: "显示 {path} 的差异",
    },
  };

  const state = {
    locale: "en",
    settings: {
      language: "en",
      gitPath: "",
      gitAvailable: true,
      gitError: "",
    },
    snapshot: null,
    recents: [],
    activeView: "changes",
    selected: {
      unstaged: new Set(),
      staged: new Set(),
    },
    activeFile: null,
    diff: null,
    diffLoading: false,
    diffRequest: 0,
    history: null,
    historyLoading: false,
    branches: null,
    branchesLoading: false,
    busy: false,
    operation: { kind: "idle", key: "ready", vars: {} },
    lastResult: { key: "nothingYet", vars: {} },
    confirmResolve: null,
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    const ids = [
      "repository-name",
      "repository-path",
      "branch-chip",
      "open-repository",
      "welcome-open-repository",
      "recent-repositories",
      "refresh-repository",
      "open-settings",
      "git-warning",
      "git-warning-message",
      "git-warning-settings",
      "changes-count",
      "sync-summary",
      "fetch-action",
      "pull-action",
      "push-action",
      "view-changes",
      "view-history",
      "view-branches",
      "no-repository",
      "unstaged-files",
      "staged-files",
      "unstaged-empty",
      "staged-empty",
      "unstaged-count",
      "staged-count",
      "select-all-unstaged",
      "select-all-staged",
      "stage-selected",
      "unstage-selected",
      "commit-staged-count",
      "commit-message",
      "commit-action",
      "diff-context",
      "diff-heading",
      "diff-original-path",
      "diff-file-status",
      "diff-empty",
      "diff-loading",
      "diff-truncated",
      "diff-lines",
      "history-filter",
      "history-loading",
      "history-empty",
      "history-table-wrap",
      "history-rows",
      "branches-loading",
      "branches-empty",
      "branch-list",
      "current-branch-summary",
      "current-branch-name",
      "operation-indicator",
      "operation-message",
      "last-result-message",
      "settings-dialog",
      "settings-form",
      "close-settings",
      "cancel-settings",
      "save-settings",
      "language-setting",
      "git-path-setting",
      "choose-git-executable",
      "use-system-git",
      "confirm-dialog",
      "confirm-title",
      "confirm-message",
      "confirm-cancel",
      "confirm-accept",
    ];

    for (const id of ids) {
      elements[toCamelCase(id)] = byId(id);
    }

    elements.tabs = Array.from(document.querySelectorAll("[data-view]"));
    elements.panels = Array.from(document.querySelectorAll("[data-view-panel]"));
  }

  function toCamelCase(value) {
    return value.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
  }

  function normalizeLocale(value) {
    return value === "zh-CN" || value === "zh" ? "zh-CN" : "en";
  }

  function t(key, vars = {}) {
    const dictionary = messages[state.locale] || messages.en;
    const template = dictionary[key] ?? messages.en[key] ?? key;
    return String(template).replace(/\{([a-zA-Z]+)\}/g, (_match, name) => {
      return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`;
    });
  }

  function applyLanguage() {
    document.documentElement.lang = state.locale;
    document.title = "Nodebraid";

    for (const element of document.querySelectorAll("[data-i18n]")) {
      element.textContent = t(element.dataset.i18n);
    }

    for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    }

    for (const element of document.querySelectorAll("[data-tooltip-key]")) {
      element.setAttribute("aria-label", t(element.dataset.tooltipKey));
    }

    elements.recentRepositories.setAttribute("aria-label", t("recentRepositories"));
    elements.closeSettings.setAttribute("aria-label", t("close"));
    renderAll();
  }

  function repositoryIsOpen() {
    return Boolean(state.snapshot?.repository?.path);
  }

  function normalizeFile(file) {
    const source = file && typeof file === "object" ? file : { path: file };
    const path = String(source.path ?? source.newPath ?? source.name ?? "");
    const originalPath = source.originalPath == null ? "" : String(source.originalPath);
    const status = String(source.status ?? source.kind ?? "modified");
    const kind = normalizeFileKind(source.kind ?? source.status);
    return { ...source, path, originalPath, status, kind };
  }

  function normalizeFileKind(value) {
    const text = String(value ?? "modified").toLowerCase();
    if (text.includes("untrack") || text === "?" || text === "??") return "untracked";
    if (text.includes("add") || text === "a") return "added";
    if (text.includes("delete") || text === "d") return "deleted";
    if (text.includes("rename") || text === "r") return "renamed";
    if (text.includes("copy") || text === "c") return "copied";
    if (text.includes("conflict") || text === "u") return "conflicted";
    return "modified";
  }

  function normalizeBranch(branch) {
    if (!branch) {
      return { name: "", ahead: 0, behind: 0, hasUpstream: false };
    }
    if (typeof branch === "string") {
      return { name: branch, ahead: 0, behind: 0, hasUpstream: false };
    }
    return {
      ...branch,
      name: String(branch.name ?? branch.current ?? ""),
      ahead: finiteCount(branch.ahead),
      behind: finiteCount(branch.behind),
      hasUpstream: Boolean(branch.hasUpstream ?? branch.upstream),
    };
  }

  function finiteCount(value) {
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  }

  function acceptSnapshot(snapshot) {
    if (!snapshot || !snapshot.repository || !snapshot.repository.path) {
      repositoryRequests.advance("");
      state.diffRequest += 1;
      state.diffLoading = false;
      state.snapshot = null;
      state.activeFile = null;
      state.diff = null;
      state.selected.unstaged.clear();
      state.selected.staged.clear();
      state.history = null;
      state.historyLoading = false;
      state.branches = null;
      state.branchesLoading = false;
      renderAll();
      return;
    }

    const previousPath = state.snapshot?.repository?.path;
    const nextPath = String(snapshot.repository.path);
    repositoryRequests.advance(nextPath);
    state.diffRequest += 1;
    state.diffLoading = false;
    state.historyLoading = false;
    state.branchesLoading = false;
    const repositoryChanged = previousPath !== nextPath;
    const unstaged = Array.isArray(snapshot.unstaged) ? snapshot.unstaged.map(normalizeFile) : [];
    const staged = Array.isArray(snapshot.staged) ? snapshot.staged.map(normalizeFile) : [];

    state.snapshot = {
      ...snapshot,
      repository: {
        ...snapshot.repository,
        name: String(snapshot.repository.name ?? baseName(nextPath) ?? nextPath),
        path: nextPath,
      },
      branch: normalizeBranch(snapshot.branch),
      unstaged,
      staged,
      dirty: Boolean(snapshot.dirty ?? (unstaged.length > 0 || staged.length > 0)),
    };

    if (typeof snapshot.gitAvailable === "boolean") {
      state.settings.gitAvailable = snapshot.gitAvailable;
      if (snapshot.gitAvailable) state.settings.gitError = "";
    }
    if (snapshot.gitError || (snapshot.gitAvailable === false && snapshot.error)) {
      state.settings.gitError = String(snapshot.gitError ?? snapshot.error);
    }

    if (repositoryChanged) {
      state.selected.unstaged.clear();
      state.selected.staged.clear();
      state.activeFile = null;
      elements.historyFilter.value = "";
    } else {
      retainExistingSelections("unstaged", unstaged);
      retainExistingSelections("staged", staged);
    }

    state.history = null;
    state.branches = null;
    ensureActiveFile();
    renderAll();
    if (state.activeFile) void loadDiff(state.activeFile);
  }

  function retainExistingSelections(group, files) {
    const available = new Set(files.map((file) => file.path));
    state.selected[group] = new Set(Array.from(state.selected[group]).filter((path) => available.has(path)));
  }

  function ensureActiveFile() {
    if (!repositoryIsOpen()) {
      state.activeFile = null;
      return;
    }

    if (state.activeFile) {
      const collection = state.activeFile.staged ? state.snapshot.staged : state.snapshot.unstaged;
      const existing = collection.find((file) => file.path === state.activeFile.path);
      if (existing) {
        state.activeFile = { ...existing, staged: state.activeFile.staged };
        return;
      }
    }

    const firstUnstaged = state.snapshot.unstaged[0];
    const firstStaged = state.snapshot.staged[0];
    state.activeFile = firstUnstaged
      ? { ...firstUnstaged, staged: false }
      : firstStaged
        ? { ...firstStaged, staged: true }
        : null;
    state.diff = null;
  }

  function renderAll() {
    if (!Object.keys(elements).length) return;
    renderRepositoryHeader();
    renderGitWarning();
    renderRecents();
    renderViews();
    renderChanges();
    renderHistory();
    renderBranches();
    renderStatus();
    renderControls();
  }

  function renderRepositoryHeader() {
    const repository = state.snapshot?.repository;
    const branch = state.snapshot?.branch;
    if (repository) {
      elements.repositoryName.textContent = repository.name;
      elements.repositoryPath.textContent = repository.path;
      elements.repositoryPath.title = repository.path;
      if (branch?.name) {
        elements.branchChip.textContent = branch.name;
        elements.branchChip.title = branch.name;
        elements.branchChip.classList.remove("is-hidden");
      } else {
        elements.branchChip.classList.add("is-hidden");
      }
    } else {
      elements.repositoryName.textContent = t("noRepository");
      elements.repositoryPath.textContent = "";
      elements.repositoryPath.removeAttribute("title");
      elements.branchChip.classList.add("is-hidden");
    }

    renderSyncSummary();
  }

  function renderSyncSummary() {
    const branch = state.snapshot?.branch;
    elements.syncSummary.classList.toggle("has-upstream", Boolean(branch?.hasUpstream));
    const label = elements.syncSummary.lastElementChild;

    if (!branch?.hasUpstream) {
      label.textContent = t("noUpstream");
      return;
    }

    if (branch.ahead && branch.behind) {
      label.textContent = t("aheadBehind", { ahead: branch.ahead, behind: branch.behind });
    } else if (branch.ahead) {
      label.textContent = t("aheadOnly", { count: branch.ahead });
    } else if (branch.behind) {
      label.textContent = t("behindOnly", { count: branch.behind });
    } else {
      label.textContent = t("upToDate");
    }
  }

  function renderGitWarning() {
    const unavailable = state.settings.gitAvailable === false;
    elements.gitWarning.classList.toggle("is-hidden", !unavailable);
    elements.gitWarningMessage.textContent = state.settings.gitError || t("gitUnavailableBody");
  }

  function renderRecents() {
    const select = elements.recentRepositories;
    const current = select.value;
    select.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = t("recentRepositories");
    select.append(placeholder);

    for (const recent of state.recents) {
      const option = document.createElement("option");
      option.value = recent.path;
      option.textContent = recent.name ? `${recent.name} — ${recent.path}` : recent.path;
      option.title = recent.path;
      select.append(option);
    }

    select.value = Array.from(select.options).some((option) => option.value === current) ? current : "";
  }

  function renderViews() {
    const hasRepository = repositoryIsOpen();
    elements.noRepository.classList.toggle("is-hidden", hasRepository);

    for (const panel of elements.panels) {
      panel.classList.toggle("is-hidden", !hasRepository || panel.dataset.viewPanel !== state.activeView);
    }

    for (const tab of elements.tabs) {
      const active = tab.dataset.view === state.activeView;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    }
  }

  function renderChanges() {
    const unstaged = state.snapshot?.unstaged ?? [];
    const staged = state.snapshot?.staged ?? [];
    const total = unstaged.length + staged.length;

    elements.changesCount.textContent = String(total);
    elements.unstagedCount.textContent = String(unstaged.length);
    elements.stagedCount.textContent = String(staged.length);
    elements.commitStagedCount.textContent = t("filesStaged", { count: staged.length });

    renderFileGroup("unstaged", unstaged, elements.unstagedFiles, elements.unstagedEmpty, elements.selectAllUnstaged);
    renderFileGroup("staged", staged, elements.stagedFiles, elements.stagedEmpty, elements.selectAllStaged);
    renderDiff();
  }

  function renderFileGroup(group, files, list, empty, selectAllButton) {
    list.replaceChildren();
    empty.classList.toggle("is-hidden", files.length > 0);
    list.classList.toggle("is-hidden", files.length === 0);

    const selected = state.selected[group];
    const allSelected = files.length > 0 && files.every((file) => selected.has(file.path));
    selectAllButton.textContent = t(allSelected ? "clearSelection" : "selectAll");

    for (const file of files) {
      const item = document.createElement("li");
      item.className = "file-item";
      const isStaged = group === "staged";
      if (state.activeFile?.path === file.path && state.activeFile?.staged === isStaged) {
        item.classList.add("is-active");
      }

      const checkbox = document.createElement("input");
      checkbox.className = "file-checkbox";
      checkbox.type = "checkbox";
      checkbox.checked = selected.has(file.path);
      checkbox.setAttribute("aria-label", t("fileSelected", { path: file.path }));
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selected.add(file.path);
        else selected.delete(file.path);
        renderChanges();
        renderControls();
      });

      const openButton = document.createElement("button");
      openButton.className = "file-open";
      openButton.type = "button";
      openButton.title = file.path;
      openButton.setAttribute("aria-label", t("fileDiff", { path: file.path }));
      openButton.addEventListener("click", () => {
        state.activeFile = { ...file, staged: isStaged };
        state.diff = null;
        renderChanges();
        void loadDiff(state.activeFile);
      });

      const filename = document.createElement("span");
      filename.className = "file-name";
      filename.textContent = baseName(file.path);
      openButton.append(filename);

      const directory = directoryName(file.path);
      if (directory) {
        const directoryElement = document.createElement("span");
        directoryElement.className = "file-directory";
        directoryElement.textContent = directory;
        openButton.append(directoryElement);
      }

      const status = document.createElement("span");
      status.className = "file-status-code";
      status.dataset.kind = file.kind;
      status.textContent = statusCode(file);
      status.title = statusLabel(file.kind);

      item.append(checkbox, openButton, status);
      list.append(item);
    }
  }

  function statusCode(file) {
    const explicit = String(file.code ?? "").trim();
    if (explicit) return explicit.slice(0, 2);
    return {
      untracked: "?",
      added: "A",
      deleted: "D",
      renamed: "R",
      copied: "C",
      conflicted: "!",
      modified: "M",
    }[file.kind] ?? "M";
  }

  function statusLabel(kind) {
    const labels = state.locale === "zh-CN"
      ? { untracked: "未跟踪", added: "新增", deleted: "删除", renamed: "重命名", copied: "复制", conflicted: "冲突", modified: "修改" }
      : { untracked: "Untracked", added: "Added", deleted: "Deleted", renamed: "Renamed", copied: "Copied", conflicted: "Conflicted", modified: "Modified" };
    return labels[kind] ?? labels.modified;
  }

  function renderDiff() {
    const active = state.activeFile;
    const hasActive = Boolean(active);
    elements.diffEmpty.classList.toggle("is-hidden", hasActive || state.diffLoading);
    elements.diffLoading.classList.toggle("is-hidden", !state.diffLoading);
    elements.diffLines.classList.toggle("is-hidden", !hasActive || state.diffLoading);
    elements.diffTruncated.classList.toggle("is-hidden", !hasActive || state.diffLoading || !state.diff?.truncated);

    if (!active) {
      elements.diffContext.textContent = t("diffPreview");
      elements.diffHeading.textContent = t("chooseFile");
      elements.diffHeading.title = "";
      elements.diffOriginalPath.classList.add("is-hidden");
      elements.diffFileStatus.classList.add("is-hidden");
      elements.diffLines.replaceChildren();
      return;
    }

    elements.diffContext.textContent = t(active.staged ? "stagedDiff" : "unstagedDiff");
    elements.diffHeading.textContent = active.path;
    elements.diffHeading.title = active.path;
    elements.diffFileStatus.textContent = statusLabel(active.kind);
    elements.diffFileStatus.classList.remove("is-hidden");

    if (active.originalPath && active.originalPath !== active.path) {
      elements.diffOriginalPath.textContent = t("renamedFrom", { path: active.originalPath });
      elements.diffOriginalPath.title = active.originalPath;
      elements.diffOriginalPath.classList.remove("is-hidden");
    } else {
      elements.diffOriginalPath.classList.add("is-hidden");
    }

    if (!state.diffLoading) renderDiffLines(state.diff?.text ?? "");
  }

  function renderDiffLines(text) {
    elements.diffLines.replaceChildren();
    if (!text) {
      const empty = document.createElement("div");
      empty.className = "diff-line is-empty-diff";
      empty.textContent = t("noTextDiff");
      elements.diffLines.append(empty);
      return;
    }

    const lines = String(text).replace(/\r\n/g, "\n").split("\n");
    const fragment = document.createDocumentFragment();
    lines.forEach((line, index) => {
      const row = document.createElement("div");
      row.className = `diff-line ${diffLineClass(line)}`.trim();

      const number = document.createElement("span");
      number.className = "diff-line-number";
      number.textContent = diffLineClass(line) === "is-metadata" ? "" : String(index + 1);

      const code = document.createElement("span");
      code.className = "diff-line-code";
      code.textContent = line || " ";

      row.append(number, code);
      fragment.append(row);
    });
    elements.diffLines.append(fragment);
  }

  function diffLineClass(line) {
    if (line.startsWith("@@")) return "is-hunk";
    if (line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("---") || line.startsWith("+++")) return "is-metadata";
    if (line.startsWith("+")) return "is-addition";
    if (line.startsWith("-")) return "is-deletion";
    return "";
  }

  function renderHistory() {
    elements.historyLoading.classList.toggle("is-hidden", !state.historyLoading);
    if (state.historyLoading) {
      elements.historyEmpty.classList.add("is-hidden");
      elements.historyTableWrap.classList.add("is-hidden");
      return;
    }

    const allEntries = Array.isArray(state.history) ? state.history : [];
    const query = elements.historyFilter.value.trim().toLocaleLowerCase(state.locale);
    const entries = query
      ? allEntries.filter((entry) => historySearchText(entry).toLocaleLowerCase(state.locale).includes(query))
      : allEntries;

    elements.historyRows.replaceChildren();
    elements.historyEmpty.classList.toggle("is-hidden", entries.length > 0 || state.history === null);
    elements.historyTableWrap.classList.toggle("is-hidden", entries.length === 0);

    if (entries.length === 0 && state.history !== null) {
      const title = elements.historyEmpty.querySelector("h2");
      const description = elements.historyEmpty.querySelector("p");
      title.textContent = t(query ? "noFilteredHistory" : "noHistory");
      description.textContent = t(query ? "noFilteredHistoryHint" : "noHistoryHint");
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const entry of entries.slice(0, 200)) {
      const row = document.createElement("tr");
      const hash = String(entry.shortHash ?? entry.hash ?? "");
      const subject = String(entry.subject ?? entry.summary ?? "");
      const author = String(entry.author ?? entry.authorName ?? "");
      const date = formatDate(entry.date ?? entry.timestamp);
      row.append(
        historyCell(hash.slice(0, 12), ""),
        historyCell(subject, "history-subject"),
        historyCell(author, ""),
        historyCell(date, ""),
      );
      fragment.append(row);
    }
    elements.historyRows.append(fragment);
  }

  function historyCell(value, className) {
    const cell = document.createElement("td");
    if (className) cell.className = className;
    cell.textContent = value;
    cell.title = value;
    return cell;
  }

  function historySearchText(entry) {
    return [entry.shortHash, entry.hash, entry.subject, entry.summary, entry.author, entry.authorName]
      .filter((value) => value != null)
      .join(" ");
  }

  function formatDate(value) {
    if (value == null || value === "") return "";
    const normalizedValue = typeof value === "number" && Math.abs(value) < 1_000_000_000_000
      ? value * 1000
      : value;
    const date = normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(state.locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function renderBranches() {
    elements.branchesLoading.classList.toggle("is-hidden", !state.branchesLoading);
    elements.branchList.replaceChildren();
    if (state.branchesLoading) {
      elements.branchesEmpty.classList.add("is-hidden");
      return;
    }

    const branches = Array.isArray(state.branches) ? state.branches : [];
    elements.branchesEmpty.classList.toggle("is-hidden", branches.length > 0 || state.branches === null);

    const currentEntry = branches.find((branch) => branch && typeof branch === "object" && (branch.current || branch.isCurrent));
    const currentName = state.snapshot?.branch?.name || currentEntry?.name || "";
    elements.currentBranchSummary.classList.toggle("is-hidden", !currentName);
    elements.currentBranchName.textContent = currentName;
    elements.currentBranchName.title = currentName;

    const fragment = document.createDocumentFragment();
    for (const source of branches) {
      const branch = typeof source === "string" ? { name: source } : source;
      const name = String(branch.name ?? branch.ref ?? "");
      if (!name) continue;
      const isCurrent = Boolean(branch.current || branch.isCurrent) || name === currentName;

      const item = document.createElement("li");
      item.className = "branch-item";
      if (isCurrent) item.classList.add("is-current");

      const symbol = document.createElement("span");
      symbol.className = "branch-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.append(document.createElement("span"));

      const details = document.createElement("div");
      details.className = "branch-details";
      const title = document.createElement("strong");
      title.textContent = name;
      title.title = name;
      const kind = document.createElement("span");
      kind.textContent = t(isCurrent ? "currentBranch" : "localBranch");
      details.append(title, kind);

      let action;
      if (isCurrent) {
        action = document.createElement("span");
        action.className = "current-label";
        action.textContent = t("current");
      } else {
        action = document.createElement("button");
        action.className = "button button-secondary button-compact";
        action.type = "button";
        action.textContent = t("switch");
        action.disabled = state.busy;
        const branchListToken = repositoryRequests.capture();
        action.addEventListener("click", () => void requestBranchSwitch(name, branchListToken));
      }

      item.append(symbol, details, action);
      fragment.append(item);
    }
    elements.branchList.append(fragment);
  }

  function renderStatus() {
    elements.operationIndicator.className = `status-indicator status-${state.operation.kind}`;
    const operationMessage = state.operation.raw
      ? state.operation.raw
      : t(state.operation.key, state.operation.vars);
    const resultMessage = state.lastResult.raw
      ? state.lastResult.raw
      : t(state.lastResult.key, state.lastResult.vars);
    elements.operationMessage.textContent = operationMessage;
    elements.operationMessage.title = operationMessage;
    elements.lastResultMessage.textContent = resultMessage;
    elements.lastResultMessage.title = resultMessage;
  }

  function renderControls() {
    const hasApi = Boolean(api);
    const hasRepository = repositoryIsOpen();
    const hasUpstream = Boolean(state.snapshot?.branch?.hasUpstream);
    const selectedUnstaged = state.selected.unstaged.size;
    const selectedStaged = state.selected.staged.size;
    const stagedCount = state.snapshot?.staged?.length ?? 0;
    const hasCommitMessage = elements.commitMessage.value.trim().length > 0;

    elements.openRepository.disabled = state.busy || !hasApi;
    elements.welcomeOpenRepository.disabled = state.busy || !hasApi;
    elements.recentRepositories.disabled = state.busy || !hasApi || state.recents.length === 0;
    elements.refreshRepository.disabled = state.busy || !hasApi || !hasRepository;
    elements.openSettings.disabled = state.busy;
    elements.gitWarningSettings.disabled = state.busy;
    elements.fetchAction.disabled = state.busy || !hasApi || !hasRepository;
    elements.pullAction.disabled = state.busy || !hasApi || !hasRepository || !hasUpstream;
    elements.pushAction.disabled = state.busy || !hasApi || !hasRepository || !hasUpstream;
    elements.selectAllUnstaged.disabled = state.busy || (state.snapshot?.unstaged?.length ?? 0) === 0;
    elements.selectAllStaged.disabled = state.busy || stagedCount === 0;
    elements.stageSelected.disabled = state.busy || !hasApi || !hasRepository || selectedUnstaged === 0;
    elements.unstageSelected.disabled = state.busy || !hasApi || !hasRepository || selectedStaged === 0;
    elements.commitAction.disabled = state.busy || !hasApi || !hasRepository || stagedCount === 0 || !hasCommitMessage;
    elements.commitMessage.disabled = state.busy || !hasRepository;
    elements.saveSettings.disabled = state.busy || !hasApi;
    elements.chooseGitExecutable.disabled = state.busy || !hasApi;
    elements.useSystemGit.disabled = state.busy || !hasApi || !state.settings.gitPath;

    for (const tab of elements.tabs) tab.disabled = !hasRepository;
  }

  function setOperation(kind, key, vars = {}, raw = "") {
    state.operation = { kind, key, vars, raw };
    renderStatus();
  }

  function setLastResult(key, vars = {}, raw = "") {
    state.lastResult = { key, vars, raw };
    renderStatus();
  }

  function errorMessage(error) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error) return error;
    return state.locale === "zh-CN" ? "未知错误" : "Unknown error";
  }

  async function runOperation({ runningKey, runningVars = {}, successKey, successVars = {}, action, refreshAfter = false }) {
    if (state.busy) return { ok: false, busy: true };
    if (!api) {
      const message = t("integrationUnavailable");
      setOperation("error", "", {}, message);
      setLastResult("", {}, message);
      return { ok: false };
    }

    state.busy = true;
    setOperation("running", runningKey, runningVars);
    renderControls();

    try {
      const result = await action();
      if (result === CANCELLED) {
        setOperation("idle", "ready");
        return { ok: false, cancelled: true };
      }

      if (refreshAfter) {
        const snapshot = await api.refresh();
        acceptSnapshot(snapshot);
      }

      setOperation("success", successKey, successVars);
      setLastResult(successKey, successVars);
      return { ok: true, result };
    } catch (error) {
      const failure = t("operationFailed", { message: errorMessage(error) });
      setOperation("error", "", {}, failure);
      setLastResult("", {}, failure);
      return { ok: false, error };
    } finally {
      state.busy = false;
      renderAll();
    }
  }

  async function openRepository() {
    const outcome = await runOperation({
      runningKey: "openingRepository",
      successKey: "repositoryOpened",
      action: async () => {
        const snapshot = await api.openRepository();
        if (!snapshot) return CANCELLED;
        acceptSnapshot(snapshot);
        await loadRecents();
        return snapshot;
      },
    });
    if (outcome.ok) void loadActiveViewData();
  }

  async function openRecentRepository(path) {
    if (!path) return;
    const outcome = await runOperation({
      runningKey: "openingRecent",
      successKey: "repositoryOpened",
      action: async () => {
        const snapshot = await api.openRecent(path);
        acceptSnapshot(snapshot);
        await loadRecents();
        return snapshot;
      },
    });
    elements.recentRepositories.value = "";
    if (outcome.ok) void loadActiveViewData();
  }

  async function refreshRepository() {
    if (!repositoryIsOpen()) return;
    const outcome = await runOperation({
      runningKey: "refreshingRepository",
      successKey: "repositoryRefreshed",
      action: () => api.refresh(),
    });
    if (outcome.ok) {
      acceptSnapshot(outcome.result);
      void loadActiveViewData();
    }
  }

  async function stageSelectedFiles() {
    const paths = Array.from(state.selected.unstaged);
    if (!paths.length) return;
    await runOperation({
      runningKey: "stagingFiles",
      runningVars: { count: paths.length },
      successKey: "filesStagedSuccess",
      action: () => api.stage({ paths }),
      refreshAfter: true,
    });
  }

  async function unstageSelectedFiles() {
    const paths = Array.from(state.selected.staged);
    if (!paths.length) return;
    await runOperation({
      runningKey: "unstagingFiles",
      runningVars: { count: paths.length },
      successKey: "filesUnstagedSuccess",
      action: () => api.unstage({ paths }),
      refreshAfter: true,
    });
  }

  async function createCommit() {
    const message = elements.commitMessage.value.trim();
    if (!message || !(state.snapshot?.staged?.length > 0)) return;
    const outcome = await runOperation({
      runningKey: "creatingCommit",
      successKey: "commitCreated",
      action: () => api.commit({ message }),
      refreshAfter: true,
    });
    if (outcome.ok) {
      elements.commitMessage.value = "";
      renderControls();
      if (state.activeView === "history") void loadHistory();
    }
  }

  async function fetchRemote() {
    await runOperation({
      runningKey: "fetchingRemote",
      successKey: "fetchComplete",
      action: () => api.fetch(),
      refreshAfter: true,
    });
  }

  async function pullRemote() {
    let confirmDirty = false;
    if (state.snapshot?.dirty) {
      confirmDirty = await confirmAction({
        title: t("pullWarningTitle"),
        message: t("pullWarningBody"),
        accept: t("continuePull"),
        cancel: t("keepWorking"),
      });
      if (!confirmDirty) return;
    }

    await runOperation({
      runningKey: "pullingRemote",
      successKey: "pullComplete",
      action: () => api.pull({ confirmDirty }),
      refreshAfter: true,
    });
  }

  async function pushRemote() {
    await runOperation({
      runningKey: "pushingRemote",
      successKey: "pushComplete",
      action: () => api.push(),
      refreshAfter: true,
    });
  }

  async function requestBranchSwitch(name, branchListToken) {
    if (!repositoryRequests.isCurrent(branchListToken)) return;
    if (!name || name === state.snapshot?.branch?.name) return;
    let confirmDirty = false;
    if (state.snapshot?.dirty) {
      confirmDirty = await confirmAction({
        title: t("switchWarningTitle"),
        message: t("switchWarningBody", { branch: name }),
        accept: t("continueSwitch"),
        cancel: t("keepWorking"),
      });
      if (!confirmDirty) return;
    }

    if (!repositoryRequests.isCurrent(branchListToken)) return;

    const outcome = await runOperation({
      runningKey: "switchingBranch",
      runningVars: { branch: name },
      successKey: "branchSwitched",
      successVars: { branch: name },
      action: () => api.switchBranch({
        name,
        confirmDirty,
        repositoryPath: branchListToken.repositoryIdentity,
      }),
      refreshAfter: true,
    });
    if (outcome.ok) void loadBranches();
  }

  async function loadDiff(file) {
    if (!api || !repositoryIsOpen() || !file?.path) return;
    const request = ++state.diffRequest;
    state.diffLoading = true;
    state.diff = null;
    renderDiff();

    try {
      const result = await api.getDiff({ path: file.path, staged: Boolean(file.staged) });
      if (request !== state.diffRequest || state.activeFile?.path !== file.path || state.activeFile?.staged !== Boolean(file.staged)) return;
      state.diff = {
        text: typeof result === "string" ? result : String(result?.text ?? ""),
        truncated: Boolean(result?.truncated),
      };
    } catch (error) {
      if (request !== state.diffRequest) return;
      state.diff = { text: t("diffFailed", { message: errorMessage(error) }), truncated: false };
    } finally {
      if (request === state.diffRequest) {
        state.diffLoading = false;
        renderDiff();
      }
    }
  }

  async function loadHistory() {
    if (!api || !repositoryIsOpen() || state.historyLoading) return;
    const requestToken = repositoryRequests.capture();
    state.historyLoading = true;
    renderHistory();
    try {
      const result = await api.getHistory({
        limit: 200,
        repositoryPath: requestToken.repositoryIdentity,
      });
      if (!repositoryRequests.isCurrent(requestToken)) return;
      const entries = Array.isArray(result) ? result : Array.isArray(result?.entries) ? result.entries : Array.isArray(result?.commits) ? result.commits : [];
      state.history = entries.slice(0, 200);
    } catch (error) {
      if (!repositoryRequests.isCurrent(requestToken)) return;
      state.history = [];
      const failure = t("loadHistoryFailed", { message: errorMessage(error) });
      setOperation("error", "", {}, failure);
      setLastResult("", {}, failure);
    } finally {
      if (repositoryRequests.isCurrent(requestToken)) {
        state.historyLoading = false;
        renderHistory();
      }
    }
  }

  async function loadBranches() {
    if (!api || !repositoryIsOpen() || state.branchesLoading) return;
    const requestToken = repositoryRequests.capture();
    state.branchesLoading = true;
    renderBranches();
    try {
      const result = await api.getBranches({ repositoryPath: requestToken.repositoryIdentity });
      if (!repositoryRequests.isCurrent(requestToken)) return;
      state.branches = Array.isArray(result) ? result : Array.isArray(result?.branches) ? result.branches : [];
    } catch (error) {
      if (!repositoryRequests.isCurrent(requestToken)) return;
      state.branches = [];
      const failure = t("loadBranchesFailed", { message: errorMessage(error) });
      setOperation("error", "", {}, failure);
      setLastResult("", {}, failure);
    } finally {
      if (repositoryRequests.isCurrent(requestToken)) {
        state.branchesLoading = false;
        renderBranches();
      }
    }
  }

  function loadActiveViewData() {
    if (state.activeView === "history" && state.history === null) return loadHistory();
    if (state.activeView === "branches" && state.branches === null) return loadBranches();
    return Promise.resolve();
  }

  async function loadRecents() {
    if (!api) return;
    try {
      const result = await api.getRecentRepositories();
      const recents = Array.isArray(result) ? result : Array.isArray(result?.repositories) ? result.repositories : [];
      state.recents = recents
        .map((recent) => {
          if (typeof recent === "string") return { path: recent, name: baseName(recent) };
          return {
            path: String(recent?.path ?? ""),
            name: String(recent?.name ?? baseName(String(recent?.path ?? ""))),
          };
        })
        .filter((recent) => recent.path);
      renderRecents();
      renderControls();
    } catch (_error) {
      state.recents = [];
      renderRecents();
    }
  }

  function openSettings() {
    elements.languageSetting.value = state.locale;
    elements.gitPathSetting.value = state.settings.gitPath || t("systemGit");
    if (!elements.settingsDialog.open) elements.settingsDialog.showModal();
  }

  async function saveSettings(event) {
    event.preventDefault();
    const requested = {
      language: normalizeLocale(elements.languageSetting.value),
    };

    const outcome = await runOperation({
      runningKey: "savingSettings",
      successKey: "settingsSaved",
      action: () => api.saveSettings(requested),
    });

    if (!outcome.ok) return;
    const saved = outcome.result && typeof outcome.result === "object" ? outcome.result : requested;
    state.settings = {
      ...state.settings,
      ...requested,
      ...saved,
      language: normalizeLocale(saved.language ?? requested.language),
      gitPath: String(saved.gitPath ?? state.settings.gitPath),
    };
    state.locale = state.settings.language;
    elements.settingsDialog.close();
    if (state.settings.gitAvailable === false) {
      const message = state.settings.gitError || t("gitUnavailableBody");
      setOperation("error", "", {}, message);
      setLastResult("", {}, message);
    }
    applyLanguage();
  }

  function applyGitSettings(saved) {
    if (!saved || typeof saved !== "object") return;
    state.settings = {
      ...state.settings,
      ...saved,
      language: normalizeLocale(saved.language ?? state.settings.language),
      gitPath: String(saved.gitPath ?? state.settings.gitPath),
      gitAvailable: saved.gitAvailable !== false,
      gitError: String(saved.gitError ?? ""),
    };
    elements.gitPathSetting.value = state.settings.gitPath || t("systemGit");
    renderAll();
  }

  async function chooseGitExecutable() {
    const outcome = await runOperation({
      runningKey: "choosingGit",
      successKey: "gitExecutableSaved",
      action: async () => (await api.chooseGitExecutable()) || CANCELLED,
    });
    if (outcome.ok) applyGitSettings(outcome.result);
  }

  async function useSystemGit() {
    const outcome = await runOperation({
      runningKey: "restoringSystemGit",
      successKey: "systemGitRestored",
      action: () => api.useSystemGit(),
    });
    if (outcome.ok) applyGitSettings(outcome.result);
  }

  function confirmAction({ title, message, accept, cancel }) {
    if (state.confirmResolve) state.confirmResolve(false);
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmAccept.textContent = accept;
    elements.confirmCancel.textContent = cancel;
    if (!elements.confirmDialog.open) elements.confirmDialog.showModal();

    return new Promise((resolve) => {
      state.confirmResolve = resolve;
    });
  }

  function resolveConfirmation(value) {
    const resolve = state.confirmResolve;
    state.confirmResolve = null;
    if (elements.confirmDialog.open) elements.confirmDialog.close();
    if (resolve) resolve(value);
  }

  function selectAll(group) {
    const files = state.snapshot?.[group] ?? [];
    const selection = state.selected[group];
    const allSelected = files.length > 0 && files.every((file) => selection.has(file.path));
    state.selected[group] = allSelected ? new Set() : new Set(files.map((file) => file.path));
    renderChanges();
    renderControls();
  }

  function activateView(view) {
    if (!repositoryIsOpen() || !["changes", "history", "branches"].includes(view)) return;
    state.activeView = view;
    renderViews();
    void loadActiveViewData();
  }

  function handleTabKeydown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabled = elements.tabs.filter((tab) => !tab.disabled);
    if (!enabled.length) return;
    const currentIndex = enabled.indexOf(event.currentTarget);
    let nextIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = enabled.length - 1;
    else if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % enabled.length;
    else nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
    enabled[nextIndex].focus();
    activateView(enabled[nextIndex].dataset.view);
  }

  function baseName(path) {
    const parts = String(path ?? "").split(/[\\/]/);
    return parts[parts.length - 1] || String(path ?? "");
  }

  function directoryName(path) {
    const value = String(path ?? "");
    const index = Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\"));
    return index > -1 ? value.slice(0, index) : "";
  }

  function bindEvents() {
    elements.openRepository.addEventListener("click", () => void openRepository());
    elements.welcomeOpenRepository.addEventListener("click", () => void openRepository());
    elements.recentRepositories.addEventListener("change", (event) => void openRecentRepository(event.target.value));
    elements.refreshRepository.addEventListener("click", () => void refreshRepository());
    elements.openSettings.addEventListener("click", openSettings);
    elements.gitWarningSettings.addEventListener("click", openSettings);
    elements.fetchAction.addEventListener("click", () => void fetchRemote());
    elements.pullAction.addEventListener("click", () => void pullRemote());
    elements.pushAction.addEventListener("click", () => void pushRemote());
    elements.selectAllUnstaged.addEventListener("click", () => selectAll("unstaged"));
    elements.selectAllStaged.addEventListener("click", () => selectAll("staged"));
    elements.stageSelected.addEventListener("click", () => void stageSelectedFiles());
    elements.unstageSelected.addEventListener("click", () => void unstageSelectedFiles());
    elements.commitAction.addEventListener("click", () => void createCommit());
    elements.commitMessage.addEventListener("input", renderControls);
    elements.historyFilter.addEventListener("input", renderHistory);

    for (const tab of elements.tabs) {
      tab.addEventListener("click", () => activateView(tab.dataset.view));
      tab.addEventListener("keydown", handleTabKeydown);
    }

    elements.closeSettings.addEventListener("click", () => elements.settingsDialog.close());
    elements.cancelSettings.addEventListener("click", () => elements.settingsDialog.close());
    elements.settingsForm.addEventListener("submit", (event) => void saveSettings(event));
    elements.chooseGitExecutable.addEventListener("click", () => void chooseGitExecutable());
    elements.useSystemGit.addEventListener("click", () => void useSystemGit());
    elements.confirmCancel.addEventListener("click", () => resolveConfirmation(false));
    elements.confirmAccept.addEventListener("click", () => resolveConfirmation(true));
    elements.confirmDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      resolveConfirmation(false);
    });
  }

  async function initialize() {
    cacheElements();
    bindEvents();
    renderAll();

    if (!api) {
      const message = t("integrationUnavailable");
      setOperation("error", "", {}, message);
      setLastResult("", {}, message);
      renderControls();
      return;
    }

    try {
      const settings = await api.getSettings();
      if (settings && typeof settings === "object") {
        state.settings = {
          ...state.settings,
          ...settings,
          language: normalizeLocale(settings.language),
          gitPath: String(settings.gitPath ?? ""),
          gitAvailable: settings.gitAvailable !== false,
          gitError: String(settings.gitError ?? ""),
        };
        state.locale = state.settings.language;
        if (state.settings.gitAvailable === false) {
          const message = state.settings.gitError || t("gitUnavailableBody");
          setOperation("error", "", {}, message);
          setLastResult("", {}, message);
        }
      }
    } catch (error) {
      const failure = t("operationFailed", { message: errorMessage(error) });
      setOperation("error", "", {}, failure);
      setLastResult("", {}, failure);
    }

    applyLanguage();
    await loadRecents();
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void initialize(), { once: true });
  } else {
    void initialize();
  }
})();
