# Contributing to Nodebraid

Thank you for helping make everyday version-control work easier to understand and safer to perform.

Nodebraid is open source under the [MIT License](LICENSE). Contributions are welcome. By submitting code, text, or artwork, you confirm that you created it or have clear permission to contribute it under the project's MIT License.

## Clean-room rule

Nodebraid must remain an original project. Do not copy, translate, trace, or adapt code, tests, documentation, layouts, identifiers, packaging scripts, or artwork from another desktop Git client. Base changes on Nodebraid's documented behavior, public Git behavior, and original design work.

## Set up a development environment

Install Node.js 24, npm, and a usable Git executable. Then run:

```sh
npm ci
npm test
npm start
```

The integration suite configures disposable repositories in temporary directories. It must never depend on a contributor's working repository or remote credentials.

Useful commands:

```sh
npm run test:unit
npm run test:integration
npm run icons
npm run pack
```

`npm run pack` creates an unpacked application for local inspection. `npm run dist` creates platform distributables and should be used only when packaging behavior needs verification.

## Design and implementation constraints

Changes must preserve these boundaries:

- Keep `contextIsolation` enabled, renderer Node integration disabled, and the renderer sandboxed where Electron supports it.
- Keep the preload API narrow, typed by operation, and allowlisted. Do not expose raw Node.js primitives or general command execution.
- Invoke Git with an executable plus explicit argument arrays. Never construct a shell command string and never enable `shell: true`.
- Put `--` before user-controlled paths for Git subcommands that accept paths.
- Validate repository roots and repository-relative paths in the main process. Reject empty paths, embedded NUL bytes, and paths outside the active repository.
- Parse machine output with NUL delimiters wherever Git provides them. Tests must include spaces, quotes, Unicode, leading dashes, and the literal text ` -> ` in filenames.
- Cap captured output and diff sizes, prevent concurrent mutations, and refresh after every mutating operation.
- Do not log diffs, commit contents, environment variables, or remote URLs that may contain credentials.
- Do not add force push, reset, rebase, cherry-pick, destructive cleanup, history rewriting, arbitrary shell commands, telemetry, or built-in credential storage to the MVP.

Keep user-facing text in the English and Simplified Chinese translation dictionaries. New actions need clear progress, success, failure, and empty-state messages in both languages.

## Tests

Add or update tests with each behavior change. At minimum, run `npm test` before proposing a change. The full suite covers parser behavior, path validation, output limits, settings persistence, security invariants, and temporary-repository workflows.

Tests should be deterministic, avoid network access, and clean up their temporary resources. Never weaken a safety assertion merely to make a test pass.

## Propose a change

Keep changes focused and explain the user-visible effect. A reviewable proposal includes:

- a concise summary and the reason for the change;
- tests that exercise success, unusual filenames, and relevant failure paths;
- screenshots for visible interface changes in both supported languages when practical;
- security and privacy considerations;
- packaging notes when main-process, preload, asset, or build configuration changes.

Before requesting review, confirm that:

- `npm test` passes;
- no unrelated generated or local files are included;
- no secrets, private repository contents, or credential-bearing URLs appear in the change;
- documentation and translations match the implemented behavior;
- the change does not imply automatic synchronization, conflict resolution, or broader Git coverage than Nodebraid provides.

Report suspected vulnerabilities through the private process in [SECURITY.md](SECURITY.md), not through a public change request.
