const log = (msg) => {
    console.log('%c %s %s %s', 'color: brown; font-weight: bold; text-decoration : underline;', '--FFS DEBUG--', msg, '--');
};

const CONTEXT_ITEM_CACHE_VIEW = 'View Cache';
const CONTEXT_ITEM_CACHE_CLEAR = 'Clear Cache';
/**
 * Allowed hosts - taken from the manifest.json file
 * @type {RegExp[]}
 */
const listHostsAllowed = parseAllowedHosts(chrome.runtime.getManifest());
// fetch(chrome.extension.getURL('manifest.json'))
//     .then(response => response.json()) // assuming file contains json
//     .then(json => {
//         listHostsAllowed = parseAllowedHosts(json);
//         log('loaded allowed scripts');
//     });

/**
 * Currently set skin
 * @type {String}
 */
let skin;

/**
 * Currently set replaced resources
 * @type {{key: String, value: String}[]}
 */
let replaceResources;

function listenOnContextMenu() {
    chrome.contextMenus.onClicked.addListener(info => {
        const {menuItemId, pageUrl} = info;
        log('menu clicked', menuItemId);
        const currentUrl = new URL(pageUrl);

        // make the checks again
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

// /**
//  *
//  * @param {Number} tabId
//  * @param {Function} callback
//  */
// function checkTab(tabId, callback) {
//     // Note: chrome.tabs.getCurrent() will always return 'tab' as undefined when called from a background script,
//     // so use chrome.tabs.get(abId)
//     // chrome.tabs.getCurrent(tab => {
//     chrome.tabs.get(tabId, tab => {
//         if (!tab) return callback(false);
//
//         // inspect the tabs URL
//         const {url, active} = tab;
//
//         if (!active || !url) return callback(false);
//
//         const currentUrl = new URL(url);
//
//         // if the the current tab is still active and has valid URL
//         callback(isAllowedTab(currentUrl.hostname), currentUrl);
//     });
// }
//
// /**
//  * @param {Number} tabId
//  */
// function checkContextMenu(tabId) {
//     // still no active Tab
//     if (-1 === tabId) {
//
//         return;
//     }
//
//     log('check authorized');
//     chrome.storage.sync.get('secret', ({secret}) => {
//         if (!secret) {
//             log('NOT authorized');
//             return;
//         }
//
//         checkTab(tabId, updateContextMenu);
//     });
// }

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
    // listen for when active tab is 'ready'
    chrome.tabs.onActivated.addListener(({tabId, windowId}, props) => {
        // first disable the menus
        updateContextMenu(false);
    });

    // check initially the current tab
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        // first disable the menus
        updateContextMenu(false);
    });
}

function listenOnStorageChanges() {
    chrome.storage.sync.get(["skin", "replaceResources"], (data) => {
        skin = data.skin;
        replaceResources = data.replaceResources;

        log(`Skin set to ${skin}`);
        log(`Replace-resources set to ${JSON.stringify(replaceResources)}`);
    });
    chrome.storage.onChanged.addListener((changes, storageAreaName) => {
        // we are interested only in the 'chrome.storage.sync' StorageArea
        if (storageAreaName !== 'sync') return;

        // check for a change in the 'skin' setting
        const skinChange = changes['skin'];
        if (!skinChange) return;

        skin = skinChange.newValue;
        log(`Skin change to ${skin}`);
    });
}

