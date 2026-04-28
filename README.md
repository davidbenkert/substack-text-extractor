# Substack Markdown Extractor

[![Privacy Policy](https://img.shields.io/badge/privacy-policy-1f1d1a?style=flat-square)](./PRIVACY.md)

A Chrome / Edge extension that extracts the currently open Substack article and converts it to clean Markdown with YAML front matter — entirely in your browser.

## Privacy

**All extraction runs locally.** The extension reads the DOM of the active tab and converts it to Markdown using [Mozilla Readability](https://github.com/mozilla/readability) and [Turndown](https://github.com/mixmark-io/turndown). No article content, metadata, or usage data is ever sent to a server.

Permissions requested:
| Permission | Why |
|---|---|
| `activeTab` | Read the current tab's URL and inject the extractor |
| `scripting` | Inject the extraction script into the active tab |
| `storage` | Store the keyboard shortcut auto-extract flag and remember the Obsidian vault name between sessions |

No network requests are made by this extension.

## Features

- Works on `*.substack.com` and custom-domain Substack newsletters
- Falls back to generic article extraction (via Readability) on non-Substack pages
- YAML front matter with title, author, publication, publish date, description, canonical URL, cover image, tags, extraction timestamp, word count, and a `paywalled` flag when applicable
- GFM Markdown: headings, paragraphs, lists, blockquotes, code blocks, images as `![alt](url)` links
- Copy to clipboard or download as a `.md` file
- Save directly to Obsidian via the `obsidian://new` URI scheme, with clipboard fallback for long articles
- Keyboard shortcut: `Alt+Shift+M` on Windows/Linux and `Option+Shift+M` on macOS
- Word count + confidence score shown in the popup
- Detects paywalled posts, surfaces a banner in the popup, and prefixes downloads with `preview-`

## Limitations

- The extension only extracts content **already present in the open tab**. It does not bypass paywalls, fetch subscriber-only content, or load additional pages.
- Image files are referenced by their original URL — they are not downloaded.
- Extraction quality may vary on heavily JavaScript-rendered pages if content is injected after the initial page load.

## Images

Extracted Markdown keeps image links remote instead of downloading files or inlining base64 data. For Substack CDN images, the extractor strips query parameters from `substackcdn.com` URLs so saved notes avoid tracking and resize hints while remaining hot-linked to the original asset.

## Installation (developer / unpacked)

1. Clone or download this repository.
2. Install dependencies and build the extension:
   ```sh
   npm install
   npm run build
   ```
3. In Chrome or Edge, navigate to `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the `dist/` folder inside this repository.
6. The extension icon will appear in the toolbar.

## Usage

1. Open a Substack article in the active tab.
2. Click the **Substack Markdown Extractor** toolbar icon.
3. Click **Extract Article**.
4. Use **Copy Markdown**, **Download .md**, or **Save to Obsidian** once extraction completes.
5. Enter your Obsidian vault name once; the popup remembers it for future saves.

Shortcut:

- Press `Alt+Shift+M` on Windows/Linux or `Option+Shift+M` on macOS to open the popup and start extraction immediately.
- `Ctrl+Shift+M` is intentionally avoided because it is reserved by Chrome and Edge for the profile switcher.
- You can reassign the shortcut in `chrome://extensions/shortcuts` or `edge://extensions/shortcuts`.

## Development

| Command | Description |
|---|---|
| `npm run build` | Bundle the extension into `dist/` |
| `npm test` | Run unit tests |
| `npm run audit` | Check dependencies for known vulnerabilities |

### Project structure

```
src/
  popup/        Popup UI (HTML + CSS + TypeScript controller)
  extract/      Content extraction pipeline
    adapters/   Site-specific adapters (Substack, generic fallback)
    pipeline.ts Orchestration and confidence scoring
    markdown.ts Turndown configuration and front-matter builder
    types.ts    Shared TypeScript interfaces
test/           Vitest unit tests
build.mjs       esbuild bundler script
manifest.json   MV3 extension manifest
```

## Privacy Policy

See [PRIVACY.md](./PRIVACY.md) for the full privacy policy, permission rationale, and network behavior. In short: the extension runs locally, makes no outbound network calls, and only emits remote image URLs inside the Markdown it generates.

## Obsidian

The Obsidian integration uses the local `obsidian://new` URI scheme. Shorter notes are sent directly in the URI; longer notes fall back to clipboard mode automatically so the generated URL stays well below platform limits.

## License

[MIT](LICENSE) — see the `LICENSE` file for details.
