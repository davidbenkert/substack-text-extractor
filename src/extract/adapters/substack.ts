import type { ArticleMetadata, ExtractionAdapter } from '../types';

const ARTICLE_HINT_SELECTORS = [
  'article',
  '[data-post-id]',
  '.available-content',
  '.body.markup',
  '.post-body',
  '.post-header'
];

const SUBSTACK_HINT_SELECTORS = [
  '[data-testid*="post"]',
  '[class*="pencraft"]',
  'meta[name="generator"][content*="Substack" i]',
  'meta[property="al:ios:app_name"][content*="Substack" i]',
  'meta[name="application-name"][content*="Substack" i]'
];

const NOISE_SELECTORS = [
  '[class*="subscribe"]',
  '[class*="signup"]',
  '[class*="footer"]',
  '[class*="comments"]',
  '[class*="reaction"]',
  '[class*="share"]',
  '[class*="related"]',
  '[class*="recommendation"]',
  'nav',
  'aside',
  'form',
  'button'
];

const queryMeta = (document: Document, selectors: string[]) => {
  for (const selector of selectors) {
    const element = document.querySelector<HTMLMetaElement>(selector);
    const content = element?.getAttribute('content')?.trim();
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

const isSubstackHost = (hostname: string) => hostname === 'substack.com' || hostname.endsWith('.substack.com');

const urlLooksLikeSubstack = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return isSubstackHost(url.hostname) || url.pathname.includes('/p/');
  } catch {
    return false;
  }
};

export const substackAdapter: ExtractionAdapter = {
  isMatch(document, location) {
    if (isSubstackHost(location.hostname)) {
      return true;
    }

    const articleHints = ARTICLE_HINT_SELECTORS.some((selector) => document.querySelector(selector) !== null) ||
      document.querySelector('meta[property="og:type"][content="article"]') !== null ||
      (document.querySelector('h1') !== null && document.querySelector('time[datetime]') !== null);

    const substackHints = SUBSTACK_HINT_SELECTORS.some((selector) => document.querySelector(selector) !== null) ||
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.toLowerCase().includes('substack') === true ||
      urlLooksLikeSubstack(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href) ||
      urlLooksLikeSubstack(document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.getAttribute('content'));

    return articleHints && substackHints;
  },

  collectMetadata(document, location): ArticleMetadata {
    const title = queryMeta(document, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]'
    ]) ?? queryText(document, ['h1', '.post-title']) ?? 'Untitled article';

    const author = queryMeta(document, [
      'meta[name="author"]',
      'meta[property="article:author"]'
    ]) ?? queryText(document, ['[data-testid="author-name"]', '.post-meta a', '.pencraft.pc-display-flex.pc-gap-8.pc-reset a']);

    const publication = queryMeta(document, [
      'meta[property="og:site_name"]'
    ]) ?? queryText(document, ['header a[href="/"]', '.publication-name']);

    const publishedAt = document.querySelector<HTMLTimeElement>('time[datetime]')?.dateTime ?? queryMeta(document, [
      'meta[property="article:published_time"]'
    ]);

    const canonicalUrl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? location.href;
    const coverImage = queryMeta(document, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ]);

    return {
      title,
      author,
      publication,
      publishedAt,
      canonicalUrl,
      coverImage
    };
  },

  cleanupDocument(document, baseUrl) {
    document.querySelectorAll(NOISE_SELECTORS.join(', ')).forEach((node) => node.remove());

    document.querySelectorAll<HTMLElement>('[aria-hidden="true"]').forEach((node) => {
      if (!node.querySelector('img, picture, figure')) {
        node.remove();
      }
    });

    document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      try {
        link.setAttribute('href', new URL(href, baseUrl).toString());
      } catch {
        // ignore malformed URLs
      }
    });

    document.querySelectorAll<HTMLImageElement>('img[src^="/"]').forEach((image) => {
      const src = image.getAttribute('src');
      if (!src) return;
      try {
        image.setAttribute('src', new URL(src, baseUrl).toString());
      } catch {
        // ignore malformed URLs
      }
    });
  }
};