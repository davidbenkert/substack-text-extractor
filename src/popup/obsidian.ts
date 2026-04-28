export const OBSIDIAN_URI_CONTENT_THRESHOLD = 8000;

interface ObsidianSaveOptions {
  vault: string;
  noteName: string;
  markdown: string;
}

interface ObsidianSavePlan {
  uri: string;
  usesClipboard: boolean;
}

export const buildObsidianSavePlan = (
  { vault, noteName, markdown }: ObsidianSaveOptions,
  contentThreshold = OBSIDIAN_URI_CONTENT_THRESHOLD
): ObsidianSavePlan => {
  const encodedVault = encodeURIComponent(vault);
  const encodedNoteName = encodeURIComponent(noteName);
  const encodedMarkdown = encodeURIComponent(markdown);

  if (encodedMarkdown.length > contentThreshold) {
    return {
      uri: `obsidian://new?vault=${encodedVault}&name=${encodedNoteName}&clipboard=true`,
      usesClipboard: true
    };
  }

  return {
    uri: `obsidian://new?vault=${encodedVault}&name=${encodedNoteName}&content=${encodedMarkdown}`,
    usesClipboard: false
  };
};