import { Readability } from '@mozilla/readability';

import { substackAdapter } from './adapters/substack';
import { buildMarkdownDocument, htmlToMarkdown } from './markdown';
import type { ArticleMetadata, ExtractionAdapter, ExtractionResult } from './types';

const adapters: ExtractionAdapter[] = [substackAdapter];

const GENERIC_NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'form',
  'dialog',
  '[class*="subscribe"]',
  '[class*="signup"]',
  '[class*="comments"]',
  '[class*="share"]',
  '[class*="related"]',
  '[class*="recommendation"]',
  'aside',
  'nav'
];

const queryMeta = (document: Document, selectors: string[]) => {
  for (const selector of selectors) {
    const content = document.querySelector<HTMLMetaElement>(selector)?.getAttribute('content')?.trim();
    if (content) {
      return content;
    }
  }

  return undefined;
};

const queryText = (document: Document, selectors: string[]) => {
  for (const selector of selectors) {
    const text = document.querySelector<HTMLElement>(selector)?.textContent?.trim();
    if (text) {
      return text;
    }
  }

  return undefined;
};

const genericArticleLooksExtractable = (document: Document) => {
  const paragraphCount = document.querySelectorAll('p').length;

  return document.querySelector('article, main') !== null ||
    document.querySelector('meta[property="og:type"][content="article"]') !== null ||
    (document.querySelector('h1') !== null && paragraphCount >= 2);
};

const genericAdapter: ExtractionAdapter = {
  isMatch(document) {
    return genericArticleLooksExtractable(document);
  },

  collectMetadata(document, location): ArticleMetadata {
    return {
      title: queryMeta(document, [
        'meta[property="og:title"]',
        'meta[name="twitter:title"]'
      ]) ?? queryText(document, ['h1']) ?? 'Untitled article',
      author: queryMeta(document, [
        'meta[name="author"]',
        'meta[property="article:author"]'
      ]) ?? queryText(document, ['[rel="author"]', '.byline', '.author']),
      publication: queryMeta(document, [
        'meta[property="og:site_name"]'
      ]) ?? location.hostname,
      publishedAt: document.querySelector<HTMLTimeElement>('time[datetime]')?.dateTime ?? queryMeta(document, [
        'meta[property="article:published_time"]'
      ]),
      canonicalUrl: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href,
      coverImage: queryMeta(document, [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]'
      ])
    };
  },

  cleanupDocument(document, baseUrl) {
    document.querySelectorAll(GENERIC_NOISE_SELECTORS.join(', ')).forEach((node) => node.remove());

    document.querySelectorAll<HTMLElement>('[aria-hidden="true"]').forEach((node) => {
      if (!node.querySelector('img, picture, figure')) {
        node.remove();
      }
    });

    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) {
        return;
      }

      try {
        link.setAttribute('href', new URL(href, baseUrl).toString());
      } catch {
        // Ignore malformed URLs and leave them untouched.
      }
    });

    document.querySelectorAll<HTMLImageElement>('img[src]').forEach((image) => {
      const src = image.getAttribute('src');
      if (!src) {
        return;
      }

      try {
        image.setAttribute('src', new URL(src, baseUrl).toString());
      } catch {
        // Ignore malformed URLs and leave them untouched.
      }
    });
  }
};

const slugify = (value: string) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'substack-article';

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const getPreview = (markdown: string) => markdown
  .replace(/^---[\s\S]*?---/u, '')
  .replace(/[#>*_`\-]/g, '')
  .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
  .trim()
  .slice(0, 320);

const detectWarnings = (document: Document, textContent: string) => {
  const warnings: string[] = [];

  if (document.querySelector('[class*="paywall"], [class*="subscriber"], [class*="login"]')) {
    warnings.push('The article appears to include subscriber-only or gated sections.');
  }

  if (textContent.length < 1200) {
    warnings.push('The extracted article body is shorter than expected.');
  }

  return warnings;
};

const calculateConfidence = (title: string, textContent: string, warnings: string[]) => {
  let score = 0.35;

  if (title.trim()) {
    score += 0.2;
  }

  score += Math.min(textContent.length / 4000, 0.35);
  score -= warnings.length * 0.12;

  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
};

export const extractFromCurrentDocument = (): ExtractionResult => {
  const adapter = adapters.find((candidate) => candidate.isMatch(document, window.location)) ??
    (genericArticleLooksExtractable(document) ? genericAdapter : undefined);

  if (!adapter) {
    return {
      status: 'error',
      reason: 'unsupported-page',
      details: 'This page does not look like a Substack article.'
    };
  }

  const baseUrl = window.location.href;
  const clonedDocument = document.cloneNode(true) as Document;
  adapter.cleanupDocument(clonedDocument, baseUrl);

  const article = new Readability(clonedDocument).parse();
  const metadata = adapter.collectMetadata(document, window.location);

  if (!article?.content || !article.textContent?.trim()) {
    return {
      status: 'error',
      reason: 'empty-article',
      details: 'Readability could not find a usable article body on this page.'
    };
  }

  const warnings = detectWarnings(document, article.textContent);

  if (adapter === genericAdapter) {
    warnings.push('This page did not match known Substack markers, so the markdown should be reviewed before use.');
  }

  const confidence = calculateConfidence(metadata.title, article.textContent, warnings);
  const bodyMarkdown = htmlToMarkdown(article.content);
  const markdown = buildMarkdownDocument(metadata, bodyMarkdown);

  if (confidence < 0.45) {
    warnings.push('Extraction confidence is low, so review the markdown before relying on it.');
  }

  return {
    status: 'success',
    payload: {
      markdown,
      preview: getPreview(markdown),
      filename: `${slugify(metadata.title)}.md`,
      wordCount: countWords(article.textContent),
      confidence,
      warnings,
      metadata
    }
  };
};

export { slugify };