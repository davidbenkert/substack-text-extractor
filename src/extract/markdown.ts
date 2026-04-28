import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

import type { ArticleMetadata } from './types';

interface MarkdownDocumentOptions {
  paywalled?: boolean;
  wordCount?: number;
  extractedAt?: string;
}

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
  hr: '---'
});

turndown.use(gfm);

turndown.addRule('figureImages', {
  filter: ['figure'],
  replacement(content, node) {
    const image = (node as HTMLElement).querySelector('img');
    if (!image?.src) {
      return `${content}\n\n`;
    }

    const alt = image.alt?.trim() ?? '';
    const caption = (node as HTMLElement).querySelector('figcaption')?.textContent?.trim();
    const imageMarkdown = `![${alt}](${image.src})`;

    return caption ? `${imageMarkdown}\n\n_${caption}_\n\n` : `${imageMarkdown}\n\n`;
  }
});

const sanitizeYamlText = (value: string) => value.replace(/\s+/g, ' ').trim();

const escapeYaml = (value: string) => sanitizeYamlText(value).replace(/"/g, '\\"');

export const buildFrontMatter = (metadata: ArticleMetadata, options: MarkdownDocumentOptions = {}) => {
  const rows = [
    `title: "${escapeYaml(metadata.title)}"`,
    `source: "${metadata.canonicalUrl}"`
  ];

  if (metadata.author) {
    rows.push(`author: "${escapeYaml(metadata.author)}"`);
  }

  if (metadata.publication) {
    rows.push(`publication: "${escapeYaml(metadata.publication)}"`);
  }

  if (metadata.publishedAt) {
    rows.push(`published_at: "${metadata.publishedAt}"`);
  }

  if (metadata.description) {
    rows.push(`description: "${escapeYaml(metadata.description)}"`);
  }

  if (metadata.coverImage) {
    rows.push(`cover_image: "${metadata.coverImage}"`);
  }

  rows.push('tags: [substack, clipped]');

  if (options.extractedAt) {
    rows.push(`extracted_at: "${options.extractedAt}"`);
  }

  if (typeof options.wordCount === 'number') {
    rows.push(`word_count: ${options.wordCount}`);
  }

  if (options.paywalled) {
    rows.push('paywalled: true');
  }

  return `---\n${rows.join('\n')}\n---`;
};

export const htmlToMarkdown = (html: string) => turndown.turndown(html).trim();

export const buildMarkdownDocument = (
  metadata: ArticleMetadata,
  bodyMarkdown: string,
  options: MarkdownDocumentOptions = {}
) => {
  const frontMatter = buildFrontMatter(metadata, {
    ...options,
    extractedAt: options.extractedAt ?? new Date().toISOString()
  });
  return `${frontMatter}\n\n# ${metadata.title}\n\n${bodyMarkdown.trim()}\n`;
};