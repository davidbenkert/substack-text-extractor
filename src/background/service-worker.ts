chrome.commands.onCommand.addListener((command) => {
  if (command !== 'extract-article') {
    return;
  }

  void chrome.storage.session.set({ autoExtract: true }).then(() => chrome.action.openPopup());
});