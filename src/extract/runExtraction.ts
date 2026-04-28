import { extractFromCurrentDocument } from './pipeline';

declare global {
  interface Window {
    __substackMarkdownExtractor?: () => ReturnType<typeof extractFromCurrentDocument>;
  }
}

window.__substackMarkdownExtractor = extractFromCurrentDocument;