import type { ArticleMetadata, ExtractionAdapter, PaywallStatus } from '../types';

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

const PAYWALL_SELECTORS = [
  '.paywall',
  '.paywall-cta',
  '[data-component-name*="paywall" i]'
];

const SUBSCRIBE_HINT_SELECTORS = [
  '[class*="subscribe" i]',
  '[class*="subscriber" i]',
  '[data-testid*="subscribe" i]'
];

const SUBSCRIBE_BUTTON_PATTERNS = [
  /subscribe to read/i,
  /subscribe to continue/i
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

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const normalizeDescription = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, 300) : undefined;
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
    const description = normalizeDescription(queryMeta(document, [
      'meta[property="og:description"]',
      'meta[name="description"]'
    ]));
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
      description,
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
  },

  detectPaywall(document, textContent): PaywallStatus {
    if (document.querySelector(PAYWALL_SELECTORS.join(', '))) {
      return {
        paywalled: true,
        reason: 'paywall-node'
      };
    }

    const subscribeButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
      const text = button.textContent?.trim() ?? '';
      return SUBSCRIBE_BUTTON_PATTERNS.some((pattern) => pattern.test(text));
    });

    if (subscribeButton) {
      return {
        paywalled: true,
        reason: 'subscribe-cta'
      };
    }

    const description = queryMeta(document, [
      'meta[property="og:description"]',
      'meta[name="description"]'
    ]);
    const descriptionWordCount = description ? countWords(description) : 0;
    const bodyWordCount = countWords(textContent);
    const hasSubscribeHint = document.querySelector(SUBSCRIBE_HINT_SELECTORS.join(', ')) !== null;

    if (hasSubscribeHint && descriptionWordCount > 0 && bodyWordCount < Math.max(80, descriptionWordCount * 3)) {
      return {
        paywalled: true,
        reason: 'truncated-preview'
      };
    }

    return {
      paywalled: false
    };
  }
};