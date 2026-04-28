import type { ExtractionResult } from '../extract/types';

const titleElement = document.querySelector<HTMLHeadingElement>('#title');
const statusElement = document.querySelector<HTMLParagraphElement>('#status');
const wordCountElement = document.querySelector<HTMLElement>('#wordCount');
const confidenceElement = document.querySelector<HTMLElement>('#confidence');
const previewElement = document.querySelector<HTMLElement>('#preview');
const warningsElement = document.querySelector<HTMLUListElement>('#warnings');
const paywallBannerElement = document.querySelector<HTMLDivElement>('#paywallBanner');

const extractButton = document.querySelector<HTMLButtonElement>('#extract');
const copyButton = document.querySelector<HTMLButtonElement>('#copy');
const downloadButton = document.querySelector<HTMLButtonElement>('#download');

let latestResult: ExtractionResult | null = null;

const setStatus = (title: string, status: string) => {
  if (titleElement) {
    titleElement.textContent = title;
  }

  if (statusElement) {
    statusElement.textContent = status;
  }
};

const setWarnings = (warnings: string[]) => {
  if (!warningsElement) {
    return;
  }

  warningsElement.replaceChildren(
    ...warnings.map((warning) => {
      const item = document.createElement('li');
      item.textContent = warning;
      return item;
    })
  );
};

const setPaywallBanner = (paywalled: boolean) => {
  if (!paywallBannerElement) {
    return;
  }

  paywallBannerElement.hidden = !paywalled;
};

const updateControls = (enabled: boolean) => {
  if (copyButton) {
    copyButton.disabled = !enabled;
  }

  if (downloadButton) {
    downloadButton.disabled = !enabled;
  }
};

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab available.');
  }

  return tab.id;
};

const runExtraction = async (): Promise<ExtractionResult> => {
  const tabId = await getActiveTabId();

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['extract.js']
  });

  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      try {
        const extractor = (window as Window & {
          __substackMarkdownExtractor?: () => ExtractionResult;
        }).__substackMarkdownExtractor;

        if (!extractor) {
          return {
            status: 'error',
            reason: 'injection-failed',
            details: 'The extractor entry point was not available in the current tab.'
          } as ExtractionResult;
        }

        return extractor();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message.slice(0, 500)
            : String(error).slice(0, 500);
        return {
          status: 'error',
          reason: 'in-page-exception',
          details: message
        } as ExtractionResult;
      }
    }
  });

  if (!result || result.result == null) {
    return {
      status: 'error',
      reason: 'injection-failed',
      details:
        'The page did not return an extraction result. The site may block content scripts (e.g. PDF viewer, chrome:// page, or strict CSP).'
    };
  }

  return result.result as ExtractionResult;
};

const renderResult = (result: ExtractionResult) => {
  latestResult = result;

  if (result.status === 'error') {
    setStatus('Extraction blocked', result.details ?? result.reason);
    setPaywallBanner(false);
    if (wordCountElement) {
      wordCountElement.textContent = '0';
    }
    if (confidenceElement) {
      confidenceElement.textContent = '0%';
    }
    if (previewElement) {
      previewElement.textContent = 'No markdown available.';
    }
    setWarnings([]);
    updateControls(false);
    return;
  }

  const { payload } = result;
  setStatus(payload.metadata.title, `${payload.metadata.publication ?? 'Substack'} article extracted.`);
  setPaywallBanner(payload.paywalled);

  if (wordCountElement) {
    wordCountElement.textContent = payload.wordCount.toLocaleString();
  }

  if (confidenceElement) {
    confidenceElement.textContent = `${Math.round(payload.confidence * 100)}%`;
  }

  if (previewElement) {
    previewElement.textContent = payload.preview;
  }

  setWarnings(payload.warnings);
  updateControls(true);
};

const copyMarkdown = async () => {
  if (latestResult?.status !== 'success') {
    return;
  }

  await navigator.clipboard.writeText(latestResult.payload.markdown);
  setStatus(latestResult.payload.metadata.title, 'Markdown copied to the clipboard.');
};

const downloadMarkdown = () => {
  if (latestResult?.status !== 'success') {
    return;
  }

  const blob = new Blob([latestResult.payload.markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = latestResult.payload.filename;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus(latestResult.payload.metadata.title, `Saved ${latestResult.payload.filename}.`);
};

extractButton?.addEventListener('click', async () => {
  setStatus('Extracting...', 'Running extraction against the current tab.');
  updateControls(false);

  try {
    const result = await runExtraction();
    renderResult(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown extraction error.';
    renderResult({
      status: 'error',
      reason: 'runtime-error',
      details: message
    });
  }
});

copyButton?.addEventListener('click', () => {
  void copyMarkdown();
});

downloadButton?.addEventListener('click', () => {
  downloadMarkdown();
});