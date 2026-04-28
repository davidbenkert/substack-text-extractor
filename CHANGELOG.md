# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added a Substack-only context-menu entry in the background service worker so right-click extraction uses the same auto-open popup flow (#13)
- Added direct Obsidian saving via the `obsidian://new` URI scheme, including clipboard fallback for long articles and persisted vault name support (#12)
- Added a keyboard shortcut (`Alt+Shift+M` / `Option+Shift+M`) backed by a service worker and session storage flag to open the popup and auto-run extraction (#11)
- Added a top-level privacy policy, popup privacy link, and README privacy references to document permissions and network behavior (#10)
- Formalized image handling policy: keep remote image URLs, strip query params from `substackcdn.com` assets, and document hot-linked image behavior (#9)
- Expanded YAML front matter: `description`, `tags`, `extracted_at`, `word_count`, and conditional `paywalled` flag (#8)
- Paywall-aware extraction with popup banner, confidence reduction, and `preview-` filename prefix (#7)

## [0.1.0] - 2026-04-28

### Added

- Manifest V3 Chrome/Edge extension with `activeTab` and `scripting` permissions only
- Substack article detection for `*.substack.com` and custom-domain Substack newsletters
- Generic article fallback via Mozilla Readability for pages without Substack-specific markers
- YAML front matter with title, author, publication, publish date, canonical URL, and cover image
- Markdown body via Turndown (GFM mode) with figure/image and code-block custom rules
- Popup with Extract, Copy Markdown, and Download .md actions
- Word count, confidence score, and per-extraction warnings in the popup
- All extraction runs locally in the browser — no network requests made
