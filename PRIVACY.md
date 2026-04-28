# Privacy Policy

Substack Markdown Extractor does not collect, transmit, or sell personal data.
All extraction happens locally in your browser.

## What We Collect

Nothing. The extension has no backend, no telemetry, and no analytics.
It reads the DOM of the active tab only when you run an extraction from the popup.

## Permissions

The permissions below must stay in sync with [manifest.json](manifest.json).

| Permission | Why |
| --- | --- |
| `activeTab` | Read the currently active page after you click the extension action and run an extraction. |
| `scripting` | Inject the extraction script into the current tab so the article can be converted to Markdown locally. |
| `storage` | Store the keyboard shortcut auto-extract flag and your Obsidian vault name locally in the browser. |
| `contextMenus` | Register the right-click entry that appears on Substack pages and triggers extraction through the existing popup flow. |

## Network Calls

The extension makes zero outbound network requests.

Extracted Markdown can include remote image URLs. When those images point to `substackcdn.com`, your Markdown viewer may fetch them later when rendering the note, but the extension itself does not request them.

## Third-Party Libraries

These libraries are bundled with the extension and run locally:

- Mozilla Readability for article body extraction
- Turndown and `turndown-plugin-gfm` for HTML to Markdown conversion

## Contact

Report issues or questions at:

https://github.com/davidbenkert/substack-text-extractor/issues