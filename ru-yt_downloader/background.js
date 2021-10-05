const CONTEXT_ITEM_MP3 = 'mp3';
const CONTEXT_ITEM_MP4 = 'mp4';

const SERVICE_URL =
'https://1ouabtnb6a.execute-api.eu-central-1.amazonaws.com/dev/view/download';

const ALLOWED_URL = /https:\/\/www.youtube.com\/watch\?v=(.+)/;

function listenOnContextMenu() {
    chrome.contextMenus.onClicked.addListener(info => {
        const { menuItemId, pageUrl } = info;

        console.log('menu clicked', menuItemId);

        const videoId = pageUrl.match(/v=([^&]*)/)[1];
        let videoDownloadUrl = `${SERVICE_URL}/${encodeURIComponent(videoId)}`;

        if (menuItemId === CONTEXT_ITEM_MP3) {
            videoDownloadUrl += '?mp3=true';
        }

        console.log('opening', videoDownloadUrl);
        // open a new tab for downloading
        chrome.tabs.create({ url: videoDownloadUrl });
    });
}

function checkContextMenu(tabId) {
    if (-1 === tabId) return; // still no active Tab

    console.log('check authorized');
    chrome.storage.sync.get('auth', ({ auth }) => {
        if (!auth) {
            console.log('NOT authorized');
            updateContextMenu(false);
            return;
        }

        console.log('check context menu');

        // Note: chrome.tabs.getCurrent() will always return 'tab' as undefined when called from a background script,
        // so use chrome.tabs.get(abId)
        // chrome.tabs.getCurrent(tab => {
        chrome.tabs.get(tabId, tab => {
            if (!tab) return;

            // inspect the tabs URL
            const { url, active } = tab;

            // if the the current tab is still active and has valid URL
            const enabled = active && url && url.match(ALLOWED_URL);
            updateContextMenu(!!enabled);
        });
    });
}
function updateContextMenu(enabled) {
    console.log('update context menu', enabled);
    chrome.contextMenus.update(CONTEXT_ITEM_MP3, { enabled });
    chrome.contextMenus.update(CONTEXT_ITEM_MP4, { enabled });
}

function listenOnTabs() {
    // Note: Currently active tab can be updated with a new URL
    let checkTabId = -1;

    // listen for when active tab is 'ready'
    chrome.tabs.onActivated.addListener(({ tabId, windowId }, props) => {
        checkTabId = tabId;
        checkContextMenu(checkTabId);
    });
    chrome.tabs.onUpdated.addListener((tabId, props) => {
        if (props.status == 'complete' && tabId === checkTabId) {
            checkContextMenu(checkTabId);
        }
    });

    // check initially the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        checkTabId = tabs[0].id;
        checkContextMenu(checkTabId);
    });
}

listenOnTabs();
listenOnContextMenu();

chrome.runtime.onInstalled.addListener(() => {
    console.log('installed');

    // Create the Context Menu items - in examples they are created ALWAYS inside 'onInstalled' event 
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_MP3,
        'title': 'MP3',
        'contexts': ['video']
    });
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_MP4,
        'title': 'MP4',
        'contexts': ['video']
    });
});

console.log('background script activated');






