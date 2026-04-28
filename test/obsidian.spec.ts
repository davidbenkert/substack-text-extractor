import { describe, expect, it } from 'vitest';

import { OBSIDIAN_URI_CONTENT_THRESHOLD, buildObsidianSavePlan } from '../src/popup/obsidian';

describe('Obsidian save plan', () => {
  it('uses direct content mode for shorter notes', () => {
    const plan = buildObsidianSavePlan({
      vault: 'Research Vault',
      noteName: 'field-notes',
      markdown: '# Field Notes\n\nHello world.'
    });

    expect(plan.usesClipboard).toBe(false);
    expect(plan.uri).toContain('obsidian://new?vault=Research%20Vault');
    expect(plan.uri).toContain('&name=field-notes');
    expect(plan.uri).toContain('&content=');
  });

  it('falls back to clipboard mode for long notes', () => {
    const markdown = 'A'.repeat(OBSIDIAN_URI_CONTENT_THRESHOLD + 1);
    const plan = buildObsidianSavePlan({
      vault: 'Research Vault',
      noteName: 'field-notes',
      markdown
    });

    expect(plan.usesClipboard).toBe(true);
    expect(plan.uri).toBe('obsidian://new?vault=Research%20Vault&name=field-notes&clipboard=true');
  });
});