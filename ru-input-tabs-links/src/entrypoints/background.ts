export default defineBackground(() => {
  /**
   * Listen for messages from content scripts and
   * respond with all open tabs when requested.
   */
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "getAllTabs") {
      browser.tabs.query({}).then((tabs) => {
        sendResponse(
          tabs.map((t) => ({
            id: t.id,
            title: t.title,
            url: t.url,
            favIconUrl: t.favIconUrl,
          })),
        );
      });
      return true; // async response
    }
  });
});
