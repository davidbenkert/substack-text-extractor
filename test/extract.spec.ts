import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { substackAdapter } from '../src/extract/adapters/substack';
import { buildFrontMatter, buildMarkdownDocument, htmlToMarkdown } from '../src/extract/markdown';
import { extractFromCurrentDocument, slugify } from '../src/extract/pipeline';

describe('markdown helpers', () => {
  it('builds front matter with optional fields', () => {
    const frontMatter = buildFrontMatter({
      title: 'A test article',
      author: 'Jane Writer',
      publication: 'The Example Publication',
      publishedAt: '2026-04-28T12:00:00.000Z',
      canonicalUrl: 'https://example.substack.com/p/test-article',
      coverImage: 'https://example.substack.com/image.png'
    });

    expect(frontMatter).toContain('title: "A test article"');
    expect(frontMatter).toContain('author: "Jane Writer"');
    expect(frontMatter).toContain('cover_image: "https://example.substack.com/image.png"');
  });

  it('converts semantic html to markdown', () => {
    const markdown = htmlToMarkdown('<h2>Section</h2><p>Hello <strong>world</strong>.</p>');

    expect(markdown).toContain('## Section');
    expect(markdown).toContain('Hello **world**.');
  });

  it('builds a stable filename slug', () => {
    expect(slugify('This is A Big, Messy Title!!!')).toBe('this-is-a-big-messy-title');
  });

  it('builds the final markdown envelope', () => {
    const markdown = buildMarkdownDocument(
      {
        title: 'A test article',
        canonicalUrl: 'https://example.substack.com/p/test-article'
      },
      'Body text'
    );

    expect(markdown).toContain('---');
    expect(markdown).toContain('# A test article');
    expect(markdown).toContain('Body text');
  });

  it('recognizes a custom-domain Substack article', () => {
    const dom = new JSDOM(`<!doctype html>
      <html>
        <head>
          <meta name="generator" content="Substack" />
          <meta property="og:type" content="article" />
          <link rel="canonical" href="https://writer.example.com/p/field-notes" />
        </head>
        <body>
          <article>
            <h1>Field Notes</h1>
            <time datetime="2026-04-28T12:00:00.000Z"></time>
          </article>
        </body>
      </html>`, {
      url: 'https://writer.example.com/p/field-notes'
    });

    expect(substackAdapter.isMatch(dom.window.document, dom.window.location)).toBe(true);
  });

  it('recognizes the bare substack.com host', () => {
    const dom = new JSDOM(`<!doctype html>
      <html>
        <head>
          <meta property="og:type" content="article" />
        </head>
        <body>
          <article>
            <h1>Field Notes</h1>
            <time datetime="2026-04-28T12:00:00.000Z"></time>
          </article>
        </body>
      </html>`, {
      url: 'https://substack.com/p/field-notes'
    });

    expect(substackAdapter.isMatch(dom.window.document, dom.window.location)).toBe(true);
  });

  it('falls back to generic article extraction when Substack markers are missing', () => {
    const dom = new JSDOM(`<!doctype html>
      <html>
        <head>
          <title>Field Notes</title>
          <meta property="og:type" content="article" />
          <link rel="canonical" href="https://writer.example.com/field-notes" />
        </head>
        <body>
          <main>
            <h1>Field Notes</h1>
            <time datetime="2026-04-28T12:00:00.000Z"></time>
            <p>This is a long paragraph that gives Readability enough content to treat the page like a real article for extraction testing.</p>
            <p>This second paragraph makes the generic fallback path concrete and prevents the extractor from blocking on a strict Substack match.</p>
            <p>This final paragraph confirms the markdown path runs even when publisher-specific markers are missing.</p>
          </main>
        </body>
      </html>`, {
      url: 'https://writer.example.com/field-notes'
    });

    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;

    Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true });
    Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true });

    try {
      const result = extractFromCurrentDocument();

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.payload.markdown).toContain('# Field Notes');
        expect(result.payload.warnings).toContain('This page did not match known Substack markers, so the markdown should be reviewed before use.');
      }
    } finally {
      Object.defineProperty(globalThis, 'document', { value: previousDocument, configurable: true });
      Object.defineProperty(globalThis, 'window', { value: previousWindow, configurable: true });
    }
  });
});