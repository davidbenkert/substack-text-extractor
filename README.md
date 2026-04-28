# Substack Markdown Extractor

A Chrome / Edge extension that extracts the currently open Substack article and converts it to clean Markdown with YAML front matter — entirely in your browser.

## Privacy

**All extraction runs locally.** The extension reads the DOM of the active tab and converts it to Markdown using [Mozilla Readability](https://github.com/mozilla/readability) and [Turndown](https://github.com/mixmark-io/turndown). No article content, metadata, or usage data is ever sent to a server.

Permissions requested:
| Permission | Why |
|---|---|
| `activeTab` | Read the current tab's URL and inject the extractor |
| `scripting` | Inject the extraction script into the active tab |

No network requests are made by this extension.

## Features

- Works on `*.substack.com` and custom-domain Substack newsletters
- Falls back to generic article extraction (via Readability) on non-Substack pages
- YAML front matter with title, author, publication, publish date, canonical URL, and cover image
- GFM Markdown: headings, paragraphs, lists, blockquotes, code blocks, images as `![alt](url)` links
- Copy to clipboard or download as a `.md` file
- Word count + confidence score shown in the popup
- Warns when content appears to be paywalled or truncated

## Limitations

- The extension only extracts content **already present in the open tab**. It does not bypass paywalls, fetch subscriber-only content, or load additional pages.
- Image files are referenced by their original URL — they are not downloaded.
- Extraction quality may vary on heavily JavaScript-rendered pages if content is injected after the initial page load.

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
4. Use **Copy Markdown** to copy to the clipboard, or **Download .md** to save a file.

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

## License

[MIT](LICENSE) — see the `LICENSE` file for details.
