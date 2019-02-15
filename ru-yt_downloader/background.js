const CONTEXT_ITEM_MP3 = 'mp3';
const CONTEXT_ITEM_MP4 = 'mp4';

const SERVICE_URL = 'https://g9wvw8v13h.execute-api.eu-central-1.amazonaws.com/dev/view/download';

const YOUTUBE_URL = /https:\/\/www.youtube.com\/watch\?v=(.+)/;

function createContextMenu() {
    // Create the Context Menu items
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_MP3,
        'title': 'Ru Download YouTube video as MP3',
        'contexts': ['video']
    });
    chrome.contextMenus.create({
        'id': CONTEXT_ITEM_MP4,
        'title': 'Ru Download YouTube video as MP4',
        'contexts': ['video']
    });
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
            const enabled = active && url && url.match(YOUTUBE_URL);
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
function loadSecret() {
    const secretFile = chrome.runtime.getURL('secret.json');
    fetch(secretFile)
        .then(res => res.json())
        .then(secret => {
            // store the email/password from the secret file
            // Could do just chrome.storage.sync.set(secret);
            // but thus is visible that the storage contains 'email' and 'password' keys
            chrome.storage.sync.set({email: secret.email, password: secret.password});
        });
}

loadSecret();
listenOnTabs();

chrome.runtime.onInstalled.addListener(() => {
    console.log('installed');

    createContextMenu();
});

console.log('background script activated');






