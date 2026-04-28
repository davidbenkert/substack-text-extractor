# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
