import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

import type { ArticleMetadata } from './types';

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

const escapeYaml = (value: string) => value.replace(/"/g, '\\"');

export const buildFrontMatter = (metadata: ArticleMetadata) => {
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

  if (metadata.coverImage) {
    rows.push(`cover_image: "${metadata.coverImage}"`);
  }

  return `---\n${rows.join('\n')}\n---`;
};

export const htmlToMarkdown = (html: string) => turndown.turndown(html).trim();

export const buildMarkdownDocument = (metadata: ArticleMetadata, bodyMarkdown: string) => {
  const frontMatter = buildFrontMatter(metadata);
  return `${frontMatter}\n\n# ${metadata.title}\n\n${bodyMarkdown.trim()}\n`;
};