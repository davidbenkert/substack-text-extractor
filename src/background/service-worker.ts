const CONTEXT_MENU_ID = 'extract-substack';

const triggerPopupExtraction = () => {
  void chrome.storage.session.set({ autoExtract: true }).then(() => chrome.action.openPopup());
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Extract Substack article to Markdown',
    contexts: ['page', 'action'],
    documentUrlPatterns: [
      '*://*.substack.com/*',
      '*://substack.com/*'
    ]
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'extract-article') {
    return;
  }

  triggerPopupExtraction();
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return;
  }

  triggerPopupExtraction();
});