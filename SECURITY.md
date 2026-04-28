# Security Policy

## Supported Versions

This project is in active development. Only the latest commit on the `main`
branch receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| Older   | :x:                |

## Reporting a Vulnerability

If you believe you have found a security vulnerability in this extension,
please **do not open a public GitHub issue**.

Instead, report it privately using GitHub's
[private vulnerability reporting](https://github.com/davidbenkert/substack-text-extractor/security/advisories/new)
feature. This sends the report directly to the maintainer and keeps the
details private until a fix is published.

When reporting, please include:

- A clear description of the issue and its potential impact.
- Steps to reproduce, or a minimal proof-of-concept.
- The browser, browser version, and extension version you tested against.
- Any relevant logs or screenshots.

You can expect an initial acknowledgement within a few days. Confirmed
issues will be triaged, fixed on `main`, and disclosed via a GitHub
Security Advisory once a patched build is available.

## Scope

This extension:

- Runs entirely in the user's browser; it makes **no network requests** of
  its own.
- Requests only the `activeTab` and `scripting` permissions.
- Reads content from the active tab's DOM and converts it to Markdown
  locally; it does not transmit article content, metadata, or telemetry
  anywhere.

In-scope reports include (non-exhaustive):

- Cross-site scripting or HTML injection in the popup or extracted output.
- Bypass of the documented permission model.
- Exfiltration of page content or user data.
- Supply-chain risks in build tooling or runtime dependencies.

Out of scope:

- Bypassing third-party paywalls or subscriber-only content (the extension
  only processes content already rendered in the open tab).
- Issues in upstream libraries that are tracked publicly elsewhere
  (please report those to the upstream project).
