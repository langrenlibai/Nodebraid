# Security Policy

Nodebraid handles local source trees and invokes a security-sensitive tool, Git. Reports that help preserve repository boundaries, process isolation, and credential privacy are welcome.

## Supported versions

Security fixes are made on the current development line and, after releases exist, the latest tagged release. Pre-release builds are provided for evaluation and may change without compatibility guarantees.

## Report a vulnerability privately

Do not put secrets, private source code, credential-bearing remote URLs, exploit details, or sensitive logs in a public issue.

If this repository is hosted on GitHub and private vulnerability reporting is enabled, use **Security → Advisories → Report a vulnerability**. Otherwise, contact the repository owner through an established private channel. If no private channel is available, open a public issue that asks for private contact information but contains no vulnerability details.

Include only the information needed to reproduce and assess the problem:

- the Nodebraid version or commit;
- operating system, Git version, and relevant configuration with secrets removed;
- a minimal sequence of actions using a disposable repository;
- expected and observed behavior;
- the potential impact;
- sanitized logs, screenshots, or proof-of-concept material, if useful.

Never test against repositories, accounts, or remotes you do not own or have permission to assess.

## What to report

Examples include:

- command or argument injection;
- repository-root or relative-path validation bypasses;
- renderer access to Node.js, unrestricted IPC, or privileged process APIs;
- unsafe handling of symbolic links or specially formed filenames;
- unintended exposure of diffs, commit contents, credentials, or environment data;
- bypasses of the single-operation or explicit-user-gesture safeguards;
- dependency vulnerabilities that are reachable in the packaged application.

General bugs without a security impact can use the normal issue process, provided the report contains no private code or secrets.

## Response and disclosure

Maintainers aim to acknowledge a private report within three business days and provide an initial assessment or request for more information within seven business days. Timing can vary with severity and maintainer availability.

Please allow time for a fix and coordinated release before public disclosure. The maintainer will credit reporters when requested and appropriate, but will not publish identifying information without permission.

## Security boundaries

Nodebraid relies on the installed Git executable, the operating system, and the user's configured credential helper or SSH agent. It does not store Git hosting passwords or tokens. Reports about those external components should be sent to their respective maintainers unless Nodebraid exposes or misuses them.
