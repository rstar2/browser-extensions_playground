/**
 * Get the current Tab's URL.
 * @param {Function<String>} callback called when the URL of the current tab is found
 */
function getCurrentTabUrl(callback) {
    // query information for the current tab
    const queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least one tab
        const tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        const url = tab.url;

        callback(url);
    });
}

/**
 * Copy element's text content
 * @param {HTMLElement} $el
 * @return {Promise}
 */
function doCopy($el) {
    // copy is not supported
    if (!navigator.clipboard)
        return Promise.reject();

    return navigator.clipboard.writeText($el.innerText);
}

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTabUrl(url => {
        const $el = document.getElementById('url');
        $el.innerHTML = url;
        doCopy($el)
            .catch(() => { } /*just trap it*/);
    });
});