function listenOnWebRequest() {
    chrome.webRequest.onBeforeRequest.addListener(
        function (details) {
            const {/*String*/type, /*String*/url} = details;

            // prevent double redirection
            if (url.endsWith('_ffs_debug')) return {};

            let redirectUrl;

            // try first to replace the whole URL
            if (replaceResources) {
                replaceResources.some(({key: original, value: replaced}) => {
                    if (url.includes(original)) {
                        // if absolute URL or if not
                        try {
                            redirectUrl = new URL(replaced).href;
                        } catch (e) {
                            redirectUrl = url.replace(original, replaced);
                        }
                        return true;
                    }
                })
            }

            // if not replaced then try changing the skin only
            if (!redirectUrl) {
                if (!skin) return {};

                switch (type) {
                    case 'stylesheet':
                        // in DEBUG mode
                        // without skin -> /jawr_generator.css?generationConfigParam=%2Fstatic%2Fless%2Fbundle_main.less
                        // with    skin -> /jawr_generator.css?generationConfigParam=%2Fstatic%2Fskin%2Fkomero%2Fless%2Fbundle_main.less
                        // in PRODUCTION mode
                        // without skin -> /static/gzip_3_10_0/bundles/bundle_main.css
                        // with    skin -> /static/gzip_3_10_0/bundles/bundle_main_skin_komero.css

                        if (url.includes('jawr_generator.css?generationConfigParam')) {
                            // in debug mode
                            redirectUrl = url.replace(/%2Fstatic(%2Fskin%2F(.*))?%2Fless/, `%2Fstatic%2Fskin%2F${skin}%2Fless`);
                        } else if (url.includes('/bundles/')) {
                            // in production mode
                            redirectUrl = url.replace(/\.css/, `_skin_${skin}.css`);
                        }
                        break;
                    case 'image':
                        // without skin ->    images/welcome.svgz
                        // with skin    ->    skin/komero/images/welcome.svgz
                        redirectUrl = url.replace(/(skin\/(.+)\/)?images\//, `skin/${skin}/images/`);
                        break;
                }
            }

            // check to see if any redirection is needed at all
            if (redirectUrl) {
                if (redirectUrl === url) redirectUrl = undefined;
                else {
                    // add an additional query param to prevent loop-redirection
                    // if the request is to be redirected again from chrome.webRequest.onHeadersReceived
                    redirectUrl = `${redirectUrl}${(redirectUrl.includes('?') ? '&' : '?')}_ffs_debug`
                }
            }

            return {redirectUrl, /*cancel: url.indexOf("skin") !== -1*/};
        },
        {
            urls: ["<all_urls>"], // this will actually intercept all urls that we have already permitted in the manifest.json 'permissions'
            types: ["stylesheet", "image", "script"]
        },
        ["blocking"]);

    chrome.webRequest.onHeadersReceived.addListener(
        function (details) {
            if (!skin) return {};

            const {/*String*/url, /*Array*/responseHeaders, /*Number*/statusCode} = details;

            // intercept only if this request is a previously intercepted and redirected by us
            if (!url.endsWith('_ffs_debug')) return {};

            let redirectUrl;

            // if the reported size of the CSS/LESS bundle is 0 - this means it's missing
            let contentLength = responseHeaders.find(header => header.name === 'Content-Length');
            if (statusCode === 404 || (contentLength && contentLength.value === '0')) {
                if (url.includes('jawr_generator.css?generationConfigParam')) {
                    // in debug mode
                    redirectUrl = url.replace(/%2Fstatic%2Fskin%2F(.*)%2Fless/, `%2Fstatic%2Fless`)
                } else {
                    redirectUrl = url.replace(/_skin_(.*)\.css/, `.css`);
                }

            }

            // check to see if any redirection is needed at all
            if (redirectUrl && redirectUrl === url) redirectUrl = undefined;

            return {redirectUrl, /*cancel: url.indexOf("skin") !== -1*/};
        }, {
            urls: ["<all_urls>"], // this will actually intercept all urls that we have already permitted in the manifest.json 'permissions'
            types: ["stylesheet"] // no need to intercept failed images as they are always properly resolved and handled in server (even if wrong skin is added)
        },
        ["blocking", "responseHeaders"]);
}

function listenOnMessages() {
    // listen for messages from content scripts for instance
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const pageUrl = sender.tab && sender.tab.url;
        // log(`Message received from ${pageUrl ? 'a content script:' + pageUrl : 'the extension itself'}`);

        if (!pageUrl) return;

        switch (request.type) {
            case 'FFS_DEBUG_VERIFY':
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
                        .then(result => ({success: result}))
                        .then(sendResponse);
                });

                // NOTE - "return true;" in order to indicate that this is ASYNC, e.g. that the sendResponse will be called later async
                return true;
            case 'FFS_DEBUG_INIT':
            case 'FFS_DEBUG_ACTIVATED':
                // enable the menus
                updateContextMenu(!!request.verified);
                return false;
        }
    });
}

function parseAllowedHosts(manifest) {
    return manifest.content_scripts[0].matches.map(urlAllowed => {
        // single items 'urlAllowed' are ALWAYS of the form  <scheme>://<host><path> as defined by the extension's manifest
        let hostname = urlAllowed.split('://')[1];
        hostname = hostname.substring(0, hostname.indexOf('/'));
        let hostnameRegex = hostname.replace('.', '\\.');
        hostnameRegex = hostnameRegex.replace('*', '.*');
        return new RegExp(hostnameRegex);
    });
}

function createContextMenus() {
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_CACHE_VIEW,
        'title': 'View cache'
    });
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_CACHE_CLEAR,
        'title': 'Clear cache'
    });
}

// when the background script is PERSISTENT then create context menus right now
if (false !== chrome.runtime.getManifest().background.persistent) {
    createContextMenus();
} else {
    // listen for when the extension is installed (called only once)
    chrome.runtime.onInstalled.addListener(() => {
        log('installed');
        // Create the Context Menu items - normally they are created ALWAYS inside 'onInstalled' event
        // so that only once
        createContextMenus();
    });
}

listenOnTabs();
listenOnContextMenu();
listenOnWebRequest();
listenOnStorageChanges();
listenOnMessages();

log('activated');






