const log = (msg) => {
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
};

const CONTEXT_ITEM_CACHE_VIEW = 'View Cache';
const CONTEXT_ITEM_CACHE_CLEAR = 'Clear Cache';
/**
 * @type {RegExp[]}
 */
let listHostsAllowed = [];

function listenOnContextMenu() {
    chrome.contextMenus.onClicked.addListener(info => {
        const {menuItemId, pageUrl} = info;
        log('menu clicked', menuItemId);
        const currentUrl = new URL(pageUrl);

        if (isAllowedTab(currentUrl.hostname)) {
            chrome.storage.sync.get('secret', ({secret}) => {
                if (!secret) {
                    log('NOT authorized');
                    return;
                }

                // overwrite the whole search-query
                currentUrl.search = `?secret=${secret}`;

                switch (menuItemId) {
                    case CONTEXT_ITEM_CACHE_VIEW:
                        currentUrl.pathname = '/adapter/internal/cache_dump';
                        chrome.tabs.create({url: currentUrl.href});
                        break;
                    case CONTEXT_ITEM_CACHE_CLEAR:
                        currentUrl.pathname = '/adapter/internal/ajax/cache_delete';
                        // append a query param
                        currentUrl.searchParams.append('regex_name_cache', '.*');
                        fetch(currentUrl.href, {
                            method: 'POST', // *GET, POST, PUT, DELETE, etc.
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            // body: JSON.stringify({
                            //     regex_name_cache: '.*'
                            // }) // body data type must match "Content-Type" header
                        }).then(res => res.json())
                            .then(({deleted}) => log(`Deleted ${deleted.length} cache(s)`));
                        break;
                }
            });
        }
    });
}

/**
 *
 * @param {Number} tabId
 * @param {Function} callback
 */
function checkTab(tabId, callback) {
    // Note: chrome.tabs.getCurrent() will always return 'tab' as undefined when called from a background script,
    // so use chrome.tabs.get(abId)
    // chrome.tabs.getCurrent(tab => {
    chrome.tabs.get(tabId, tab => {
        if (!tab) return callback(false);

        // inspect the tabs URL
        const {url, active} = tab;

        if (!active || !url) return callback(false);

        const currentUrl = new URL(url);

        // if the the current tab is still active and has valid URL
        callback(isAllowedTab(currentUrl.hostname), currentUrl);
    });
}

/**
 * @param {Number} tabId
 */
function checkContextMenu(tabId) {
    // still no active Tab
    if (-1 === tabId) {
        // first disable the menus
        updateContextMenu(false);
        return;
    }

    log('check authorized');
    chrome.storage.sync.get('secret', ({secret}) => {
        if (!secret) {
            log('NOT authorized');
            return;
        }

        checkTab(tabId, updateContextMenu);
    });
}

/**
 * @param {String} hostname
 * @return {Boolean}
 */
function isAllowedTab(hostname) {
    return listHostsAllowed.some(hostnameAllowed => !!hostname.match(hostnameAllowed));
}

function updateContextMenu(enabled) {
    // log('update context menu', enabled);
    chrome.contextMenus.update(CONTEXT_ITEM_CACHE_VIEW, {enabled});
    chrome.contextMenus.update(CONTEXT_ITEM_CACHE_CLEAR, {enabled});
}

function listenOnTabs() {
    // Note: Currently active tab can be updated with a new URL
    let checkTabId = -1;

    // listen for when active tab is 'ready'
    chrome.tabs.onActivated.addListener(({tabId, windowId}, props) => {
        checkTabId = tabId;
        checkContextMenu(checkTabId);
    });
    chrome.tabs.onUpdated.addListener((tabId, props) => {
        if (props.status === 'complete' && tabId === checkTabId) {
            checkContextMenu(checkTabId);
        }
    });

    // check initially the current tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || !tabs.length) {
            checkTabId = -1;
        } else {
            checkTabId = tabs[0].id;
        }
        checkContextMenu(checkTabId);
    });
}

listenOnTabs();
listenOnContextMenu();

// listen for when the extension is installed (called only once)
chrome.runtime.onInstalled.addListener(() => {
    log('installed');

    // Create the Context Menu items - normally they are created ALWAYS inside 'onInstalled' event
    // so that only once

    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_CACHE_VIEW,
        'title': 'View cache'
    });
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_CACHE_CLEAR,
        'title': 'Clear cache'
    });
});

// listen for messages from content scripts for instance
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const pageUrl = sender.tab && sender.tab.url;
    // log(`Message received from ${pageUrl ? 'a content script:' + pageUrl : 'the extension itself'}`);

    if (pageUrl && request.type === 'FFS_DEBUG_VERIFY') {
        log('verify code');
        // check the 'secret' code
        chrome.storage.sync.get('secret', ({secret}) => {
            if (!secret) {
                return sendResponse({success: false});
            }

            const currentUrl = new URL(pageUrl);
            currentUrl.pathname = '/fbweb/internal/ajax/verify';
            currentUrl.search = `?secret=${secret}`;
            // verify with the server
            fetch(currentUrl.href)
                .then(() => true)
                .catch(() => false)
                .then(result => ({success : result}))
                .then(sendResponse);
        });

        // NOTE - "return true;" in order to indicate that this is ASYNC, e.g. that the sendResponse will be called later async
        return true;
    }
});

fetch(chrome.extension.getURL('manifest.json'))
    .then(response => response.json()) // assuming file contains json
    .then(json => {
        listHostsAllowed = json.content_scripts[0].matches.map(urlAllowed => {
            // single items 'urlAllowed' are ALWAYS of the form  <scheme>://<host><path> as defined by the extension's manifest
            let hostname = urlAllowed.split('://')[1];
            hostname = hostname.substring(0, hostname.indexOf('/'));
            let hostnameRegex = hostname.replace('.', '\\.');
            hostnameRegex = hostnameRegex.replace('*', '.*');
            return new RegExp(hostnameRegex);
        });
        log('loaded allowed scripts');
    });

log('background script activated');





